<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';
import { NCard, NButton, NInput, NSelect, NPagination, NModal, NForm, NFormItem, NDataTable, NTag, NSpace, useDialog } from 'naive-ui';
import { fetchBalanceOrderSummary, fetchBalanceOrders, redeemBalanceOrder } from '@/service/api';
import { localStg } from '@/utils/storage';
defineOptions({ name: 'ProjectBalanceOrderPage' });
const dialog = useDialog();

// ========== 统计卡片 ==========
const summary = ref({ totalAmount: 0, totalProfit: 0, activeOrders: 0, maturedOrders: 0 });

// ========== 筛选 ==========
const keyword = ref('');
const projectName = ref('');
const statusFilter = ref('all');
const settleFilter = ref('all');
const statusOptions = [{ label: '订单状态', value: 'all' }, { label: '进行中', value: 'active' }, { label: '已到期', value: 'matured' }, { label: '已转出', value: 'redeemed' }];
const settleOptions = [{ label: '结算方式', value: 'all' }, { label: '按日返息', value: 'daily' }, { label: '到期返本息', value: 'maturity' }];

// ========== 列表 ==========
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 6;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);
const data = ref<any[]>([]);

async function loadData() {
  loading.value = true;
  const { data: resData, error } = await fetchBalanceOrders({
    keyword: keyword.value || undefined,
    project_name: projectName.value || undefined,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    settle_type: settleFilter.value === 'all' ? undefined : settleFilter.value,
    page: currentPage.value,
    page_size: pageSize
  });
  if (!error && resData) {
    data.value = resData.list || [];
    totalRecords.value = resData.total || 0;
  }
  loading.value = false;
}
async function loadSummary() {
  const { data: resData, error } = await fetchBalanceOrderSummary();
  if (!error && resData) {
    summary.value = {
      totalAmount: resData.totalAmount || 0,
      totalProfit: resData.totalProfit || 0,
      activeOrders: resData.activeCount || resData.activeOrders || 0,
      maturedOrders: resData.maturedCount || resData.maturedOrders || 0
    };
  }
}

// ========== 表格列 ==========
const columns = [
  { title: '订单ID', key: 'orderNo', width: 130 },
  { title: '用户信息', key: 'userName', width: 120, render: (row: any) => h('div', {}, [h('div', { class: 'font-500' }, row.userName || row.user?.name || '-'), h('div', { class: 'text-11px op-50' }, row.userAccount || row.user?.account || '-')]) },
  { title: '项目名称', key: 'productName', width: 130 },
  { title: '购买金额 (元)', key: 'amount', width: 130, align: 'left' as const, render: (row: any) => formatMoney(row.amount) },
  { title: '年化利率', key: 'rate', width: 90, render: (row: any) => `${row.rate}%` },
  { title: '时间周期', key: 'startDate', width: 130, render: (row: any) => h('div', {}, [h('div', { class: 'text-12px' }, `起: ${(row.startDate || '').substring(0, 10)}`), h('div', { class: 'text-12px' }, `止: ${(row.endDate || '').substring(0, 10)}`)]) },
  { title: '预期收益', key: 'expectedProfit', width: 100, align: 'left' as const, render: (row: any) => h('span', { class: 'font-500 text-primary' }, formatMoney(row.expectedProfit)) },
  { title: '结算方式', key: 'settleType', width: 120, render: (row: any) => h('span', { class: 'flex items-center gap-4px' }, [h('span', { class: `inline-block w-8px h-8px rounded-full ${row.settleType === 'daily' ? 'bg-green-500' : 'bg-blue-500'}` }), row.settleType === 'daily' ? '按日返息' : '到期返本息']) },
  { title: '状态', key: 'status', width: 90, align: 'left' as const, render: (row: any) => h(NTag, { type: row.status === 'active' ? 'success' : row.status === 'matured' ? 'info' : 'warning', size: 'small', bordered: false }, () => getStatusInfo(row.status).label) },
  { title: '操作', key: 'action', width: 100, align: 'center', render: (row: any) => h(NButton, { size: 'tiny', type: getActionType(row) as any, disabled: row.status === 'redeemed', onClick: () => openRedeem(row) }, () => getActionLabel(row)) }
];
function handleSearch() { currentPage.value = 1; loadData(); }
function handleReset() { keyword.value = ''; projectName.value = ''; statusFilter.value = 'all'; settleFilter.value = 'all'; handleSearch(); }
watch(currentPage, loadData);

function getStatusInfo(s: string) {
  const m: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: '进行中', color: '#fff', bg: '#18a058' },
    matured: { label: '已到期', color: '#fff', bg: '#2080f0' },
    redeemed: { label: '已转出', color: '#fff', bg: '#f0a020' }
  };
  return m[s] || { label: s, color: '#666', bg: '#eee' };
}

function getActionLabel(row: any) {
  if (row.status === 'redeemed') return '不可操作';
  if (row.status === 'matured') return '结算转出';
  return '手动转出';
}
function getActionType(row: any) {
  if (row.status === 'redeemed') return 'default';
  if (row.status === 'matured') return 'warning';
  return 'primary';
}

// ========== 转出结算弹窗 ==========
const redeemVisible = ref(false);
const redeemData = ref<any>({});
const redeemRemark = ref('');

function openRedeem(row: any) {
  if (row.status === 'redeemed') return;
  redeemData.value = row;
  redeemRemark.value = '';
  redeemVisible.value = true;
}
async function confirmRedeem() {
  const { error } = await redeemBalanceOrder(redeemData.value.id, { remark: redeemRemark.value });
  if (!error) {
    window.$message?.success('转出成功');
    redeemVisible.value = false;
    loadData();
  }
}

function formatMoney(n: number) { return n?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'; }

function handleExport() {
  const baseUrl = import.meta.env.VITE_SERVICE_BASE_URL || '/api/admin';
  const token = localStg.get('token') || '';
  const params = new URLSearchParams();
  if (keyword.value) params.set('keyword', keyword.value);
  if (statusFilter.value && statusFilter.value !== 'all') params.set('status', statusFilter.value);
  if (token) params.set('token', token);
  const url = `${baseUrl}/balance-orders/export?${params.toString()}`;
  window.open(url, '_blank');
}

onMounted(() => { loadSummary(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-16px">
      <div>
        <div class="flex items-center gap-8px">
          <SvgIcon icon="ph:vault" class="text-22px text-primary" />
          <h2 class="text-18px font-bold">用户投资订单与转出管理</h2>
        </div>
        <p class="text-12px op-50 mt-4px ml-30px">管理平台所有用户的投资订单状态、收益计算及转出操作</p>
      </div>
      <NButton type="primary" @click="handleExport">
        <SvgIcon icon="ph:download-simple" class="mr-4px" />
        导出报表
      </NButton>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-16px mb-16px">
      <div class="stat-card">
        <div class="flex items-center gap-8px mb-6px">
          <div class="w-32px h-32px rounded-full bg-blue-50 flex-center"><SvgIcon icon="ph:coins" class="text-16px text-primary" /></div>
          <span class="text-12px op-50">总投资金额 (元)</span>
        </div>
        <div class="text-22px font-bold">{{ formatMoney(summary.totalAmount) }}</div>
      </div>
      <div class="stat-card">
        <div class="flex items-center gap-8px mb-6px">
          <div class="w-32px h-32px rounded-full bg-green-50 flex-center"><SvgIcon icon="ph:trend-up" class="text-16px text-green-600" /></div>
          <span class="text-12px op-50">累计产生收益 (元)</span>
        </div>
        <div class="text-22px font-bold">{{ formatMoney(summary.totalProfit) }}</div>
      </div>
      <div class="stat-card">
        <div class="flex items-center gap-8px mb-6px">
          <div class="w-32px h-32px rounded-full bg-orange-50 flex-center"><SvgIcon icon="ph:spinner" class="text-16px text-orange-500" /></div>
          <span class="text-12px op-50">进行中订单</span>
        </div>
        <div class="text-22px font-bold">{{ summary.activeOrders }}</div>
      </div>
      <div class="stat-card">
        <div class="flex items-center gap-8px mb-6px">
          <div class="w-32px h-32px rounded-full bg-gray-100 flex-center"><SvgIcon icon="ph:check-circle" class="text-16px op-60" /></div>
          <span class="text-12px op-50">已到期订单</span>
        </div>
        <div class="text-22px font-bold">{{ summary.maturedOrders }}</div>
      </div>
    </div>

    <!-- 筛选 -->
    <NCard :bordered="false" class="card-wrapper mb-16px" content-style="padding: 12px 16px;">
      <div class="flex items-center gap-12px flex-wrap">
        <NInput v-model:value="keyword" autosize placeholder="用户名/姓名" clearable size="small" class="w-150px">
          <template #prefix><SvgIcon icon="ph:user" class="op-40 text-13px" /></template>
        </NInput>
        <NInput v-model:value="projectName" autosize placeholder="项目名称" clearable size="small" class="w-150px">
          <template #prefix><SvgIcon icon="ph:package" class="op-40 text-13px" /></template>
        </NInput>
        <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" class="w-120px" />
        <NSelect v-model:value="settleFilter" :options="settleOptions" size="small" class="w-120px" />
        <NButton size="small" type="primary" @click="handleSearch">
          <SvgIcon icon="ph:magnifying-glass" class="mr-4px" />
          查询
        </NButton>
        <NButton size="small" @click="handleReset">重置</NButton>
      </div>
    </NCard>

    <!-- 表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="data" :loading="loading" :bordered="false" size="small" :scroll-x="1200" />

      <!-- 分页 -->
      <div class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">显示第 1 到 {{ data.length }} 条，共 {{ totalRecords }} 条数据</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" />
      </div>
    </NCard>

    <!-- 底部说明 -->
    <div class="mt-16px p-14px bg-blue-50 rounded-8px">
      <div class="flex items-start gap-8px text-13px">
        <SvgIcon icon="ph:info" class="text-primary text-16px flex-shrink-0 mt-2px" />
        <div>
          <p class="mb-4px">1. 预期收益计算公式：本金 × 年化利率 × (投资天数 ÷ 365)</p>
          <p class="mb-2px">2. 结算规则说明：</p>
          <ul class="list-disc ml-16px text-12px op-70">
            <li>到期返本息：项目到期后，系统自动将本金和全部收益转入用户可用余额。若提前手动转出，收益将按活期利率重新计算。</li>
            <li>按日返息：每日凌晨计算并发放昨日收益至用户可用余额。本金在项目到期后自动退回。提前手动转出仅退回本金，已发放收益不扣回。</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 转出结算弹窗 -->
    <NModal v-model:show="redeemVisible" preset="card" title="确认转出结算" style="width: 540px;" :bordered="false">
      <template #header-extra><SvgIcon icon="ph:arrows-left-right" class="text-18px text-primary" /></template>
      <!-- 订单信息 -->
      <div class="info-grid mb-16px">
        <div class="info-row"><span class="info-label">订单编号</span><span class="info-value">{{ redeemData.orderNo }}</span></div>
        <div class="info-row"><span class="info-label">用户信息</span><span class="info-value">{{ redeemData.userName || '-' }} ({{ redeemData.userAccount || '-' }})</span></div>
        <div class="info-row"><span class="info-label">项目名称</span><span class="info-value">{{ redeemData.productName }}</span></div>
        <div class="info-row"><span class="info-label">结算方式</span><span class="info-value"><span class="settle-badge">{{ redeemData.settleType === 'daily' ? '按日返息' : '到期返本息' }}</span></span></div>
        <div class="info-row"><span class="info-label">投资本金</span><span class="info-value">{{ formatMoney(redeemData.amount) }} 元</span></div>
        <div class="info-row"><span class="info-label">持有天数</span><span class="info-value">{{ redeemData.holdDays || 0 }} 天</span></div>
      </div>

      <!-- 提前赎回提示 -->
      <div v-if="redeemData.status === 'active'" class="warning-box mb-16px">
        <SvgIcon icon="ph:warning" class="text-16px text-orange-500 flex-shrink-0" />
        <div class="text-12px">
          <p class="font-500 mb-2px">提前赎回提醒</p>
          <p class="op-70">该订单尚未到期。根据项目规则，提前赎回将取消原定 {{ redeemData.rate }}% 年化利率，已持有天数按活期利率 {{ redeemData.early_rate || 0.3 }}% 重新计算收益。</p>
        </div>
      </div>

      <!-- 结算明细 -->
      <div class="settle-detail mb-16px">
        <div class="text-14px font-500 mb-10px">结算明细</div>
        <div class="detail-row"><span>退回本金</span><span>{{ formatMoney(redeemData.amount) }}</span></div>
        <div class="detail-row"><span>结算收益 <span class="text-11px op-50">({{ redeemData.earlyRate || redeemData.rate }}%活期)</span></span><span class="text-green-600">+{{ formatMoney(redeemData.settleProfit || 0) }}</span></div>
        <div class="detail-row total"><span>实际转出金额</span><span class="text-primary text-20px font-bold">{{ formatMoney((redeemData.amount || 0) + (redeemData.settleProfit || 0)) }}元</span></div>
      </div>

      <!-- 备注 -->
      <NFormItem label="操作备注 (选填)">
        <NInput v-model:value="redeemRemark" placeholder="请输入提前转出原因" />
      </NFormItem>

      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="redeemVisible = false">取消操作</NButton>
          <NButton type="primary" @click="confirmRedeem">
            <SvgIcon icon="ph:check" class="mr-4px" />
            确认转出
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.stat-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; padding: 16px 20px; }
.info-grid { background: #f9fafb; border-radius: 8px; padding: 14px 16px; }
.info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.info-row:last-child { border-bottom: none; }
.info-label { color: #666; font-size: 13px; }
.info-value { font-size: 13px; font-weight: 500; }
.settle-badge { background: #e3f2fd; color: #2080f0; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.warning-box { display: flex; gap: 8px; background: #fff8e6; border: 1px solid #ffe58f; border-radius: 8px; padding: 12px 14px; }
.settle-detail { background: #f9fafb; border-radius: 8px; padding: 14px 16px; }
.detail-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
.detail-row:last-child { border-bottom: none; }
.detail-row.total { border-top: 1px solid #e0e0e0; margin-top: 4px; padding-top: 12px; }
</style>
