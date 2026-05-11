<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { NBadge } from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchPendingCounts, fetchSettings } from '@/service/api';

defineOptions({
  name: 'HeaderShortcuts'
});

const router = useRouter();

// 当前时间
const currentTime = ref('');
let timer: ReturnType<typeof setInterval> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function updateTime() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  currentTime.value = `${y}-${m}-${d} ${h}:${min}:${s}`;
}

// 待处理数量
const orderCount = ref(0);
const rechargeCount = ref(0);
const withdrawCount = ref(0);
const kycCount = ref(0);
const onlineCount = ref(0);

// ========== 提示音逻辑 ==========
const defaultSoundFiles: Record<string, string> = {
  default: '/static/dingdong.mp3',
  coin: '/static/yingbi.mp3',
  alert: '/static/jingming.mp3',
  alert_long: '/static/changming.mp3'
};

let customSoundUrls: Record<string, string> = {};

function getSoundUrl(soundKey: string): string {
  return customSoundUrls[soundKey] || defaultSoundFiles[soundKey] || defaultSoundFiles.default;
}

interface SoundConfig {
  key: string;
  enabled: boolean;
  mode: string;
  sound: string;
}

let soundConfigs: SoundConfig[] = [];
let prevCounts: Record<string, number> = {};
let audioInstance: HTMLAudioElement | null = null;
let isFirstLoad = true; // 首次加载标记

async function loadSoundConfig() {
  try {
    const { data, error } = await fetchSettings();
    if (!error && data) {
      const notify = data.notify || {};
      if (notify.soundConfig) {
        soundConfigs = JSON.parse(notify.soundConfig);
      }
      if (notify.soundCustomUrls) {
        try { customSoundUrls = JSON.parse(notify.soundCustomUrls); } catch { /* 忽略 */ }
      }
    }
  } catch { /* 静默 */ }
}

// 音频缓存（预加载，避免每次播放都请求文件）
const audioCache: Record<string, HTMLAudioElement> = {};

function getOrCreateAudio(src: string): HTMLAudioElement {
  if (!audioCache[src]) {
    audioCache[src] = new Audio(src);
    audioCache[src].preload = 'auto';
  }
  return audioCache[src];
}

// 待播放队列（浏览器阻止自动播放时暂存）
let pendingPlay: { soundKey: string; loop: boolean } | null = null;
let userInteracted = false;

function playSound(soundKey: string, loop = false) {
  const src = getSoundUrl(soundKey);
  try {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
    audioInstance = getOrCreateAudio(src);
    audioInstance.loop = loop;
    audioInstance.currentTime = 0;
    audioInstance.play().then(() => {
      userInteracted = true;
      pendingPlay = null;
    }).catch(() => {
      pendingPlay = { soundKey, loop };
    });
  } catch { /* 静默 */ }
}

// 用户首次交互时尝试播放被阻止的音频
function onUserInteraction() {
  if (!userInteracted && pendingPlay) {
    userInteracted = true;
    playSound(pendingPlay.soundKey, pendingPlay.loop);
    document.removeEventListener('click', onUserInteraction);
    document.removeEventListener('keydown', onUserInteraction);
  }
}
document.addEventListener('click', onUserInteraction, { once: false });
document.addEventListener('keydown', onUserInteraction, { once: false });

function stopSound() {
  if (audioInstance) {
    audioInstance.pause();
    audioInstance.currentTime = 0;
    audioInstance = null;
  }
}

// interval 模式的上次播放时间记录
let lastIntervalPlayTime = 0;

function checkAndPlaySound(counts: Record<string, number>) {
  if (!soundConfigs.length) return;

  const keyMap: Record<string, string> = {
    kyc: 'kyc',
    recharge: 'recharge',
    withdraw: 'withdraw',
    orders: 'order'
  };

  for (const [countKey, configKey] of Object.entries(keyMap)) {
    const config = soundConfigs.find(c => c.key === configKey);
    if (!config || !config.enabled) continue;

    const current = counts[countKey] || 0;
    const prev = prevCounts[countKey] || 0;

    // loop 模式：只要有待处理事件就循环播放，处理完后停止
    if (config.mode === 'loop' && current > 0) {
      if (!audioInstance || audioInstance.paused) {
        playSound(config.sound, true);
      }
      break;
    }
    // loop 模式：处理完后停止
    if (config.mode === 'loop' && current === 0 && audioInstance) {
      stopSound();
    }
    // once 模式：只在新增时播放一次（首次加载不播放）
    if (config.mode === 'once' && !isFirstLoad && current > prev && current > 0) {
      playSound(config.sound, false);
      break;
    }
    // interval 模式：每隔5分钟响铃一次（只要有待处理事件）
    if (config.mode === 'interval' && current > 0) {
      const now = Date.now();
      if (now - lastIntervalPlayTime >= 5 * 60 * 1000) {
        playSound(config.sound, false);
        lastIntervalPlayTime = now;
      }
      break;
    }
  }

  prevCounts = { ...counts };
  isFirstLoad = false;
}

// ========== 数据加载 ==========
async function loadPendingCounts() {
  try {
    const { data, error } = await fetchPendingCounts();
    if (!error && data) {
      const counts = {
        recharge: data.recharge ?? 0,
        withdraw: data.withdraw ?? 0,
        kyc: data.kyc ?? 0,
        orders: data.orders ?? 0,
        online: data.online ?? 0
      };

      rechargeCount.value = counts.recharge;
      withdrawCount.value = counts.withdraw;
      kycCount.value = counts.kyc;
      orderCount.value = counts.orders;
      onlineCount.value = counts.online;

      // 检查是否需要播放提示音
      checkAndPlaySound(counts);
    }
  } catch { /* 静默处理 */ }
}

// 路由跳转
function goOrders() { router.push('/project/order'); }
function goRecharge() { router.push('/finance/recharge-audit'); }
function goWithdraw() { router.push('/finance/withdraw-audit'); }
function goKyc() { router.push('/user/kyc'); }
function goOnline() { router.push('/user/online'); }

onMounted(async () => {
  updateTime();
  timer = setInterval(updateTime, 1000);

  // 先加载提示音配置
  await loadSoundConfig();

  // 立即加载待处理数量并检查响铃
  loadPendingCounts();

  // 每60秒轮询
  pollTimer = setInterval(loadPendingCounts, 60000);

  // 暴露刷新方法
  (window as any).__refreshPendingCounts = loadPendingCounts;
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (pollTimer) clearInterval(pollTimer);
  if (audioInstance) { audioInstance.pause(); audioInstance = null; }
});
</script>

<template>
  <div class="flex-y-center gap-4px">
    <!-- 当前时间 -->
    <span class="text-14px op-60 whitespace-nowrap mr-8px">{{ currentTime }}</span>

    <!-- 订单 -->
    <NBadge :value="orderCount" :max="99" :offset="[-6, 6]" color="#f5222d">
      <ButtonIcon tooltip-content="待处理订单" @click="goOrders">
        <SvgIcon icon="ph:shopping-cart" class="text-icon" />
        <span class="text-14px">订单</span>
      </ButtonIcon>
    </NBadge>

    <!-- 充值 -->
    <NBadge :value="rechargeCount" :max="99" :offset="[-6, 6]" color="#f5222d">
      <ButtonIcon tooltip-content="待审核充值" @click="goRecharge">
        <SvgIcon icon="ph:wallet" class="text-icon" />
        <span class="text-14px">充值</span>
      </ButtonIcon>
    </NBadge>

    <!-- 提现 -->
    <NBadge :value="withdrawCount" :max="99" :offset="[-6, 6]" color="#f5222d">
      <ButtonIcon tooltip-content="待审核提现" @click="goWithdraw">
        <SvgIcon icon="ph:money" class="text-icon" />
        <span class="text-14px">提现</span>
      </ButtonIcon>
    </NBadge>

    <!-- 实名 -->
    <NBadge :value="kycCount" :max="99" :offset="[-6, 6]" color="#f5222d">
      <ButtonIcon tooltip-content="待审核实名认证" @click="goKyc">
        <SvgIcon icon="ph:shield-check" class="text-icon" />
        <span class="text-14px">实名</span>
      </ButtonIcon>
    </NBadge>

    <!-- 在线 -->
    <NBadge :value="onlineCount" :max="99" :offset="[-6, 6]" color="#52c41a">
      <ButtonIcon tooltip-content="当前在线用户" @click="goOnline">
        <SvgIcon icon="ph:user" class="text-icon" />
        <span class="text-14px">在线</span>
      </ButtonIcon>
    </NBadge>
  </div>
</template>
