<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NPagination, NModal, NSpace,
  NSwitch, NRadio, NRadioGroup, NDatePicker, NDataTable, NTag, NTabs, NTabPane, useDialog
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchNewsList, fetchNewsDetail, createNews, updateNews, deleteNews, fetchNewsCategories, createNewsCategory, updateNewsCategory, deleteNewsCategory } from '@/service/api';
import ImageUpload from '@/components/common/ImageUpload.vue';
import RichTextEditor from '@/components/common/RichTextEditor.vue';
import { useAuthStore } from '@/store/modules/auth';
import { useLanguageEditor } from '@/hooks/business/useLanguageEditor';

defineOptions({ name: 'ContentNewsPage' });
const dialog = useDialog();
const authStore = useAuthStore();

// 多语言编辑器
const {
  currentLang,
  locales,
  formFields,
  switchLang,
  initEditor,
  buildPayload,
  loadLocales
} = useLanguageEditor({ fields: ['title', 'content'] });

const searchKeyword = ref('');
const statusFilter = ref('' as string);
const categoryFilter = ref('' as string);
const statusOptions = [
  { label: '全部状态', value: '' }, { label: '已发布', value: 'published' }, { label: '草稿', value: 'draft' }
];

const loading = ref(false);
const categories = ref<any[]>([]);
const categoryOptions = ref([{ label: '全部分类', value: null }]);

async function loadCategories() {
  const { data, error } = await fetchNewsCategories();
  if (!error) {
    const list = data.list || data || [];
    categories.value = list;
    categoryOptions.value = [{ label: '全部分类', value: '' }, ...list.map((c: any) => ({ label: c.name || c, value: String(c.id || c) }))];
  }
}

const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);

interface NewsRecord {
  id: number; title: string; coverImage: string; categoryId: number;
  category: any; isTop: boolean; status: 'published' | 'draft';
  publishedAt: string; content: string; contentType: string;
}
const records = ref<NewsRecord[]>([]);

const statusMap: Record<string, { type: 'success' | 'warning'; label: string }> = {
  published: { type: 'success', label: '已发布' },
  draft: { type: 'warning', label: '草稿' }
};

// ========== 新闻列表表格列 ==========
const newsColumns = computed<DataTableColumns>(() => [
  { title: '序号', key: '_index', width: 50, align: 'center', render: (_row, index) => index + 1 },
  {
    title: '封面图', key: 'coverImage', width: 100,
    render: (row) => {
      const r = row as NewsRecord;
      return r.coverImage
        ? h('img', { src: r.coverImage, style: 'width:80px;height:50px;object-fit:cover;border-radius:6px;border:1px solid #e8e8ec;' })
        : h('div', { style: 'width:80px;height:50px;background:#f0f0f5;border-radius:6px;display:flex;align-items:center;justify-content:center;border:1px solid #e8e8ec;' }, [h('span', { style: 'font-size:11px;opacity:0.3;' }, '无图')]);
    }
  },
  { title: '标题', key: 'title', minWidth: 150, render: (row) => h('span', { style: 'font-weight:bold;' }, { default: () => row.title }) },
  {
    title: '分类', key: 'category', width: 100,
    render: (row) => {
      const r = row as any;
      // 兼容多种可能的数据结构
      if (r.category && typeof r.category === 'object') return r.category.name || '--';
      if (r.categoryName) return r.categoryName;
      return '--';
    }
  },
  {
    title: '置顶', key: 'isTop', width: 50, align: 'center',
    render: (row) => {
      const v = (row as any).isTop;
      return (v === true || v === 1) ? '是' : '否';
    }
  },
  {
    title: '状态', key: 'status', width: 70, align: 'center',
    render: (row) => {
      const s = statusMap[(row as NewsRecord).status] || { type: 'default' as const, label: (row as NewsRecord).status };
      return h(NTag, { type: s.type, size: 'small', bordered: false }, () => s.label);
    }
  },
  {
    title: '语言', key: 'locales', width: 120,
    render: (row) => {
      const locales = (row as any).locales || ['zh-CN'];
      return h(NSpace, { size: 4 }, () => locales.map((code: string) => h(NTag, { size: 'tiny', bordered: false }, () => code)));
    }
  },
  { title: '发布时间', key: 'publishedAt', width: 150, render: (row) => (row as any).publishedAt || (row as any).createdAt || '--' },
  {
    title: '操作', key: 'action', width: 100, align: 'center',
    render: (row) => h(NSpace, { size: 4, justify: 'center' }, () => [
      authStore.hasPermission('content.news.edit') ? h(NButton, { size: 'tiny', quaternary: true, type: 'primary', onClick: () => openEdit(row as NewsRecord) }, () => '编辑') : null,
      authStore.hasPermission('content.news.delete') ? h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row as NewsRecord) }, () => '删除') : null
    ])
  }
]);

// ========== 分类管理表格列 ==========
const categoryColumns: DataTableColumns = [
  {
    title: '分类名称', key: 'name', minWidth: 200,
    render: (row) => h(NInput, {
      value: (row as any).name || '',
      'onUpdate:value': (v: string) => { (row as any).name = v; },
      onBlur: async () => {
        const cat = row as any;
        if (cat.id && cat.name) {
          const { error } = await updateNewsCategory(cat.id, { name: cat.name });
          if (!error) { window.$message?.success('已保存'); loadCategories(); loadData(); }
          else { window.$message?.error(error?.msg || '保存失败'); }
        }
      }
    })
  },
  {
    title: '操作', key: 'action', width: 60, align: 'center',
    render: (_row, index) => h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => removeCategory(index) }, () => '删除')
  }
];

// ========== 发布新闻弹窗 ==========
const publishVisible = ref(false);
const editingNewsId = ref<number | null>(null);
const publishForm = ref({
  title: '', categoryId: null as number | null, coverImage: '',
  contentType: 'original' as 'original' | 'external', content: '',
  externalTitle: '', externalUrl: '', summary: '',
  isTop: false, status: 'published' as 'published' | 'draft', publishedAt: null as number | null
});

function openPublish() {
  editingNewsId.value = null;
  publishForm.value = { title: '', categoryId: null, coverImage: '', contentType: 'original', content: '', externalTitle: '', externalUrl: '', summary: '', isTop: false, status: 'published', publishedAt: null };
  // 初始化多语言编辑器（新建时主字段为空，无翻译数据）
  initEditor({ title: '', content: '' }, {});
  publishVisible.value = true;
}

async function openEdit(r: NewsRecord) {
  editingNewsId.value = r.id;
  const row = r as any;
  publishForm.value = {
    title: r.title,
    categoryId: r.categoryId || null,
    coverImage: r.coverImage || '',
    contentType: r.contentType as any || 'original',
    content: r.content || '',
    externalTitle: row.externalTitle || '',
    externalUrl: row.externalUrl || '',
    summary: row.summary || '',
    isTop: !!r.isTop,
    status: r.status,
    publishedAt: r.publishedAt ? new Date(r.publishedAt).getTime() : null
  };
  // 获取详情（含 translations）
  const { data, error } = await fetchNewsDetail(r.id);
  if (!error && data) {
    const detail = data as any;
    publishForm.value.content = detail.content || r.content || '';
    // 初始化多语言编辑器
    initEditor(
      { title: detail.title || r.title || '', content: detail.content || r.content || '' },
      detail.translations || {}
    );
  } else {
    // 接口失败时用列表数据初始化
    initEditor({ title: r.title || '', content: r.content || '' }, {});
  }
  publishVisible.value = true;
}

// ========== 分类管理弹窗 ==========
const categoryVisible = ref(false);
const newCategoryName = ref('');

function openCategoryManage() { newCategoryName.value = ''; loadCategories(); categoryVisible.value = true; }

async function addCategory() {
  if (newCategoryName.value.trim()) {
    const { error } = await createNewsCategory({ name: newCategoryName.value.trim() });
    if (!error) { window.$message?.success('添加成功'); newCategoryName.value = ''; await loadCategories(); loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  }
}

async function removeCategory(index: number) {
  const cat = categories.value[index];
  const catId = cat?.id || cat;
  const { error } = await deleteNewsCategory(catId);
  if (!error) { window.$message?.success('删除成功'); await loadCategories(); loadData(); }
  else { window.$message?.error(error?.msg || '操作失败'); }
}

function handleDelete(r: NewsRecord) {
  dialog.warning({
    title: '确认删除', content: `确定要删除新闻"${r.title}"吗？`,
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteNews(r.id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error(error?.msg || '操作失败'); }
    }
  });
}

async function handleSaveNews() {
  // 构建多语言 payload
  const { zhFields, translationsJson } = buildPayload();

  const payload: Record<string, any> = { ...publishForm.value };
  // 用多语言编辑器中的 zh-CN 字段覆盖主字段
  payload.title = zhFields.title || '';
  payload.content = zhFields.content || '';
  // 将 translations 序列化为 JSON 字符串后提交（避免 axios 拦截器转换 key）
  payload.translations = translationsJson;

  // 转换日期时间戳为字符串
  if (payload.publishedAt && typeof payload.publishedAt === 'number') {
    payload.publishedAt = new Date(payload.publishedAt).toISOString().slice(0, 19).replace('T', ' ');
  }
  if (editingNewsId.value) {
    const { error } = await updateNews(editingNewsId.value, payload);
    if (!error) { window.$message?.success('更新成功'); publishVisible.value = false; loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  } else {
    const { error } = await createNews(payload);
    if (!error) { window.$message?.success('发布成功'); publishVisible.value = false; loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  }
}

async function loadData() {
  loading.value = true;
  const { data, error } = await fetchNewsList({ title: searchKeyword.value, status: statusFilter.value, category_id: categoryFilter.value, page: currentPage.value, page_size: pageSize });
  loading.value = false;
  if (!error) { records.value = data.list || []; totalRecords.value = data.total || 0; }
  else { window.$message?.error(error?.msg || '加载失败'); }
}

watch(currentPage, loadData);
onMounted(() => { loadCategories(); loadData(); loadLocales(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between mb-16px">
        <h2 class="text-18px font-bold m-0">新闻管理</h2>
        <div class="flex gap-8px">
          <NButton v-permission="'content.news.category'" @click="openCategoryManage"><SvgIcon icon="ph:tag" class="mr-4px" />分类管理</NButton>
          <NButton v-permission="'content.news.create'" type="primary" @click="openPublish">+ 发布新闻</NButton>
        </div>
      </div>
      <div class="flex items-center gap-8px mb-16px">
        <NInput v-model:value="searchKeyword" placeholder="搜索标题..." autosize class="w-280px"><template #prefix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template></NInput>
        <NSelect v-model:value="statusFilter" :options="statusOptions" class="w-120px" />
        <NSelect v-model:value="categoryFilter" :options="categoryOptions" class="w-120px" />
        <NButton @click="loadData">
          <template #icon><SvgIcon icon="ph:magnifying-glass" /></template>
          搜索
        </NButton>
      </div>

      <NDataTable :columns="newsColumns" :data="records" :bordered="false" size="small" :scroll-x="740" :loading="loading" />

      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 发布新闻弹窗 -->
    <NModal v-model:show="publishVisible" preset="card" title="发布新闻" style="width: 600px;" :bordered="false">
      <div class="flex flex-col gap-18px">
        <!-- 多语言 Tab 栏 -->
        <NTabs :value="currentLang" type="line" size="small" @update:value="switchLang">
          <NTabPane v-for="locale in locales" :key="locale.code" :name="locale.code" :tab="locale.label" />
        </NTabs>

        <div><div class="text-13px font-500 mb-6px">新闻标题</div><NInput v-model:value="formFields.title" placeholder="请输入新闻标题" /></div>
        <div><div class="text-13px font-500 mb-6px">所属分类</div><NSelect v-model:value="publishForm.categoryId" :options="categories.map(c => ({ label: c.name, value: c.id }))" placeholder="请选择分类" /></div>
        <div>
          <div class="text-13px font-500 mb-6px">封面图片</div>
          <ImageUpload v-model="publishForm.coverImage" width="160px" height="100px" />
          <div class="text-11px op-40 mt-4px">支持 JPG, PNG 格式，大小不超过 2MB</div>
        </div>
        <div><div class="text-13px font-500 mb-8px">内容类型</div><NRadioGroup v-model:value="publishForm.contentType"><NRadio value="original">原创内容</NRadio><NRadio value="external" class="ml-16px">引用外链</NRadio></NRadioGroup></div>
        <div v-if="publishForm.contentType === 'original'">
          <div class="text-13px font-500 mb-6px">新闻内容</div>
          <RichTextEditor v-model="formFields.content" placeholder="请输入新闻内容..." height="300px" />
        </div>
        <template v-if="publishForm.contentType === 'external'">
          <div><div class="text-13px font-500 mb-6px">外链标题</div><NInput v-model:value="publishForm.externalTitle" placeholder="输入外链新闻标题" /></div>
          <div><div class="text-13px font-500 mb-6px">外链地址</div><NInput v-model:value="publishForm.externalUrl" placeholder="https://example.com/news" /></div>
          <div><div class="text-13px font-500 mb-6px">摘要说明</div><NInput v-model:value="publishForm.summary" type="textarea" :rows="3" placeholder="简要描述外链内容..." /></div>
        </template>
        <div class="flex gap-24px">
          <div><div class="text-13px font-500 mb-6px">置顶</div><div class="flex items-center gap-8px"><NSwitch v-model:value="publishForm.isTop" /><span class="text-13px op-60">设为置顶</span></div></div>
          <div><div class="text-13px font-500 mb-8px">状态</div><NRadioGroup v-model:value="publishForm.status"><NRadio value="published">已发布</NRadio><NRadio value="draft" class="ml-12px">草稿</NRadio></NRadioGroup></div>
        </div>
        <div><div class="text-13px font-500 mb-6px">发布时间</div><NDatePicker v-model:value="publishForm.publishedAt" type="datetime" placeholder="-/-/- --:--" class="w-full" /></div>
      </div>
      <template #footer><NSpace justify="end"><NButton @click="publishVisible = false">取消</NButton><NButton type="primary" @click="handleSaveNews">发布</NButton></NSpace></template>
    </NModal>

    <!-- 分类管理弹窗 -->
    <NModal v-model:show="categoryVisible" preset="card" title="分类管理" style="width: 520px;" :bordered="false">
      <div class="mb-20px">
        <div class="text-14px font-500 mb-10px">添加新分类</div>
        <div class="flex gap-8px">
          <NInput v-model:value="newCategoryName" placeholder="输入分类名称" class="flex-1" />
          <NButton type="primary" @click="addCategory">+ 添加</NButton>
        </div>
      </div>
      <div>
        <div class="text-14px font-500 mb-10px">现有分类</div>
        <NDataTable :columns="categoryColumns" :data="categories" :bordered="false" size="small" />
      </div>
      <template #footer><NSpace justify="end"><NButton type="primary" @click="categoryVisible = false">保存更改</NButton></NSpace></template>
    </NModal>
  </div>
</template>

<style scoped>
</style>
