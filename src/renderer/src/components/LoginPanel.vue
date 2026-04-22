<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  baseUrl: string
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  updateBaseUrl: [value: string]
  phoneLogin: [payload: { phone: string; password: string }]
  cookieLogin: [payload: { cookie: string }]
}>()

const mode = ref<'phone' | 'cookie'>('phone')
const phone = ref('')
const password = ref('')
const cookie = ref('')
const apiBaseUrl = ref(props.baseUrl)

const canSubmit = computed(() => {
  if (mode.value === 'phone') {
    return phone.value.trim().length >= 11 && password.value.trim().length >= 6
  }

  return cookie.value.trim().length > 20
})

function submit() {
  emit('updateBaseUrl', apiBaseUrl.value)
  if (mode.value === 'phone') {
    emit('phoneLogin', {
      phone: phone.value.trim(),
      password: password.value.trim()
    })
    return
  }

  emit('cookieLogin', {
    cookie: cookie.value.trim()
  })
}
</script>

<template>
  <section class="login-card">
    <div class="eyebrow">Sounds AI / Phase 1</div>
    <h1>把“登录 → 搜索 → 播放”先跑通</h1>
    <p class="intro">
      当前实现直接对接网易云增强 API 的 HTTP 服务形态。你只需要提供可用的服务地址，再用手机号密码或 Cookie 登录。
    </p>

    <label class="field">
      <span>API Base URL</span>
      <input v-model="apiBaseUrl" placeholder="http://127.0.0.1:3000" type="text" />
    </label>

    <div class="mode-switch">
      <button :class="{ active: mode === 'phone' }" type="button" @click="mode = 'phone'">手机号登录</button>
      <button :class="{ active: mode === 'cookie' }" type="button" @click="mode = 'cookie'">Cookie 登录</button>
    </div>

    <div v-if="mode === 'phone'" class="form-grid">
      <label class="field">
        <span>手机号</span>
        <input v-model="phone" inputmode="numeric" placeholder="请输入 11 位手机号" type="text" />
      </label>

      <label class="field">
        <span>密码</span>
        <input v-model="password" placeholder="密码" type="password" />
      </label>
    </div>

    <label v-else class="field">
      <span>Cookie</span>
      <textarea
        v-model="cookie"
        placeholder="粘贴完整 Cookie 字符串，用于直接恢复登录态"
        rows="5"
      />
    </label>

    <p v-if="error" class="error">{{ error }}</p>

    <button :disabled="loading || !canSubmit" class="submit-button" type="button" @click="submit">
      {{ loading ? '正在验证登录态...' : '进入音乐桌面' }}
    </button>
  </section>
</template>

<style scoped>
.login-card {
  width: min(520px, 100%);
  padding: 2.4rem;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.04)),
    rgba(8, 10, 18, 0.88);
  box-shadow: 0 32px 90px rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(26px);
}

.eyebrow {
  margin-bottom: 0.8rem;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent-soft);
}

h1 {
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.intro {
  margin: 1rem 0 1.6rem;
  color: var(--color-text-muted);
}

.mode-switch {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  padding: 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.mode-switch button {
  min-height: 42px;
  border: 0;
  border-radius: 999px;
  color: var(--color-text-muted);
  background: transparent;
}

.mode-switch button.active {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.14);
}

.form-grid {
  display: grid;
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.5rem;
  margin-top: 1.1rem;
}

.field span {
  font-size: 0.84rem;
  color: var(--color-text-muted);
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 0.95rem 1rem;
  color: var(--color-text);
  background: rgba(10, 13, 24, 0.85);
}

.field textarea {
  resize: vertical;
}

.error {
  margin-top: 1rem;
  color: #ffb4b4;
}

.submit-button {
  width: 100%;
  margin-top: 1.3rem;
  min-height: 52px;
  border: 0;
  border-radius: 16px;
  font-weight: 700;
  color: #0a0f19;
  background: linear-gradient(135deg, var(--color-accent), #ffde8c);
  box-shadow: 0 16px 44px rgba(255, 177, 62, 0.34);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
