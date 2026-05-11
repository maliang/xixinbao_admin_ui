<script setup lang="ts">
import { ref, h, watch, computed, onMounted } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NDatePicker, NPagination,
  NCollapse, NCollapseItem, NGrid, NGridItem, NModal, NSpace,
  NRadio, NRadioGroup, NDataTable, NTag
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchWithdrawPending, reviewWithdraw } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'FinanceWithdrawAuditPage' });
const authStore = useAuthStore();

// ========== 筛选 ==========
const searchForm = ref({
  account: '', orderNo: '', name: '',
  status: null as string | null,
  dateStart: null as number | null, dateEnd: null as number | null
});
const statusOptions = [
  { label: '全部', value: null }, { label: '未审核', value: 'pending' },
  { label: '已通过', value: 'approved' }, { label: '已拒绝', value: 'rejected' }
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
  wallet?: { bankName: string; accountNumber: string; branchName: string; walletType?: { name: string } };
  [key: string]: any;
}
const records = ref<WithdrawRecord[]>([]);

const statusMap: Record<number, { type: 'warning' | 'success' | 'error'; label: string }> = {
  0: { type: 'warning', label: '未审核' },
  1: { type: 'success', label: '已通过' },
  2: { type: 'error', label: '已拒绝' }
};

// ========== 表格列定义 ==========
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
    title: '金额信息', key: 'amount', width: 130,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-size:14px;font-weight:bold;' }, { default: () => '¥' + parseFloat(row.amount || 0).toFixed(2) }),
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
    title: '状态', key: 'status', width: 70, align: 'center',
    render: (row: any) => {
      const s = statusMap[row.status as number] || statusMap[0];
      return h(NTag, { type: s.type, size: 'small', bordered: false }, () => s.label);
    }
  },
  {
    title: '操作', key: 'action', width: 55, align: 'center',
    render: (row: any) => {
      if (row.status === 0) {
        return authStore.hasPermission('finance.withdraw-audit.audit') ? h(NButton, { text: true, type: 'primary', onClick: () => openAudit(row) }, () => '审核') : null;
      }
      return h('span', { style: 'font-size:12px;opacity:0.4;' }, { default: () => '已处理' });
    }
  },
  {
    title: '原因', key: 'rejectReason', width: 80,
    render: (row: any) => h('span', { style: 'font-size:12px;' }, { default: () => row.rejectReason || '-' })
  }
]);

// ========== 审核弹窗 ==========
const auditVisible = ref(false);
const auditRecord = ref<WithdrawRecord | null>(null);
const auditFeeRate = ref('1');
const auditFeeAmount = ref('');
const auditActualAmount = ref('');
const auditApplyAmount = ref('');
const auditResult = ref<string>('approved');
const auditRejectReason = ref('');

function openAudit(r: WithdrawRecord) {
  auditRecord.value = r;
  auditApplyAmount.value = String(r.amount || '');
  auditFeeRate.value = String(r.feeRate || '1');
  auditFeeAmount.value = String(parseFloat(String(r.feeAmount || 0)).toFixed(2));
  // 直接用订单中已计算好的实际到账金额（含汇率）
  auditActualAmount.value = String(parseFloat(String(r.actualAmount || 0)).toFixed(2));
  auditResult.value = 'approved';
  auditRejectReason.value = '';
  auditVisible.value = true;
}

function calcFee() {
  const amount = parseFloat(auditApplyAmount.value) || 0;
  const rate = parseFloat(auditFeeRate.value) || 0;
  const fee = amount * rate / 100;
  auditFeeAmount.value = fee.toFixed(2);
  auditActualAmount.value = (amount - fee).toFixed(2);
}
watch(auditFeeRate, calcFee);

async function submitAudit() {
  if (!auditRecord.value) return;
  const { error } = await reviewWithdraw((auditRecord.value as any).id, {
    result: auditResult.value, fee_rate: auditFeeRate.value,
    actual_amount: auditActualAmount.value, remark: auditRejectReason.value
  });
  if (!error) { window.$message?.success('审核成功'); auditVisible.value = false; loadData(); (window as any).__refreshPendingCounts?.(); }
  else { window.$message?.error(error?.msg || '操作失败'); }
}

async function loadData() {
  loading.value = true;
  const { data, error } = await fetchWithdrawPending({ ...searchForm.value, page: currentPage.value, page_size: pageSize });
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
      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="970" :loading="loading" />
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 提现审核弹窗 -->
    <NModal v-model:show="auditVisible" preset="card" title="提现审核" style="width: 580px;" :bordered="false">
      <template v-if="auditRecord">
        <div class="flex flex-col gap-16px">
          <div class="flex gap-16px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">订单编号</div><div class="text-14px font-bold">{{ auditRecord.orderNo }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-4px">用户信息</div><div class="text-14px">{{ auditRecord.user?.account || '-' }} ({{ auditRecord.user?.name || '-' }})</div></div>
          </div>
          <div class="flex gap-16px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">提交时间</div><div class="text-14px">{{ auditRecord.createdAt }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-4px">到账信息</div><div class="text-14px font-500">{{ auditRecord.wallet?.walletType?.name || auditRecord.wallet?.bankName || '-' }}</div><div class="text-12px op-60">{{ auditRecord.wallet?.accountNumber || '-' }}</div></div>
          </div>
          <div class="flex gap-16px">
            <div class="flex-1"><div class="text-13px op-50 mb-6px">申请金额</div><NInput :value="auditApplyAmount" disabled /></div>
            <div class="flex-1"><div class="text-13px op-50 mb-6px">手续费比例</div><NInput v-model:value="auditFeeRate"><template #suffix><span class="op-50">%</span></template></NInput></div>
          </div>
          <div class="flex gap-16px">
            <div class="flex-1"><div class="text-13px op-50 mb-4px">手续费金额</div><div class="text-14px">{{ auditFeeAmount }}</div></div>
            <div class="flex-1"><div class="text-13px op-50 mb-6px">实际到账金额</div><NInput v-model:value="auditActualAmount" /></div>
          </div>
          <div><div class="text-13px op-50 mb-8px">审核结果</div><NRadioGroup v-model:value="auditResult"><NRadio value="approved">通过</NRadio><NRadio value="rejected" class="ml-16px">拒绝</NRadio></NRadioGroup></div>
          <div><div class="text-13px op-50 mb-6px">拒绝原因</div><NInput v-model:value="auditRejectReason" type="textarea" :rows="4" placeholder="请输入拒绝原因" /></div>
        </div>
      </template>
      <template #footer><NSpace justify="end"><NButton @click="auditVisible = false">取消</NButton><NButton type="primary" @click="submitAudit">确认</NButton></NSpace></template>
    </NModal>
  </div>
</template>
