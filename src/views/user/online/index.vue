<script setup lang="ts">
import { ref, h, onMounted, watch, computed } from 'vue';
import { NCard, NButton, NInput, NPagination, NDataTable, NTag } from 'naive-ui';
import { fetchOnlineUsers, kickOnlineUser } from '@/service/api';

defineOptions({ name: 'UserOnlinePage' });

const loading = ref(false);
const keyword = ref('');
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);
const records = ref<any[]>([]);

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '账号', key: 'account', width: 120 },
  { title: '姓名', key: 'name', width: 90, render: (row: any) => row.name || '-' },
  { title: '会员等级', key: 'levelName', width: 90, render: (row: any) => row.level?.name || '-' },
  { title: '余额', key: 'balance', width: 100, align: 'left' as const },
  { title: '最后登录IP', key: 'lastLoginIp', width: 130, render: (row: any) => row.lastLoginIp || '-' },
  { title: 'ISP', key: 'lastLoginIsp', width: 100, render: (row: any) => row.lastLoginIsp || '-' },
  { title: '最后活跃', key: 'lastLoginAt', width: 160, render: (row: any) => row.lastLoginAt || '-' },
  { title: '状态', key: 'status', width: 70, align: 'center' as const, render: (row: any) => h(NTag, { type: 'success', size: 'small', bordered: false }, () => '在线') },
  { title: '操作', key: 'action', width: 70, align: 'center' as const, render: (row: any) => h(NButton, { size: 'tiny', type: 'error', text: true, onClick: () => handleKick(row) }, () => '踢线') }
];

async function loadData() {
  loading.value = true;
  const { data, error } = await fetchOnlineUsers({
    keyword: keyword.value || undefined,
    page: currentPage.value,
    pageSize
  });
  loading.value = false;
  if (!error && data) {
    records.value = data.list || [];
    totalRecords.value = data.total || 0;
  }
}

async function handleKick(r: any) {
  const { error } = await kickOnlineUser(r.id);
  if (!error) {
    window.$message?.success('已踢线');
    loadData();
    (window as any).__refreshPendingCounts?.();
  }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <!-- 顶部栏 -->
    <div class="flex items-center justify-between mb-16px">
      <div class="flex items-center gap-12px">
        <span class="text-14px op-60">当前在线人数</span>
        <span class="text-28px font-bold text-primary">{{ totalRecords }}</span>
      </div>
      <div class="flex items-center gap-8px">
        <NInput v-model:value="keyword" placeholder="搜索账号/姓名..." clearable size="small" class="w-180px" @keydown.enter="loadData">
          <template #suffix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template>
        </NInput>
        <NButton size="small" @click="loadData">
          <SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />
          刷新
        </NButton>
      </div>
    </div>

    <!-- 表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="1000" :loading="loading" />
    </NCard>

    <!-- 分页 -->
    <div class="flex items-center justify-between mt-16px">
      <span class="text-13px op-50">共 {{ totalRecords }} 条记录</span>
      <NPagination v-model:page="currentPage" :page-count="totalPages" />
    </div>
  </div>
</template>
