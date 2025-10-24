<template>
  <div class="layout">
    <aside :class="['sidebar', { collapsed }]">
      <div class="sidebar-header">
        <img src="/logo.svg" alt="logo" class="logo" />
        <span class="logo-text">WangchukMind</span>
        <el-button type="text" @click="collapsed = !collapsed">☰</el-button>
      </div>
      <div class="sidebar-actions">
        <el-button type="primary" class="w-100" @click="newConversation">新建对话</el-button>
      </div>
      <div class="history">
        <div class="title">最近对话</div>
        <div v-for="c in conversations" :key="c.id" :class="['history-item', { active: c.id === currentId }]" @click="selectConversation(c.id)">
          <div class="name">{{ c.name }}</div>
          <div class="time">{{ formatTime(c.updatedAt) }}</div>
          <el-dropdown @command="cmd => onCommand(cmd, c.id)">
            <span class="el-dropdown-link">
              <el-button type="text">⋮</el-button>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">重命名</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="sidebar-footer">
        <div class="user" @click="showLogin = !isLoggedIn">
          <div class="avatar">{{ isLoggedIn ? userInfo?.nickname ?? '用户' : '未登录' }}</div>
        </div>
      </div>
    </aside>

    <main class="content">
      <div class="header">
        <el-button type="text" v-if="collapsed" @click="collapsed = false">☰</el-button>
        <div class="spacer" />
        <el-button type="text" @click="toggleLang">{{ lang === 'bo' ? '切换中文' : 'སྒྱུར་བ།' }}</el-button>
      </div>

      <div class="messages" ref="contentRef">
        <div v-if="!currentId" class="welcome">
          <h2>{{ lang === 'bo' ? 'དྲི་མེད་རིག་ནུས།' : 'Zhime AI' }}</h2>
          <p>{{ lang === 'bo' ? 'སྐད་ཆ་གསར་པ་འགོ་འཛུགས།' : '开始你的对话' }}</p>
        </div>
        <div v-for="m in messages" :key="m.id + m.type" :class="['message', m.role]">
          <div class="bubble" v-html="m.html"></div>
        </div>
        <div v-if="isTyping" class="typing">···</div>
      </div>

      <div class="input-area">
        <el-input v-model="input" :placeholder="lang==='bo'?'དོན་ཚན་འཇུག':'请输入'" type="textarea" autosize />
        <div class="actions">
          <el-button type="primary" :disabled="!input.trim()" @click="send">发送</el-button>
        </div>
      </div>
    </main>

    <el-dialog v-model="dialogRename" title="重命名对话">
      <el-input v-model="renameText" maxlength="50" show-word-limit />
      <template #footer>
        <el-button @click="dialogRename=false">取消</el-button>
        <el-button type="primary" @click="doRename">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showLogin" title="登录">
      <el-input v-model="phone" placeholder="手机号" />
      <div style="margin-top:8px; display:flex; gap:8px">
        <el-input v-model="code" placeholder="验证码" />
        <el-button @click="sendCode">发送验证码</el-button>
      </div>
      <template #footer>
        <el-button @click="showLogin=false">取消</el-button>
        <el-button type="primary" @click="doLogin">登录</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { marked } from 'marked'
import hljs from 'highlight.js'

const contentRef = ref<HTMLElement | null>(null)
const collapsed = ref(false)
const lang = ref<'bo' | 'zh'>('bo')
const input = ref('')
const auth = useAuthStore()
const isLoggedIn = ref(false)
const userInfo = ref<any>(null)
const conversations = ref<any[]>([])
const currentId = ref<string | null>(null)
const messages = ref<any[]>([])
const isTyping = ref(false)
const dialogRename = ref(false)
const renameText = ref('')
const renameId = ref('')
const showLogin = ref(false)
const phone = ref('')
const code = ref('')

function renderMarkdown(md: string) {
  return marked.parse(md, {
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value
      return hljs.highlightAuto(code).value
    }
  }) as string
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString()
}

async function loadConversations() {
  const data = await api.getConversations()
  conversations.value = data.items || []
}

function selectConversation(id: string) {
  currentId.value = id
  messages.value = []
}

async function newConversation() {
  const r = await api.createConversation('新建对话')
  await loadConversations()
  selectConversation(r.item.id)
}

function onCommand(cmd: string, id: string) {
  if (cmd === 'rename') {
    renameText.value = conversations.value.find(x => x.id === id)?.name || ''
    renameId.value = id
    dialogRename.value = true
  } else if (cmd === 'delete') {
    api.deleteConversation(id).then(loadConversations)
  }
}

async function doRename() {
  await api.renameConversation(renameId.value, renameText.value)
  dialogRename.value = false
  await loadConversations()
}

async function send() {
  if (!input.value.trim()) return
  const userMsg = { id: crypto.randomUUID(), role: 'user', html: renderMarkdown(input.value) }
  messages.value.push(userMsg)
  const body = { input: input.value, conversationId: currentId.value }
  input.value = ''
  isTyping.value = true
  const resp = await api.sseChat(body)
  const reader = resp.body?.getReader()
  const decoder = new TextDecoder()
  let assistantText = ''
  while (reader) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    const events = chunk.split('\n\n').filter(Boolean)
    for (const e of events) {
      const line = e.split('\n').find(l => l.startsWith('data: '))
      if (!line) continue
      try {
        const data = JSON.parse(line.slice(6))
        if (data.type === 'token') {
          assistantText += data.content
        }
      } catch {}
    }
  }
  isTyping.value = false
  messages.value.push({ id: crypto.randomUUID(), role: 'assistant', html: renderMarkdown(assistantText) })
  await nextTick()
  contentRef.value?.scrollTo({ top: contentRef.value.scrollHeight, behavior: 'smooth' })
}

function toggleLang() {
  lang.value = lang.value === 'bo' ? 'zh' : 'bo'
}

function sendCode() { api.sendSmsCode(phone.value) }
async function doLogin() {
  const r = await api.smsLogin(phone.value, code.value)
  auth.login(r.token, r.userInfo)
  isLoggedIn.value = true
  userInfo.value = r.userInfo
  showLogin.value = false
}

onMounted(async () => {
  auth.init()
  isLoggedIn.value = auth.isLoggedIn
  userInfo.value = auth.userInfo
  await loadConversations()
})
</script>
<style scoped>
.layout { display: grid; grid-template-columns: 300px 1fr; height: 100%; }
.sidebar { border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
.sidebar.collapsed { width: 0; overflow: hidden; }
.sidebar-header { display: flex; align-items: center; gap: 8px; padding: 12px; }
.logo { width: 24px; height: 24px; }
.sidebar-actions { padding: 12px; }
.history { flex: 1; overflow: auto; padding: 8px; }
.history .title { font-size: 12px; color: #6b7280; margin: 8px; }
.history-item { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 6px; }
.history-item.active { background: #eff6ff; border-left: 3px solid #3b82f6; }
.name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time { font-size: 11px; color: #9ca3af; }
.sidebar-footer { padding: 12px; border-top: 1px solid #e5e7eb; }
.user { cursor: pointer; }
.content { display: flex; flex-direction: column; height: 100%; }
.header { height: 50px; display: flex; align-items: center; padding: 0 12px; gap: 8px; border-bottom: 1px solid #e5e7eb; }
.spacer { flex: 1; }
.messages { flex: 1; overflow: auto; padding: 12px; }
.message { margin: 8px 0; }
.message .bubble { background: #f3f4f6; padding: 10px; border-radius: 8px; }
.message.user .bubble { background: #dbeafe; }
.typing { color: #6b7280; padding: 8px; }
.input-area { padding: 12px; border-top: 1px solid #e5e7eb; display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.w-100 { width: 100%; }
</style>
