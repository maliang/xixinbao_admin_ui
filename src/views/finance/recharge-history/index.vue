<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NDatePicker, NPagination,
  NCollapse, NCollapseItem, NGrid, NGridItem, NModal, NSpace,
  NDataTable, NTag, NImage, useDialog
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchRechargeHistory, fetchRechargeDetail, deleteRecharge, batchDeleteRecharge, adjustUserBalance } from '@/service/api';

defineOptions({ name: 'FinanceRechargeHistoryPage' });
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
  { label: '全部', value: '' }, { label: '已通过', value: '1' }, { label: '不予通过', value: '2' }
];

function handleReset() {
  searchForm.value = { account: '', orderNo: '', name: '', payMethod: '', status: '', dateStart: null, dateEnd: null };
  currentPage.value = 1;
  loadData();
}

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);

interface RechargeRecord {
  id: number; orderNo: string; userId: number; amount: number;
  actualAmount: number; paymentMethod: string; bankName: string; bankBranch: string; bankAccount: string;
  voucherImage: string; status: number; createdAt: string; reviewedAt: string;
  rejectReason: string; remark: string;
  user?: { account: string; name: string; phone: string; createdAt: string };
  payChannel?: any;
  [key: string]: any;
}
const records = ref<RechargeRecord[]>([]);

const statusMap: Record<number, { type: 'success' | 'error'; label: string }> = {
  1: { type: 'success', label: '已通过' },
  2: { type: 'error', label: '不予通过' }
};

// ========== 表格列定义 ==========
const columns = computed<DataTableColumns>(() => [
  { type: 'selection', width: 40 },
  {
    title: '订单编号', key: 'orderNo', width: 150,
    render: (row: any) => h('a', { style: 'color:#2080f0;cursor:pointer;', onClick: () => openDetail(row) }, { default: () => row.orderNo })
  },
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
      const s = statusMap[row.status as number] || { type: 'success' as const, label: String(row.status) };
      return h(NTag, { type: s.type, size: 'small', bordered: false }, () => s.label);
    }
  },
  {
    title: '操作', key: 'action', width: 65, align: 'center',
    render: (row: any) => h(NSpace, { size: 4, justify: 'center' }, () => [
      h(NButton, { size: 'tiny', quaternary: true, type: 'info', onClick: () => openDetail(row) }, () => '查看'),
      h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDeleteOne(row) }, () => '删除')
    ])
  }
]);

// ========== 详情弹窗 ==========
const detailVisible = ref(false);
const detailRecord = ref<RechargeRecord | null>(null);

async function openDetail(r: RechargeRecord) {
  const { data, error } = await fetchRechargeDetail((r as any).id);
  detailRecord.value = !error ? data : r;
  detailVisible.value = true;
}

// ========== 单条删除 ==========
function handleDeleteOne(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除订单「${row.orderNo}」吗？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteRecharge(row.id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error('删除失败'); }
    }
  });
}

// ========== 调整余额弹窗 ==========
const adjustVisible = ref(false);
const adjustForm = ref({ account: '', operationType: 'add' as 'add' | 'deduct', amount: '', remark: '' });
function openAdjust() { adjustForm.value = { account: '', operationType: 'add', amount: '', remark: '' }; adjustVisible.value = true; }
async function submitAdjust() {
  const { error } = await adjustUserBalance({ account: adjustForm.value.account, type: adjustForm.value.operationType, amount: adjustForm.value.amount, remark: adjustForm.value.remark });
  if (!error) { window.$message?.success('余额调整成功'); adjustVisible.value = false; loadData(); }
  else { window.$message?.error(error?.msg || '操作失败'); }
}

// ========== 数据加载 ==========
async function loadData() {
  loading.value = true;
  const params: Record<string, any> = { page: currentPage.value, page_size: pageSize };
  if (searchForm.value.account) params.account = searchForm.value.account;
  if (searchForm.value.orderNo) params.orderNo = searchForm.value.orderNo;
  if (searchForm.value.name) params.name = searchForm.value.name;
  if (searchForm.value.payMethod) params.paymentMethod = searchForm.value.payMethod;
  if (searchForm.value.status) params.status = searchForm.value.status;
  if (searchForm.value.dateStart) params.dateStart = toLocalDateStr(searchForm.value.dateStart);
  if (searchForm.value.dateEnd) params.dateEnd = toLocalDateStr(searchForm.value.dateEnd);

  const { data, error } = await fetchRechargeHistory(params);
  loading.value = false;
  if (!error) { records.value = data.list || []; totalRecords.value = data.total || 0; }
  else { window.$message?.error(error?.msg || '加载失败'); }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); loadPayMethods(); });
</script>

<template>
  <div class="p-16px">
    <h2 class="text-18px font-bold m-0 mb-16px">充值记录</h2>
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
            <NGridItem><div class="text-13px mb-6px">支付方式</div><NSelect v-model:value="searchForm.payMethod" :options="payMethodOptions" /></NGridItem>
            <NGridItem><div class="text-13px mb-6px">状态</div><NSelect v-model:value="searchForm.status" :options="statusOptions" /></NGridItem>
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
      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="950" :loading="loading" :row-key="(row: any) => row.id" v-model:checked-row-keys="checkedKeys" />
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 订单详情弹窗 -->
    <NModal v-model:show="detailVisible" preset="card" title="订单详情" style="width: 720px;" :bordered="false">
      <template v-if="detailRecord">
        <div class="flex gap-20px">
          <div class="flex-1">
            <div class="detail-section">
              <div class="detail-section-title">订单信息</div>
              <div class="detail-row"><span class="detail-label">订单编号:</span><span class="detail-value font-bold">{{ detailRecord.orderNo }}</span></div>
              <div class="detail-row"><span class="detail-label">提交时间:</span><span class="detail-value">{{ detailRecord.createdAt }}</span></div>
              <div class="detail-row"><span class="detail-label">支付方式:</span><span class="detail-value">{{ detailRecord.paymentMethod || '-' }}</span></div>
              <div class="detail-row"><span class="detail-label">申请金额:</span><span class="detail-value font-bold" style="color:#18a058;">¥{{ detailRecord.amount }}</span></div>
              <div class="detail-row"><span class="detail-label">实际金额:</span><span class="detail-value font-bold" style="color:#18a058;">¥{{ detailRecord.actualAmount || detailRecord.amount }}</span></div>
            </div>
            <div class="detail-section">
              <div class="detail-section-title">用户信息</div>
              <div class="detail-row"><span class="detail-label">账号:</span><span class="detail-value">{{ detailRecord.user?.account || '-' }}</span></div>
              <div class="detail-row"><span class="detail-label">姓名:</span><span class="detail-value">{{ detailRecord.user?.name || '-' }}</span></div>
              <div class="detail-row"><span class="detail-label">注册时间:</span><span class="detail-value">{{ detailRecord.user?.createdAt || '-' }}</span></div>
            </div>
            <div class="detail-section">
              <div class="detail-section-title">收款通道信息</div>
              <div class="detail-row"><span class="detail-label">通道名称:</span><span class="detail-value">{{ detailRecord.payChannel?.name || detailRecord.paymentMethod || '-' }}</span></div>
              <template v-if="detailRecord.payChannel?.type === 'bank'">
                <div class="detail-row"><span class="detail-label">银行名称:</span><span class="detail-value">{{ detailRecord.payChannel?.bankType || '-' }}</span></div>
                <div class="detail-row"><span class="detail-label">支行:</span><span class="detail-value">{{ detailRecord.payChannel?.bankBranch || '-' }}</span></div>
                <div class="detail-row"><span class="detail-label">收款账号:</span><span class="detail-value">{{ detailRecord.payChannel?.accountNumber || '-' }}</span></div>
                <div class="detail-row"><span class="detail-label">持卡人:</span><span class="detail-value">{{ detailRecord.payChannel?.holderName || '-' }}</span></div>
              </template>
              <template v-else-if="detailRecord.payChannel?.type === 'crypto'">
                <div class="detail-row"><span class="detail-label">币种:</span><span class="detail-value">{{ detailRecord.payChannel?.coinType || '-' }}</span></div>
                <div class="detail-row"><span class="detail-label">收款地址:</span><span class="detail-value" style="word-break:break-all;">{{ detailRecord.payChannel?.walletAddress || '-' }}</span></div>
              </template>
            </div>
          </div>
          <div class="flex-1">
            <div class="detail-section">
              <div class="detail-section-title">支付凭证</div>
              <div v-if="detailRecord.voucherImage" style="text-align:center;"><NImage :src="detailRecord.voucherImage" style="max-width:100%;max-height:220px;border-radius:8px;" /></div>
              <div v-else class="voucher-large"><span class="op-20 text-12px">暂无凭证</span></div>
            </div>
            <div class="detail-section">
              <div class="detail-section-title">审核记录</div>
              <div class="detail-row"><span class="detail-label">审核人:</span><span class="detail-value font-bold">{{ detailRecord.reviewerName || '-' }}</span></div>
              <div class="detail-row"><span class="detail-label">审核时间:</span><span class="detail-value">{{ detailRecord.reviewedAt || '-' }}</span></div>
              <div class="detail-row">
                <span class="detail-label">审核结果:</span>
                <NTag v-if="statusMap[detailRecord.status]" :type="statusMap[detailRecord.status].type" size="small" :bordered="false">{{ statusMap[detailRecord.status].label }}</NTag>
                <span v-else>-</span>
              </div>
              <div class="detail-row"><span class="detail-label">拒绝原因:</span><span class="detail-value">{{ detailRecord.rejectReason || '-' }}</span></div>
              <div class="detail-row"><span class="detail-label">备注:</span><span class="detail-value">{{ detailRecord.remark || '-' }}</span></div>
            </div>
          </div>
        </div>
      </template>
      <template #footer><NSpace justify="end"><NButton type="primary" @click="detailVisible = false"><SvgIcon icon="ph:check" class="mr-4px" />确认</NButton></NSpace></template>
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
.detail-section { margin-bottom: 20px; }
.detail-section-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f0f0f5; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 13px; }
.detail-label { color: rgba(0,0,0,0.5); flex-shrink: 0; }
.detail-value { text-align: right; }
.voucher-large { width: 100%; height: 220px; background-color: #f5f5f8; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #e8e8ec; }
.type-btn { flex: 1; padding: 10px 0; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: center; }
.type-add { border: 1px solid #e6f7ef; background: #fff; color: #18a058; }
.type-add.active { background: #e6f7ef; border-color: #18a058; }
.type-deduct { border: 1px solid #fde8ec; background: #fff; color: #d03050; }
.type-deduct.active { background: #fde8ec; border-color: #d03050; }
</style>
