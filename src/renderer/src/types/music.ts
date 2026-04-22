export type LoginMethod = 'phone' | 'cookie'
export type LoginStatus = 'anonymous' | 'restoring' | 'authenticated' | 'expired' | 'error'
export type SearchTab = 'songs' | 'artists' | 'albums' | 'playlists'
export type RecommendationSectionType = 'songs' | 'playlist'
export type PlaybackSourceType = 'search' | 'recommendation' | 'playlist' | 'history' | 'manual'
export type PlayMode = 'list' | 'single' | 'shuffle'

export interface AuthSession {
  userId: number
  nickname: string
  avatarUrl: string
  cookie: string
  loginMethod: LoginMethod
  loginStatus: LoginStatus
}

export interface Song {
  id: number
  name: string
  artistNames: string[]
  albumName: string
  coverUrl: string
  durationMs: number
  playable: boolean
}

export interface ArtistSummary {
  id: number
  name: string
  coverUrl: string
  trackCount?: number
}

export interface AlbumSummary {
  id: number
  name: string
  artistName: string
  coverUrl: string
  publishTimeText?: string
}

export interface PlaylistSummary {
  id: number
  name: string
  coverUrl: string
  description: string
  trackCount: number
  playCount?: number
}

export interface SearchResults {
  songs: Song[]
  artists: ArtistSummary[]
  albums: AlbumSummary[]
  playlists: PlaylistSummary[]
}

export interface SearchState {
  keyword: string
  activeTab: SearchTab
  loading: boolean
  results: SearchResults
  lastSearchedKeyword: string
  error: string | null
}

export interface RecommendationSection {
  id: string
  title: string
  subtitle: string
  type: RecommendationSectionType
  songs?: Song[]
  playlists?: PlaylistSummary[]
}

export interface RecommendationFeed {
  sections: RecommendationSection[]
  refreshToken: string
  pageSeed: number
  fallbackUsed: boolean
  loading: boolean
  error: string | null
}

export interface PlaybackQueue {
  currentSongId: number | null
  sourceType: PlaybackSourceType
  songIds: number[]
  pendingSongIds: number[]
  mode: PlayMode
  volume: number
  progressMs: number
}

export interface PlaySummary {
  songId: number
  playedMs: number
  completed: boolean
  updatedAt: string
}

export interface SearchClickHistory {
  keyword: string
  targetId: number
  targetType: SearchTab
  clickedAt: string
}

export interface RecentPlay {
  song: Song
  playedAt: string
}

export interface UserHistory {
  recentPlays: RecentPlay[]
  searchClicks: SearchClickHistory[]
  playSummaries: PlaySummary[]
}

export interface ApiErrorPayload {
  code?: number
  message?: string
  msg?: string
}
