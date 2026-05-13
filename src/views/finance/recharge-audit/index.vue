<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NDatePicker, NPagination,
  NCollapse, NCollapseItem, NGrid, NGridItem, NModal, NSpace,
  NRadio, NRadioGroup, NCheckbox, NDataTable, NTag, NImage, useDialog
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchRechargePending, reviewRecharge, deleteRecharge, batchDeleteRecharge, adjustUserBalance } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'FinanceRechargeAuditPage' });
const authStore = useAuthStore();
const dialog = useDialog();

// ========== 筛选 ==========
const searchForm = ref({
  account: '', orderNo: '', name: '',
  payMethod: '' as string, status: '' as string,
  dateStart: null as number | null, dateEnd: null as number | null
});

const payMethodOptions = ref<{ label: string; value: any }[]>([{ label: '全部', value: '' }]);

async function loadPayMethods() {
  const { fetchPayChannels } = await import('@/service/api');
  const { data, error } = await fetchPayChannels({});
  if (!error && data) {
    const list = Array.isArray(data) ? data : (data.list || []);
    payMethodOptions.value = [
      { label: '全部', value: '' },
      ...list.map((ch: any) => ({ label: ch.name, value: ch.name }))
    ];
  }
}
const statusOptions = [
  { label: '全部', value: '' }, { label: '未审核', value: '0' },
  { label: '已通过', value: '1' }, { label: '已拒绝', value: '2' }
];

function handleReset() {
  searchForm.value = { account: '', orderNo: '', name: '', payMethod: '', status: '', dateStart: null, dateEnd: null };
  currentPage.value = 1;
  loadData();
}

// ========== 选择与批量操作 ==========
const checkedKeys = ref<number[]>([]);

function handleBatchDelete() {
  if (!checkedKeys.value.length) { window.$message?.warning('请先选择要删除的订单'); return; }
  dialog.warning({
    title: '确认删除',
    content: `确定要删除选中的 ${checkedKeys.value.length} 条订单吗？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await batchDeleteRecharge(checkedKeys.value);
      if (!error) { window.$message?.success('删除成功'); checkedKeys.value = []; loadData(); }
      else { window.$message?.error('删除失败'); }
    }
  });
}

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 分页 ==========
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);

// ========== 数据 ==========
interface RechargeRecord {
  id: number; orderNo: string; userId: number; amount: number;
  paymentMethod: string; bankName: string; bankBranch: string; bankAccount: string;
  voucherImage: string; status: number; createdAt: string;
  user?: { account: string; name: string; phone: string };
  [key: string]: any;
}
const records = ref<RechargeRecord[]>([]);

const statusMap: Record<number, { type: 'warning' | 'success' | 'error'; label: string }> = {
  0: { type: 'warning', label: '未审核' },
  1: { type: 'success', label: '已通过' },
  2: { type: 'error', label: '已拒绝' }
};

// ========== 表格列定义 ==========
const columns = computed<DataTableColumns>(() => [
  { type: 'selection', width: 40 },
  { title: '订单编号', key: 'orderNo', width: 150 },
  {
    title: '账户信息', key: 'user', width: 120,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-weight:bold;font-size:13px;' }, { default: () => row.user?.account || '-' }),
      h('div', { style: 'font-size:11px;opacity:0.5;' }, { default: () => row.user?.name || '-' })
    ])
  },
  {
    title: '金额', key: 'amount', width: 130,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-weight:bold;color:#333;' }, { default: () => '¥' + parseFloat(row.amount || 0).toFixed(2) }),
      row.actualAmount ? h('div', { style: 'font-size:11px;color:#18a058;' }, { default: () => '到账: ¥' + parseFloat(row.actualAmount || 0).toFixed(2) }) : null
    ])
  },
  {
    title: '支付方式', key: 'paymentMethod', width: 160,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-size:13px;font-weight:500;' }, { default: () => row.paymentMethod || '-' }),
      row.bankName ? h('div', { style: 'font-size:11px;opacity:0.5;' }, { default: () => row.bankName }) : null
    ])
  },
  {
    title: '凭证', key: 'voucherImage', width: 60, align: 'center',
    render: (row: any) => {
      if (row.voucherImage) {
        return h(NImage, { src: row.voucherImage, width: 40, height: 40, objectFit: 'cover', style: 'border-radius:6px;cursor:pointer;' });
      }
      return h('div', { style: 'width:40px;height:40px;background:#f0f0f5;border-radius:6px;margin:0 auto;' });
    }
  },
  { title: '时间', key: 'createdAt', width: 160 },
  {
    title: '状态', key: 'status', width: 80, align: 'center',
    render: (row: any) => {
      const s = statusMap[row.status as number] || statusMap[0];
      return h(NTag, { type: s.type, size: 'small', bordered: false }, () => s.label);
    }
  },
  {
    title: '操作', key: 'action', width: 70, align: 'center',
    render: (row: any) => {
      if (row.status === 0) {
        return authStore.hasPermission('finance.recharge-audit.audit') ? h(NButton, { size: 'small', type: 'primary', onClick: () => openAudit(row) }, () => '审核') : null;
      }
      return h(NSpace, { size: 4, justify: 'center' }, () => [
        h(NButton, { size: 'tiny', quaternary: true, onClick: () => {} }, () => '查看'),
        h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => {} }, () => '删除')
      ]);
    }
  }
]);

// ========== 审核弹窗 ==========
const auditVisible = ref(false);
const auditRecord = ref<RechargeRecord | null>(null);
const auditActualAmount = ref('');
const auditResult = ref<string>('approved');
const auditRejectReason = ref('');

function openAudit(r: RechargeRecord) {
  auditRecord.value = r;
  // 显示后端已计算好的实际金额（含汇率）
  auditActualAmount.value = String(r.actualAmount || r.amount || '');
  auditResult.value = 'approved';
  auditRejectReason.value = '';
  auditVisible.value = true;
}

async function submitAudit() {
  if (!auditRecord.value) return;
  const { error } = await reviewRecharge((auditRecord.value as any).id, {
    result: auditResult.value, actual_amount: auditActualAmount.value, remark: auditRejectReason.value
  });
  if (!error) { window.$message?.success('审核成功'); auditVisible.value = false; loadData(); (window as any).__refreshPendingCounts?.(); }
  else { window.$message?.error(error?.msg || '操作失败'); }
}

// ========== 调整余额弹窗 ==========
const adjustVisible = ref(false);
const adjustForm = ref({ account: '', operationType: 'add' as 'add' | 'deduct', amount: '', remark: '' });

function openAdjust() {
  adjustForm.value = { account: '', operationType: 'add', amount: '', remark: '' };
  adjustVisible.value = true;
}

async function submitAdjust() {
  const { error } = await adjustUserBalance({
    account: adjustForm.value.account, type: adjustForm.value.operationType,
    amount: adjustForm.value.amount, remark: adjustForm.value.remark
  });
  if (!error) { window.$message?.success('余额调整成功'); adjustVisible.value = false; loadData(); }
  else { window.$message?.error(error?.msg || '操作失败'); }
}

// ========== 数据加载 ==========
async function loadData() {
  if (searchForm.value.dateStart && searchForm.value.dateEnd && searchForm.value.dateEnd < searchForm.value.dateStart) {
    window.$message?.warning('结束时间必须大于开始时间'); return;
  }
  loading.value = true;
  const params: Record<string, any> = {
    page: currentPage.value,
    page_size: pageSize
  };
  if (searchForm.value.account) params.account = searchForm.value.account;
  if (searchForm.value.orderNo) params.orderNo = searchForm.value.orderNo;
  if (searchForm.value.name) params.name = searchForm.value.name;
  if (searchForm.value.payMethod) params.paymentMethod = searchForm.value.payMethod;
  if (searchForm.value.status) params.status = searchForm.value.status;
  if (searchForm.value.dateStart) params.dateStart = toLocalDateStr(searchForm.value.dateStart);
  if (searchForm.value.dateEnd) params.dateEnd = toLocalDateStr(searchForm.value.dateEnd);

  const { data, error } = await fetchRechargePending(params);
  loading.value = false;
  if (!error) { records.value = data.list || []; totalRecords.value = data.total || 0; }
  else { window.$message?.error(error?.msg || '加载失败'); }
}

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

watch(currentPage, loadData);
onMounted(() => { loadData(); loadPayMethods(); });
</script>

<template>
  <div class="p-16px">
    <h2 class="text-18px font-bold m-0 mb-16px">充值记录审核</h2>

    <div class="flex items-center justify-between mb-16px">
      <div class="flex gap-8px">
        <NButton type="primary" @click="openAdjust"><SvgIcon icon="ph:arrows-left-right" class="mr-4px" />调整余额</NButton>
        <NButton type="error" ghost @click="handleBatchDelete"><SvgIcon icon="ph:trash" class="mr-4px" />批量删除</NButton>
      </div>
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
            <NGridItem><div class="text-13px mb-6px">支付方式</div><NSelect v-model:value="searchForm.payMethod" :options="payMethodOptions" placeholder="全部" /></NGridItem>
            <NGridItem><div class="text-13px mb-6px">状态</div><NSelect v-model:value="searchForm.status" :options="statusOptions" placeholder="全部" /></NGridItem>
            <NGridItem>
              <div class="text-13px mb-6px">充值时间</div>
              <div class="flex items-center gap-8px">
                <NDatePicker v-model:value="searchForm.dateStart" type="date" placeholder="-/-/-" class="flex-1" />
                <span class="text-13px op-60">至</span>
                <NDatePicker v-model:value="searchForm.dateEnd" type="date" placeholder="-/-/-" class="flex-1" />
              </div>
            </NGridItem>
          </NGrid>
          <div class="flex justify-end gap-8px mt-16px">
            <NButton @click="handleReset">重置</NButton>
            <NButton type="primary" @click="loadData"><SvgIcon icon="ph:magnifying-glass" class="mr-4px" />查询</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="990" :loading="loading" :row-key="(row: any) => row.id" v-model:checked-row-keys="checkedKeys" />
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 充值审核弹窗 -->
    <NModal v-model:show="auditVisible" preset="card" title="充值审核" style="width: 520px;" :bordered="false">
      <template v-if="auditRecord">
        <div class="flex flex-col gap-16px">
          <div><div class="text-13px op-50 mb-4px">订单编号</div><div class="text-14px font-bold">{{ auditRecord.orderNo }}</div></div>
          <div><div class="text-13px op-50 mb-4px">用户信息</div><div class="text-14px">{{ auditRecord.user?.account || '-' }} - {{ auditRecord.user?.name || '-' }}</div></div>
          <div><div class="text-13px op-50 mb-4px">申请金额</div><div class="text-18px font-bold" style="color:#18a058;">¥{{ auditRecord.amount }}</div></div>
          <div><div class="text-13px op-50 mb-6px">实际金额</div><NInput v-model:value="auditActualAmount" /></div>
          <div><div class="text-13px op-50 mb-4px">支付方式</div><div class="text-14px font-500">{{ auditRecord.paymentMethod || '-' }}</div></div>
          <div v-if="auditRecord.bankName"><div class="text-13px op-50 mb-4px">银行信息</div><div class="text-14px font-500">{{ auditRecord.bankName }}</div><div class="text-12px op-50">账号 {{ auditRecord.bankAccount || '-' }}</div></div>
          <div><div class="text-13px op-50 mb-4px">订单提交时间</div><div class="text-14px">{{ auditRecord.createdAt }}</div></div>
          <div v-if="auditRecord.voucherImage"><div class="text-13px op-50 mb-6px">支付凭证</div><NImage :src="auditRecord.voucherImage" width="120" style="border-radius:8px;" /></div>
          <div><div class="text-13px op-50 mb-8px">审核结果</div><NRadioGroup v-model:value="auditResult"><NRadio value="approved">通过</NRadio><NRadio value="rejected" class="ml-16px">拒绝</NRadio></NRadioGroup></div>
          <div><div class="text-13px op-50 mb-6px">拒绝原因</div><NInput v-model:value="auditRejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" /></div>
        </div>
      </template>
      <template #footer><NSpace justify="end"><NButton @click="auditVisible = false">取消</NButton><NButton type="primary" @click="submitAudit">确认</NButton></NSpace></template>
    </NModal>

    <!-- 调整玩家余额弹窗 -->
    <NModal v-model:show="adjustVisible" preset="card" title="调整玩家余额" style="width: 520px;" :bordered="false">
      <div class="flex flex-col gap-16px">
        <div><div class="text-13px font-500 mb-6px">玩家账号</div><NInput v-model:value="adjustForm.account" placeholder="输入玩家账号" /></div>
        <div>
          <div class="text-13px font-500 mb-8px">操作类型</div>
          <div class="flex gap-8px">
            <button class="type-btn type-add" :class="{ active: adjustForm.operationType === 'add' }" @click="adjustForm.operationType = 'add'"><SvgIcon icon="ph:plus-circle" class="mr-4px" />加款</button>
            <button class="type-btn type-deduct" :class="{ active: adjustForm.operationType === 'deduct' }" @click="adjustForm.operationType = 'deduct'"><SvgIcon icon="ph:minus-circle" class="mr-4px" />扣款</button>
          </div>
        </div>
        <div><div class="text-13px font-500 mb-6px">金额</div><NInput v-model:value="adjustForm.amount" placeholder="输入调整金额" /></div>
        <div><div class="text-13px font-500 mb-6px">调整备注</div><NInput v-model:value="adjustForm.remark" type="textarea" :rows="3" placeholder="输入调整原因或备注" /></div>
      </div>
      <template #footer><NSpace justify="end"><NButton @click="adjustVisible = false">取消</NButton><NButton type="primary" @click="submitAdjust">确认</NButton></NSpace></template>
    </NModal>
  </div>
</template>

<style scoped>
.voucher-preview { width: 120px; height: 160px; background-color: #f0f0f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #e8e8ec; }
.type-btn { flex: 1; padding: 10px 0; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: center; }
.type-add { border: 1px solid #e6f7ef; background: #fff; color: #18a058; }
.type-add.active { background: #e6f7ef; border-color: #18a058; }
.type-deduct { border: 1px solid #fde8ec; background: #fff; color: #d03050; }
.type-deduct.active { background: #fde8ec; border-color: #d03050; }
</style>
