import { reactive } from 'vue'
import { fetchHomeSections } from '@renderer/services/musicDiscoveryService'
import type { RecommendationFeed } from '@renderer/types/music'

const state = reactive<RecommendationFeed>({
  sections: [],
  refreshToken: '',
  pageSeed: 0,
  fallbackUsed: false,
  loading: false,
  error: null
})

export function useRecommendationStore() {
  async function refresh(isAuthenticated: boolean): Promise<void> {
    state.loading = true
    state.error = null
    state.pageSeed = Math.floor(Date.now() / 1000)

    try {
      const payload = await fetchHomeSections(isAuthenticated, state.pageSeed)
      state.sections = payload.sections
      state.fallbackUsed = payload.fallbackUsed
      state.refreshToken = String(Date.now())
    } catch (error) {
      state.sections = []
      state.fallbackUsed = true
      state.error = error instanceof Error ? error.message : '推荐流加载失败。'
    } finally {
      state.loading = false
    }
  }

  return {
    state,
    refresh
  }
}
