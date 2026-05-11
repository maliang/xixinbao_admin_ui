<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NPagination,
  NCollapse, NCollapseItem, NGrid, NGridItem,
  NModal, NSpace, NDataTable, useDialog
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchBankWallets, fetchCryptoWallets, updateWallet, deleteWallet } from '@/service/api';

defineOptions({ name: 'UserWalletPage' });

const dialog = useDialog();

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 收款方式切换 ==========
const paymentMethod = ref<'bank' | 'wallet'>('bank');

// ========== 筛选 ==========
const searchForm = ref({
  account: '',
  name: '',
  bankName: '' as string,
  branchName: '',
  accountNumber: '',
  coinType: '' as string,
  walletAddress: ''
});

const bankNameOptions = [
  { label: '全部', value: null },
  { label: '中国工商银行', value: '中国工商银行' },
  { label: '中国建设银行', value: '中国建设银行' },
  { label: '中国农业银行', value: '中国农业银行' },
  { label: '中国银行', value: '中国银行' },
  { label: '招商银行', value: '招商银行' }
];

const coinTypeOptions = [
  { label: '全部', value: null },
  { label: 'USDT', value: 'USDT' },
  { label: 'BTC', value: 'BTC' },
  { label: 'ETH', value: 'ETH' },
  { label: 'USDC', value: 'USDC' }
];

function handleReset() {
  searchForm.value = { account: '', name: '', bankName: '', branchName: '', accountNumber: '', coinType: null, walletAddress: '' };
  currentPage.value = 1;
  loadData();
}

// ========== Tab 切换 ==========
const activeTab = ref<'bank' | 'wallet'>('bank');

// ========== 分页 ==========
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize));

// ========== 银行卡数据 ==========
interface BankRecord {
  index: number; id: string; account: string; name: string;
  bankName: string; branchName: string; accountNumber: string; createdAt: string;
}
const bankRecords = ref<BankRecord[]>([]);

// ========== 数字钱包数据 ==========
interface WalletRecord {
  index: number; id: string; account: string; name: string;
  coinType: string; accountNumber: string; createdAt: string;
}
const walletRecords = ref<WalletRecord[]>([]);

// ========== 银行卡表格列 ==========
const bankColumns = computed<DataTableColumns>(() => [
  { title: '序号', key: 'index', width: 50, align: 'center' },
  { title: 'ID', key: 'id', width: 130 },
  { title: '账号', key: 'account', width: 110 },
  { title: '姓名', key: 'name', width: 70 },
  { title: '银行名称', key: 'bankName', width: 110 },
  { title: '支行', key: 'branchName', width: 110 },
  { title: '银行账户', key: 'accountNumber', width: 160 },
  { title: '提交时间', key: 'createdAt', width: 140 },
  {
    title: '操作', key: 'action', width: 90, align: 'center',
    render: (row) => h(NSpace, { size: 8 }, () => [
      h(NButton, { text: true, type: 'primary', onClick: () => openEditBank(row as BankRecord) }, () => '编辑'),
      h(NButton, { text: true, type: 'error', onClick: () => handleUnbindBank(row as BankRecord) }, () => '解绑')
    ])
  }
]);

// ========== 数字钱包表格列 ==========
const walletColumns = computed<DataTableColumns>(() => [
  { title: '序号', key: 'index', width: 50, align: 'center' },
  { title: 'ID', key: 'id', width: 130 },
  { title: '账号', key: 'account', width: 110 },
  { title: '姓名', key: 'name', width: 70 },
  { title: '币种', key: 'coinType', width: 70 },
  {
    title: '钱包地址', key: 'accountNumber', width: 240, ellipsis: { tooltip: true }
  },
  { title: '提交时间', key: 'createdAt', width: 140 },
  {
    title: '操作', key: 'action', width: 90, align: 'center',
    render: (row) => h(NSpace, { size: 8 }, () => [
      h(NButton, { text: true, type: 'primary', onClick: () => openEditWallet(row as WalletRecord) }, () => '编辑'),
      h(NButton, { text: true, type: 'error', onClick: () => handleUnbindWallet(row as WalletRecord) }, () => '解绑')
    ])
  }
]);

async function loadData() {
  loading.value = true;
  if (activeTab.value === 'bank') {
    const { data, error } = await fetchBankWallets({
      account: searchForm.value.account,
      name: searchForm.value.name,
      bankName: searchForm.value.bankName,
      branchName: searchForm.value.branchName,
      accountNumber: searchForm.value.accountNumber,
      page: currentPage.value,
      page_size: pageSize
    });
    loading.value = false;
    if (!error) {
      const list = data?.list || [];
      bankRecords.value = list.map((item: any, idx: number) => ({ ...item, index: (currentPage.value - 1) * pageSize + idx + 1 }));
      totalRecords.value = data?.total || 0;
    }
    else { window.$message?.error(error?.msg || '操作失败'); }
  } else {
    const { data, error } = await fetchCryptoWallets({
      account: searchForm.value.account,
      name: searchForm.value.name,
      accountNumber: searchForm.value.walletAddress,
      page: currentPage.value,
      page_size: pageSize
    });
    loading.value = false;
    if (!error) {
      const list = data?.list || [];
      walletRecords.value = list.map((item: any, idx: number) => ({ ...item, index: (currentPage.value - 1) * pageSize + idx + 1 }));
      totalRecords.value = data?.total || 0;
    }
    else { window.$message?.error(error?.msg || '操作失败'); }
  }
}

watch(currentPage, loadData);
watch(activeTab, () => { currentPage.value = 1; loadData(); });
onMounted(() => { loadData(); });

// ========== 编辑银行卡弹窗 ==========
const editBankVisible = ref(false);
const editBankForm = ref({ id: '', account: '', name: '', bankName: null as string | null, branchName: '', bankAccount: '' });

function openEditBank(r: BankRecord) {
  editBankForm.value = { id: r.id, account: r.account, name: r.name, bankName: r.bankName, branchName: r.branchName, bankAccount: r.accountNumber };
  editBankVisible.value = true;
}

// ========== 编辑数字钱包弹窗 ==========
const editWalletVisible = ref(false);
const editWalletForm = ref({ id: '', account: '', name: '', coinType: null as string | null, walletAddress: '' });

function openEditWallet(r: WalletRecord) {
  editWalletForm.value = { id: r.id, account: r.account, name: r.name, coinType: r.coinType, walletAddress: r.accountNumber };
  editWalletVisible.value = true;
}

async function handleSaveBank() {
  const { error } = await updateWallet(Number(editBankForm.value.id), {
    bankName: editBankForm.value.bankName, branchName: editBankForm.value.branchName, accountNumber: editBankForm.value.bankAccount
  });
  if (!error) { window.$message?.success('操作成功'); editBankVisible.value = false; loadData(); }
  else { window.$message?.error(error?.msg || '操作失败'); }
}

async function handleSaveWallet() {
  const { error } = await updateWallet(Number(editWalletForm.value.id), {
    coinType: editWalletForm.value.coinType, accountNumber: editWalletForm.value.walletAddress
  });
  if (!error) { window.$message?.success('操作成功'); editWalletVisible.value = false; loadData(); }
  else { window.$message?.error(error?.msg || '操作失败'); }
}

// ========== 解绑 ==========
function handleUnbindBank(r: BankRecord) {
  dialog.warning({
    title: '确认解绑', content: `确定要解绑用户 ${r.account}（${r.name}）的银行卡 ${r.accountNumber} 吗？`,
    positiveText: '确认解绑', negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteWallet(Number(r.id));
      if (!error) { window.$message?.success('操作成功'); loadData(); }
      else { window.$message?.error(error?.msg || '操作失败'); }
    }
  });
}

function handleUnbindWallet(r: WalletRecord) {
  dialog.warning({
    title: '确认解绑', content: `确定要解绑用户 ${r.account}（${r.name}）的 ${r.coinType} 钱包吗？`,
    positiveText: '确认解绑', negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteWallet(Number(r.id));
      if (!error) { window.$message?.success('操作成功'); loadData(); }
      else { window.$message?.error(error?.msg || '操作失败'); }
    }
  });
}
</script>

<template>
  <div class="p-16px">
    <!-- 标题 -->
    <h2 class="text-18px font-bold m-0 mb-20px">钱包管理系统</h2>

    <!-- 筛选条件 -->
    <NCard :bordered="false" class="card-wrapper mb-20px">
      <NCollapse>
        <NCollapseItem title="筛选条件" name="filter">
          <div class="section-title">账号信息</div>
          <NGrid :x-gap="16" :y-gap="12" :cols="2" class="mb-16px">
            <NGridItem>
              <div class="text-13px mb-6px">账号</div>
              <NInput v-model:value="searchForm.account" placeholder="">
                <template #suffix><SvgIcon icon="ph:user" class="op-40" /></template>
              </NInput>
            </NGridItem>
            <NGridItem>
              <div class="text-13px mb-6px">姓名</div>
              <NInput v-model:value="searchForm.name" placeholder="">
                <template #suffix><SvgIcon icon="ph:copy" class="op-40" /></template>
              </NInput>
            </NGridItem>
          </NGrid>
          <div class="flex items-center gap-12px mb-16px">
            <span class="text-14px font-bold">收款方</span>
            <div class="method-switch">
              <button class="method-btn" :class="{ active: paymentMethod === 'bank' }" @click="paymentMethod = 'bank'">银行卡</button>
              <button class="method-btn" :class="{ active: paymentMethod === 'wallet' }" @click="paymentMethod = 'wallet'">数字钱包</button>
            </div>
          </div>
          <NGrid v-if="paymentMethod === 'bank'" :x-gap="16" :y-gap="12" :cols="3" class="mb-16px">
            <NGridItem><div class="text-13px mb-6px">银行名称</div><NInput v-model:value="searchForm.bankName" placeholder="输入银行名称模糊搜索" clearable /></NGridItem>
            <NGridItem><div class="text-13px mb-6px">支行名称</div><NInput v-model:value="searchForm.branchName" placeholder="" /></NGridItem>
            <NGridItem><div class="text-13px mb-6px">银行账户</div><NInput v-model:value="searchForm.accountNumber" placeholder="" /></NGridItem>
          </NGrid>
          <NGrid v-if="paymentMethod === 'wallet'" :x-gap="16" :y-gap="12" :cols="2" class="mb-16px">
            <NGridItem><div class="text-13px mb-6px">币种</div><NSelect v-model:value="searchForm.coinType" :options="coinTypeOptions" placeholder="全部" /></NGridItem>
            <NGridItem><div class="text-13px mb-6px">钱包地址</div><NInput v-model:value="searchForm.walletAddress" placeholder="" /></NGridItem>
          </NGrid>
          <div class="flex justify-end gap-8px">
            <NButton @click="handleReset">重置</NButton>
            <NButton type="primary" @click="loadData"><SvgIcon icon="ph:magnifying-glass" class="mr-4px" />查询</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <!-- Tab 切换 -->
    <div class="flex gap-24px mb-16px tab-bar">
      <a class="tab-item" :class="{ active: activeTab === 'bank' }" @click="activeTab = 'bank'">银行卡列表</a>
      <a class="tab-item" :class="{ active: activeTab === 'wallet' }" @click="activeTab = 'wallet'">数字钱包列表</a>
    </div>

    <!-- 银行卡列表 -->
    <NCard v-if="activeTab === 'bank'" :bordered="false" class="card-wrapper">
      <NDataTable :columns="bankColumns" :data="bankRecords" :bordered="false" size="small" :scroll-x="970" :loading="loading" />
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ bankRecords.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 数字钱包列表 -->
    <NCard v-if="activeTab === 'wallet'" :bordered="false" class="card-wrapper">
      <NDataTable :columns="walletColumns" :data="walletRecords" :bordered="false" size="small" :scroll-x="910" :loading="loading" />
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ walletRecords.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 编辑银行卡弹窗 -->
    <NModal v-model:show="editBankVisible" preset="card" title="编辑绑定信息" style="width: 560px;" :bordered="false">
      <NGrid :x-gap="16" :y-gap="16" :cols="2">
        <NGridItem><div class="text-13px op-60 mb-6px">账号</div><NInput :value="editBankForm.account" disabled /></NGridItem>
        <NGridItem><div class="text-13px op-60 mb-6px">姓名</div><NInput :value="editBankForm.name" disabled /></NGridItem>
      </NGrid>
      <NGrid :x-gap="16" :y-gap="16" :cols="3" class="mt-16px">
        <NGridItem><div class="text-13px op-60 mb-6px">银行名称</div><NSelect v-model:value="editBankForm.bankName" :options="bankNameOptions.slice(1)" /></NGridItem>
        <NGridItem><div class="text-13px op-60 mb-6px">支行名称</div><NInput v-model:value="editBankForm.branchName" /></NGridItem>
        <NGridItem><div class="text-13px op-60 mb-6px">银行账户</div><NInput v-model:value="editBankForm.bankAccount" /></NGridItem>
      </NGrid>
      <template #footer><NSpace justify="end"><NButton @click="editBankVisible = false">取消</NButton><NButton type="primary" @click="handleSaveBank">保存更改</NButton></NSpace></template>
    </NModal>

    <!-- 编辑数字钱包弹窗 -->
    <NModal v-model:show="editWalletVisible" preset="card" title="编辑绑定信息" style="width: 560px;" :bordered="false">
      <NGrid :x-gap="16" :y-gap="16" :cols="2">
        <NGridItem><div class="text-13px op-60 mb-6px">账号</div><NInput :value="editWalletForm.account" disabled /></NGridItem>
        <NGridItem><div class="text-13px op-60 mb-6px">姓名</div><NInput :value="editWalletForm.name" disabled /></NGridItem>
      </NGrid>
      <NGrid :x-gap="16" :y-gap="16" :cols="2" class="mt-16px">
        <NGridItem><div class="text-13px op-60 mb-6px">币种</div><NSelect v-model:value="editWalletForm.coinType" :options="coinTypeOptions.slice(1)" /></NGridItem>
        <NGridItem><div class="text-13px op-60 mb-6px">钱包地址</div><NInput v-model:value="editWalletForm.walletAddress" /></NGridItem>
      </NGrid>
      <template #footer><NSpace justify="end"><NButton @click="editWalletVisible = false">取消</NButton><NButton type="primary" @click="handleSaveWallet">保存更改</NButton></NSpace></template>
    </NModal>
  </div>
</template>

<style scoped>
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f5; }
.method-switch { display: flex; border: 1px solid #e0e0e6; border-radius: 4px; overflow: hidden; }
.method-btn { padding: 6px 16px; font-size: 13px; border: none; background: #fff; cursor: pointer; color: #333; transition: all 0.2s; }
.method-btn.active { background: #2080f0; color: #fff; }
.method-btn:not(.active):hover { background: #f5f5f8; }
.tab-bar { border-bottom: 1px solid #efeff5; padding-bottom: 0; }
.tab-item { padding-bottom: 10px; font-size: 14px; color: rgba(0,0,0,0.6); cursor: pointer; text-decoration: none; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab-item.active { color: #2080f0; border-bottom-color: #2080f0; font-weight: 500; }
.tab-item:hover { color: #2080f0; }
</style>
