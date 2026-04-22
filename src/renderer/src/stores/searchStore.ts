import { reactive } from 'vue'
import { searchMusic } from '@renderer/services/musicDiscoveryService'
import type { SearchResults, SearchState, SearchTab } from '@renderer/types/music'

const emptyResults: SearchResults = {
  songs: [],
  artists: [],
  albums: [],
  playlists: []
}

const state = reactive<SearchState>({
  keyword: '',
  activeTab: 'songs',
  loading: false,
  results: { ...emptyResults },
  lastSearchedKeyword: '',
  error: null
})

let activeSearchToken = 0

export function useSearchStore() {
  function setKeyword(keyword: string): void {
    state.keyword = keyword
  }

  function setActiveTab(tab: SearchTab): void {
    state.activeTab = tab
  }

  async function search(keyword = state.keyword): Promise<void> {
    const cleanedKeyword = keyword.trim()
    state.keyword = keyword

    if (!cleanedKeyword) {
      state.error = null
      state.lastSearchedKeyword = ''
      state.results = { ...emptyResults }
      return
    }

    const token = ++activeSearchToken
    state.loading = true
    state.error = null

    try {
      const [songs, artists, albums, playlists] = await Promise.all([
        searchMusic(cleanedKeyword, 'songs') as Promise<SearchResults['songs']>,
        searchMusic(cleanedKeyword, 'artists') as Promise<SearchResults['artists']>,
        searchMusic(cleanedKeyword, 'albums') as Promise<SearchResults['albums']>,
        searchMusic(cleanedKeyword, 'playlists') as Promise<SearchResults['playlists']>
      ])

      if (token !== activeSearchToken) return

      state.results = {
        songs,
        artists,
        albums,
        playlists
      }
      state.lastSearchedKeyword = cleanedKeyword
    } catch (error) {
      if (token !== activeSearchToken) return
      state.error = error instanceof Error ? error.message : '搜索失败，请稍后重试。'
      state.results = { ...emptyResults }
    } finally {
      if (token === activeSearchToken) {
        state.loading = false
      }
    }
  }

  return {
    state,
    setKeyword,
    setActiveTab,
    search
  }
}
