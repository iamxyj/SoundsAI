<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import fallbackCover from '@renderer/assets/cover-fallback.svg'
import HomePanel from '@renderer/components/HomePanel.vue'
import LoginPanel from '@renderer/components/LoginPanel.vue'
import PlayerBar from '@renderer/components/PlayerBar.vue'
import QueuePanel from '@renderer/components/QueuePanel.vue'
import SearchPanel from '@renderer/components/SearchPanel.vue'
import { fetchPlaylistTracks } from '@renderer/services/musicDiscoveryService'
import { useAuthStore } from '@renderer/stores/authStore'
import { useHistoryStore } from '@renderer/stores/historyStore'
import { usePlayerStore } from '@renderer/stores/playerStore'
import { useRecommendationStore } from '@renderer/stores/recommendationStore'
import { useSearchStore } from '@renderer/stores/searchStore'
import type { PlayMode, PlaybackSourceType, PlaylistSummary, SearchTab, Song } from '@renderer/types/music'

type AppView = 'home' | 'search' | 'queue'

const authStore = useAuthStore()
const searchStore = useSearchStore()
const recommendationStore = useRecommendationStore()
const playerStore = usePlayerStore()
const historyStore = useHistoryStore()

const currentView = ref<AppView>('home')
const playlistLoading = ref(false)
const playlistError = ref<string | null>(null)

const navigationItems: Array<{ key: AppView; label: string; description: string }> = [
  { key: 'home', label: '首页', description: '推荐 / 热门 / 新歌' },
  { key: 'search', label: '搜索', description: '歌曲 / 歌手 / 专辑 / 歌单' },
  { key: 'queue', label: '队列', description: '当前播放列表' }
]

const currentSong = computed(() => playerStore.currentSong.value)
const authState = computed(() => authStore.state)
const searchState = computed(() => searchStore.state)
const recommendationState = computed(() => recommendationStore.state)
const playerState = computed(() => playerStore.state)
const historyState = computed(() => historyStore.state)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => searchState.value.keyword,
  (keyword) => {
    if (!authStore.isAuthenticated.value) return

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      void searchStore.search(keyword)
    }, 420)
  }
)

onMounted(async () => {
  historyStore.hydrate()
  await authStore.restoreSession()
  await playerStore.restorePlaybackContext()
  if (authStore.isAuthenticated.value) {
    await recommendationStore.refresh(true)
  }
})

async function handlePhoneLogin(payload: { phone: string; password: string }) {
  await authStore.signInWithPhone(payload.phone, payload.password)
  currentView.value = 'home'
  await recommendationStore.refresh(true)
}

async function handleCookieLogin(payload: { cookie: string }) {
  await authStore.signInWithCookie(payload.cookie)
  currentView.value = 'home'
  await recommendationStore.refresh(true)
}

function handleSearchPlay(song: Song, songs: Song[]) {
  historyStore.recordSearchClick({
    keyword: searchState.value.lastSearchedKeyword || searchState.value.keyword,
    targetId: song.id,
    targetType: 'songs',
    clickedAt: new Date().toISOString()
  })
  void playerStore.playQueue(songs, songs.findIndex((entry) => entry.id === song.id), 'search')
}

function handleRecommendationPlay(song: Song, songs: Song[]) {
  void playerStore.playQueue(songs, songs.findIndex((entry) => entry.id === song.id), 'recommendation')
}

function playSingleSong(song: Song, sourceType: PlaybackSourceType) {
  void playerStore.playSong(song, sourceType)
}

function addSongToQueue(song: Song) {
  playerStore.addToQueue(song)
}

async function openPlaylist(playlist: PlaylistSummary) {
  playlistLoading.value = true
  playlistError.value = null

  try {
    const payload = await fetchPlaylistTracks(playlist.id)
    if (!payload.songs.length) {
      playlistError.value = '这个歌单当前没有可播放的歌曲。'
      currentView.value = 'home'
      return
    }

    currentView.value = 'queue'
    await playerStore.playQueue(payload.songs, 0, 'playlist')
  } catch (error) {
    playlistError.value = error instanceof Error ? error.message : '歌单加载失败。'
  } finally {
    playlistLoading.value = false
  }
}

function changeMode(mode: PlayMode) {
  playerStore.setMode(mode)
}

function switchSearchTab(tab: SearchTab) {
  searchStore.setActiveTab(tab)
}

async function refreshHome() {
  await recommendationStore.refresh(authStore.isAuthenticated.value)
}

function updateBaseUrl(baseUrl: string) {
  authStore.setBaseUrl(baseUrl)
}

function updateSearchKeyword(event: Event) {
  searchStore.setKeyword((event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="app-shell">
    <div class="background-orb background-orb--left" />
    <div class="background-orb background-orb--right" />

    <template v-if="!authStore.isAuthenticated">
      <main class="login-shell">
        <LoginPanel
          :base-url="authState.baseUrl"
          :error="authState.error"
          :loading="authState.loading"
          @cookie-login="handleCookieLogin"
          @phone-login="handlePhoneLogin"
          @update-base-url="updateBaseUrl"
        />
      </main>
    </template>

    <template v-else>
      <main class="desktop-shell">
        <aside class="sidebar">
          <div class="brand-block">
            <p class="brand-eyebrow">Sounds AI</p>
            <h1>Music MVP</h1>
            <span>{{ authState.session?.nickname }}</span>
          </div>

          <nav class="nav-list">
            <button
              v-for="item in navigationItems"
              :key="item.key"
              :class="{ active: currentView === item.key }"
              type="button"
              @click="currentView = item.key"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.description }}</span>
            </button>
          </nav>

          <div class="status-card">
            <p>服务地址</p>
            <strong>{{ authState.baseUrl }}</strong>
            <small>当前实现按网易云增强 API 的 HTTP 形态接入，方便未来迁到网页端。</small>
          </div>

          <button class="logout-button" type="button" @click="authStore.signOut()">退出登录</button>
        </aside>

        <section class="content-shell">
          <header class="topbar">
            <div>
              <p class="eyebrow">Continuous Playback</p>
              <h2>先验证“能发现、能播放、能连续听”</h2>
            </div>

            <label class="search-box">
              <span>搜索歌曲 / 歌手 / 专辑 / 歌单</span>
              <input
                :value="searchState.keyword"
                placeholder="输入关键词后自动搜索"
                type="text"
                @input="updateSearchKeyword"
                @focus="currentView = 'search'"
              />
            </label>
          </header>

          <section class="content-grid">
            <div class="main-panel">
              <HomePanel
                v-if="currentView === 'home'"
                :error="recommendationState.error || playlistError"
                :fallback-used="recommendationState.fallbackUsed"
                :loading="recommendationState.loading || playlistLoading"
                :recent-plays="historyState.recentPlays"
                :sections="recommendationState.sections"
                @add-song="addSongToQueue"
                @open-playlist="openPlaylist"
                @play-song="handleRecommendationPlay"
                @refresh="refreshHome"
                @resume-history="(song) => playSingleSong(song, 'history')"
              />

              <SearchPanel
                v-else-if="currentView === 'search'"
                :search-state="searchState"
                @add-song="addSongToQueue"
                @open-playlist="openPlaylist"
                @play-song="handleSearchPlay"
                @switch-tab="switchSearchTab"
              />

              <QueuePanel
                v-else
                :current-song-id="currentSong?.id ?? null"
                :mode="playerState.mode"
                :songs="playerState.queue"
                @change-mode="changeMode"
                @play-song="(song) => playSingleSong(song, 'manual')"
              />
            </div>

            <aside class="insight-panel">
              <div class="insight-card">
                <p class="eyebrow">Now Playing</p>
                <div class="artwork">
                  <img
                    :alt="currentSong?.name ?? 'Nothing playing'"
                    :src="currentSong?.coverUrl || fallbackCover"
                  />
                </div>
                <div class="track-copy">
                  <strong>{{ currentSong?.name ?? '还没有开始播放' }}</strong>
                  <span>{{ currentSong?.artistNames.join(' / ') ?? '从左侧首页或搜索开始。' }}</span>
                </div>
              </div>

              <div class="insight-card metrics-card">
                <p class="eyebrow">History Signals</p>
                <div class="metric">
                  <span>最近播放</span>
                  <strong>{{ historyState.recentPlays.length }}</strong>
                </div>
                <div class="metric">
                  <span>搜索点击</span>
                  <strong>{{ historyState.searchClicks.length }}</strong>
                </div>
                <div class="metric">
                  <span>播放摘要</span>
                  <strong>{{ historyState.playSummaries.length }}</strong>
                </div>
              </div>
            </aside>
          </section>
        </section>
      </main>

      <PlayerBar
        :duration-ms="playerState.durationMs"
        :error="playerState.error"
        :loading="playerState.loading"
        :playing="playerState.playing"
        :progress-ms="playerState.progressMs"
        :song="currentSong"
        :volume="playerState.volume"
        @clear-error="playerStore.clearError"
        @next="playerStore.next"
        @previous="playerStore.previous"
        @seek="playerStore.seek"
        @toggle="playerStore.togglePlayback"
        @volume="playerStore.setVolume"
      />
    </template>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding: 1.4rem;
  position: relative;
}

.background-orb {
  position: fixed;
  inset: auto;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.22;
  pointer-events: none;
}

.background-orb--left {
  top: -60px;
  left: -120px;
  background: #ff9b61;
}

.background-orb--right {
  right: -80px;
  bottom: 120px;
  background: #4b6cff;
}

.login-shell {
  display: grid;
  place-items: center;
  min-height: calc(100vh - 2.8rem);
}

.desktop-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 1rem;
  min-height: calc(100vh - 170px);
}

.sidebar,
.content-shell,
.insight-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(9, 12, 20, 0.72);
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(20px);
}

.sidebar {
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 28px;
}

.brand-block span,
.status-card p,
.status-card small,
.eyebrow {
  color: var(--color-text-muted);
}

.brand-eyebrow,
.eyebrow {
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent-soft);
}

.brand-block h1,
.topbar h2 {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.nav-list {
  display: grid;
  gap: 0.7rem;
}

.nav-list button {
  display: grid;
  gap: 0.25rem;
  padding: 0.95rem 1rem;
  border: 0;
  border-radius: 20px;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.04);
  text-align: left;
}

.nav-list button.active {
  background: linear-gradient(135deg, rgba(255, 177, 62, 0.18), rgba(91, 122, 255, 0.16));
}

.nav-list span {
  color: var(--color-text-muted);
}

.status-card,
.logout-button {
  border-radius: 20px;
}

.status-card {
  display: grid;
  gap: 0.4rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
}

.logout-button {
  min-height: 48px;
  border: 0;
  color: #0b111f;
  background: linear-gradient(135deg, var(--color-accent), #ffd36b);
}

.content-shell {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: 28px;
}

.topbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.5rem;
}

.search-box {
  display: grid;
  gap: 0.45rem;
  min-width: min(420px, 100%);
}

.search-box span {
  color: var(--color-text-muted);
  font-size: 0.84rem;
}

.search-box input {
  width: 100%;
  min-height: 52px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 0 1rem;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.04);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) 360px;
  gap: 1rem;
  min-height: 0;
}

.main-panel {
  min-height: 0;
  overflow: auto;
  padding-right: 0.2rem;
}

.insight-panel {
  display: grid;
  gap: 1rem;
}

.insight-card {
  padding: 1rem;
  border-radius: 24px;
}

.artwork img {
  width: 100%;
  aspect-ratio: 1;
  margin: 1rem 0;
  border-radius: 22px;
  object-fit: cover;
}

.track-copy {
  display: grid;
  gap: 0.2rem;
}

.track-copy span {
  color: var(--color-text-muted);
}

.metrics-card {
  display: grid;
  gap: 0.8rem;
}

.metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 0.95rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
}

.metric span {
  color: var(--color-text-muted);
}

@media (max-width: 1200px) {
  .desktop-shell,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .insight-panel {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (max-width: 760px) {
  .app-shell {
    padding: 0.75rem;
  }

  .topbar {
    align-items: start;
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }
}
</style>
