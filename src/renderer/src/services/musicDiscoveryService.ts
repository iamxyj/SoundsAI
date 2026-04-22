import { apiGet } from '@renderer/services/apiClient'
import type {
  AlbumSummary,
  ArtistSummary,
  PlaylistSummary,
  RecommendationSection,
  SearchResults,
  SearchTab,
  Song
} from '@renderer/types/music'

interface SongSearchPayload {
  result?: {
    songs?: Array<{
      id: number
      name: string
      ar?: Array<{ name: string }>
      al?: { name?: string; picUrl?: string }
      dt?: number
      fee?: number
      privilege?: { st?: number }
    }>
  }
}

interface ArtistSearchPayload {
  result?: {
    artists?: Array<{
      id: number
      name: string
      picUrl?: string
      albumSize?: number
    }>
  }
}

interface AlbumSearchPayload {
  result?: {
    albums?: Array<{
      id: number
      name: string
      blurPicUrl?: string
      artist?: { name?: string }
      publishTime?: number
    }>
  }
}

interface PlaylistSearchPayload {
  result?: {
    playlists?: Array<{
      id: number
      name: string
      coverImgUrl?: string
      description?: string
      trackCount?: number
      playCount?: number
    }>
  }
}

interface PersonalizedSongsPayload {
  data?: Array<{
    id: number
    name: string
    ar?: Array<{ name: string }>
    al?: { name?: string; picUrl?: string }
    dt?: number
    fee?: number
  }>
}

interface NewSongPayload {
  data?: Array<{
    id: number
    name: string
    artists?: Array<{ name: string }>
    album?: { name?: string; picUrl?: string }
    duration?: number
  }>
}

interface PersonalizedPlaylistPayload {
  result?: Array<{
    id: number
    name: string
    picUrl?: string
    copywriter?: string
    trackCount?: number
    playCount?: number
  }>
}

interface TopPlaylistPayload {
  playlists?: Array<{
    id: number
    name: string
    coverImgUrl?: string
    description?: string
    trackCount?: number
    playCount?: number
  }>
}

interface PlaylistDetailPayload {
  playlist?: {
    id: number
    name: string
    tracks?: Array<{
      id: number
      name: string
      ar?: Array<{ name: string }>
      al?: { name?: string; picUrl?: string }
      dt?: number
      fee?: number
    }>
  }
}

function mapSong(item: {
  id: number
  name: string
  ar?: Array<{ name: string }>
  artists?: Array<{ name: string }>
  al?: { name?: string; picUrl?: string }
  album?: { name?: string; picUrl?: string }
  dt?: number
  duration?: number
  fee?: number
  privilege?: { st?: number }
}): Song {
  const artists = item.ar ?? item.artists ?? []
  const album = item.al ?? item.album

  return {
    id: item.id,
    name: item.name,
    artistNames: artists.map((artist) => artist.name),
    albumName: album?.name ?? '未知专辑',
    coverUrl: album?.picUrl ?? '',
    durationMs: item.dt ?? item.duration ?? 0,
    playable: item.fee !== 1 && item.privilege?.st !== -200
  }
}

function rotateItems<T>(items: T[], pageSeed: number, limit: number): T[] {
  if (!items.length) return []
  const start = pageSeed % items.length
  return Array.from({ length: Math.min(limit, items.length) }, (_, index) => {
    return items[(start + index) % items.length]
  })
}

export async function searchMusic(keyword: string, tab: SearchTab): Promise<SearchResults[SearchTab]> {
  const types: Record<SearchTab, number> = {
    songs: 1,
    artists: 100,
    albums: 10,
    playlists: 1000
  }

  const payload = await apiGet<
    SongSearchPayload | ArtistSearchPayload | AlbumSearchPayload | PlaylistSearchPayload
  >('/cloudsearch', {
    keywords: keyword,
    type: types[tab],
    limit: tab === 'songs' ? 18 : 12,
    timestamp: Date.now()
  })

  switch (tab) {
    case 'songs':
      return ((payload as SongSearchPayload).result?.songs ?? []).map(mapSong)
    case 'artists':
      return ((payload as ArtistSearchPayload).result?.artists ?? []).map<ArtistSummary>((artist) => ({
        id: artist.id,
        name: artist.name,
        coverUrl: artist.picUrl ?? '',
        trackCount: artist.albumSize
      }))
    case 'albums':
      return ((payload as AlbumSearchPayload).result?.albums ?? []).map<AlbumSummary>((album) => ({
        id: album.id,
        name: album.name,
        artistName: album.artist?.name ?? '未知歌手',
        coverUrl: album.blurPicUrl ?? '',
        publishTimeText: album.publishTime ? new Date(album.publishTime).getFullYear().toString() : undefined
      }))
    case 'playlists':
      return ((payload as PlaylistSearchPayload).result?.playlists ?? []).map<PlaylistSummary>((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        coverUrl: playlist.coverImgUrl ?? '',
        description: playlist.description ?? '暂无描述',
        trackCount: playlist.trackCount ?? 0,
        playCount: playlist.playCount
      }))
  }
}

export async function fetchHomeSections(isAuthenticated: boolean, pageSeed: number): Promise<{
  sections: RecommendationSection[]
  fallbackUsed: boolean
}> {
  const sections: RecommendationSection[] = []
  let fallbackUsed = false

  if (isAuthenticated) {
    try {
      const recommendedSongs = await apiGet<PersonalizedSongsPayload>('/recommend/songs', {
        timestamp: Date.now()
      })
      const mappedSongs = rotateItems((recommendedSongs.data ?? []).map(mapSong), pageSeed, 8)
      if (mappedSongs.length) {
        sections.push({
          id: 'daily-songs',
          title: '今日推荐',
          subtitle: '基于登录态拉取的个性化歌曲',
          type: 'songs',
          songs: mappedSongs
        })
      }
    } catch {
      fallbackUsed = true
    }
  }

  try {
    const personalized = await apiGet<PersonalizedPlaylistPayload>('/personalized', {
      limit: 12,
      timestamp: Date.now()
    })

    const playlists = rotateItems(
      (personalized.result ?? []).map<PlaylistSummary>((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        coverUrl: playlist.picUrl ?? '',
        description: playlist.copywriter ?? '平台精选歌单',
        trackCount: playlist.trackCount ?? 0,
        playCount: playlist.playCount
      })),
      pageSeed + 3,
      6
    )

    if (playlists.length) {
      sections.push({
        id: 'playlist-picks',
        title: '场景歌单',
        subtitle: '用于快速进入连续播放状态',
        type: 'playlist',
        playlists
      })
    }
  } catch {
    fallbackUsed = true
  }

  try {
    const newSongs = await apiGet<NewSongPayload>('/top/song', {
      type: 0,
      timestamp: Date.now()
    })
    const mappedSongs = rotateItems((newSongs.data ?? []).map(mapSong), pageSeed + 5, 8)
    if (mappedSongs.length) {
      sections.push({
        id: 'new-songs',
        title: '新歌雷达',
        subtitle: '推荐流兜底也优先保证可播内容',
        type: 'songs',
        songs: mappedSongs
      })
    }
  } catch {
    fallbackUsed = true
  }

  if (!sections.length) {
    const hotPlaylists = await apiGet<TopPlaylistPayload>('/top/playlist', {
      limit: 6,
      order: 'hot',
      timestamp: Date.now()
    })

    sections.push({
      id: 'hot-fallback',
      title: '热门兜底',
      subtitle: '个性化推荐不可用时的公共内容流',
      type: 'playlist',
      playlists: (hotPlaylists.playlists ?? []).map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        coverUrl: playlist.coverImgUrl ?? '',
        description: playlist.description ?? '热门歌单',
        trackCount: playlist.trackCount ?? 0,
        playCount: playlist.playCount
      }))
    })
    fallbackUsed = true
  }

  return {
    sections,
    fallbackUsed
  }
}

export async function fetchPlaylistTracks(playlistId: number): Promise<{
  name: string
  songs: Song[]
}> {
  const payload = await apiGet<PlaylistDetailPayload>('/playlist/detail', {
    id: playlistId,
    timestamp: Date.now()
  })

  return {
    name: payload.playlist?.name ?? '歌单',
    songs: (payload.playlist?.tracks ?? []).map(mapSong)
  }
}
