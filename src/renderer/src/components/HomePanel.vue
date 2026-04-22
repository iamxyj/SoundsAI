<script setup lang="ts">
import fallbackCover from '@renderer/assets/cover-fallback.svg'
import type { PlaylistSummary, RecommendationSection, Song } from '@renderer/types/music'
import { formatDuration, formatLargeNumber, formatRelativeTime } from '@renderer/utils/format'

defineProps<{
  loading: boolean
  error: string | null
  fallbackUsed: boolean
  sections: RecommendationSection[]
  recentPlays: Array<{ song: Song; playedAt: string }>
}>()

defineEmits<{
  refresh: []
  playSong: [song: Song, songs: Song[]]
  addSong: [song: Song]
  openPlaylist: [playlist: PlaylistSummary]
  resumeHistory: [song: Song]
}>()
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">Discover</p>
        <h2>首页推荐流</h2>
      </div>
      <button class="ghost-button" type="button" @click="$emit('refresh')">换一批</button>
    </div>

    <p v-if="fallbackUsed" class="notice">当前展示包含热门兜底内容，用来保证推荐流始终可播。</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="recentPlays.length" class="history-strip">
      <div class="panel-subtitle">最近播放</div>
      <div class="history-list">
        <button
          v-for="entry in recentPlays"
          :key="entry.song.id"
          class="history-pill"
          type="button"
          @click="$emit('resumeHistory', entry.song)"
        >
          <span>{{ entry.song.name }}</span>
          <small>{{ formatRelativeTime(entry.playedAt) }}</small>
        </button>
      </div>
    </div>

    <div v-if="loading" class="placeholder-grid">
      <div v-for="index in 6" :key="index" class="placeholder-card" />
    </div>

    <div v-else class="section-list">
      <article v-for="section in sections" :key="section.id" class="section-card">
        <div class="section-heading">
          <div>
            <p class="panel-subtitle">{{ section.title }}</p>
            <h3>{{ section.subtitle }}</h3>
          </div>
        </div>

        <div v-if="section.type === 'songs'" class="song-grid">
          <button
            v-for="song in section.songs"
            :key="song.id"
            class="song-card"
            type="button"
            @click="$emit('playSong', song, section.songs ?? [])"
          >
            <img :alt="song.name" :src="song.coverUrl || fallbackCover" />
            <div class="song-meta">
              <strong>{{ song.name }}</strong>
              <span>{{ song.artistNames.join(' / ') }}</span>
            </div>
            <div class="song-actions">
              <small>{{ formatDuration(song.durationMs) }}</small>
              <span class="icon-button" @click.stop="$emit('addSong', song)">加入队列</span>
            </div>
          </button>
        </div>

        <div v-else class="playlist-grid">
          <button
            v-for="playlist in section.playlists"
            :key="playlist.id"
            class="playlist-card"
            type="button"
            @click="$emit('openPlaylist', playlist)"
          >
            <img :alt="playlist.name" :src="playlist.coverUrl || fallbackCover" />
            <div class="playlist-meta">
              <strong>{{ playlist.name }}</strong>
              <span>{{ playlist.description }}</span>
              <small>{{ playlist.trackCount }} 首 · {{ formatLargeNumber(playlist.playCount) }} 播放</small>
            </div>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: 1.2rem;
}

.panel-header,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow,
.panel-subtitle {
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent-soft);
}

h2 {
  font-size: 1.9rem;
  line-height: 1;
  letter-spacing: -0.04em;
}

h3 {
  color: var(--color-text-muted);
}

.notice,
.error {
  padding: 0.85rem 1rem;
  border-radius: 16px;
}

.notice {
  background: rgba(255, 194, 92, 0.1);
  color: #ffd27d;
}

.error {
  background: rgba(255, 132, 132, 0.08);
  color: #ffb7b7;
}

.ghost-button {
  min-height: 40px;
  padding: 0 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.05);
}

.history-strip {
  display: grid;
  gap: 0.8rem;
}

.history-list {
  display: flex;
  gap: 0.7rem;
  overflow-x: auto;
}

.history-pill {
  min-width: 170px;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.04);
  text-align: left;
}

.history-pill small {
  display: block;
  color: var(--color-text-muted);
}

.placeholder-grid,
.song-grid,
.playlist-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.placeholder-card {
  min-height: 250px;
  border-radius: 24px;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
}

.section-list {
  display: grid;
  gap: 1.2rem;
}

.section-card {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.song-card,
.playlist-card {
  display: grid;
  gap: 0.8rem;
  padding: 0.85rem;
  border: 0;
  border-radius: 22px;
  color: var(--color-text);
  background: rgba(8, 10, 18, 0.72);
  text-align: left;
}

.song-card img,
.playlist-card img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 18px;
  object-fit: cover;
}

.song-meta,
.playlist-meta {
  display: grid;
  gap: 0.2rem;
}

.song-meta span,
.playlist-meta span,
.playlist-meta small {
  color: var(--color-text-muted);
}

.song-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-text-muted);
}

.icon-button {
  color: var(--color-accent-soft);
}
</style>
