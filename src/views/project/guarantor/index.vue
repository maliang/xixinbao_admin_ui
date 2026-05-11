<script setup lang="ts">
import { ref, h, resolveComponent, onMounted, watch, computed } from 'vue';
import {
  NCard, NDataTable, NButton, NSpace, NInputNumber, NPagination,
  NModal, NForm, NFormItem, NInput, NImage, useDialog
} from 'naive-ui';
import { fetchGuarantors, createGuarantor, updateGuarantor, deleteGuarantor } from '@/service/api';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'ProjectGuarantorPage' });

const dialog = useDialog();
const authStore = useAuthStore();

// ========== 加载状态 ==========
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);

// ========== 表格数据 ==========
const data = ref<any[]>([]);

const columns = [
  { title: '序号', key: 'id', width: 70, align: 'center' as const },
  { title: '名称', key: 'name' , width: 300 },
  {
    title: '公章图', key: 'logo', align: 'center' as const,
    render: (row: any) => {
      if (row.logo) {
        return h(NImage, { src: row.logo, width: 36, height: 36, objectFit: 'contain' });
      }
      return h('div', {
        class: 'w-36px h-36px rounded-full bg-gray-100 flex-center mx-auto',
        style: 'display: inline-flex;'
      }, h(resolveComponent('SvgIcon'), { icon: 'ph:seal', class: 'text-18px op-30' }));
    }
  },
  {
    title: '排序', key: 'sort', width: 120, align: 'center' as const,
    render: (row: any) => h(NInputNumber, {
      value: row.sort,
      size: 'small',
      buttonPlacement: 'both',
      style: 'width: 100px;',
      onUpdateValue: (v: number | null) => {
        const newVal = v ?? 0;
        if (newVal !== row.sort) {
          row.sort = newVal;
          handleSortChange(row);
        }
      },
      onKeydown: (e: KeyboardEvent) => {
        if (e.key === 'Enter') handleSortChange(row);
      }
    })
  },
  {
    title: '操作', key: 'action', width: 140, align: 'center' as const,
    render: (row: any) => h(NSpace, { size: 8, justify: 'center' }, () => [
      authStore.hasPermission('project.guarantor.edit') ? h(NButton, { text: true, type: 'primary', onClick: () => openModal(row) }, () => '编辑') : null,
      authStore.hasPermission('project.guarantor.delete') ? h(NButton, { text: true, type: 'error', onClick: () => confirmDelete(row) }, () => '删除') : null
    ])
  }
];

// ========== 排序变更（失焦自动保存） ==========
async function handleSortChange(row: any) {
  const { error } = await updateGuarantor(row.id, { sort: row.sort });
  if (!error) {
    window.$message?.success('排序已更新');
    loadData();
  } else {
    window.$message?.error(error?.msg || '排序更新失败');
  }
}

// ========== 新增/编辑弹窗 ==========
const modalVisible = ref(false);
const modalTitle = ref('新增担保机构');
const formData = ref({
  id: null as number | null,
  name: '',
  logo: '' as string,
  sort: 10
});

function openModal(row?: any) {
  if (row) {
    modalTitle.value = '编辑担保机构';
    formData.value = { id: row.id, name: row.name, logo: row.logo || '', sort: row.sort };
  } else {
    modalTitle.value = '新增担保机构';
    formData.value = { id: null, name: '', logo: '', sort: 10 };
  }
  modalVisible.value = true;
}

async function handleSave() {
  const payload: Record<string, any> = { name: formData.value.name, sort: formData.value.sort };
  if (formData.value.logo) {
    payload.logo = formData.value.logo;
  }
  if (formData.value.id) {
    const { error } = await updateGuarantor(formData.value.id, payload);
    if (!error) {
      window.$message?.success('更新成功');
      modalVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || '操作失败');
    }
  } else {
    const { error } = await createGuarantor(payload);
    if (!error) {
      window.$message?.success('创建成功');
      modalVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || '操作失败');
    }
  }
}

// ========== 删除 ==========
function confirmDelete(row: any) {
  dialog.warning({
    title: '删除担保机构',
    content: '确定要删除「' + row.name + '」吗？此操作不可恢复。',
    positiveText: '确认删除',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteGuarantor(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        loadData();
      } else {
        window.$message?.error(error?.msg || '操作失败');
      }
    }
  });
}

// ========== 数据加载 ==========
async function loadData() {
  loading.value = true;
  const { data: resData, error } = await fetchGuarantors({
    page: currentPage.value,
    page_size: pageSize
  });
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
    <NCard :bordered="false" class="card-wrapper">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-16px">
        <h3 class="text-18px font-bold">担保机构列表</h3>
        <NButton v-permission="'project.guarantor.create'" type="primary" @click="openModal()">
          <SvgIcon icon="ph:plus" class="mr-4px" />
          新增担保机构
        </NButton>
      </div>

      <!-- 表格 -->
      <NDataTable :columns="columns" :data="data" :bordered="false" size="small" />

      <!-- 分页 -->
      <div class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">共 {{ totalRecords }} 条记录</span>
        <NPagination v-model:page="currentPage" :page-count="Math.ceil(totalRecords / pageSize) || 1" />
      </div>
    </NCard>

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 480px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NFormItem label="名称">
          <NInput v-model:value="formData.name" placeholder="请输入担保机构名称" />
        </NFormItem>
        <NFormItem label="公章图">
          <ImageUpload v-model="formData.logo" width="120px" height="120px" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="formData.sort" class="w-120px" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSave">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
