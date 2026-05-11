<script setup lang="ts">
import { ref, h, resolveComponent, computed, onMounted, watch } from 'vue';
import {
  NCard, NDataTable, NButton, NSpace, NTag, NInput, NSelect, NImage,
  NPagination, NModal, NForm, NFormItem, NInputNumber, NTreeSelect, useDialog
} from 'naive-ui';
import { fetchMallGoods, createMallGoods, updateMallGoods, deleteMallGoods, fetchMallCategories } from '@/service/api';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'MallGoodsPage' });
const dialog = useDialog();
const authStore = useAuthStore();

// ========== 筛选 ==========
const keyword = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');

const categoryOptions = ref<{ label: string; value: string }[]>([
  { label: '全部分类', value: '' }
]);
const categoryFormOptions = computed(() => categoryOptions.value.filter(o => o.value !== ''));

// 树形分类选项（用于 NTreeSelect）
const categoryTreeOptions = ref<any[]>([]);
const categoryFilterTreeOptions = computed(() => [{ label: '全部分类', key: '' }, ...categoryTreeOptions.value]);
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '上架中', value: '上架中' },
  { label: '已下架', value: '已下架' }
];
const statusFormOptions = [
  { label: '上架中', value: '上架中' },
  { label: '已下架', value: '已下架' }
];

// ========== 加载状态 ==========
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);

// ========== 表格 ===========
const columns = [
  { title: '序号', key: 'id', width: 70, align: 'center' as const },
  { title: '分类', key: 'categoryId', width: 90, render: (row: any) => {
    const cat = categoryOptions.value.find(c => c.value === String(row.categoryId));
    return cat ? cat.label : '-';
  }},
  { title: '标题', key: 'name', width: 250, ellipsis: { tooltip: true }, render: (row: any) => h('span', { class: 'font-bold' }, row.name) },
  {
    title: '缩略图', key: 'image', width: 70, align: 'center' as const,
    render: (row: any) => row.image
      ? h(NImage, { src: row.image, width: 40, height: 40, objectFit: 'cover', style: 'border-radius: 6px;' })
      : h('div', { class: 'w-40px h-40px rounded-6px bg-gray-100 flex-center mx-auto', style: 'display: inline-flex;' },
          h(resolveComponent('SvgIcon'), { icon: 'ph:image', class: 'text-18px op-30' }))
  },
  { title: '积分', key: 'points', width: 80, align: 'center' as const, render: (row: any) => h('span', { class: 'text-primary font-bold' }, (row.points || 0).toLocaleString()) },
  { title: '市价', key: 'price', width: 70, align: 'center' as const, render: (row: any) => '¥' + (row.price || 0) },
  { title: '库存', key: 'stock', width: 70, align: 'center' as const, render: (row: any) => h('span', { style: (row.stock || 0) <= 0 ? 'color:#d03050;' : '' }, row.stock ?? 0) },
  { title: '排序', key: 'sort', width: 60, align: 'center' as const },
  {
    title: '状态', key: 'status', width: 70, align: 'center' as const,
    render: (row: any) => h(NTag, { type: row.status === '上架中' ? 'success' : 'warning', size: 'small', bordered: false }, () => row.status)
  },
  { title: '添加时间', key: 'createdAt', width: 140 },
  {
    title: '操作', key: 'action', width: 80, align: 'center' as const,
    render: (row: any) => h(NSpace, { size: 4, justify: 'center' }, () => [
      authStore.hasPermission('mall.goods.edit') ? h(NButton, { size: 'tiny', type: 'primary', quaternary: true, onClick: () => openModal(row) }, () =>
        h(resolveComponent('SvgIcon'), { icon: 'ph:pencil-simple', class: 'text-16px' })
      ) : null,
      authStore.hasPermission('mall.goods.delete') ? h(NButton, { size: 'tiny', type: 'error', quaternary: true, onClick: () => confirmDelete(row) }, () =>
        h(resolveComponent('SvgIcon'), { icon: 'ph:trash', class: 'text-16px' })
      ) : null
    ])
  }
];

const data = ref<any[]>([]);

// ========== 新增/编辑弹窗 ==========
const modalVisible = ref(false);
const modalTitle = ref('新增商品');
const formData = ref({
  id: null as number | null,
  name: '',
  categoryId: null as string | null,
  points: null as number | null,
  price: null as number | null,
  stock: null as number | null,
  image: '' as string,
  description: '',
  sort: 0,
  status: '上架中'
});

function openModal(row?: any) {
  if (row) {
    modalTitle.value = '编辑商品';
    formData.value = {
      id: row.id,
      name: row.name,
      categoryId: row.categoryId ? String(row.categoryId) : null,
      points: row.points,
      price: parseFloat(String(row.price || 0).replace(/,/g, '')),
      stock: row.stock ?? 0,
      image: row.image || '',
      description: row.description || '',
      sort: row.sort,
      status: row.status
    };
  } else {
    modalTitle.value = '新增商品';
    formData.value = { id: null, name: '', categoryId: null, points: null, price: null, stock: null, image: '', description: '', sort: 0, status: '上架中' };
  }
  modalVisible.value = true;
}

async function handleSaveGoods() {
  const payload = { ...formData.value };
  if (formData.value.id) {
    const { error } = await updateMallGoods(formData.value.id, payload);
    if (!error) {
      window.$message?.success('更新成功');
      modalVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || '操作失败');
    }
  } else {
    const { error } = await createMallGoods(payload);
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
    title: '删除商品',
    content: '确定要删除「' + row.name + '」吗？',
    positiveText: '确认删除',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteMallGoods(row.id);
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
  const { data: resData, error } = await fetchMallGoods({
    keyword: keyword.value || undefined,
    categoryId: categoryFilter.value || undefined,
    status: statusFilter.value || undefined,
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
onMounted(() => {
  loadCategories();
  loadData();
});

async function loadCategories() {
  const { data, error } = await fetchMallCategories({ page_size: 200 });
  if (!error && data) {
    const list = data.list || data || [];
    const flat = Array.isArray(list) ? list : [];

    // 扁平选项（兼容筛选栏 NSelect）
    categoryOptions.value = [
      { label: '全部分类', value: null },
      ...flat.map((c: any) => ({ label: c.name, value: String(c.id) }))
    ];

    // 构建树形选项（用于 NTreeSelect）
    const map: Record<number, any> = {};
    const roots: any[] = [];
    flat.forEach((c: any) => {
      map[c.id] = { label: c.name, key: String(c.id), children: [] };
    });
    flat.forEach((c: any) => {
      const pid = c.parentId || 0;
      if (pid && map[pid]) {
        map[pid].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    // 清理空 children
    function clean(nodes: any[]) {
      nodes.forEach(n => {
        if (n.children.length === 0) delete n.children;
        else clean(n.children);
      });
    }
    clean(roots);
    categoryTreeOptions.value = roots;
  }
}
</script>

<template>
  <div class="p-16px">
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-20px font-bold">积分商城商品管理</h2>
      <NButton v-permission="'mall.goods.create'" type="primary" @click="openModal()">
        <SvgIcon icon="ph:plus" class="mr-4px" />
        新增商品
      </NButton>
    </div>

    <!-- 搜索栏 -->
    <NCard :bordered="false" class="card-wrapper mb-16px" content-style="padding: 12px 16px;">
      <div class="flex items-center gap-12px">
        <NInput v-model:value="keyword" placeholder="搜索商品名称或ID..." clearable size="small" class="flex-1">
          <template #prefix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template>
        </NInput>
        <NTreeSelect v-model:value="categoryFilter" :options="categoryFilterTreeOptions" size="small" class="w-140px" placeholder="全部分类" clearable />
        <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" class="w-120px" />
        <NButton size="small" @click="loadData">
          <SvgIcon icon="ph:funnel" class="mr-4px" />
          筛选
        </NButton>
      </div>
    </NCard>

    <!-- 表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="data" :bordered="false" size="small" :scroll-x="950" />
      <div class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">显示 1 到 {{ data.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="Math.ceil(totalRecords / pageSize) || 1" />
      </div>
    </NCard>

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 600px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NGrid :x-gap="16" :cols="2">
          <NGridItem>
            <NFormItem label="商品名称">
              <NInput v-model:value="formData.name" placeholder="请输入商品名称" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="商品分类">
              <NTreeSelect v-model:value="formData.categoryId" :options="categoryTreeOptions" placeholder="选择分类" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="所需积分">
              <NInputNumber v-model:value="formData.points" placeholder="请输入所需积分" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="市场价格">
              <NInputNumber v-model:value="formData.price" placeholder="请输入市场价格" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="库存数量">
              <NInputNumber v-model:value="formData.stock" placeholder="请输入库存数量" :min="0" class="w-full" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <NFormItem label="商品描述">
          <NInput v-model:value="formData.description" type="textarea" :rows="4" placeholder="请输入商品描述" />
        </NFormItem>

        <NFormItem label="商品图片">
          <ImageUpload v-model="formData.image" />
        </NFormItem>

        <NGrid :x-gap="16" :cols="2">
          <NGridItem>
            <NFormItem label="排序权重">
              <NInputNumber v-model:value="formData.sort" class="w-full" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem label="商品状态">
              <NSelect v-model:value="formData.status" :options="statusFormOptions" />
            </NFormItem>
          </NGridItem>
        </NGrid>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSaveGoods">确认添加</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
