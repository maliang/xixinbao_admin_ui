<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { NCard, NButton, NInput, NModal, NSpace, NDataTable, useDialog } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchLevels, createLevel, updateLevel, deleteLevel } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'UserLevelPage' });
const dialog = useDialog();
const authStore = useAuthStore();

const loading = ref(false);
const records = ref<any[]>([]);

// ========== 表格列定义 ==========
const columns: DataTableColumns = [
  { title: '序号', key: 'index', width: 60, align: 'center', render: (_row, index) => index + 1 },
  { title: '会员等级', key: 'name', width: 140 },
  { title: '分红奖励利率', key: 'dividendRate', width: 140, render: (row) => `${row.dividendRate}%` },
  { title: '投资额要求', key: 'investAmount', width: 140, render: (row) => `¥${Number(row.investAmount || 0).toLocaleString()}` },
  { title: '每日转盘次数', key: 'dailySpinCount', width: 140, render: (row) => `${row.dailySpinCount} 次` },
  {
    title: '操作', key: 'action', width: 100, align: 'right',
    render: (row) => h(NSpace, { size: 8, justify: 'end' }, () => [
      authStore.hasPermission('user.level.edit') ? h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row) }, () => '编辑') : null,
      authStore.hasPermission('user.level.delete') ? h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, () => '删除') : null
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
const modalTitle = ref('添加等级');
const editId = ref<number | null>(null);
const formData = ref({ name: '', dividendRate: '', investAmount: '', dailySpinCount: '' });

function openAdd() {
  modalTitle.value = '添加等级';
  editId.value = null;
  formData.value = { name: '', dividendRate: '', investAmount: '', dailySpinCount: '' };
  modalVisible.value = true;
}

function openEdit(r: any) {
  modalTitle.value = '编辑等级';
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
    window.$message?.success('操作成功');
    modalVisible.value = false;
    loadData();
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

function handleDelete(r: any) {
  dialog.warning({
    title: '警告', content: '确定要删除该会员等级吗？删除后无法恢复。',
    positiveText: '确认删除', negativeText: '取消', positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteLevel(r.id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error(error?.msg || '操作失败'); }
    }
  });
}
</script>

<template>
  <div class="p-16px">
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-18px font-bold m-0">会员等级管理</h2>
      <NButton v-permission="'user.level.create'" type="primary" @click="openAdd">添加等级</NButton>
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
          <div class="text-13px font-500 mb-6px">等级名称</div>
          <NInput v-model:value="formData.name" placeholder="请输入等级名称" />
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">分红奖励利率</div>
          <NInput v-model:value="formData.dividendRate" placeholder="请输入利率">
            <template #suffix><span class="op-50">%</span></template>
          </NInput>
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">投资额要求</div>
          <NInput v-model:value="formData.investAmount" placeholder="请输入最低投资额">
            <template #prefix><span class="op-50">¥</span></template>
          </NInput>
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">每日转盘次数</div>
          <NInput v-model:value="formData.dailySpinCount" placeholder="请输入次数">
            <template #suffix><span class="op-50">次</span></template>
          </NInput>
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确认</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
