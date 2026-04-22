<script setup lang="ts">
import fallbackCover from '@renderer/assets/cover-fallback.svg'
import type { Song } from '@renderer/types/music'
import { formatDuration } from '@renderer/utils/format'

defineProps<{
  song: Song | null
  loading: boolean
  playing: boolean
  progressMs: number
  durationMs: number
  volume: number
  error: string | null
}>()

const emit = defineEmits<{
  previous: []
  toggle: []
  next: []
  seek: [value: number]
  volume: [value: number]
  clearError: []
}>()

function onSeek(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  if (Number.isFinite(value)) {
    emit('seek', value)
  }
}

function onVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  if (Number.isFinite(value)) {
    emit('volume', value)
  }
}
</script>

<template>
  <footer class="player-bar">
    <div class="track-panel">
      <img
        :alt="song?.name ?? 'No song'"
        :src="song?.coverUrl || fallbackCover"
      />
      <div class="track-meta">
        <strong>{{ song?.name ?? '等待播放' }}</strong>
        <span>{{ song?.artistNames.join(' / ') ?? '从搜索或推荐中选择一首歌开始。' }}</span>
      </div>
    </div>

    <div class="transport">
      <div class="transport-buttons">
        <button type="button" @click="$emit('previous')">上一首</button>
        <button class="primary" type="button" @click="$emit('toggle')">
          {{ loading ? '加载中...' : playing ? '暂停' : '播放' }}
        </button>
        <button type="button" @click="$emit('next')">下一首</button>
      </div>

      <div class="timeline">
        <small>{{ formatDuration(progressMs) }}</small>
        <input
          :max="Math.max(durationMs, 1)"
          :value="progressMs"
          min="0"
          type="range"
          @input="onSeek"
        />
        <small>{{ formatDuration(durationMs) }}</small>
      </div>
    </div>

    <div class="volume-panel">
      <label>
        <span>音量</span>
        <input
          :value="volume"
          max="1"
          min="0"
          step="0.01"
          type="range"
          @input="onVolumeChange"
        />
      </label>
      <button v-if="error" class="error-badge" type="button" @click="$emit('clearError')">{{ error }}</button>
    </div>
  </footer>
</template>

<style scoped>
.player-bar {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.4fr) minmax(220px, 0.8fr);
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 10, 18, 0.86);
  backdrop-filter: blur(24px);
}

.track-panel,
.transport,
.volume-panel {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.track-panel img {
  width: 68px;
  height: 68px;
  border-radius: 18px;
  object-fit: cover;
}

.track-meta {
  display: grid;
}

.track-meta span,
.timeline small,
.volume-panel span {
  color: var(--color-text-muted);
}

.transport {
  flex-direction: column;
  justify-content: center;
}

.transport-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.transport-buttons button,
.error-badge {
  min-height: 40px;
  padding: 0 0.95rem;
  border: 0;
  border-radius: 999px;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.08);
}

.transport-buttons .primary {
  color: #0b111f;
  background: linear-gradient(135deg, var(--color-accent), #ffd36b);
}

.timeline {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
}

input[type='range'] {
  width: 100%;
}

.volume-panel {
  justify-content: flex-end;
}

.volume-panel label {
  display: grid;
  gap: 0.35rem;
  min-width: 180px;
}

.error-badge {
  color: #ffd4d4;
  background: rgba(255, 122, 122, 0.12);
}

@media (max-width: 1100px) {
  .player-bar {
    grid-template-columns: 1fr;
  }

  .volume-panel {
    justify-content: flex-start;
  }
}
</style>
