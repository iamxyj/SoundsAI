import { ApiRequestError, apiGet } from '@renderer/services/apiClient'

interface SongUrlPayload {
  data?: Array<{
    id: number
    url?: string | null
    freeTrialInfo?: unknown
  }>
}

export async function resolveSongStream(songId: number): Promise<string> {
  const payload = await apiGet<SongUrlPayload>('/song/url/v1', {
    id: songId,
    level: 'standard',
    timestamp: Date.now()
  })

  const url = payload.data?.[0]?.url
  if (!url) {
    throw new ApiRequestError('这首歌当前没有可用音源，已尝试自动跳过。')
  }

  return url
}
