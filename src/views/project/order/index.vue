<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NDataTable, NButton, NSpace, NTag, NInput, NSelect, NDatePicker, NInputNumber,
  NPagination, NCollapse, NCollapseItem, NGrid, NGridItem, NModal, NForm, NFormItem,
  NRadioGroup, NRadio, useDialog
} from 'naive-ui';
import type { DataTableRowKey } from 'naive-ui';
import { fetchProjectOrders, updateProjectOrder, deleteProjectOrder, batchRebateOrders, rebateOrder } from '@/service/api';

defineOptions({ name: 'ProjectOrderPage' });

const dialog = useDialog();

// ========== 筛选 ==========
const searchForm = ref({
  projectName: '',
  account: '',
  realName: '',
  status: '' as string,
  startDate: null as number | null,
  endDate: null as number | null,
  minAmount: null as number | null,
  maxAmount: null as number | null
});
const statusOptions = [
  { label: '全部', value: '' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '已退销', value: 'cancelled' }
];

function resetSearch() {
  searchForm.value = { projectName: '', account: '', realName: '', status: '', startDate: null, endDate: null, minAmount: null, maxAmount: null };
  currentPage.value = 1;
  loadData();
}

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 表格 ==========
const checkedKeys = ref<DataTableRowKey[]>([]);
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);

const columns = [
  { type: 'selection' as const, width: 40 },
  { title: 'ID', key: 'id', width: 70 },
  { title: '会员账号', key: 'user', width: 90, render: (row: any) => row.user?.account || '-' },
  { title: '姓名', key: 'userName', width: 70, render: (row: any) => row.user?.name || '-' },
  { title: '项目名称', key: 'projectName', width: 140, render: (row: any) => row.project?.name || '-' },
  { title: '状态', key: 'status', width: 70, render: (row: any) => {
    const map: Record<string, { label: string; type: string }> = { active: { label: '进行中', type: 'success' }, completed: { label: '已完成', type: 'default' }, cancelled: { label: '已退销', type: 'error' } };
    const item = map[row.status] || { label: row.status, type: 'default' };
    return h(NTag, { type: item.type as any, size: 'small', bordered: false }, () => item.label);
  }},
  { title: '投资金额', key: 'amount', width: 90, align: 'right' as const },
  { title: '加入时间/下次返款', key: 'dateInfo', width: 140, render: (row: any) => h('div', { class: 'text-12px' }, [h('div', {}, row.startDate || '-'), h('div', { class: 'op-60' }, row.nextReturnDate || '-')]) },
  { title: '领取次数', key: 'completedTimes', width: 70, align: 'center' as const, render: (row: any) => (row.completedTimes || 0) + '/' + (row.totalTimes || 0) },
  { title: '返款金额', key: 'returnAmount', width: 90, align: 'right' as const },
  { title: '复利金额', key: 'rebateAmount', width: 90, align: 'right' as const },
  { title: '会员奖励', key: 'rewardAmount', width: 90, align: 'right' as const },
  { title: '投资前/后余额', key: 'balanceInfo', width: 100, render: (row: any) => h('div', { class: 'text-12px' }, [h('div', {}, row.balanceBefore ?? '-'), h('div', { class: 'op-60' }, row.balanceAfter ?? '-')]) },
  {
    title: '操作', key: 'action', width: 120, fixed: 'right' as const,
    render: (row: any) => h(NSpace, { size: 2 }, () => [
      h(NButton, { size: 'tiny', type: 'primary', quaternary: true, onClick: () => openEdit(row) }, () => '编辑'),
      h(NButton, { size: 'tiny', type: 'error', quaternary: true, onClick: () => handleDeleteOrder(row) }, () => '删除'),
      h(NButton, { size: 'tiny', type: 'warning', quaternary: true, onClick: () => handleRebateOrder(row) }, () => '返佣')
    ])
  }
];

const data = ref<any[]>([]);

// ========== 编辑订单弹窗 ==========
const editVisible = ref(false);
const editForm = ref({
  id: 0, account: '', name: '', projectName: '', amount: '', status: '',
  joinDate: '', nextReturn: '', times: '', returnAmount: '', rebateAmount: '',
  rewardAmount: '', beforeBalance: '', afterBalance: ''
});

function openEdit(row: any) {
  editForm.value = {
    id: row.id,
    account: row.user?.account || '',
    name: row.user?.name || '',
    projectName: row.project?.name || row.projectName || '',
    amount: String(row.amount || ''),
    status: row.status || '',
    joinDate: row.startDate || row.createdAt || '',
    nextReturn: row.nextReturnDate || '',
    times: String(row.completedTimes || 0) + '/' + String(row.totalTimes || 0),
    returnAmount: String(row.amount || ''),
    rebateAmount: '',
    rewardAmount: '',
    beforeBalance: String(row.balanceBefore || ''),
    afterBalance: String(row.balanceAfter || '')
  };
  editVisible.value = true;
}

async function handleSaveEdit() {
  const payload: Record<string, any> = {
    amount: editForm.value.amount,
    status: editForm.value.status,
    nextReturnDate: editForm.value.nextReturn,
  };
  const { error } = await updateProjectOrder(editForm.value.id, payload);
  if (!error) {
    window.$message?.success('保存成功');
    editVisible.value = false;
    loadData();
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

async function handleDeleteOrder(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除订单 #${row.id} 吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteProjectOrder(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        loadData();
      } else {
        window.$message?.error(error?.msg || '操作失败');
      }
    }
  });
}

async function handleRebateOrder(row: any) {
  const { error } = await rebateOrder(row.id);
  if (!error) {
    window.$message?.success('返佣成功');
    loadData();
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

// ========== 一键返佣弹窗 ==========
const rebateVisible = ref(false);
const rebateScope = ref('all');

function openRebate() {
  rebateVisible.value = true;
}

function confirmRebate() {
  rebateVisible.value = false;
  if (rebateScope.value === 'selected' && checkedKeys.value.length === 0) {
    dialog.warning({ title: '提示', content: '请先选择订单' });
    return;
  }
  dialog.info({
    title: '确认返佣',
    content: rebateScope.value === 'all' ? '确定要为全部订单执行返佣操作吗？' : '确定要为选中的订单执行返佣操作吗？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      const ids = rebateScope.value === 'selected' ? checkedKeys.value as number[] : [];
      const { error } = await batchRebateOrders(ids);
      if (!error) {
        window.$message?.success('返佣成功');
        loadData();
      } else {
        window.$message?.error(error?.msg || '操作失败');
      }
    }
  });
}

// ========== 数据加载 ==========
async function loadData() {
  if (searchForm.value.startDate && searchForm.value.endDate && searchForm.value.endDate < searchForm.value.startDate) {
    window.$message?.warning('结束时间必须大于开始时间'); return;
  }
  loading.value = true;
  const params: Record<string, any> = { page: currentPage.value, page_size: pageSize };
  if (searchForm.value.projectName) params.projectName = searchForm.value.projectName;
  if (searchForm.value.account) params.account = searchForm.value.account;
  if (searchForm.value.realName) params.name = searchForm.value.realName;
  if (searchForm.value.status) params.status = searchForm.value.status;
  if (searchForm.value.startDate) {
    const d = new Date(searchForm.value.startDate);
    params.dateStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (searchForm.value.endDate) {
    const d = new Date(searchForm.value.endDate);
    params.dateEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (searchForm.value.minAmount) params.amountMin = searchForm.value.minAmount;
  if (searchForm.value.maxAmount) params.amountMax = searchForm.value.maxAmount;

  const { data: resData, error } = await fetchProjectOrders(params);
  loading.value = false;
  if (!error) {
    data.value = resData.list || [];
    totalRecords.value = resData.total || 0;
  } else {
    window.$message?.error(error?.msg || '加载失败');
  }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-20px font-bold">项目订单管理</h2>
      <NSpace>
        <NButton @click="loadData">
          <SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />
          刷新
        </NButton>
        <NButton type="primary" @click="openRebate">
          <SvgIcon icon="ph:download-simple" class="mr-4px" />
          一键返佣
        </NButton>
      </NSpace>
    </div>

    <!-- 高级搜索 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse>
        <NCollapseItem title="高级搜索" name="search">
          <NGrid :x-gap="16" :y-gap="8" :cols="3">
            <NGridItem>
              <NFormItem label="项目名称" label-placement="top" :show-feedback="false">
                <NInput v-model:value="searchForm.projectName" placeholder="输入项目名称" size="small" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="账号" label-placement="top" :show-feedback="false">
                <NInput v-model:value="searchForm.account" placeholder="输入账号" size="small" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="姓名" label-placement="top" :show-feedback="false">
                <NInput v-model:value="searchForm.realName" placeholder="输入姓名" size="small" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="投资状态" label-placement="top" :show-feedback="false">
                <NSelect v-model:value="searchForm.status" :options="statusOptions" size="small" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="开始时间" label-placement="top" :show-feedback="false">
                <NDatePicker v-model:value="searchForm.startDate" type="date" size="small" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="截止时间" label-placement="top" :show-feedback="false">
                <NDatePicker v-model:value="searchForm.endDate" type="date" size="small" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="投资金额(最小)" label-placement="top" :show-feedback="false">
                <NInputNumber v-model:value="searchForm.minAmount" placeholder="最小金额" size="small" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="投资金额(最大)" label-placement="top" :show-feedback="false">
                <NInputNumber v-model:value="searchForm.maxAmount" placeholder="最大金额" size="small" class="w-full" />
              </NFormItem>
            </NGridItem>
          </NGrid>
          <div class="flex justify-end gap-8px mt-12px">
            <NButton size="small" @click="resetSearch">重置</NButton>
            <NButton size="small" type="primary" @click="loadData">搜索</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <!-- 数据表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        :columns="columns"
        :data="data"
        :bordered="false"
        size="small"
        :scroll-x="1400"
        :loading="loading"
        :row-key="(row: any) => row.id"
        v-model:checked-row-keys="checkedKeys"
      />
      <div class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">显示 1 到 {{ data.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="Math.ceil(totalRecords / pageSize) || 1" />
      </div>
    </NCard>

    <!-- 编辑订单弹窗 -->
    <NModal v-model:show="editVisible" preset="card" title="编辑订单" style="width: 600px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NGrid :x-gap="16" :cols="2">
          <NGridItem>
            <NFormItem label="订单ID">
              <NInput :value="String(editForm.id)" disabled />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="会员账号">
              <NInput v-model:value="editForm.account" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="姓名">
              <NInput v-model:value="editForm.name" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="项目名称">
              <NInput v-model:value="editForm.projectName" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="投资金额">
              <NInput v-model:value="editForm.amount" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="投资状态">
              <NSelect v-model:value="editForm.status" :options="[{ label: '进行中', value: 'active' }, { label: '已完成', value: 'completed' }, { label: '已取消', value: 'cancelled' }]" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="加入时间">
              <NInput v-model:value="editForm.joinDate" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="下次返款">
              <NInput v-model:value="editForm.nextReturn" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="领取次数">
              <NInput v-model:value="editForm.times" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="返款金额">
              <NInput v-model:value="editForm.returnAmount" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="复利金额">
              <NInput v-model:value="editForm.rebateAmount" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="会员奖励">
              <NInput v-model:value="editForm.rewardAmount" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="投资前余额">
              <NInput v-model:value="editForm.beforeBalance" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="投资后余额">
              <NInput v-model:value="editForm.afterBalance" />
            </NFormItem>
          </NGridItem>
        </NGrid>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="editVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSaveEdit">保存修改</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 一键返佣弹窗 -->
    <NModal v-model:show="rebateVisible" preset="card" title="一键返佣" style="width: 400px;" :bordered="false">
      <div class="mb-12px text-14px op-70">请选择返佣范围：</div>
      <NRadioGroup v-model:value="rebateScope" class="flex flex-col gap-12px">
        <NRadio value="all">全部订单</NRadio>
        <NRadio value="selected">已选订单</NRadio>
      </NRadioGroup>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="rebateVisible = false">取消</NButton>
          <NButton type="primary" @click="confirmRebate">确认返佣</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
