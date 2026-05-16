<script setup lang="ts">
import { ref, h, onMounted, watch, computed } from 'vue';
import { NCard, NButton, NInput, NPagination, NDataTable, NTag } from 'naive-ui';
import { fetchOnlineUsers, kickOnlineUser } from '@/service/api';
import { $t } from '@/locales';

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
  { title: $t('biz.user.online.account'), key: 'account', width: 120 },
  { title: $t('biz.user.online.name'), key: 'name', width: 90, render: (row: any) => row.name || '-' },
  { title: $t('biz.user.online.level'), key: 'levelName', width: 90, render: (row: any) => row.level?.name || '-' },
  { title: $t('biz.user.online.balance'), key: 'balance', width: 100, align: 'left' as const },
  { title: $t('biz.user.online.lastLoginIp'), key: 'lastLoginIp', width: 130, render: (row: any) => row.lastLoginIp || '-' },
  { title: 'ISP', key: 'lastLoginIsp', width: 100, render: (row: any) => row.lastLoginIsp || '-' },
  { title: $t('biz.user.online.lastLoginAt'), key: 'lastLoginAt', width: 160, render: (row: any) => row.lastLoginAt || '-' },
  { title: $t('biz.common.status'), key: 'status', width: 70, align: 'center' as const, render: (row: any) => h(NTag, { type: 'success', size: 'small', bordered: false }, () => $t('biz.user.online.title')) },
  { title: $t('common.action'), key: 'action', width: 70, align: 'center' as const, render: (row: any) => h(NButton, { size: 'tiny', type: 'error', text: true, onClick: () => handleKick(row) }, () => $t('biz.user.online.kick')) }
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
    window.$message?.success($t('biz.common.operateSuccess'));
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
        <span class="text-14px op-60">{{ $t('biz.user.online.title') }}</span>
        <span class="text-28px font-bold text-primary">{{ totalRecords }}</span>
      </div>
      <div class="flex items-center gap-8px">
        <NInput v-model:value="keyword" :placeholder="$t('biz.user.online.account')" clearable size="small" class="w-180px" @keydown.enter="loadData">
          <template #suffix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template>
        </NInput>
        <NButton size="small" @click="loadData">
          <SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />
          {{ $t('common.refresh') }}
        </NButton>
      </div>
    </div>

    <!-- 表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="1000" :loading="loading" />
    </NCard>

    <!-- 分页 -->
    <div class="flex items-center justify-between mt-16px">
      <span class="text-13px op-50">{{ $t('biz.common.total', { count: totalRecords }) }}</span>
      <NPagination v-model:page="currentPage" :page-count="totalPages" />
    </div>
  </div>
</template>
