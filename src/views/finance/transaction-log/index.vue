<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NDatePicker, NPagination,
  NCollapse, NCollapseItem, NDataTable
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchTransactions } from '@/service/api';

defineOptions({ name: 'FinanceTransactionLogPage' });

const searchForm = ref({
  keyword: '', type: '' as string, currency: '' as string,
  dateStart: null as number | null, dateEnd: null as number | null
});
const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '充值到账', value: 'recharge' },
  { label: '提现', value: 'withdraw' },
  { label: '投资', value: 'invest' },
  { label: '收益', value: 'profit' },
  { label: '团队奖励', value: 'team_reward' },
  { label: '系统调整', value: 'system_adjust' },
  { label: '签到奖励', value: 'checkin' },
  { label: '转盘抽奖', value: 'lottery_reward' },
  { label: '积分兑换', value: 'exchange' }
];
const currencyOptions = [
  { label: '全部', value: '' },
  { label: '余额', value: 'balance' },
  { label: '积分', value: 'points' }
];
function handleReset() {
  searchForm.value = { keyword: '', type: '', currency: '', dateStart: null, dateEnd: null };
  currentPage.value = 1;
  loadData();
}

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const loading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);

interface LogRecord {
  id: number; userId: number; type: string;
  amount: number; balanceBefore: number; balanceAfter: number;
  description: string; createdAt: string;
  user?: { account: string; name: string };
  [key: string]: any;
}
const records = ref<LogRecord[]>([]);

const typeLabels: Record<string, string> = {
  recharge: '充值到账', withdraw: '提现', invest: '投资', profit: '收益',
  team_reward: '团队奖励', system_adjust: '系统调整', checkin: '签到奖励', lottery_reward: '转盘抽奖',
  exchange: '积分兑换'
};

const columns: DataTableColumns = [
  {
    title: '用户信息', key: 'account', width: 140,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-weight:bold;font-size:13px;' }, { default: () => row.account || '-' }),
      h('div', { style: 'font-size:11px;opacity:0.5;' }, { default: () => row.name || '-' })
    ])
  },
  {
    title: '币种', key: 'currency', width: 70, align: 'center' as const,
    render: (row: any) => {
      const isPoints = row.currency === 'points';
      return h('span', { style: `font-size:12px;padding:1px 8px;border-radius:3px;${isPoints ? 'background:#fff7e6;color:#f0a020;' : 'background:#e8f4ff;color:#2080f0;'}` }, { default: () => isPoints ? '积分' : '余额' });
    }
  },
  {
    title: '交易类型', key: 'type', width: 100,
    render: (row: any) => h('span', {}, { default: () => typeLabels[row.type] || row.type || '-' })
  },
  {
    title: '变动前', key: 'balanceBefore', width: 110,
    render: (row: any) => {
      const isPoints = row.currency === 'points';
      const val = parseFloat(row.balanceBefore || 0);
      return h('span', {}, { default: () => isPoints ? val.toFixed(0) : '¥' + val.toFixed(2) });
    }
  },
  {
    title: '变动金额', key: 'amount', width: 100,
    render: (row: any) => {
      const amt = parseFloat(row.amount || 0);
      const color = amt >= 0 ? '#18a058' : '#d03050';
      const prefix = amt >= 0 ? '+' : '';
      const isPoints = row.currency === 'points';
      return h('span', { style: `font-weight:bold;color:${color};` }, { default: () => prefix + (isPoints ? amt.toFixed(0) : '¥' + amt.toFixed(2)) });
    }
  },
  {
    title: '变动后', key: 'balanceAfter', width: 110,
    render: (row: any) => {
      const isPoints = row.currency === 'points';
      const val = parseFloat(row.balanceAfter || 0);
      return h('span', { style: 'font-weight:bold;' }, { default: () => isPoints ? val.toFixed(0) : '¥' + val.toFixed(2) });
    }
  },
  { title: '流水时间', key: 'createdAt', width: 170 },
  { title: '详情说明', key: 'description', minWidth: 120, ellipsis: { tooltip: true } }
];

async function loadData() {
  if (searchForm.value.dateStart && searchForm.value.dateEnd && searchForm.value.dateEnd < searchForm.value.dateStart) {
    window.$message?.warning('结束时间必须大于开始时间'); return;
  }
  loading.value = true;
  const params: Record<string, any> = { page: currentPage.value, page_size: pageSize };
  if (searchForm.value.keyword) params.keyword = searchForm.value.keyword;
  if (searchForm.value.type) params.type = searchForm.value.type;
  if (searchForm.value.currency) params.currency = searchForm.value.currency;
  if (searchForm.value.dateStart) params.dateStart = toLocalDateStr(searchForm.value.dateStart);
  if (searchForm.value.dateEnd) params.dateEnd = toLocalDateStr(searchForm.value.dateEnd);

  const { data, error } = await fetchTransactions(params);
  loading.value = false;
  if (!error) { records.value = data.list || []; totalRecords.value = data.total || 0; }
  else { window.$message?.error(error?.msg || '加载失败'); }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse default-expanded-names="filter">
        <NCollapseItem title="筛选条件" name="filter">
          <div class="flex items-end gap-16px flex-wrap">
            <div><div class="text-13px mb-6px">账号/姓名</div><NInput v-model:value="searchForm.keyword" placeholder="输入账号或姓名" class="w-220px" /></div>
            <div><div class="text-13px mb-6px">币种</div><NSelect v-model:value="searchForm.currency" :options="currencyOptions" placeholder="全部" class="w-120px" /></div>
            <div><div class="text-13px mb-6px">交易类型</div><NSelect v-model:value="searchForm.type" :options="typeOptions" placeholder="全部类型" class="w-200px" /></div>
            <div>
              <div class="text-13px mb-6px">时间范围</div>
              <div class="flex items-center gap-8px">
                <NDatePicker v-model:value="searchForm.dateStart" type="date" placeholder="-/-/-" class="w-150px" />
                <span class="text-13px op-60">至</span>
                <NDatePicker v-model:value="searchForm.dateEnd" type="date" placeholder="-/-/-" class="w-150px" />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-8px mt-16px">
            <NButton @click="handleReset">重置</NButton>
            <NButton type="primary" @click="loadData"><SvgIcon icon="ph:magnifying-glass" class="mr-4px" />查询</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="800" :loading="loading" />
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>
  </div>
</template>
