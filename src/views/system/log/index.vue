<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';
import { NCard, NButton, NInput, NSelect, NDatePicker, NPagination, NDataTable } from 'naive-ui';
import { fetchOperationLogs } from '@/service/api';
defineOptions({ name: 'SystemLogPage' });

// ========== 筛选 ==========
const startDate = ref<number | null>(null);
const endDate = ref<number | null>(null);
const operator = ref('');
const typeFilter = ref<string | null>(null);
const typeOptions = [
  { label: '登录系统', value: '登录系统' },
  { label: '新增代理', value: '新增代理' },
  { label: '编辑站点配置', value: '编辑站点配置' },
  { label: '删除用户', value: '删除用户' },
  { label: '系统设置', value: '系统设置' },
  { label: '数据导出', value: '数据导出' },
  { label: '权限修改', value: '权限修改' }
];

// ========== 分页与列表 ==========
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 8;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);
const data = ref<any[]>([]);

// ========== 表格列 ==========
const columns = [
  { title: '日志 ID', key: 'id', width: 90 },
  { title: '操作人', key: 'operator', width: 100 },
  { title: '操作类型', key: 'type', width: 120 },
  { title: '操作内容摘要', key: 'content', width: 200 },
  { title: 'IP 地址', key: 'ip', width: 140 },
  { title: '操作时间', key: 'createdAt', width: 180 }
];

// ========== 数据加载 ==========
async function loadData() {
  if (startDate.value && endDate.value && endDate.value < startDate.value) {
    window.$message?.warning('结束时间必须大于开始时间'); return;
  }
  loading.value = true;
  const { data: resData, error } = await fetchOperationLogs({
    operator: operator.value || undefined,
    type: typeFilter.value || undefined,
    start_date: startDate.value ? toLocalDateStr(startDate.value) : undefined,
    end_date: endDate.value ? toLocalDateStr(endDate.value) : undefined,
    page: currentPage.value,
    page_size: 8
  });
  if (!error && resData) {
    data.value = resData.list || [];
    totalRecords.value = resData.total || 0;
  }
  loading.value = false;
}
function handleSearch() { currentPage.value = 1; loadData(); }
function handleReset() { startDate.value = null; endDate.value = null; operator.value = ''; typeFilter.value = null; handleSearch(); }

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
watch(currentPage, loadData);

onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-20px">
        <h3 class="text-18px font-bold">日志管理</h3>
        <NButton quaternary>
          <SvgIcon icon="ph:magnifying-glass" class="mr-4px" />
          筛选
        </NButton>
      </div>

      <!-- 筛选条件 -->
      <div class="mb-20px">
        <div class="flex items-end gap-12px mb-12px flex-wrap">
          <div>
            <div class="text-12px op-50 mb-4px">开始时间</div>
            <NDatePicker v-model:value="startDate" type="date" clearable size="small" class="w-180px" />
          </div>
          <div>
            <div class="text-12px op-50 mb-4px">结束时间</div>
            <NDatePicker v-model:value="endDate" type="date" clearable size="small" class="w-180px" />
          </div>
          <div class="flex-1">
            <div class="text-12px op-50 mb-4px">操作人</div>
            <NInput v-model:value="operator" placeholder="请输入操作人" clearable size="small">
              <template #prefix><SvgIcon icon="ph:user" class="op-40 text-13px" /></template>
            </NInput>
          </div>
        </div>
        <div class="flex items-end gap-12px flex-wrap">
          <div>
            <div class="text-12px op-50 mb-4px">操作类型</div>
            <NSelect v-model:value="typeFilter" :options="typeOptions" clearable placeholder="请选择" size="small" class="w-280px" />
          </div>
          <NButton size="small" @click="handleReset">重置</NButton>
          <NButton type="primary" size="small" @click="handleSearch">查询</NButton>
        </div>
      </div>

      <!-- 表格 -->
      <NDataTable :columns="columns" :data="data" :loading="loading" :bordered="false" size="small" :scroll-x="830" />

      <!-- 分页 -->
      <div class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">显示 1 到 {{ data.length }} 条，共 {{ totalRecords }} 条记录</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" />
      </div>
    </NCard>
  </div>
</template>
