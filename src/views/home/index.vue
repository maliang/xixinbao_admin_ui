<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { NCard, NGrid, NGridItem, NDataTable, NDatePicker, NButton, NButtonGroup, NSpace, NStatistic } from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchDashboardSummary, fetchDashboardToday, fetchDashboardReport, fetchDashboardDaily } from '@/service/api';

defineOptions({ name: 'HomePage' });

const router = useRouter();

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 顶部统计卡片数据 ==========
const summaryCards = ref([
  { title: '总盈亏', value: '-', icon: 'ph:chart-line-up', color: '#4A7FD0', bg: '#EBF2FC', sub: '', subColor: '#52c41a' },
  { title: '用户总量', value: '-', icon: 'ph:users', color: '#52c41a', bg: '#F0FFF0', sub: '', subColor: '#999' },
  { title: '充值总额', value: '-', icon: 'ph:wallet', color: '#722ED1', bg: '#F5F0FF', sub: '', subColor: '#999' },
  { title: '提现总额', value: '-', icon: 'ph:money', color: '#FF4D4F', bg: '#FFF1F0', sub: '', subColor: '#999' }
]);

// ========== 今日/昨日对比数据 ==========
const todayCards = ref([
  { label1: '今日充值', value1: '-', label2: '昨日充值', value2: '-', change: '', changeColor: '#52c41a' },
  { label1: '今日提现', value1: '-', label2: '昨日提现', value2: '-', change: '', changeColor: '#FF4D4F' },
  { label1: '今日新增用户', value1: '-', label2: '昨日新增', value2: '-', change: '', changeColor: '#52c41a' }
]);

// ========== 快捷入口 ==========
const shortcuts = [
  { label: '用户管理', icon: 'ph:users-three', color: '#4A7FD0', route: '/user/member' },
  { label: '充值管理', icon: 'ph:plus-circle', color: '#52c41a', route: '/finance/recharge-audit' },
  { label: '提现管理', icon: 'ph:minus-circle', color: '#FF4D4F', route: '/finance/withdraw-audit' },
  { label: '实名认证', icon: 'ph:shield-check', color: '#722ED1', route: '/user/kyc' },
  { label: '交易记录', icon: 'ph:receipt', color: '#FAAD14', route: '/finance/transaction-log' },
  { label: '数据统计', icon: 'ph:chart-bar', color: '#13C2C2', route: '' },
  { label: '消息通知', icon: 'ph:bell', color: '#FF7A45', route: '/content/message' },
  { label: '系统设置', icon: 'ph:gear', color: '#8E8E93', route: '' },
  { label: '报表导出', icon: 'ph:file-arrow-down', color: '#2F54EB', route: '' },
  { label: '帮助中心', icon: 'ph:question', color: '#333', route: '' }
];

function handleShortcut(item: typeof shortcuts[0]) {
  if (item.route) {
    router.push(item.route);
  }
}

// ========== 经营数据综合报表 ==========
const reportColumns = [
  { title: '指标项目', key: 'name', width: 140 },
  { title: '上月总计', key: 'lastMonth', align: 'right' as const },
  { title: '本月总计', key: 'thisMonth', align: 'right' as const },
  { title: '全量总计', key: 'total', align: 'right' as const }
];

const reportData = ref<any[]>([]);

// ========== 每日明细数据 ==========
const dailyTab = ref<'thisMonth' | 'lastMonth'>('thisMonth');
const dateRange = ref<[number, number] | null>(null);

const dailyColumns = [
  { title: '日期', key: 'date', width: 90, fixed: 'left' as const },
  { title: '新增用户', key: 'newUsers', align: 'right' as const },
  { title: '入款', key: 'deposit', align: 'right' as const },
  { title: '出款', key: 'withdraw', align: 'right' as const, render: (row: any) => renderChange(row.withdraw) },
  { title: '首充人数', key: 'firstDeposit', align: 'right' as const },
  { title: '活跃人数', key: 'activeUsers', align: 'right' as const },
  { title: '订单量', key: 'orders', align: 'right' as const },
  { title: '盈亏', key: 'profit', align: 'right' as const, render: (row: any) => renderChange(row.profit) },
  { title: '流水', key: 'turnover', align: 'right' as const }
];

function renderChange(val: string) {
  if (!val) return '';
  if (val.startsWith('+')) return h('span', { style: 'color: #52c41a' }, val);
  if (val.startsWith('-')) return h('span', { style: 'color: #FF4D4F' }, val);
  return val;
}

const dailyData = ref<any[]>([]);

// 快捷日期
function setToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  dateRange.value = [d.getTime(), d.getTime()];
}
function setYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  dateRange.value = [d.getTime(), d.getTime()];
}
function setThisWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setDate(now.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  dateRange.value = [start.getTime(), end.getTime()];
}
function resetDate() {
  dateRange.value = null;
  loadDaily();
}

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ========== 辅助：安全提取数组 ==========
function toArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  return [];
}

// ========== 格式化金额 ==========
function fmtMoney(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtChange(cur: number, prev: number): { text: string; color: string } {
  const diff = cur - prev;
  if (diff > 0) return { text: `↑ ${fmtMoney(diff)}`, color: '#52c41a' };
  if (diff < 0) return { text: `↓ ${fmtMoney(Math.abs(diff))}`, color: '#FF4D4F' };
  return { text: '持平', color: '#999' };
}

// ========== 数据加载 ==========
async function loadSummary() {
  try {
    const { data, error } = await fetchDashboardSummary();
    if (!error && data) {
      summaryCards.value[0].value = fmtMoney(data.totalProfit);
      summaryCards.value[0].sub = data.totalProfit >= 0 ? '盈利' : '亏损';
      summaryCards.value[0].subColor = data.totalProfit >= 0 ? '#52c41a' : '#FF4D4F';
      summaryCards.value[1].value = String(data.totalUsers ?? 0);
      summaryCards.value[2].value = fmtMoney(data.totalRecharge);
      summaryCards.value[3].value = fmtMoney(data.totalWithdraw);
    }
  } catch { /* 接口异常静默处理 */ }
}

async function loadToday() {
  try {
    const { data, error } = await fetchDashboardToday();
    if (!error && data) {
      const rechargeChange = fmtChange(data.todayRecharge, data.yesterdayRecharge);
      const withdrawChange = fmtChange(data.todayWithdraw, data.yesterdayWithdraw);
      const userChange = fmtChange(data.todayNewUsers, data.yesterdayNewUsers);

      todayCards.value[0].value1 = fmtMoney(data.todayRecharge);
      todayCards.value[0].value2 = fmtMoney(data.yesterdayRecharge);
      todayCards.value[0].change = rechargeChange.text;
      todayCards.value[0].changeColor = rechargeChange.color;

      todayCards.value[1].value1 = fmtMoney(data.todayWithdraw);
      todayCards.value[1].value2 = fmtMoney(data.yesterdayWithdraw);
      todayCards.value[1].change = withdrawChange.text;
      todayCards.value[1].changeColor = withdrawChange.color;

      todayCards.value[2].value1 = String(data.todayNewUsers ?? 0);
      todayCards.value[2].value2 = String(data.yesterdayNewUsers ?? 0);
      todayCards.value[2].change = userChange.text;
      todayCards.value[2].changeColor = userChange.color;
    }
  } catch { /* 接口异常静默处理 */ }
}

async function loadReport() {
  try {
    const { data, error } = await fetchDashboardReport();
    if (!error && data) {
      reportData.value = toArray(data);
    }
  } catch { /* 接口异常静默处理 */ }
}

async function loadDaily() {
  try {
    const params: Record<string, any> = { tab: dailyTab.value };
    if (dateRange.value) {
      params.start_date = toLocalDateStr(dateRange.value[0]);
      params.end_date = toLocalDateStr(dateRange.value[1]);
    }
    const { data, error } = await fetchDashboardDaily(params);
    if (!error && data) {
      dailyData.value = toArray(data);
    }
  } catch { /* 接口异常静默处理 */ }
}

onMounted(() => {
  loadSummary();
  loadToday();
  loadReport();
  loadDaily();
});

watch(dailyTab, () => {
  dateRange.value = null;
  loadDaily();
});

import { h } from 'vue';
</script>

<template>
  <div class="p-16px">
    <!-- 顶部 4 个统计卡片 -->
    <NGrid :x-gap="16" :y-gap="16" :cols="4" responsive="screen" item-responsive>
      <NGridItem v-for="card in summaryCards" :key="card.title" span="4 m:2 l:1">
        <NCard :bordered="false" class="card-wrapper">
          <div class="flex items-start gap-12px relative">
            <div v-if="card.sub" class="absolute top-0 right-0 text-11px px-6px py-1px rounded-4px" :style="{ color: card.subColor, background: card.subColor + '15' }">{{ card.sub }}</div>
            <div class="w-48px h-48px rounded-12px flex-center flex-shrink-0" :style="{ background: card.bg }">
              <SvgIcon :icon="card.icon" class="text-24px" :style="{ color: card.color }" />
            </div>
            <div>
              <div class="text-13px op-60">{{ card.title }}</div>
              <div class="text-24px font-bold mt-4px">{{ card.value }}</div>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 今日/昨日对比卡片 -->
    <NGrid :x-gap="16" :y-gap="16" :cols="3" class="mt-16px" responsive="screen" item-responsive>
      <NGridItem v-for="card in todayCards" :key="card.label1" span="3 m:1">
        <NCard :bordered="false" class="card-wrapper">
          <div class="flex justify-between items-start">
            <div>
              <div class="text-13px op-60">{{ card.label1 }}</div>
              <div class="text-22px font-bold mt-4px">{{ card.value1 }}</div>
            </div>
            <div class="text-right">
              <div class="text-13px op-60">{{ card.label2 }}</div>
              <div class="text-16px mt-4px op-80">{{ card.value2 }}</div>
            </div>
          </div>
          <div class="text-12px mt-8px" :style="{ color: card.changeColor }">{{ card.change }}</div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 快捷入口 -->
    <NCard :bordered="false" class="card-wrapper mt-16px" title="快捷入口">
      <div class="grid grid-cols-5 sm:grid-cols-10 gap-16px">
        <div
          v-for="item in shortcuts"
          :key="item.label"
          class="flex flex-col items-center gap-8px transition-opacity"
          :class="item.route ? 'cursor-pointer hover:op-70' : 'op-50 cursor-not-allowed'"
          @click="handleShortcut(item)"
        >
          <div class="w-48px h-48px rounded-12px flex-center" style="background: #f5f7fa">
            <SvgIcon :icon="item.icon" class="text-22px" :style="{ color: item.color }" />
          </div>
          <span class="text-12px op-70">{{ item.label }}</span>
        </div>
      </div>
    </NCard>

    <!-- 经营数据综合报表 -->
    <NCard :bordered="false" class="card-wrapper mt-16px" title="经营数据综合报表">
      <NDataTable :columns="reportColumns" :data="reportData" :bordered="false" size="small" />
    </NCard>

    <!-- 每日明细数据 -->
    <NCard :bordered="false" class="card-wrapper mt-16px">
      <template #header>
        <div class="flex items-center justify-between">
          <span>每日明细数据</span>
          <NButtonGroup size="small">
            <NButton :type="dailyTab === 'thisMonth' ? 'primary' : 'default'" @click="dailyTab = 'thisMonth'">
              本月每日明细
            </NButton>
            <NButton :type="dailyTab === 'lastMonth' ? 'primary' : 'default'" @click="dailyTab = 'lastMonth'">
              上月每日明细
            </NButton>
          </NButtonGroup>
        </div>
      </template>

      <!-- 日期筛选 -->
      <div class="flex items-center gap-12px mb-16px flex-wrap">
        <NDatePicker v-model:value="dateRange" type="daterange" clearable start-placeholder="开始日期 (如: 10-01)" end-placeholder="结束日期 (如: 10-07)" />
        <NButton size="small" @click="setToday">今天</NButton>
        <NButton size="small" @click="setYesterday">昨天</NButton>
        <NButton size="small" @click="setThisWeek">本周</NButton>
        <NButton size="small" type="primary" @click="loadDaily">查询</NButton>
        <NButton size="small" @click="resetDate">重置</NButton>
      </div>

      <NDataTable :columns="dailyColumns" :data="dailyData" :bordered="false" size="small" :scroll-x="900" />
    </NCard>
  </div>
</template>

<style scoped></style>
