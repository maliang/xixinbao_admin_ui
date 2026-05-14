<script setup lang="ts">
import { ref, h, resolveComponent, computed, onMounted, watch } from 'vue';
import {
  NCard, NDataTable, NButton, NSpace, NTag, NSwitch, NInput, NSelect, NInputNumber,
  NPagination, NModal, NForm, NFormItem, NUpload, NCheckbox, NImage, NTabs, NTabPane, useDialog
} from 'naive-ui';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { fetchMallCategories, fetchMallCategoryDetail, createMallCategory, updateMallCategory, deleteMallCategory, sortMallCategories } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { useLanguageEditor } from '@/hooks/business/useLanguageEditor';

defineOptions({ name: 'MallCategoryPage' });
const dialog = useDialog();
const authStore = useAuthStore();

// 多语言编辑器（可翻译字段：name）
const {
  currentLang, locales, formFields: langFields, switchLang, initEditor, buildPayload, loadLocales
} = useLanguageEditor({ fields: ['name'] });

// ========== 筛选 ==========
const keyword = ref('');
const statusFilter = ref('');
const parentFilter = ref('');
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' }
];
const parentOptions = computed(() => {
  const opts: { label: string; value: string }[] = [{ label: '全部', value: '' }];
  flatData.value.forEach((item: any) => {
    if (item.parentId === 0 || item.parentId === null) {
      opts.push({ label: item.name, value: String(item.id) });
    }
  });
  return opts;
});

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 表格 ==========
const data = ref<any[]>([]);
const flatData = ref<any[]>([]); // 扁平列表（用于构建父类选项）

const columns = [
  { title: 'ID', key: 'id', width: 70, align: 'center' as const },
  {
    title: '排序值', key: 'sort', width: 80, align: 'center' as const,
    render: (row: any) => h(NInputNumber, { value: row.sort, size: 'small', buttonPlacement: 'both', style: 'width: 100px;', onUpdateValue: (v: number | null) => { const nv = v ?? 1; if (nv !== row.sort) { row.sort = nv; handleSortChange(row); } }, onKeydown: (e: KeyboardEvent) => { if (e.key === 'Enter') handleSortChange(row); } })
  },
  { title: '分类名称', key: 'name', width: 140, render: (row: any) => h('span', { class: 'font-bold' }, row.name) },
  {
    title: '图标', key: 'image', width: 70, align: 'center' as const,
    render: (row: any) => row.image
      ? h(NImage, { src: row.image, width: 36, height: 36, objectFit: 'cover', style: 'border-radius: 6px;' })
      : h('div', { class: 'w-36px h-36px rounded-6px bg-gray-100 flex-center mx-auto', style: 'display: inline-flex;' },
          h(resolveComponent('SvgIcon'), { icon: 'ph:image', class: 'text-16px op-30' }))
  },
  {
    title: '状态', key: 'status', width: 80, align: 'center' as const,
    render: (row: any) => h(NSwitch, { value: row.status, size: 'small', onUpdateValue: () => handleToggleStatus(row) })
  },
  {
    title: '语言', key: 'locales', width: 120,
    render: (row: any) => {
      const locales = row.locales || ['zh-CN'];
      return h(NSpace, { size: 4 }, () => locales.map((code: string) => h(NTag, { size: 'tiny', bordered: false }, () => code)));
    }
  },
  { title: '商品数量', key: 'goodsCount', width: 90, align: 'center' as const },
  { title: '创建时间', key: 'createdAt', width: 120, align: 'center' as const },
  {
    title: '操作', key: 'action', width: 120, align: 'center' as const,
    render: (row: any) => h(NSpace, { size: 8, justify: 'center' }, () => [
      authStore.hasPermission('mall.category.edit') ? h(NButton, { text: true, type: 'primary', onClick: () => openModal(row) }, () => '编辑') : null,
      authStore.hasPermission('mall.category.delete') ? h(NButton, { text: true, type: 'error', onClick: () => confirmDelete(row) }, () => '删除') : null
    ])
  }
];

// ========== 状态切换 ==========
async function handleToggleStatus(row: any) {
  const newStatus = row.status ? 0 : 1;
  const { error } = await updateMallCategory(row.id, { status: newStatus });
  if (!error) {
    row.status = !row.status;
    window.$message?.success(row.status ? '已启用' : '已禁用');
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

// ========== 排序变更（失焦自动保存） ==========
async function handleSortChange(row: any) {
  const { error } = await updateMallCategory(row.id, { sort: row.sort });
  if (!error) {
    window.$message?.success('排序已更新');
    loadData();
  } else {
    window.$message?.error(error?.msg || '排序更新失败');
  }
}

// ========== 新增/编辑弹窗 ==========
const modalVisible = ref(false);
const modalTitle = ref('新增商品分类');
const formData = ref({
  id: null as number | null,
  image: '',
  parentId: 0 as number,
  sort: 1,
  enabled: true
});

// 父类选项（从已有分类中获取顶级分类）
const parentCategoryOptions = ref<{ label: string; value: number }[]>([
  { label: '无（顶级分类）', value: 0 }
]);

function buildParentOptions() {
  const opts: { label: string; value: number }[] = [{ label: '无（顶级分类）', value: 0 }];
  flatData.value.forEach((item: any) => {
    if (item.parentId === 0 || item.parentId === null) {
      opts.push({ label: item.name, value: item.id });
    }
  });
  parentCategoryOptions.value = opts;
}

function openModal(row?: any) {
  buildParentOptions();
  if (row) {
    modalTitle.value = '编辑商品分类';
    formData.value = { id: row.id, image: row.image || '', parentId: row.parentId || 0, sort: row.sort, enabled: row.status };
    // 从详情接口获取完整 translations 数据
    fetchMallCategoryDetail(row.id).then(({ data: detail, error }) => {
      if (!error && detail) {
        const translations = detail.translations || {};
        initEditor({ name: detail.name || '' }, translations);
      } else {
        initEditor({ name: row.name || '' }, {});
      }
    });
  } else {
    modalTitle.value = '新增商品分类';
    formData.value = { id: null, image: '', parentId: 0, sort: 1, enabled: true };
    initEditor({ name: '' }, {});
  }
  modalVisible.value = true;
}

async function handleSaveCategory() {
  if (!langFields.value.name && currentLang.value === 'zh-CN') {
    window.$message?.warning('请输入分类名称');
    return;
  }

  // 构建多语言 payload
  const { zhFields, translationsJson } = buildPayload();

  const payload: Record<string, any> = {
    name: zhFields.name,
    image: formData.value.image,
    parent_id: formData.value.parentId,
    sort: formData.value.sort,
    status: formData.value.enabled ? 1 : 0,
    translations: translationsJson
  };

  if (formData.value.id) {
    const { error } = await updateMallCategory(formData.value.id, payload);
    if (!error) {
      window.$message?.success('更新成功');
      modalVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || '操作失败');
    }
  } else {
    const { error } = await createMallCategory(payload);
    if (!error) {
      window.$message?.success('创建成功');
      modalVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || '操作失败');
    }
  }
}

function confirmDelete(row: any) {
  dialog.warning({
    title: '删除分类',
    content: '确定要删除「' + row.name + '」吗？此操作不可恢复。',
    positiveText: '确认删除',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteMallCategory(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        loadData();
      } else {
        window.$message?.error(error?.msg || '操作失败');
      }
    }
  });
}

// ========== 应用排序 ==========
async function handleApplySort() {
  const items = flatData.value.map((d: any) => ({ id: d.id, sort: d.sort }));
  const { error } = await sortMallCategories(items);
  if (!error) {
    window.$message?.success('排序已保存');
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

// ========== 数据加载 ==========
function buildTree(list: any[]): any[] {
  const map: Record<number, any> = {};
  const roots: any[] = [];
  list.forEach(item => {
    item.children = [];
    map[item.id] = item;
  });
  list.forEach(item => {
    const pid = item.parentId || 0;
    if (pid && map[pid]) {
      map[pid].children.push(item);
    } else {
      roots.push(item);
    }
  });
  // 移除空 children（NDataTable 需要无 children 属性才不显示展开箭头）
  function clean(nodes: any[]) {
    nodes.forEach(n => {
      if (n.children.length === 0) delete n.children;
      else clean(n.children);
    });
  }
  clean(roots);
  return roots;
}

async function loadData() {
  loading.value = true;
  const { data: resData, error } = await fetchMallCategories({
    keyword: keyword.value || undefined,
    status: statusFilter.value || undefined,
    parentId: parentFilter.value || undefined
  });
  loading.value = false;
  if (!error) {
    const list = resData.list || resData || [];
    flatData.value = Array.isArray(list) ? list : [];
    data.value = buildTree([...flatData.value]);
  } else {
    window.$message?.error(error?.msg || '加载失败');
  }
}

function handleReset() {
  keyword.value = '';
  statusFilter.value = '';
  parentFilter.value = '';
  loadData();
}

onMounted(() => { loadLocales(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-20px font-bold">商品分类管理</h2>
      <NButton v-permission="'mall.category.create'" type="primary" @click="openModal()">
        <SvgIcon icon="ph:plus" class="mr-4px" />
        新增分类
      </NButton>
    </div>

    <!-- 搜索栏 -->
    <NCard :bordered="false" class="card-wrapper mb-16px" content-style="padding: 12px 16px;">
      <div class="flex items-center gap-12px flex-wrap">
        <div>
          <div class="text-12px op-60 mb-4px">分类名称</div>
          <NInput v-model:value="keyword" placeholder="输入分类名称" size="small" class="w-180px" />
        </div>
        <div>
          <div class="text-12px op-60 mb-4px">状态</div>
          <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" class="w-140px" />
        </div>
        <div>
          <div class="text-12px op-60 mb-4px">上级分类</div>
          <NSelect v-model:value="parentFilter" :options="parentOptions" size="small" class="w-140px" />
        </div>
        <div class="flex items-end gap-8px" style="padding-top: 18px;">
          <NButton size="small" type="primary" @click="loadData">
            <SvgIcon icon="ph:magnifying-glass" class="mr-4px" />
            查询
          </NButton>
          <NButton size="small" @click="handleReset">重置</NButton>
        </div>
      </div>
    </NCard>

    <!-- 表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="data" :bordered="false" size="small" :row-key="(row: any) => row.id" default-expand-all />

      <!-- 底部 -->
      <div class="mt-16px">
        <span class="text-13px op-50">共 {{ flatData.length }} 条</span>
      </div>
    </NCard>

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 500px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <!-- Language Tab -->
        <NTabs v-if="locales.length > 1" :value="currentLang" type="segment" size="small" @update:value="switchLang" class="mb-16px">
          <NTabPane v-for="locale in locales" :key="locale.code" :name="locale.code" :tab="locale.label" />
        </NTabs>

        <NFormItem label="分类名称">
          <NInput v-model:value="langFields.name" placeholder="请输入分类名称" />
        </NFormItem>

        <!-- 以下字段仅在 zh-CN 时显示（非翻译字段） -->
        <template v-if="currentLang === 'zh-CN'">
          <NFormItem label="上级分类">
            <NSelect v-model:value="formData.parentId" :options="parentCategoryOptions" placeholder="选择上级分类" />
          </NFormItem>
          <NFormItem label="排序值">
            <NInputNumber v-model:value="formData.sort" class="w-full" />
          </NFormItem>
          <NFormItem label="分类图标">
            <ImageUpload v-model="formData.image" width="80px" height="80px" />
          </NFormItem>
          <NFormItem>
            <NCheckbox v-model:checked="formData.enabled">启用该分类</NCheckbox>
          </NFormItem>
        </template>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSaveCategory">确认保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
