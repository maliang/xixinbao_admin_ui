<script setup lang="ts">
import { ref, h, computed, onMounted, watch, resolveComponent } from 'vue';
import {
  NCard, NDataTable, NButton, NSpace, NTag, NInput, NSelect, NSwitch, NPagination,
  NModal, NForm, NFormItem, NInputNumber, NTabs, NTabPane, useDialog
} from 'naive-ui';
import { fetchProjectCategories, fetchProjectCategoryDetail, createProjectCategory, updateProjectCategory, deleteProjectCategory, toggleProjectCategoryStatus } from '@/service/api';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { useAuthStore } from '@/store/modules/auth';
import { useLanguageEditor } from '@/hooks/business/useLanguageEditor';

defineOptions({ name: 'ProjectCategoryPage' });

const dialog = useDialog();
const authStore = useAuthStore();

// 多语言编辑器（可翻译字段：name）
const {
  currentLang, locales, formFields, switchLang, initEditor, buildPayload, loadLocales
} = useLanguageEditor({ fields: ['name'] });

// ========== 筛选 ==========
const keyword = ref('');
const statusFilter = ref<number | string>('all');
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
];

// ========== 加载状态 ==========
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);

// ========== 表格数据 ==========
const categories = ref<any[]>([]);

const columns = [
  {
    title: 'Logo', key: 'logo', width: 80, align: 'center' as const,
    render: (row: any) => {
      if (row.logo && row.logo.startsWith('http')) {
        return h('img', { src: row.logo, class: 'w-36px h-36px rounded-8px object-contain', style: 'display: inline-block;' });
      }
      return h('div', {
        class: 'w-36px h-36px rounded-8px bg-gray-100 flex-center mx-auto',
        style: 'display: inline-flex;'
      }, h(resolveComponent('SvgIcon'), { icon: 'ph:image', class: 'text-18px op-30' }));
    }
  },
  { title: '分类名称', key: 'name', width: 200 },
  { title: '排序值', key: 'sort', width: 120, align: 'center' as const },
  {
    title: '状态', key: 'status', width: 120, align: 'center' as const,
    render: (row: any) => h(NSwitch, { value: row.status, size: 'small', onUpdateValue: () => handleToggleStatus(row) })
  },
  {
    title: '语言', key: 'locales', width: 120,
    render: (row: any) => {
      const locales = row.locales || ['zh-CN'];
      return h(NSpace, { size: 4 }, () => locales.map((code: string) => h(NTag, { size: 'tiny', bordered: false }, () => code)));
    }
  },
  {
    title: '操作', key: 'action', width: 150, align: 'right' as const,
    render: (row: any) => h(NSpace, { size: 4, justify: 'end' }, () => [
      authStore.hasPermission('project.category.edit') ? h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => openEdit(row) }, () => [
        h(resolveComponent('SvgIcon'), { icon: 'ph:pencil-simple', class: 'mr-2px' }),
        '编辑'
      ]) : null,
      authStore.hasPermission('project.category.delete') ? h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => confirmDelete(row) }, () => [
        h(resolveComponent('SvgIcon'), { icon: 'ph:trash', class: 'mr-2px' }),
        '删除'
      ]) : null
    ])
  }
];

// ========== 新建/编辑弹窗 ==========
const modalVisible = ref(false);
const modalTitle = ref('新建分类');
const formData = ref({
  id: null as number | null,
  logo: '' as string,
  sort: 1,
  status: true,
  showHome: false,
  description: ''
});

function openCreate() {
  modalTitle.value = '新建分类';
  formData.value = { id: null, logo: '', sort: 1, status: true, showHome: false, description: '' };
  initEditor({ name: '' }, {});
  modalVisible.value = true;
}

async function openEdit(row: any) {
  modalTitle.value = '编辑分类';
  formData.value = { id: row.id, logo: row.logo || '', sort: row.sort, status: row.status, showHome: false, description: '' };

  // 从详情接口获取完整 translations 数据
  const { data, error } = await fetchProjectCategoryDetail(row.id);
  if (!error && data) {
    const translations = data.translations || {};
    initEditor({ name: data.name || '' }, translations);
  } else {
    initEditor({ name: row.name || '' }, {});
  }
  modalVisible.value = true;
}

function handleSave() {
  doSave();
}

async function doSave() {
  // 构建多语言 payload
  const { zhFields, translationsJson } = buildPayload();

  const payload: Record<string, any> = {
    name: zhFields.name,
    sort: formData.value.sort,
    status: formData.value.status,
    translations: translationsJson
  };
  if (formData.value.logo) payload.logo = formData.value.logo;

  if (formData.value.id) {
    const { error } = await updateProjectCategory(formData.value.id, payload);
    if (!error) {
      window.$message?.success('更新成功');
      modalVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || '操作失败');
    }
  } else {
    const { error } = await createProjectCategory({ ...payload, showHome: formData.value.showHome, description: formData.value.description });
    if (!error) {
      window.$message?.success('创建成功');
      modalVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || '操作失败');
    }
  }
}

// ========== 切换状态 ==========
async function handleToggleStatus(row: any) {
  const { error } = await toggleProjectCategoryStatus(row.id);
  if (!error) {
    row.status = !row.status;
    window.$message?.success(row.status ? '已启用' : '已禁用');
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

// ========== 删除确认 ==========
function confirmDelete(row: any) {
  dialog.warning({
    title: '删除分类',
    content: '确定要删除吗？此操作不可恢复。',
    positiveText: '确认删除',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      const { error } = await deleteProjectCategory(row.id);
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
  const { data, error } = await fetchProjectCategories({
    keyword: keyword.value || undefined,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    page: currentPage.value,
    page_size: pageSize
  });
  loading.value = false;
  if (!error) {
    categories.value = data.list || [];
    totalRecords.value = data.total || 0;
  } else {
    window.$message?.error(error?.msg || '加载失败');
  }
}

watch(currentPage, loadData);
onMounted(() => { loadLocales(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-16px">
      <div>
        <h2 class="text-20px font-bold">项目分类管理</h2>
        <p class="text-13px op-50 mt-2px">当前共有 {{ totalRecords }} 个分类</p>
      </div>
      <NButton v-permission="'project.category.create'" type="primary" @click="openCreate">
        <SvgIcon icon="ph:plus" class="mr-4px" />
        新建分类
      </NButton>
    </div>

    <!-- 搜索栏 -->
    <NCard :bordered="false" class="card-wrapper mb-16px" content-style="padding: 12px 16px;">
      <div class="flex items-center gap-12px">
        <NInput v-model:value="keyword" placeholder="搜索分类名称..." clearable size="small" class="flex-1 max-w-400px">
          <template #prefix>
            <SvgIcon icon="ph:magnifying-glass" class="op-40" />
          </template>
        </NInput>
        <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" class="w-140px" />
        <NButton type="primary" size="small" @click="() => { currentPage = 1; loadData(); }">
          <SvgIcon icon="ph:magnifying-glass" class="mr-4px" />
          搜索
        </NButton>
      </div>
    </NCard>

    <!-- 表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="categories" :bordered="false" size="small" />
      <div class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">显示 1 到 {{ categories.length }} 项，共 {{ totalRecords }} 项</span>
        <NPagination v-model:page="currentPage" :page-count="Math.ceil(totalRecords / pageSize) || 1" />
      </div>
    </NCard>

    <!-- 新建/编辑弹窗 -->
    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 500px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <!-- Language Tab -->
        <NTabs v-if="locales.length > 1" :value="currentLang" type="segment" size="small" @update:value="switchLang" class="mb-16px">
          <NTabPane v-for="locale in locales" :key="locale.code" :name="locale.code" :tab="locale.label" />
        </NTabs>

        <!-- 新建时 Logo 在最上面（仅 zh-CN 时显示） -->
        <NFormItem v-if="modalTitle === '新建分类' && currentLang === 'zh-CN'" label="分类Logo">
          <ImageUpload v-model="formData.logo" />
        </NFormItem>

        <NFormItem label="分类名称">
          <NInput v-model:value="formFields.name" placeholder="请输入分类名称" />
        </NFormItem>

        <!-- 编辑时 Logo 在名称后面（仅 zh-CN 时显示） -->
        <NFormItem v-if="modalTitle === '编辑分类' && currentLang === 'zh-CN'" label="分类Logo">
          <ImageUpload v-model="formData.logo" />
        </NFormItem>

        <!-- 以下字段仅在 zh-CN 时显示（非翻译字段） -->
        <template v-if="currentLang === 'zh-CN'">
          <NFormItem label="排序值">
            <NInputNumber v-model:value="formData.sort" class="w-full" />
          </NFormItem>

          <NFormItem label="启用状态">
            <NSwitch v-model:value="formData.status" />
          </NFormItem>

          <!-- 新建时额外字段 -->
          <template v-if="modalTitle === '新建分类'">
            <NFormItem label="置顶到首页显示">
              <NSwitch v-model:value="formData.showHome" />
            </NFormItem>
            <NFormItem label="分类描述">
              <NInput v-model:value="formData.description" type="textarea" :rows="4" placeholder="请输入分类描述（最多500字符）" />
            </NFormItem>
          </template>
        </template>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSave">{{ modalTitle === '新建分类' ? '确定' : '保存' }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
