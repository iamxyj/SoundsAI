import { reactive } from 'vue'
import {
  loadHistory,
  recordPlaySummary as persistPlaySummary,
  recordRecentPlay as persistRecentPlay,
  recordSearchClick as persistSearchClick
} from '@renderer/services/historyService'
import type { PlaySummary, SearchClickHistory, Song, UserHistory } from '@renderer/types/music'

const state = reactive<UserHistory>(loadHistory())

export function useHistoryStore() {
  function hydrate(): void {
    Object.assign(state, loadHistory())
  }

  function recordRecentPlay(song: Song): void {
    Object.assign(state, persistRecentPlay(song))
  }

  function recordSearchClick(entry: SearchClickHistory): void {
    Object.assign(state, persistSearchClick(entry))
  }

  function recordPlaySummary(summary: PlaySummary): void {
    Object.assign(state, persistPlaySummary(summary))
  }

  return {
    state,
    hydrate,
    recordRecentPlay,
    recordSearchClick,
    recordPlaySummary
  }
}
