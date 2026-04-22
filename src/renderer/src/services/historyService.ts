import type { PlaySummary, SearchClickHistory, Song, UserHistory } from '@renderer/types/music'
import { readStorage, writeStorage } from '@renderer/utils/storage'

const HISTORY_KEY = 'sounds-ai/user-history'

const defaultHistory: UserHistory = {
  recentPlays: [],
  searchClicks: [],
  playSummaries: []
}

function saveHistory(history: UserHistory): UserHistory {
  writeStorage(HISTORY_KEY, history)
  return history
}

export function loadHistory(): UserHistory {
  return readStorage<UserHistory>(HISTORY_KEY, defaultHistory)
}

export function recordRecentPlay(song: Song): UserHistory {
  const history = loadHistory()
  const recentPlays = [
    { song, playedAt: new Date().toISOString() },
    ...history.recentPlays.filter((entry) => entry.song.id !== song.id)
  ].slice(0, 12)

  return saveHistory({
    ...history,
    recentPlays
  })
}

export function recordSearchClick(entry: SearchClickHistory): UserHistory {
  const history = loadHistory()
  return saveHistory({
    ...history,
    searchClicks: [entry, ...history.searchClicks].slice(0, 24)
  })
}

export function recordPlaySummary(summary: PlaySummary): UserHistory {
  const history = loadHistory()
  const next = history.playSummaries.filter((entry) => entry.songId !== summary.songId)
  return saveHistory({
    ...history,
    playSummaries: [summary, ...next].slice(0, 24)
  })
}
