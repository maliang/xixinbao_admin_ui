<script setup lang="ts">
import { ref, h, onMounted, watch, computed } from 'vue';
import { NCard, NButton, NSelect, NInput, NPagination, NDataTable, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchCheckinLogs, fetchCheckinStats } from '@/service/api';

defineOptions({ name: 'UserCheckinLogPage' });

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 筛选 ==========
const timeRange = ref('7d');
const typeFilter = ref('' as string);
const keyword = ref('');

const timeOptions = [
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
  { label: '最近90天', value: '90d' },
  { label: '全部', value: 'all' }
];

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '现金', value: 'cash' },
  { label: '积分', value: 'points' }
];

function handleReset() {
  timeRange.value = '7d';
  typeFilter.value = '';
  keyword.value = '';
  currentPage.value = 1;
  loadData();
}

// ========== 统计 ==========
const stats = ref({ totalCount: 0, totalAmount: 0, totalPoints: 0 });

// ========== 分页 ==========
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize));

// ========== 流水数据 ==========
interface LogRecord {
  time: string; userName: string; userAccount: string;
  type: 'cash' | 'points'; change: string; balance: string; source: string;
}
const records = ref<LogRecord[]>([]);

// ========== 表格列定义 ==========
const columns: DataTableColumns = [
  { title: '时间 ↓', key: 'createdAt', width: 180 },
  {
    title: '用户', key: 'name', width: 120,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-weight:bold;font-size:13px;' }, { default: () => row.name || '--' }),
      h('div', { style: 'font-size:11px;opacity:0.5;' }, { default: () => `账户: ${row.account}` })
    ])
  },
  {
    title: '类型', key: 'rewardType', width: 80,
    render: (row: any) => {
      return h(NTag, {
        type: row.rewardType === 'cash' ? 'success' : 'warning',
        size: 'small', bordered: false
      }, () => row.rewardType === 'cash' ? '现金' : '积分');
    }
  },
  {
    title: '变动', key: 'rewardAmount', width: 80,
    render: (row: any) => h('span', { style: 'color:#18a058;font-weight:600;' }, { default: () => '+' + row.rewardAmount })
  },
  { title: '余额/积分', key: 'balanceAfter', width: 100 },
  { title: '连续天数', key: 'consecutiveDays', width: 80, align: 'right' as const }
];

async function loadData() {
  loading.value = true;
  const { data: statsData, error: statsError } = await fetchCheckinStats();
  if (!statsError && statsData) {
    stats.value = {
      totalCount: statsData.totalCount || 0,
      totalAmount: statsData.totalAmount || 0,
      totalPoints: statsData.totalPoints || 0
    };
  }
  const { data, error } = await fetchCheckinLogs({
    time_range: timeRange.value, type: typeFilter.value,
    keyword: keyword.value, page: currentPage.value, page_size: pageSize
  });
  loading.value = false;
  if (!error) {
    records.value = data.list || [];
    totalRecords.value = data.total || 0;
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <h2 class="text-18px font-bold m-0 mb-16px">签到流水记录</h2>

      <!-- 筛选栏 -->
      <div class="flex items-center gap-8px mb-16px">
        <NSelect v-model:value="timeRange" :options="timeOptions" size="small" class="w-160px" />
        <NSelect v-model:value="typeFilter" :options="typeOptions" size="small" class="w-160px" />
        <NInput v-model:value="keyword" placeholder="输入用户ID或昵称搜索" size="small" class="w-220px">
          <template #prefix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template>
        </NInput>
        <div class="flex-1"></div>
        <NButton size="small" @click="handleReset"><SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />重置</NButton>
        <NButton size="small" type="primary" @click="loadData"><SvgIcon icon="ph:funnel" class="mr-4px" />筛选</NButton>
      </div>

      <!-- 统计卡片 -->
      <div class="flex gap-12px mb-20px">
        <div class="stat-card">
          <div class="stat-icon stat-icon-blue"><SvgIcon icon="ph:calendar-check" /></div>
          <div>
            <div class="text-12px op-60">签到总人次</div>
            <div class="text-20px font-bold">{{ stats.totalCount.toLocaleString() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-green"><SvgIcon icon="ph:coins" /></div>
          <div>
            <div class="text-12px op-60">发放总金额</div>
            <div class="text-20px font-bold">{{ stats.totalAmount.toLocaleString('en', { minimumFractionDigits: 2 }) }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-orange"><SvgIcon icon="ph:trophy" /></div>
          <div>
            <div class="text-12px op-60">发放总积分</div>
            <div class="text-20px font-bold">{{ stats.totalPoints.toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <!-- 表格 -->
      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="660" :loading="loading" />

      <!-- 分页 -->
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords.toLocaleString() }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.stat-card { flex: 1; display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 10px; background-color: #f8f9fc; }
.stat-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.stat-icon-blue { background-color: #e6f0ff; }
.stat-icon-green { background-color: #e6f7ef; }
.stat-icon-orange { background-color: #fff4e6; }
</style>
