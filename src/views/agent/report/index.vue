<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { NCard, NButton, NInput, NSelect, NPagination, NDataTable } from 'naive-ui';
import { fetchAgentReportSummary, fetchAgentReport } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
defineOptions({ name: 'AgentReportPage' });

const authStore = useAuthStore();
const isAgent = computed(() => authStore.userInfo.isAgent);

// ========== 筛选 ==========
const monthFilter = ref(getCurrentMonth());
const keyword = ref('');

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`;
}
// 生成最近12个月选项
const monthOptions = computed(() => {
  const opts: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
    opts.push({ label, value: label });
  }
  return opts;
});

// ========== 统计卡片 ==========
const summaryData = ref({
  totalAgents: 0,
  totalPerformance: 0,
  newAgents: 0
});

// ========== 列表 ==========
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 15;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);
const reportData = ref<any[]>([]);

// 管理员视角的表格列
const adminColumns = [
  { title: $t('biz.agent.report.dataMonth'), key: 'month', width: 120 },
  { title: $t('biz.agent.report.agentAccount'), key: 'account', width: 160, render: (row: any) => `${row.account || '-'}/${row.name || '-'}` },
  { title: $t('biz.agent.report.teamPerformance'), key: 'teamAmount', width: 120, align: 'right' as const, render: (row: any) => formatNumber(row.teamAmount || 0) },
  { title: $t('biz.agent.report.personalCommission'), key: 'commission', width: 120, align: 'right' as const, render: (row: any) => formatNumber(row.commission || 0) },
  { title: $t('biz.agent.report.subCount'), key: 'subCount', width: 100, align: 'right' as const },
  { title: $t('biz.common.registerTime'), key: 'createdAt', width: 140, render: (row: any) => row.agentCreatedAt || row.createdAt || '-' }
];

// 代理视角的表格列
const agentColumns = [
  { title: $t('biz.agent.report.dataMonth'), key: 'month', width: 120 },
  { title: $t('biz.agent.report.subAccount'), key: 'account', width: 160, render: (row: any) => `${row.account || '-'}/${row.name || '-'}` },
  { title: $t('biz.agent.report.subPerformance'), key: 'teamAmount', width: 120, align: 'right' as const, render: (row: any) => formatNumber(row.teamAmount || 0) },
  { title: $t('biz.common.registerTime'), key: 'createdAt', width: 140, render: (row: any) => row.agentCreatedAt || row.createdAt || '-' }
];

const columns = computed(() => isAgent.value ? agentColumns : adminColumns);

async function loadData() {
  loading.value = true;
  // 将 "2026年05月" 转为 "2026-05" 格式
  const monthParam = monthFilter.value.replace(/(\d{4})年(\d{2})月/, '$1-$2');
  const { data, error } = await fetchAgentReport({
    month: monthParam,
    keyword: keyword.value || undefined,
    page: currentPage.value,
    page_size: pageSize
  });
  if (!error && data) {
    reportData.value = data.list || [];
    totalRecords.value = data.total || 0;
  }
  loading.value = false;
}
async function loadSummary() {
  const monthParam = monthFilter.value.replace(/(\d{4})年(\d{2})月/, '$1-$2');
  const { data, error } = await fetchAgentReportSummary({ month: monthParam });
  if (!error && data) {
    summaryData.value = {
      totalAgents: data.totalAgents || data.total_agents || 0,
      totalPerformance: data.totalPerformance || data.total_performance || 0,
      newAgents: data.newAgents || data.new_agents || 0
    };
  }
}
function handleSearch() { currentPage.value = 1; loadData(); loadSummary(); }
function handleReset() { monthFilter.value = getCurrentMonth(); keyword.value = ''; handleSearch(); }
watch(currentPage, loadData);

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

onMounted(() => { loadSummary(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-20px">
        <h3 class="text-18px font-bold">{{ $t('biz.agent.report.title') }}</h3>
        <NButton quaternary>
          <SvgIcon icon="ph:magnifying-glass" class="mr-4px" />
          {{ $t('biz.common.filterConditions') }}
        </NButton>
      </div>

      <!-- 筛选条件 -->
      <div class="flex items-center gap-12px mb-20px flex-wrap">
        <div class="flex-1 max-w-280px">
          <div class="text-12px op-50 mb-4px">{{ $t('biz.agent.report.month') }}</div>
          <NSelect v-model:value="monthFilter" :options="monthOptions" size="small" />
        </div>
        <div class="flex-1 max-w-320px">
          <div class="text-12px op-50 mb-4px">{{ isAgent ? $t('biz.agent.report.keywordAgent') : $t('biz.agent.report.keyword') }}</div>
          <NInput v-model:value="keyword" :placeholder="isAgent ? $t('biz.agent.report.keywordAgent') : $t('biz.agent.report.keyword')" clearable size="small">
            <template #suffix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template>
          </NInput>
        </div>
        <div class="flex items-end gap-8px pt-18px">
          <NButton size="small" @click="handleReset">{{ $t('common.reset') }}</NButton>
          <NButton type="primary" size="small" @click="handleSearch">{{ $t('common.search') }}</NButton>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-3 gap-16px mb-24px">
        <div class="stat-card">
          <div class="stat-label">{{ isAgent ? $t('biz.agent.report.subCount') : $t('biz.agent.report.totalAgents') }}</div>
          <div class="stat-row">
            <span class="stat-value text-primary">{{ formatNumber(summaryData.totalAgents) }}</span>
            <span class="stat-period">({{ monthFilter }})</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ $t('biz.agent.report.totalPerformance') }}</div>
          <div class="stat-row">
            <span class="stat-value text-orange-500">{{ formatNumber(summaryData.totalPerformance) }}</span>
            <span class="stat-period">({{ monthFilter }})</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ isAgent ? $t('biz.agent.report.personalCommission') : $t('biz.agent.report.newAgents') }}</div>
          <div class="stat-row">
            <span class="stat-value text-primary">{{ formatNumber(summaryData.newAgents) }}</span>
            <span class="stat-period">({{ monthFilter }})</span>
          </div>
        </div>
      </div>

      <!-- 表格 -->
      <NDataTable :columns="columns" :data="reportData" :loading="loading" :bordered="false" size="small" :scroll-x="800" />

      <!-- 分页 -->
      <div v-if="totalRecords > pageSize" class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">共 {{ totalRecords }} 条记录</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.stat-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px 20px;
}
.stat-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
.stat-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
}
.stat-period {
  font-size: 12px;
  color: #999;
}
</style>
