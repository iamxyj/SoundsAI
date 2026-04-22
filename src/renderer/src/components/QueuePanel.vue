<script setup lang="ts">
import type { PlayMode, Song } from '@renderer/types/music'
import { formatDuration } from '@renderer/utils/format'

defineProps<{
  songs: Song[]
  currentSongId: number | null
  mode: PlayMode
}>()

defineEmits<{
  playSong: [song: Song]
  changeMode: [mode: PlayMode]
}>()

const modes: Array<{ key: PlayMode; label: string }> = [
  { key: 'list', label: '列表循环' },
  { key: 'single', label: '单曲循环' },
  { key: 'shuffle', label: '随机播放' }
]
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">Queue</p>
        <h2>当前播放队列</h2>
      </div>
      <div class="mode-select">
        <button
          v-for="modeOption in modes"
          :key="modeOption.key"
          :class="{ active: mode === modeOption.key }"
          type="button"
          @click="$emit('changeMode', modeOption.key)"
        >
          {{ modeOption.label }}
        </button>
      </div>
    </div>

    <p v-if="!songs.length" class="empty">先从搜索结果或推荐流中播放一首歌，这里会自动形成连续播放队列。</p>

    <div v-else class="queue-list">
      <button
        v-for="song in songs"
        :key="song.id"
        :class="{ current: song.id === currentSongId }"
        class="queue-item"
        type="button"
        @click="$emit('playSong', song)"
      >
        <div class="queue-item__meta">
          <strong>{{ song.name }}</strong>
          <span>{{ song.artistNames.join(' / ') }}</span>
        </div>
        <small>{{ formatDuration(song.durationMs) }}</small>
      </button>
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: 1rem;
}

.panel-header {
  display: grid;
  gap: 0.8rem;
}

.eyebrow {
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent-soft);
}

h2 {
  font-size: 1.5rem;
  letter-spacing: -0.04em;
}

.mode-select {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mode-select button {
  min-height: 36px;
  padding: 0 0.9rem;
  border: 0;
  border-radius: 999px;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.mode-select button.active {
  color: var(--color-text);
  background: rgba(255, 177, 62, 0.16);
}

.empty {
  padding: 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-muted);
}

.queue-list {
  display: grid;
  gap: 0.75rem;
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.03);
  text-align: left;
}

.queue-item.current {
  border-color: rgba(255, 177, 62, 0.32);
  background: rgba(255, 177, 62, 0.1);
}

.queue-item__meta {
  display: grid;
}

.queue-item__meta span,
small {
  color: var(--color-text-muted);
}
</style>
