<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NDatePicker, NPagination,
  NCollapse, NCollapseItem, NGrid, NGridItem, NModal, NSpace,
  NDataTable, NTag, useDialog
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchWithdrawHistory, fetchWithdrawDetail, deleteWithdraw } from '@/service/api';

defineOptions({ name: 'FinanceWithdrawHistoryPage' });
const dialog = useDialog();

const searchForm = ref({
  account: '', orderNo: '', name: '',
  status: null as string | null,
  dateStart: null as number | null, dateEnd: null as number | null
});
const statusOptions = [
  { label: '全部', value: null }, { label: '通过', value: 'approved' }, { label: '拒绝', value: 'rejected' }
];
function handleReset() {
  searchForm.value = { account: '', orderNo: '', name: '', status: null, dateStart: null, dateEnd: null };
}

const loading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);

interface WithdrawRecord {
  id: number; orderNo: string; userId: number;
  walletId: number; amount: number; feeRate: number; feeAmount: number; actualAmount: number;
  status: number; createdAt: string; reviewedAt: string;
  rejectReason: string; remark: string;
  user?: { account: string; name: string; phone: string };
  wallet?: { bankName: string; accountNumber: string; branchName: string; accountName: string; walletType?: { name: string } };
  reviewer?: { username: string };
  [key: string]: any;
}
const records = ref<WithdrawRecord[]>([]);

const statusMap: Record<number, { type: 'success' | 'error'; label: string }> = {
  1: { type: 'success', label: '通过' },
  2: { type: 'error', label: '拒绝' }
};

const columns = computed<DataTableColumns>(() => [
  { title: '订单编号', key: 'orderNo', width: 150 },
  {
    title: '用户信息', key: 'user', width: 120,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-weight:bold;font-size:13px;' }, { default: () => row.user?.account || '-' }),
      h('div', { style: 'font-size:11px;opacity:0.5;' }, { default: () => row.user?.name || '-' })
    ])
  },
  {
    title: '金额信息', key: 'amount', width: 150,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-size:14px;font-weight:bold;' }, { default: () => '申请: ¥' + parseFloat(row.amount || 0).toFixed(2) }),
      h('div', { style: 'font-size:12px;' }, { default: () => `汇率后: ¥${parseFloat(row.frozenAmount || row.amount || 0).toFixed(2)}` }),
      h('div', { style: 'font-size:11px;opacity:0.5;' }, { default: () => `手续费: ¥${parseFloat(row.feeAmount || 0).toFixed(2)}` }),
      h('div', { style: 'font-size:12px;font-weight:bold;color:#18a058;' }, { default: () => `实际到账: ¥${parseFloat(row.actualAmount || 0).toFixed(2)}` })
    ])
  },
  {
    title: '到账信息', key: 'wallet', width: 180,
    render: (row: any) => {
      const w = row.wallet || {};
      const typeName = w.walletType?.name || w.bankName || w.accountName || '';
      const account = w.accountNumber || '';
      return h('div', {}, [
        h('div', { style: 'font-size:13px;font-weight:500;' }, { default: () => typeName || '-' }),
        h('div', { style: 'font-size:12px;' }, { default: () => account || '-' }),
        ...(w.branchName ? [h('div', { style: 'font-size:11px;opacity:0.5;' }, { default: () => w.branchName })] : [])
      ]);
    }
  },
  { title: '提交时间', key: 'createdAt', width: 160 },
  {
    title: '状态', key: 'status', width: 60, align: 'center',
    render: (row: any) => {
      const s = statusMap[row.status as number] || { type: 'success' as const, label: String(row.status) };
      return h(NTag, { type: s.type, size: 'small', bordered: false }, () => s.label);
    }
  },
  {
    title: '操作', key: 'action', width: 90, align: 'center',
    render: (row: any) => h(NSpace, { size: 8, justify: 'center' }, () => [
      h(NButton, { text: true, type: 'primary', onClick: () => openDetail(row) }, () => '查看'),
      h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, () => '删除')
    ])
  },
  {
    title: '原因', key: 'rejectReason', width: 80,
    render: (row: any) => h('span', { style: 'font-size:12px;' }, { default: () => row.rejectReason || '-' })
  }
]);

const detailVisible = ref(false);
const detailRecord = ref<WithdrawRecord | null>(null);

async function openDetail(r: WithdrawRecord) {
  const { data, error } = await fetchWithdrawDetail((r as any).id);
  detailRecord.value = !error ? data : r;
  detailVisible.value = true;
}

function handleDelete(r: WithdrawRecord) {
  dialog.warning({
    title: '确认删除', content: `确定要删除订单 ${r.orderNo} 的提现记录吗？`,
    positiveText: '确认删除', negativeText: '取消', positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      const { error } = await deleteWithdraw((r as any).id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error(error?.msg || '操作失败'); }
    }
  });
}

async function loadData() {
  if (searchForm.value.dateStart && searchForm.value.dateEnd && searchForm.value.dateEnd < searchForm.value.dateStart) {
    window.$message?.warning('结束时间必须大于开始时间'); return;
  }
  loading.value = true;
  const { data, error } = await fetchWithdrawHistory({ ...searchForm.value, page: currentPage.value, page_size: pageSize });
  loading.value = false;
  if (!error) { records.value = data.list || []; totalRecords.value = data.total || 0; }
  else { window.$message?.error(error?.msg || '加载失败'); }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-18px font-bold m-0">提现记录审核</h2>
      <NButton size="small" @click="loadData"><SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />刷新</NButton>
    </div>

    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse>
        <NCollapseItem title="筛选条件" name="filter">
          <NGrid :x-gap="16" :y-gap="12" :cols="3">
            <NGridItem><div class="text-13px mb-6px">账号</div><NInput v-model:value="searchForm.account" /></NGridItem>
            <NGridItem><div class="text-13px mb-6px">订单编号</div><NInput v-model:value="searchForm.orderNo" /></NGridItem>
            <NGridItem><div class="text-13px mb-6px">姓名</div><NInput v-model:value="searchForm.name" /></NGridItem>
          </NGrid>
          <NGrid :x-gap="16" :y-gap="12" :cols="3" class="mt-12px">
            <NGridItem><div class="text-13px mb-6px">状态</div><NSelect v-model:value="searchForm.status" :options="statusOptions" placeholder="全部" /></NGridItem>
            <NGridItem :span="2">
              <div class="text-13px mb-6px">提交时间</div>
              <div class="flex items-center gap-8px">
                <NDatePicker v-model:value="searchForm.dateStart" type="date" placeholder="-/-/-" class="flex-1" />
                <span class="text-13px op-60">至</span>
                <NDatePicker v-model:value="searchForm.dateEnd" type="date" placeholder="-/-/-" class="flex-1" />
              </div>
            </NGridItem>
          </NGrid>
          <div class="flex justify-end gap-8px mt-16px"><NButton @click="handleReset">重置</NButton><NButton type="primary" @click="loadData">查询</NButton></div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="995" :loading="loading" />
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 提现详情弹窗 -->
    <NModal v-model:show="detailVisible" preset="card" title="提现详情" style="width: 600px;" :bordered="false">
      <template v-if="detailRecord">
        <div class="flex flex-col gap-4px">
          <div class="flex gap-16px mb-12px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">订单编号</div><div class="text-14px font-bold">{{ detailRecord.orderNo }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-4px">申请时间</div><div class="text-14px">{{ detailRecord.createdAt }}</div></div>
          </div>
          <div class="flex gap-16px mb-12px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">用户账号</div><div class="text-14px">{{ detailRecord.user?.account || '-' }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-4px">真实姓名</div><div class="text-14px">{{ detailRecord.user?.name || '-' }}</div></div>
          </div>
          <div class="flex gap-16px mb-12px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">申请金额</div><div class="text-14px">¥{{ detailRecord.amount }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-4px">汇率后金额</div><div class="text-14px">¥{{ (detailRecord as any).frozenAmount || detailRecord.amount }}</div></div>
          </div>
          <div class="flex gap-16px mb-12px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">手续费</div><div class="text-14px">¥{{ detailRecord.feeAmount }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-4px">实际到账</div><div class="text-16px font-bold" style="color:#18a058;">¥{{ detailRecord.actualAmount }}</div></div>
          </div>
          <div class="flex gap-16px mb-20px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">状态</div><NTag v-if="statusMap[detailRecord.status]" :type="statusMap[detailRecord.status].type" size="small" :bordered="false">{{ statusMap[detailRecord.status].label }}</NTag><span v-else>-</span></div>
            <div class="flex-1"></div>
          </div>
          <div class="section-divider">到账信息</div>
          <div class="flex gap-16px mb-20px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">钱包类型</div><div class="text-14px">{{ detailRecord.wallet?.walletType?.name || detailRecord.wallet?.bankName || '-' }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-4px">钱包账号</div><div class="text-14px">{{ detailRecord.wallet?.accountNumber || '-' }}</div></div>
          </div>
          <div class="section-divider">审核信息</div>
          <div class="flex gap-16px mb-12px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">审核时间</div><div class="text-14px">{{ detailRecord.reviewedAt || '-' }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-4px">审核人</div><div class="text-14px">{{ detailRecord.reviewer?.username || '-' }}</div></div>
          </div>
          <div class="flex gap-16px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">拒绝原因</div><div class="text-14px">{{ detailRecord.rejectReason || '-' }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-4px">备注</div><div class="text-14px">{{ detailRecord.remark || '-' }}</div></div>
          </div>
        </div>
      </template>
      <template #footer><NSpace justify="end"><NButton type="primary" @click="detailVisible = false">关闭</NButton></NSpace></template>
    </NModal>
  </div>
</template>

<style scoped>
.section-divider { font-size: 14px; font-weight: 600; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 1px solid #f0f0f5; }
</style>
