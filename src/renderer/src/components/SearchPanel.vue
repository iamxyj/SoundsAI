<script setup lang="ts">
import fallbackCover from '@renderer/assets/cover-fallback.svg'
import type {
  SearchState,
  SearchTab,
  PlaylistSummary,
  Song
} from '@renderer/types/music'
import { formatDuration } from '@renderer/utils/format'

defineProps<{
  searchState: SearchState
}>()

defineEmits<{
  playSong: [song: Song, songs: Song[]]
  addSong: [song: Song]
  switchTab: [tab: SearchTab]
  openPlaylist: [playlist: PlaylistSummary]
}>()

const tabs: Array<{ key: SearchTab; label: string }> = [
  { key: 'songs', label: '歌曲' },
  { key: 'artists', label: '歌手' },
  { key: 'albums', label: '专辑' },
  { key: 'playlists', label: '歌单' }
]
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">Search</p>
        <h2>多类型搜索</h2>
      </div>
      <span class="search-keyword" v-if="searchState.lastSearchedKeyword">
        {{ searchState.lastSearchedKeyword }}
      </span>
    </div>

    <div class="tab-row">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: searchState.activeTab === tab.key }"
        type="button"
        @click="$emit('switchTab', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <p v-if="searchState.error" class="error">{{ searchState.error }}</p>
    <p
      v-else-if="!searchState.loading && searchState.lastSearchedKeyword && !searchState.results[searchState.activeTab].length"
      class="empty"
    >
      没有找到与“{{ searchState.lastSearchedKeyword }}”相关的结果。
    </p>

    <div v-if="searchState.loading" class="loading-list">
      <div v-for="index in 6" :key="index" class="skeleton-row" />
    </div>

    <div v-else class="result-list">
      <template v-if="searchState.activeTab === 'songs'">
        <button
          v-for="song in searchState.results.songs"
          :key="song.id"
          class="song-row"
          type="button"
          @click="$emit('playSong', song, searchState.results.songs)"
        >
          <img :alt="song.name" :src="song.coverUrl || fallbackCover" />
          <div class="primary">
            <strong>{{ song.name }}</strong>
            <span>{{ song.artistNames.join(' / ') }}</span>
          </div>
          <div class="secondary">
            <span>{{ song.albumName }}</span>
            <small>{{ formatDuration(song.durationMs) }}</small>
          </div>
          <span class="queue-action" @click.stop="$emit('addSong', song)">加入队列</span>
        </button>
      </template>

      <template v-else-if="searchState.activeTab === 'artists'">
        <div
          v-for="artist in searchState.results.artists"
          :key="artist.id"
          class="result-card"
        >
          <img :alt="artist.name" :src="artist.coverUrl || fallbackCover" />
          <div class="primary">
            <strong>{{ artist.name }}</strong>
            <span>{{ artist.trackCount ?? 0 }} 张专辑</span>
          </div>
        </div>
      </template>

      <template v-else-if="searchState.activeTab === 'albums'">
        <div
          v-for="album in searchState.results.albums"
          :key="album.id"
          class="result-card"
        >
          <img :alt="album.name" :src="album.coverUrl || fallbackCover" />
          <div class="primary">
            <strong>{{ album.name }}</strong>
            <span>{{ album.artistName }}</span>
          </div>
          <small>{{ album.publishTimeText }}</small>
        </div>
      </template>

      <template v-else>
        <button
          v-for="playlist in searchState.results.playlists"
          :key="playlist.id"
          class="result-card playlist-result"
          type="button"
          @click="$emit('openPlaylist', playlist)"
        >
          <img :alt="playlist.name" :src="playlist.coverUrl || fallbackCover" />
          <div class="primary">
            <strong>{{ playlist.name }}</strong>
            <span>{{ playlist.description }}</span>
          </div>
          <small>{{ playlist.trackCount }} 首</small>
        </button>
      </template>
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: 1rem;
}

.panel-header,
.tab-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.eyebrow {
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent-soft);
}

h2 {
  font-size: 1.7rem;
  line-height: 1;
  letter-spacing: -0.04em;
}

.search-keyword {
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-muted);
}

.tab-row button {
  min-height: 40px;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.tab-row button.active {
  color: var(--color-text);
  background: rgba(255, 177, 62, 0.2);
}

.error,
.empty {
  padding: 0.9rem 1rem;
  border-radius: 16px;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.loading-list,
.result-list {
  display: grid;
  gap: 0.8rem;
}

.skeleton-row {
  min-height: 86px;
  border-radius: 20px;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
}

.song-row,
.result-card {
  display: grid;
  grid-template-columns: 64px 1.4fr 1fr auto;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.03);
  text-align: left;
}

.result-card {
  grid-template-columns: 64px 1fr auto;
}

.song-row img,
.result-card img {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
}

.primary,
.secondary {
  display: grid;
  gap: 0.15rem;
}

.primary span,
.secondary,
.result-card small {
  color: var(--color-text-muted);
}

.queue-action {
  color: var(--color-accent-soft);
}

.playlist-result {
  border: 0;
}

@media (max-width: 720px) {
  .song-row,
  .result-card {
    grid-template-columns: 56px 1fr;
  }

  .secondary,
  .queue-action,
  .result-card small {
    grid-column: 2;
  }
}
</style>
