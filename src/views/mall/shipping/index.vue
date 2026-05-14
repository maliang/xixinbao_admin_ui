<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NDataTable, NButton, NSpace, NTag, NInput, NSelect, NInputNumber,
  NPagination, NModal, NForm, NFormItem, NDatePicker, NTabs, NTabPane, useDialog
} from 'naive-ui';
import { fetchShippingOrders, fetchShippingDetail, updateShippingLogistics } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { useLanguageEditor } from '@/hooks/business/useLanguageEditor';

defineOptions({ name: 'MallShippingPage' });
const dialog = useDialog();
const authStore = useAuthStore();

// 多语言编辑器（可翻译字段：description）
const {
  currentLang, locales, formFields: langFields, switchLang, initEditor, buildPayload, loadLocales
} = useLanguageEditor({ fields: ['description'] });

// ========== 筛选 ==========
const keyword = ref('');
const statusFilter = ref<string | null>(null);
const statusOptions = [
  { label: '全部状态', value: null },
  { label: '待发货', value: 'pending' },
  { label: '已发货', value: 'shipped' },
  { label: '运输中', value: 'transit' },
  { label: '已完成', value: 'completed' }
];

// ========== 加载状态 ==========
const loading = ref(false);
const currentPage = ref(1);
const totalRecords = ref(0);

// ========== 表格 ===========
const columns = [
  { title: '订单编号', key: 'orderNo', width: 160 },
  { title: '商品名称', key: 'goodsName', width: 200, ellipsis: { tooltip: true } },
  { title: '消耗积分', key: 'points', width: 70, align: 'right' as const },
  { title: '数量', key: 'quantity', width: 50, align: 'center' as const },
  { title: '总价', key: 'totalPrice', width: 90, align: 'right' as const, render: (row: any) => '¥' + parseFloat(row.totalPrice || 0).toFixed(2) },
  { title: '收货人', key: 'realName', width: 80 },
  { title: '收货地址', key: 'address', width: 220, ellipsis: { tooltip: true } },
  { title: '联系方式', key: 'phone', width: 120 },
  { title: '创建时间', key: 'createdAt', width: 140 },
  {
    title: '状态', key: 'status', width: 80, align: 'center' as const,
    render: (row: any) => {
      const m: Record<string, { label: string; type: string }> = {
        pending: { label: '待发货', type: 'warning' },
        shipped: { label: '已发货', type: 'success' },
        transit: { label: '运输中', type: 'info' },
        completed: { label: '已完成', type: 'default' }
      };
      const s = m[row.status] || { label: row.status, type: 'default' };
      return h(NTag, { type: s.type as any, size: 'small', bordered: false }, () => s.label);
    }
  },
  {
    title: '操作', key: 'action', width: 80, align: 'center' as const, fixed: 'right' as const,
    render: (row: any) => {
      if (!authStore.hasPermission('mall.shipping.edit')) return null;
      if (row.status === 'pending') {
        return h(NButton, { size: 'small', type: 'primary', onClick: () => openLogistics(row) }, () => '发货');
      }
      return h(NButton, { size: 'small', quaternary: true, onClick: () => openLogistics(row) }, () => '物流');
    }
  }
];

const data = ref<any[]>([]);

// ========== 物流信息弹窗 ==========
const logisticsVisible = ref(false);
const logisticsForm = ref({
  orderStatus: '待发货',
  carrier: '',
  trackingNo: '',
  newProgressTime: null as number | null,
  progressList: [] as { time: string; desc: string; translations?: Record<string, Record<string, string>> }[]
});

const orderStatusOptions = [
  { label: '待发货', value: 'pending' },
  { label: '已发货', value: 'shipped' },
  { label: '运输中', value: 'transit' },
  { label: '已完成', value: 'completed' }
];

// 当前正在编辑的进度项索引（-1 表示新增模式）
const editingProgressIndex = ref(-1);

async function openLogistics(row: any) {
  editingOrderId.value = row.id;

  // 从详情接口获取完整 translations 数据
  const { data: detailData, error } = await fetchShippingDetail(row.id);

  let progressData: any[] = [];
  if (!error && detailData) {
    progressData = detailData.shipping_progress || detailData.shippingProgress || [];
  } else {
    progressData = row.shippingProgress || row.shipping_progress || [];
  }

  var progressList = progressData.map(function (p: any) {
    return {
      time: p.createdAt || p.created_at || '',
      desc: p.description || '',
      locales: p.locales || ['zh-CN'],
      translations: p.translations || {}
    };
  });

  logisticsForm.value = {
    orderStatus: row.status,
    carrier: row.carrier || '',
    trackingNo: row.trackingNo || row.tracking_no || '',
    newProgressTime: null,
    progressList: progressList
  };

  // 初始化语言编辑器为新增模式（空内容）
  editingProgressIndex.value = -1;
  initEditor({ description: '' }, {});
  logisticsVisible.value = true;
}

function addProgress() {
  if (!langFields.value.description.trim() && currentLang.value === 'zh-CN') return;

  // 构建多语言 payload
  const { zhFields, translationsJson } = buildPayload();
  const translations = JSON.parse(translationsJson);

  const now = new Date();
  const timeStr = logisticsForm.value.newProgressTime
    ? new Date(logisticsForm.value.newProgressTime).toLocaleString()
    : now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

  logisticsForm.value.progressList.unshift({
    time: timeStr,
    desc: zhFields.description,
    translations: Object.keys(translations).length > 0 ? translations : undefined
  });

  // 重置语言编辑器
  initEditor({ description: '' }, {});
  logisticsForm.value.newProgressTime = null;
}

function editProgress(index: number) {
  editingProgressIndex.value = index;
  const item = logisticsForm.value.progressList[index];
  initEditor({ description: item.desc || '' }, item.translations || {});
}

function saveEditProgress() {
  if (editingProgressIndex.value < 0) return;

  const { zhFields, translationsJson } = buildPayload();
  const translations = JSON.parse(translationsJson);
  const item = logisticsForm.value.progressList[editingProgressIndex.value];

  item.desc = zhFields.description;
  item.translations = Object.keys(translations).length > 0 ? translations : undefined;

  // 退出编辑模式
  editingProgressIndex.value = -1;
  initEditor({ description: '' }, {});
}

function cancelEditProgress() {
  editingProgressIndex.value = -1;
  initEditor({ description: '' }, {});
}

function removeProgress(index: number) {
  logisticsForm.value.progressList.splice(index, 1);
  if (editingProgressIndex.value === index) {
    editingProgressIndex.value = -1;
    initEditor({ description: '' }, {});
  } else if (editingProgressIndex.value > index) {
    editingProgressIndex.value--;
  }
}

function useCurrentTime() {
  logisticsForm.value.newProgressTime = Date.now();
}

// 分页
const pageSize = ref(10);

// ========== 保存物流 ==========
const editingOrderId = ref<number | null>(null);

async function handleSaveLogistics() {
  if (!editingOrderId.value) return;

  // 构建进度列表（含 translations）
  const progressPayload = logisticsForm.value.progressList.map(item => ({
    time: item.time,
    desc: item.desc,
    translations: item.translations ? JSON.stringify(item.translations) : undefined
  }));

  const { error } = await updateShippingLogistics(editingOrderId.value, {
    status: logisticsForm.value.orderStatus,
    carrier: logisticsForm.value.carrier,
    tracking_no: logisticsForm.value.trackingNo,
    progress_list: progressPayload
  });
  if (!error) {
    window.$message?.success('保存成功');
    logisticsVisible.value = false;
    loadData();
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

// ========== 数据加载 ==========
async function loadData() {
  loading.value = true;
  const { data: resData, error } = await fetchShippingOrders({
    keyword: keyword.value,
    status: statusFilter.value,
    page: currentPage.value,
    page_size: pageSize.value
  });
  loading.value = false;
  if (!error) {
    data.value = resData.list || [];
    totalRecords.value = resData.total || 0;
  } else {
    window.$message?.error(error?.msg || '加载失败');
  }
}

function handleReset() {
  keyword.value = '';
  statusFilter.value = null;
  currentPage.value = 1;
  loadData();
}

watch(currentPage, loadData);
onMounted(() => { loadLocales(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <!-- 搜索栏 -->
    <NCard :bordered="false" class="card-wrapper mb-16px" content-style="padding: 12px 16px;">
      <div class="flex items-center gap-12px">
        <NInput v-model:value="keyword" placeholder="输入订单编号" clearable size="small" class="w-220px">
          <template #prefix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template>
        </NInput>
        <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" class="w-130px" />
        <NButton size="small" type="primary" @click="loadData">搜索</NButton>
        <NButton size="small" @click="handleReset">重置</NButton>
      </div>
    </NCard>

    <!-- 表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="data" :bordered="false" size="small" :scroll-x="1350" />
      <div class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">显示 1 到 {{ data.length }} 条，共 {{ totalRecords }} 条</span>
        <div class="flex items-center gap-12px">
          <NPagination v-model:page="currentPage" :page-count="Math.ceil(totalRecords / pageSize) || 1" />
          <div class="flex items-center gap-4px text-13px op-60">
            每页
            <NSelect v-model:value="pageSize" :options="[{label:'10',value:10},{label:'20',value:20},{label:'50',value:50}]" size="tiny" class="w-60px" />
            条
          </div>
        </div>
      </div>
    </NCard>

    <!-- 物流信息弹窗 -->
    <NModal v-model:show="logisticsVisible" preset="card" title="物流信息" style="width: 620px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NFormItem label="订单状态">
          <NSelect v-model:value="logisticsForm.orderStatus" :options="orderStatusOptions" />
        </NFormItem>
        <NFormItem label="物流公司">
          <NInput v-model:value="logisticsForm.carrier" placeholder="输入物流公司名称" />
        </NFormItem>
        <NFormItem label="快递单号">
          <NInput v-model:value="logisticsForm.trackingNo" placeholder="输入快递单号" />
        </NFormItem>
        <NFormItem label="物流进度">
          <div class="w-full">
            <!-- Language Tab -->
            <NTabs v-if="locales.length > 1" :value="currentLang" type="segment" size="small" class="mb-8px" @update:value="switchLang">
              <NTabPane v-for="locale in locales" :key="locale.code" :name="locale.code" :tab="locale.label" />
            </NTabs>

            <!-- 新增/编辑进度输入区 -->
            <NInput v-model:value="langFields.description" type="textarea" :rows="2" :placeholder="editingProgressIndex >= 0 ? '编辑物流进度信息' : '输入新的物流进度信息'" class="mb-8px" />

            <div v-if="editingProgressIndex < 0" class="flex items-center gap-8px mb-12px">
              <NDatePicker v-model:value="logisticsForm.newProgressTime" type="datetime" size="small" class="flex-1" />
              <span class="text-12px op-50">或</span>
              <NButton size="small" quaternary @click="useCurrentTime">使用当前时间</NButton>
              <NButton size="small" type="primary" @click="addProgress">添加</NButton>
            </div>
            <div v-else class="flex items-center gap-8px mb-12px">
              <NButton size="small" type="primary" @click="saveEditProgress">保存修改</NButton>
              <NButton size="small" @click="cancelEditProgress">取消</NButton>
            </div>

            <!-- 进度列表 -->
            <div v-for="(item, index) in logisticsForm.progressList" :key="index"
              class="flex items-start gap-8px p-10px mb-6px rounded-6px"
              :style="{ background: editingProgressIndex === index ? '#e8f4ff' : '#f9f9f9' }">
              <div class="flex-1">
                <div class="text-11px op-50">{{ item.time }}</div>
                <div class="text-13px mt-2px">{{ item.desc }}</div>
                <div v-if="item.locales && item.locales.length > 1" class="flex items-center gap-4px mt-4px">
                  <NTag v-for="code in item.locales" :key="code" size="tiny" :bordered="false">{{ code }}</NTag>
                </div>
              </div>
              <NButton size="tiny" quaternary @click="editProgress(index)">
                <SvgIcon icon="ph:pencil" class="text-14px" />
              </NButton>
              <NButton size="tiny" type="error" quaternary @click="removeProgress(index)">
                <SvgIcon icon="ph:trash" class="text-14px" />
              </NButton>
            </div>
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="logisticsVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSaveLogistics">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
