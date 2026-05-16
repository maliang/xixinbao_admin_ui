<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { NCard, NButton, NInput, NModal, NSpace, NDataTable, useDialog } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchLevels, createLevel, updateLevel, deleteLevel } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';

defineOptions({ name: 'UserLevelPage' });
const dialog = useDialog();
const authStore = useAuthStore();

const loading = ref(false);
const records = ref<any[]>([]);

// ========== 表格列定义 ==========
const columns: DataTableColumns = [
  { title: '#', key: 'index', width: 60, align: 'center', render: (_row, index) => index + 1 },
  { title: $t('biz.user.level.levelName'), key: 'name', width: 140 },
  { title: $t('biz.user.level.investAmount'), key: 'dividendRate', width: 140, render: (row) => `${row.dividendRate}%` },
  { title: $t('biz.user.level.investAmount'), key: 'investAmount', width: 140, render: (row) => `¥${Number(row.investAmount || 0).toLocaleString()}` },
  { title: $t('biz.user.level.sort'), key: 'dailySpinCount', width: 140, render: (row) => `${row.dailySpinCount}` },
  {
    title: $t('common.action'), key: 'action', width: 100, align: 'right',
    render: (row) => h(NSpace, { size: 8, justify: 'end' }, () => [
      authStore.hasPermission('user.level.edit') ? h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row) }, () => $t('common.edit')) : null,
      authStore.hasPermission('user.level.delete') ? h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, () => $t('common.delete')) : null
    ])
  }
];

async function loadData() {
  loading.value = true;
  const { data, error } = await fetchLevels();
  loading.value = false;
  if (!error && data) {
    const list = data.list || data || [];
    records.value = Array.isArray(list) ? list : [];
  }
}

onMounted(() => { loadData(); });

// ========== 添加/编辑弹窗 ==========
const modalVisible = ref(false);
const modalTitle = ref($t('biz.user.level.addLevel'));
const editId = ref<number | null>(null);
const formData = ref({ name: '', dividendRate: '', investAmount: '', dailySpinCount: '' });

function openAdd() {
  modalTitle.value = $t('biz.user.level.addLevel');
  editId.value = null;
  formData.value = { name: '', dividendRate: '', investAmount: '', dailySpinCount: '' };
  modalVisible.value = true;
}

function openEdit(r: any) {
  modalTitle.value = $t('biz.user.level.editLevel');
  editId.value = r.id;
  formData.value = {
    name: r.name || '',
    dividendRate: String(r.dividendRate ?? ''),
    investAmount: String(r.investAmount ?? ''),
    dailySpinCount: String(r.dailySpinCount ?? '')
  };
  modalVisible.value = true;
}

async function handleSubmit() {
  const payload = {
    name: formData.value.name,
    dividendRate: formData.value.dividendRate,
    investAmount: formData.value.investAmount,
    dailySpinCount: formData.value.dailySpinCount
  };
  const { error } = editId.value
    ? await updateLevel(editId.value, payload)
    : await createLevel(payload);
  if (!error) {
    window.$message?.success($t('biz.common.operateSuccess'));
    modalVisible.value = false;
    loadData();
  } else {
    window.$message?.error(error?.msg || $t('biz.common.operateFailed'));
  }
}

function handleDelete(r: any) {
  dialog.warning({
    title: $t('biz.common.confirmDeleteTitle'), content: $t('biz.common.confirmDeleteContent'),
    positiveText: $t('biz.common.confirmDeleteTitle'), negativeText: $t('common.cancel'), positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteLevel(r.id);
      if (!error) { window.$message?.success($t('biz.common.deleteSuccess')); loadData(); }
      else { window.$message?.error(error?.msg || $t('biz.common.operateFailed')); }
    }
  });
}
</script>

<template>
  <div class="p-16px">
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-18px font-bold m-0">{{ $t('biz.user.level.title') }}</h2>
      <NButton v-permission="'user.level.create'" type="primary" @click="openAdd">{{ $t('biz.user.level.addLevel') }}</NButton>
    </div>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        :columns="columns"
        :data="records"
        :bordered="false"
        size="small"
        :scroll-x="720"
        :loading="loading"
      />
    </NCard>

    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 480px;" :bordered="false">
      <div class="flex flex-col gap-16px">
        <div>
          <div class="text-13px font-500 mb-6px">{{ $t('biz.user.level.levelName') }}</div>
          <NInput v-model:value="formData.name" :placeholder="$t('biz.user.level.levelName')" />
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">{{ $t('biz.user.level.investAmount') }}</div>
          <NInput v-model:value="formData.dividendRate" :placeholder="$t('biz.user.level.investAmount')">
            <template #suffix><span class="op-50">%</span></template>
          </NInput>
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">{{ $t('biz.user.level.investAmount') }}</div>
          <NInput v-model:value="formData.investAmount" :placeholder="$t('biz.user.level.investAmount')">
            <template #prefix><span class="op-50">¥</span></template>
          </NInput>
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">{{ $t('biz.user.level.sort') }}</div>
          <NInput v-model:value="formData.dailySpinCount" :placeholder="$t('biz.user.level.sort')">
          </NInput>
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
