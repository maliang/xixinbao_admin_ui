<script setup lang="ts">
import { ref, h, onMounted, watch, computed } from 'vue';
import {
  NCard, NButton, NInput, NDatePicker,
  NPagination, NCollapse, NCollapseItem, NDataTable
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchLoginLogs } from '@/service/api';

defineOptions({ name: 'UserLoginLogPage' });

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 筛选 ==========
const searchForm = ref({
  account: '',
  ip: '',
  dateStart: null as number | null,
  dateEnd: null as number | null
});

function handleReset() {
  searchForm.value = { account: '', ip: '', dateStart: null, dateEnd: null };
  currentPage.value = 1;
  loadData();
}

// ========== 分页 ==========
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize));

// ========== 登录记录数据 ==========
const records = ref<any[]>([]);

// ========== 表格列定义 ==========
const columns: DataTableColumns = [
  { title: '序号', key: 'index', width: 60, align: 'center', render: (_row, index) => index + 1 },
  { title: '会员账号', key: 'account', width: 140, render: (row) => h('a', { style: 'color:#2080f0;cursor:pointer;text-decoration:none;' }, { default: () => row.account }) },
  { title: '姓名', key: 'name', width: 130, render: (row) => row.name || '-' },
  { title: '登录时间', key: 'createdAt', width: 170 },
  { title: '访问域名', key: 'domain', width: 150, render: (row) => row.domain || '-' },
  { title: 'IP 地址', key: 'ip', width: 140 },
  { title: '设备', key: 'device', width: 160, render: (row) => row.device || '-' },
  { title: '国家/地区', key: 'region', width: 140, render: (row) => row.region || '-' }
];

async function loadData() {
  if (searchForm.value.dateStart && searchForm.value.dateEnd && searchForm.value.dateEnd < searchForm.value.dateStart) {
    window.$message?.warning('结束时间必须大于开始时间'); return;
  }
  loading.value = true;
  const { data, error } = await fetchLoginLogs({
    account: searchForm.value.account || undefined,
    ip: searchForm.value.ip || undefined,
    dateStart: searchForm.value.dateStart,
    dateEnd: searchForm.value.dateEnd,
    page: currentPage.value,
    pageSize: pageSize
  });
  loading.value = false;
  if (!error) {
    records.value = data.list || [];
    totalRecords.value = data.total || 0;
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <!-- 顶部标题栏 -->
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-18px font-bold m-0">会员登录记录</h2>
      <span class="text-13px op-50">共 {{ totalRecords.toLocaleString() }} 条</span>
    </div>

    <!-- 筛选条件 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse>
        <NCollapseItem title="筛选条件" name="filter">
          <div class="flex items-end gap-16px flex-wrap">
            <!-- 会员账号 -->
            <div>
              <div class="text-13px mb-6px">会员账号</div>
              <NInput
                v-model:value="searchForm.account"
                placeholder="请输入会员账号"
                clearable
                class="w-220px"
              >
                <template #suffix>
                  <SvgIcon icon="ph:magnifying-glass" class="op-40" />
                </template>
              </NInput>
            </div>
            <!-- IP 地址 -->
            <div>
              <div class="text-13px mb-6px">IP 地址</div>
              <NInput
                v-model:value="searchForm.ip"
                placeholder="请输入 IP 地址"
                clearable
                class="w-220px"
              />
            </div>
            <!-- 登录时间 -->
            <div>
              <div class="text-13px mb-6px">登录时间</div>
              <div class="flex items-center gap-8px">
                <NDatePicker
                  v-model:value="searchForm.dateStart"
                  type="date"
                  placeholder="-/-/-"
                  class="w-160px"
                />
                <span class="text-13px op-60">至</span>
                <NDatePicker
                  v-model:value="searchForm.dateEnd"
                  type="date"
                  placeholder="-/-/-"
                  class="w-160px"
                />
              </div>
            </div>
            <!-- 按钮 -->
            <div class="flex gap-8px">
              <NButton type="primary" @click="loadData">查询</NButton>
              <NButton @click="handleReset">重置</NButton>
            </div>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <!-- 表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        :columns="columns"
        :data="records"
        :bordered="false"
        size="small"
        :scroll-x="1090"
        :loading="loading"
      />
    </NCard>

    <!-- 分页 -->
    <div class="flex items-center justify-between mt-16px">
      <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords.toLocaleString() }} 条</span>
      <NPagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :page-slot="5"
      />
    </div>
  </div>
</template>
