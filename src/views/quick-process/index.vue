<script setup lang="ts">
import { ref, h, resolveComponent, onMounted, onUnmounted, watch } from 'vue';
import {
  NCard, NDataTable, NSelect, NButton, NSpace, NBadge, NCollapse, NCollapseItem,
  NGrid, NGridItem, NTag, NImage, NImageGroup
} from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchQuickProcess } from '@/service/api';

defineOptions({ name: 'QuickProcessPage' });

const router = useRouter();

// ========== 显示设置 ==========
const rechargeLimit = ref(3);
const withdrawLimit = ref(3);
const kycLimit = ref(3);
const orderLimit = ref(3);
const refreshInterval = ref(0);
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

const limitOptions = [
  { label: '3条', value: 3 },
  { label: '5条', value: 5 },
  { label: '10条', value: 10 },
  { label: '20条', value: 20 }
];

const refreshOptions = [
  { label: '不自动刷新', value: 0 },
  { label: '10秒', value: 10 },
  { label: '30秒', value: 30 },
  { label: '60秒', value: 60 }
];

// 应用设置：重新加载数据 + 重置定时器
function applySettings() {
  loadData();
  setupAutoRefresh();
  window.$message?.success('设置已应用');
}

// 设置自动刷新定时器
function setupAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (refreshInterval.value > 0) {
    autoRefreshTimer = setInterval(loadData, refreshInterval.value * 1000);
  }
}

// ========== 充值审核 ==========
const rechargeColumns = [
  { title: '序号', key: 'index', width: 60 },
  { title: '订单编号', key: 'orderNo', width: 150 },
  { title: '账户信息', key: 'userInfo', width: 120, render: (row: any) => renderCopyLines(row.userInfo) },
  { title: '金额', key: 'amount', width: 100, align: 'right' as const },
  { title: '支付方式', key: 'payMethod', width: 160, render: (row: any) => renderMultiLine(row.payMethod) },
  { title: '凭证', key: 'proof', width: 60 },
  { title: '时间', key: 'time', width: 160 },
  { title: '状态', key: 'status', width: 80, render: (row: any) => renderStatus(row.status) },
  { title: '操作', key: 'action', width: 100, render: (row: any) => renderRechargeAction(row) }
];

const rechargeData = ref<any[]>([]);
const rechargeBadge = ref(0);

// ========== 提现审核 ==========
const withdrawColumns = [
  { title: '序号', key: 'index', width: 50 },
  { title: '订单编号', key: 'orderNo', width: 160 },
  { title: '用户信息', key: 'userInfo', width: 120, render: (row: any) => renderCopyLines(row.userInfo) },
  { title: '金额信息', key: 'amountInfo', width: 140, render: (row: any) => renderMultiLine(row.amountInfo) },
  { title: '到账信息', key: 'bankInfo', width: 180, render: (row: any) => renderCopyLines(row.bankInfo) },
  { title: '提交时间', key: 'time', width: 160 },
  { title: '状态', key: 'status', width: 80, render: (row: any) => renderStatus(row.status) },
  { title: '操作', key: 'action', width: 120, render: (row: any) => renderWithdrawAction(row) },
  { title: '原因', key: 'source', width: 40 }
];

const withdrawData = ref<any[]>([]);
const withdrawBadge = ref(0);

// ========== 实名认证 ==========
const kycColumns = [
  { title: '序号', key: 'index', width: 50 },
  { title: '用户信息', key: 'userInfo', width: 140, render: (row: any) => renderCopyLines(row.userInfo) },
  { title: '证件号', key: 'idNumber', width: 180 },
  { title: '证件照片', key: 'photos', width: 120 },
  { title: '提交时间', key: 'time', width: 160 },
  { title: '状态', key: 'status', width: 80, render: (row: any) => renderStatus(row.status) },
  { title: '操作', key: 'action', width: 120, render: (row: any) => renderKycAction(row) }
];

const kycData = ref<any[]>([]);
const kycBadge = ref(0);

// ========== 最近订单 ==========
const orderColumns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '账号/姓名', key: 'userInfo', width: 120, render: (row: any) => renderMultiLine(row.userInfo) },
  { title: '项目名称', key: 'projectName', width: 140 },
  { title: '投资金额', key: 'amount', width: 80, align: 'right' as const },
  { title: '买入时间/下次返款', key: 'dateInfo', width: 140, render: (row: any) => renderMultiLine(row.dateInfo) },
  { title: '预取次数', key: 'times', width: 70 },
  { title: '返款/返利/奖励', key: 'returns', width: 140, render: (row: any) => renderMultiLine(row.returns) },
  { title: '状态', key: 'status', width: 70, render: (row: any) => renderOrderStatus(row.status) },
  { title: '操作', key: 'action', width: 140, render: () => renderOrderAction() }
];

const orderData = ref<any[]>([]);
const orderBadge = ref(0);

// ========== 渲染函数 ==========
function copyText(text: string) {
  navigator.clipboard.writeText(text);
  window.$message?.success('已复制');
}

function renderMultiLine(text: string) {
  if (!text) return '';
  const lines = text.split('\n');
  return h('div', { class: 'flex flex-col gap-2px' }, lines.map((line, i) =>
    h('div', { class: i === 0 ? 'font-500 text-13px' : 'text-11px op-60' }, line)
  ));
}

function renderCopyLines(text: string) {
  if (!text) return '';
  const lines = text.split('\n');
  return h('div', { class: 'flex flex-col gap-2px' }, lines.map((line, i) =>
    h('div', { class: `flex items-center gap-4px ${i === 0 ? 'font-500 text-13px' : 'text-11px op-60'}` }, [
      h('span', null, line),
      h('span', {
        class: 'cursor-pointer op-30 hover:op-70 transition-opacity',
        style: 'font-size: 12px; flex-shrink: 0;',
        title: '复制',
        onClick: (e: Event) => { e.stopPropagation(); copyText(line); }
      }, [h(resolveComponent('SvgIcon') as any, { icon: 'ph:copy', style: 'font-size: 12px;' })])
    ])
  ));
}

function renderStatus(status: string) {
  const map: Record<string, string> = {
    '已通过': 'success', '通过': 'success',
    '未审核': 'warning',
    '不予通过': 'error', '已拒绝': 'error'
  };
  const type = map[status] || 'default';
  return h(NTag, { type: type as any, size: 'small', bordered: false }, () => status);
}

function renderOrderStatus(status: string) {
  const map: Record<string, string> = {
    '进行中': 'info', '已完成': 'success', '已退销': 'error'
  };
  return h(NTag, { type: (map[status] || 'default') as any, size: 'small', bordered: false }, () => status);
}

function renderRechargeAction(row: any) {
  if (row.status === '未审核') {
    return h(NButton, { type: 'primary', size: 'small', onClick: () => router.push('/finance/recharge-audit') }, () => '审核');
  }
  return h(NSpace, { size: 4 }, () => [
    h(NButton, { size: 'tiny', quaternary: true }, () => '查看'),
    h(NButton, { size: 'tiny', quaternary: true, type: 'error' }, () => '删除')
  ]);
}

function renderWithdrawAction(row: any) {
  if (row.status === '未审核') {
    return h(NSpace, { size: 4 }, () => [
      h(NButton, { size: 'small', type: 'warning', onClick: () => router.push('/finance/withdraw-audit') }, () => '回核'),
    ]);
  }
  return h(NSpace, { size: 4 }, () => [
    h(NButton, { size: 'small', quaternary: true }, () => '查看'),
    h(NButton, { size: 'small', quaternary: true, type: 'error' }, () => '删除'),
  ]);
}

function renderKycAction(row: any) {
  if (row.status === '未审核') {
    return h(NButton, { size: 'small', type: 'primary', onClick: () => router.push('/user/kyc') }, () => '审核');
  }
  return h(NSpace, { size: 4 }, () => [
    h(NButton, { size: 'small', quaternary: true }, () => '查看'),
    h(NButton, { size: 'small', quaternary: true, type: 'error' }, () => '删除'),
  ]);
}

function renderOrderAction() {
  return h(NSpace, { size: 4 }, () => [
    h(NButton, { size: 'tiny', type: 'primary', quaternary: true, onClick: () => router.push('/project/order') }, () => '编辑'),
    h(NButton, { size: 'tiny', type: 'warning', quaternary: true }, () => '复投'),
    h(NButton, { size: 'tiny', type: 'error', quaternary: true }, () => '退销'),
  ]);
}

// ========== 数据加载 ==========
const loading = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const { data, error } = await fetchQuickProcess({
      recharge_limit: rechargeLimit.value,
      withdraw_limit: withdrawLimit.value,
      kyc_limit: kycLimit.value,
      order_limit: orderLimit.value
    });
    if (!error && data) {
      rechargeData.value = data.recharge?.list || [];
      rechargeBadge.value = data.recharge?.total || 0;
      withdrawData.value = data.withdraw?.list || [];
      withdrawBadge.value = data.withdraw?.total || 0;
      kycData.value = data.kyc?.list || [];
      kycBadge.value = data.kyc?.total || 0;
      orderData.value = data.orders?.list || [];
      orderBadge.value = data.orders?.total || 0;
    }
  } catch { /* 静默处理 */ }
  loading.value = false;
}

// 路由跳转
function goRechargeAll() { router.push('/finance/recharge-audit'); }
function goWithdrawAll() { router.push('/finance/withdraw-audit'); }
function goKycAll() { router.push('/user/kyc'); }
function goOrderAll() { router.push('/project/order'); }

onMounted(() => {
  loadData();
  setupAutoRefresh();
});

onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
});
</script>

<template>
  <div class="p-16px">
    <!-- 页面标题 -->
    <div class="mb-16px">
      <h2 class="text-18px font-bold">快速处理中心</h2>
      <p class="text-13px op-50 mt-4px">高效处理各类待办事项，提升工作效率</p>
    </div>

    <!-- 显示设置 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse>
        <NCollapseItem title="显示设置" name="settings">
          <NGrid :x-gap="16" :y-gap="12" :cols="4" class="mb-12px">
            <NGridItem>
              <div class="text-12px op-60 mb-4px">充值审核</div>
              <NSelect v-model:value="rechargeLimit" :options="limitOptions" size="small" />
            </NGridItem>
            <NGridItem>
              <div class="text-12px op-60 mb-4px">提现审核</div>
              <NSelect v-model:value="withdrawLimit" :options="limitOptions" size="small" />
            </NGridItem>
            <NGridItem>
              <div class="text-12px op-60 mb-4px">实名认证</div>
              <NSelect v-model:value="kycLimit" :options="limitOptions" size="small" />
            </NGridItem>
            <NGridItem>
              <div class="text-12px op-60 mb-4px">最近订单</div>
              <NSelect v-model:value="orderLimit" :options="limitOptions" size="small" />
            </NGridItem>
          </NGrid>
          <div class="text-12px op-60 mb-4px">自动刷新间隔</div>
          <div class="flex items-center gap-12px">
            <NSelect v-model:value="refreshInterval" :options="refreshOptions" size="small" class="flex-1" />
            <NButton size="small" type="info" @click="loadData">
              <SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />
              立即刷新
            </NButton>
            <NButton size="small" type="primary" @click="applySettings">应用设置</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <!-- 充值审核 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <template #header>
        <div class="flex items-center gap-8px">
          <span class="font-bold">充值审核</span>
          <NBadge :value="rechargeBadge" color="#f5222d" />
        </div>
      </template>
      <template #header-extra>
        <a class="text-13px text-primary cursor-pointer" @click="goRechargeAll">查看全部 ›</a>
      </template>
      <NDataTable :columns="rechargeColumns" :data="rechargeData" :loading="loading" :bordered="false" size="small" :scroll-x="900" />
    </NCard>

    <!-- 提现审核 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <template #header>
        <div class="flex items-center gap-8px">
          <span class="font-bold">提现审核</span>
          <NBadge :value="withdrawBadge" color="#f5222d" />
        </div>
      </template>
      <template #header-extra>
        <a class="text-13px text-primary cursor-pointer" @click="goWithdrawAll">查看全部 ›</a>
      </template>
      <NDataTable :columns="withdrawColumns" :data="withdrawData" :loading="loading" :bordered="false" size="small" :scroll-x="1000" />
    </NCard>

    <!-- 实名认证 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <template #header>
        <div class="flex items-center gap-8px">
          <span class="font-bold">实名认证</span>
          <NBadge :value="kycBadge" color="#f5222d" />
        </div>
      </template>
      <template #header-extra>
        <a class="text-13px text-primary cursor-pointer" @click="goKycAll">查看全部 ›</a>
      </template>
      <NDataTable :columns="kycColumns" :data="kycData" :loading="loading" :bordered="false" size="small" :scroll-x="850" />
    </NCard>

    <!-- 最近订单 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <template #header>
        <div class="flex items-center gap-8px">
          <span class="font-bold">最近订单</span>
          <NBadge :value="orderBadge" color="#4A7FD0" />
        </div>
      </template>
      <template #header-extra>
        <a class="text-13px text-primary cursor-pointer" @click="goOrderAll">查看全部 ›</a>
      </template>
      <NDataTable :columns="orderColumns" :data="orderData" :loading="loading" :bordered="false" size="small" :scroll-x="950" />
    </NCard>
  </div>
</template>
