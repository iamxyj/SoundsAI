import { computed, reactive } from 'vue'
import { resolveSongStream } from '@renderer/services/playbackService'
import { useHistoryStore } from '@renderer/stores/historyStore'
import type { PlayMode, PlaybackSourceType, Song } from '@renderer/types/music'
import { readStorage, writeStorage } from '@renderer/utils/storage'

interface PersistedPlayerState {
  queue: Song[]
  currentIndex: number
  mode: PlayMode
  volume: number
  progressMs: number
  sourceType: PlaybackSourceType
}

interface PlayerState {
  queue: Song[]
  currentIndex: number
  mode: PlayMode
  volume: number
  progressMs: number
  durationMs: number
  loading: boolean
  playing: boolean
  error: string | null
  sourceType: PlaybackSourceType
}

const PLAYER_KEY = 'sounds-ai/player-state'

const persisted = readStorage<PersistedPlayerState>(PLAYER_KEY, {
  queue: [],
  currentIndex: -1,
  mode: 'list',
  volume: 0.72,
  progressMs: 0,
  sourceType: 'manual'
})

const state = reactive<PlayerState>({
  queue: persisted.queue,
  currentIndex: persisted.currentIndex,
  mode: persisted.mode,
  volume: persisted.volume,
  progressMs: persisted.progressMs,
  durationMs: persisted.queue[persisted.currentIndex]?.durationMs ?? 0,
  loading: false,
  playing: false,
  error: null,
  sourceType: persisted.sourceType
})

const historyStore = useHistoryStore()
const audio = new Audio()
audio.preload = 'auto'
audio.volume = state.volume

function persist(): void {
  writeStorage<PersistedPlayerState>(PLAYER_KEY, {
    queue: state.queue,
    currentIndex: state.currentIndex,
    mode: state.mode,
    volume: state.volume,
    progressMs: state.progressMs,
    sourceType: state.sourceType
  })
}

function getNextIndex(direction: 'next' | 'previous'): number {
  if (!state.queue.length) return -1

  if (state.mode === 'shuffle' && state.queue.length > 1) {
    let index = Math.floor(Math.random() * state.queue.length)
    while (index === state.currentIndex) {
      index = Math.floor(Math.random() * state.queue.length)
    }
    return index
  }

  if (state.mode === 'single' && direction === 'next') {
    return state.currentIndex
  }

  if (direction === 'previous') {
    if (state.progressMs > 3000) return state.currentIndex
    return state.currentIndex <= 0 ? state.queue.length - 1 : state.currentIndex - 1
  }

  return state.currentIndex >= state.queue.length - 1 ? 0 : state.currentIndex + 1
}

async function loadAndPlay(index: number, seekMs = 0): Promise<void> {
  const song = state.queue[index]
  if (!song) return

  state.currentIndex = index
  state.progressMs = seekMs
  state.durationMs = song.durationMs
  state.loading = true
  state.playing = false
  state.error = null
  persist()

  try {
    const streamUrl = await resolveSongStream(song.id)
    audio.src = streamUrl
    audio.currentTime = seekMs / 1000
    await audio.play()
    state.playing = true
    state.loading = false
    historyStore.recordRecentPlay(song)
    persist()
  } catch (error) {
    state.loading = false
    state.playing = false
    state.error = error instanceof Error ? error.message : '播放失败，已尝试自动跳过。'
    persist()

    const nextIndex = getNextIndex('next')
    if (nextIndex !== -1 && nextIndex !== state.currentIndex) {
      await loadAndPlay(nextIndex)
    }
  }
}

audio.addEventListener('timeupdate', () => {
  state.progressMs = Math.floor(audio.currentTime * 1000)
  state.durationMs = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.floor(audio.duration * 1000) : state.durationMs
  persist()
})

audio.addEventListener('ended', async () => {
  const currentSong = state.queue[state.currentIndex]
  if (currentSong) {
    historyStore.recordPlaySummary({
      songId: currentSong.id,
      playedMs: state.durationMs,
      completed: true,
      updatedAt: new Date().toISOString()
    })
  }

  const nextIndex = getNextIndex('next')
  if (nextIndex !== -1) {
    await loadAndPlay(nextIndex)
  }
})

audio.addEventListener('pause', () => {
  state.playing = false
})

audio.addEventListener('play', () => {
  state.playing = true
})

audio.addEventListener('error', () => {
  state.error = '音频资源加载失败，正在尝试下一首。'
})

export function usePlayerStore() {
  const currentSong = computed(() => state.queue[state.currentIndex] ?? null)

  async function playQueue(queue: Song[], startIndex: number, sourceType: PlaybackSourceType): Promise<void> {
    state.queue = queue
    state.currentIndex = startIndex
    state.sourceType = sourceType
    await loadAndPlay(startIndex)
  }

  async function playSong(song: Song, sourceType: PlaybackSourceType): Promise<void> {
    const existingIndex = state.queue.findIndex((entry) => entry.id === song.id)
    if (existingIndex !== -1) {
      state.sourceType = sourceType
      await loadAndPlay(existingIndex)
      return
    }

    state.queue = [...state.queue, song]
    state.sourceType = sourceType
    await loadAndPlay(state.queue.length - 1)
  }

  async function togglePlayback(): Promise<void> {
    if (!currentSong.value) return

    if (state.playing) {
      audio.pause()
      return
    }

    if (audio.src) {
      await audio.play()
      return
    }

    await loadAndPlay(state.currentIndex, state.progressMs)
  }

  async function next(): Promise<void> {
    const nextIndex = getNextIndex('next')
    if (nextIndex !== -1) {
      await loadAndPlay(nextIndex)
    }
  }

  async function previous(): Promise<void> {
    const previousIndex = getNextIndex('previous')
    if (previousIndex !== -1) {
      await loadAndPlay(previousIndex)
    }
  }

  function addToQueue(song: Song): void {
    if (state.queue.some((entry) => entry.id === song.id)) return
    state.queue = [...state.queue, song]
    persist()
  }

  function setMode(mode: PlayMode): void {
    state.mode = mode
    persist()
  }

  function setVolume(volume: number): void {
    state.volume = volume
    audio.volume = volume
    persist()
  }

  function seek(progressMs: number): void {
    audio.currentTime = progressMs / 1000
    state.progressMs = progressMs
    persist()
  }

  function clearError(): void {
    state.error = null
  }

  async function restorePlaybackContext(): Promise<void> {
    audio.volume = state.volume
    if (state.currentIndex >= 0 && state.queue[state.currentIndex]) {
      state.durationMs = state.queue[state.currentIndex].durationMs
    }
    persist()
  }

  return {
    state,
    currentSong,
    playQueue,
    playSong,
    togglePlayback,
    next,
    previous,
    addToQueue,
    setMode,
    setVolume,
    seek,
    clearError,
    restorePlaybackContext
  }
}
