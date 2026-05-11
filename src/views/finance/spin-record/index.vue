<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NDatePicker, NPagination,
  NCollapse, NCollapseItem, NGrid, NGridItem, NModal, NSpace,
  NDataTable, NTag, NForm, NFormItem
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchSpinRecords, fetchSpinStats, updateSpinRecord } from '@/service/api';

defineOptions({ name: 'FinanceSpinRecordPage' });

// ========== 统计 ==========
const stats = ref({ totalCount: 0, todayCount: 0 });

// ========== 筛选 ==========
const searchForm = ref({
  playerName: '',
  prizeType: null as string | null,
  deliveryStatus: null as string | null,
  dateStart: null as number | null,
  dateEnd: null as number | null
});

const prizeTypeOptions = [
  { label: '全部', value: null },
  { label: '虚拟', value: 'virtual' },
  { label: '实物', value: 'physical' }
];

const deliveryStatusOptions = [
  { label: '全部', value: null },
  { label: '已领取', value: 'claimed' },
  { label: '待发货', value: 'pending' },
  { label: '已发货', value: 'shipped' }
];

function handleReset() {
  searchForm.value = { playerName: '', prizeType: null, deliveryStatus: null, dateStart: null, dateEnd: null };
  currentPage.value = 1;
  loadData();
}

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 分页 ==========
const currentPage = ref(1);
const pageSize = ref(50);
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value) || 1);

const pageSizeOptions = [
  { label: '50 条/页', value: 50 },
  { label: '100 条/页', value: 100 },
  { label: '200 条/页', value: 200 }
];

// ========== 数据 ==========
interface SpinRecord {
  id: number;
  orderNo: string;
  account: string;
  playerName: string;
  prizeName: string;
  prizeType: string;
  winTime: string;
  deliveryStatus: string;
  remark: string;
  trackingNo: string;
}
const records = ref<SpinRecord[]>([]);

// ========== 表格列 ==========
const columns = computed<DataTableColumns>(() => [
  { title: '序号', key: 'index', width: 60, align: 'center' },
  { title: '玩家账号', key: 'account', width: 120 },
  { title: '玩家姓名', key: 'playerName', width: 100 },
  { title: '奖品名称', key: 'prizeName', width: 140 },
  {
    title: '奖品类型', key: 'prizeType', width: 100,
    render: (row: any) => h('span', { style: 'display:flex;align-items:center;gap:4px' }, [
      h('span', {
        style: `width:8px;height:8px;border-radius:50%;background:${row.prizeType === 'virtual' ? '#2080f0' : '#18a058'}`
      }),
      row.prizeType === 'virtual' ? '虚拟' : '实物'
    ])
  },
  { title: '中奖时间', key: 'winTime', width: 150 },
  {
    title: '发放状态', key: 'deliveryStatus', width: 100, align: 'center',
    render: (row: any) => {
      const map: Record<string, { text: string; type: 'success' | 'warning' | 'info' }> = {
        claimed: { text: '已领取', type: 'success' },
        pending: { text: '待发货', type: 'warning' },
        shipped: { text: '已发货', type: 'info' }
      };
      const item = map[row.deliveryStatus] || { text: row.deliveryStatus, type: 'info' as const };
      return h(NTag, { type: item.type, size: 'small', bordered: false }, () => item.text);
    }
  },
  { title: '备注', key: 'remark', width: 140, render: (row: any) => row.remark || '' },
  {
    title: '操作', key: 'action', width: 90, align: 'center',
    render: (row: any) => h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row) }, () => '编辑订单')
  }
]);

// ========== 数据加载 ==========
async function loadData() {
  loading.value = true;
  const { data, error } = await fetchSpinRecords({
    playerName: searchForm.value.playerName,
    prizeType: searchForm.value.prizeType,
    deliveryStatus: searchForm.value.deliveryStatus,
    dateStart: searchForm.value.dateStart ? toLocalDateStr(searchForm.value.dateStart) : null,
    dateEnd: searchForm.value.dateEnd ? toLocalDateStr(searchForm.value.dateEnd) : null,
    page: currentPage.value,
    pageSize: pageSize.value
  });
  loading.value = false;
  if (!error) {
    const list = data?.list || [];
    records.value = list.map((item: any, idx: number) => ({
      ...item,
      index: (currentPage.value - 1) * pageSize.value + idx + 1
    }));
    totalRecords.value = data?.total || 0;
  }
}

async function loadStats() {
  const { data, error } = await fetchSpinStats();
  if (!error && data) {
    stats.value = { totalCount: data.totalCount || 0, todayCount: data.todayCount || 0 };
  }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); loadStats(); });

// ========== 编辑弹窗 ==========
const editVisible = ref(false);
const editForm = ref({
  id: 0,
  orderNo: '',
  playerName: '',
  prizeName: '',
  prizeType: null as string | null,
  deliveryStatus: null as string | null,
  trackingNo: '',
  remark: ''
});

const editPrizeTypeOptions = [
  { label: '虚拟', value: 'virtual' },
  { label: '实物', value: 'physical' }
];

const editDeliveryStatusOptions = [
  { label: '已领取', value: 'claimed' },
  { label: '待发货', value: 'pending' },
  { label: '已发货', value: 'shipped' }
];

function openEdit(row: SpinRecord) {
  editForm.value = {
    id: row.id,
    orderNo: row.orderNo,
    playerName: row.playerName,
    prizeName: row.prizeName,
    prizeType: row.prizeType,
    deliveryStatus: row.deliveryStatus,
    trackingNo: row.trackingNo || '',
    remark: row.remark || ''
  };
  editVisible.value = true;
}

async function handleSave() {
  const { error } = await updateSpinRecord(editForm.value.id, {
    prizeType: editForm.value.prizeType,
    deliveryStatus: editForm.value.deliveryStatus,
    trackingNo: editForm.value.trackingNo,
    remark: editForm.value.remark
  });
  if (!error) {
    window.$message?.success('保存成功');
    editVisible.value = false;
    loadData();
  } else {
    window.$message?.error('操作失败');
  }
}
</script>

<template>
  <div class="p-16px">
    <!-- 标题 -->
    <div class="mb-20px">
      <h2 class="text-18px font-bold m-0">转盘中奖记录</h2>
      <p class="text-13px op-50 mt-4px mb-0">
        总中奖次数：{{ stats.totalCount.toLocaleString() }} 次 · 今日中奖：{{ stats.todayCount }} 次
      </p>
    </div>

    <!-- 筛选条件 -->
    <NCard :bordered="false" class="card-wrapper mb-20px">
      <NCollapse default-expanded-names="filter">
        <NCollapseItem title="数据筛选" name="filter">
          <template #header-extra>
            <span class="text-13px op-50">收起筛选</span>
          </template>
          <NGrid :x-gap="16" :y-gap="12" :cols="2" class="mb-16px">
            <NGridItem>
              <div class="flex items-center gap-8px">
                <span class="text-13px w-70px flex-shrink-0">玩家姓名</span>
                <NInput v-model:value="searchForm.playerName" placeholder="输入玩家姓名" />
              </div>
            </NGridItem>
            <NGridItem>
              <div class="flex items-center gap-8px">
                <span class="text-13px w-70px flex-shrink-0">中奖时间</span>
                <NDatePicker v-model:value="searchForm.dateStart" type="date" placeholder="-/--/--" style="flex:1" />
                <span class="op-40">—</span>
                <NDatePicker v-model:value="searchForm.dateEnd" type="date" placeholder="-/--/--" style="flex:1" />
              </div>
            </NGridItem>
          </NGrid>
          <NGrid :x-gap="16" :y-gap="12" :cols="2" class="mb-16px">
            <NGridItem>
              <div class="flex items-center gap-8px">
                <span class="text-13px w-70px flex-shrink-0">奖品类型</span>
                <NSelect v-model:value="searchForm.prizeType" :options="prizeTypeOptions" placeholder="全部" />
              </div>
            </NGridItem>
            <NGridItem>
              <div class="flex items-center gap-8px">
                <span class="text-13px w-70px flex-shrink-0">发放状态</span>
                <NSelect v-model:value="searchForm.deliveryStatus" :options="deliveryStatusOptions" placeholder="全部" />
              </div>
            </NGridItem>
          </NGrid>
          <div class="flex justify-end gap-8px">
            <NButton @click="handleReset">重置</NButton>
            <NButton type="primary" @click="() => { currentPage = 1; loadData(); }">查询</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <!-- 数据表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        :columns="columns"
        :data="records"
        :bordered="false"
        size="small"
        :scroll-x="1010"
        :loading="loading"
      />
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <div class="flex items-center gap-12px">
          <span class="text-13px op-50">共 {{ totalRecords.toLocaleString() }} 条</span>
          <NSelect v-model:value="pageSize" :options="pageSizeOptions" size="small" style="width: 110px" @update:value="() => { currentPage = 1; loadData(); }" />
        </div>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 编辑订单弹窗 -->
    <NModal v-model:show="editVisible" preset="card" title="编辑订单信息" style="width: 560px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NGrid :x-gap="16" :y-gap="12" :cols="2">
          <NGridItem>
            <NFormItem label="订单 ID">
              <NInput :value="'#' + editForm.orderNo" disabled />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="玩家姓名">
              <NInput :value="editForm.playerName" disabled />
            </NFormItem>
          </NGridItem>
        </NGrid>
        <NFormItem label="奖品名称">
          <NInput :value="editForm.prizeName" disabled />
        </NFormItem>
        <NGrid :x-gap="16" :y-gap="12" :cols="2">
          <NGridItem>
            <NFormItem label="奖品类型">
              <NSelect v-model:value="editForm.prizeType" :options="editPrizeTypeOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="发放状态">
              <NSelect v-model:value="editForm.deliveryStatus" :options="editDeliveryStatusOptions" />
            </NFormItem>
          </NGridItem>
        </NGrid>
        <NFormItem label="发货单号">
          <NInput v-model:value="editForm.trackingNo" placeholder="请输入快递单号" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="editForm.remark" type="textarea" :rows="3" placeholder="添加备注信息" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="editVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSave">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
