<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { NCard, NButton, NInput, NSelect, NModal, NSpace, NSwitch, NDataTable, useDialog } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchStaticPages, createStaticPage, updateStaticPage, deleteStaticPage } from '@/service/api';
import RichTextEditor from '@/components/common/RichTextEditor.vue';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'ContentAboutPage' });
const dialog = useDialog();
const authStore = useAuthStore();

const searchKeyword = ref('');
const statusFilter = ref('');
const statusOptions = [
  { label: '全部状态', value: '' }, { label: '已发布', value: '1' }, { label: '草稿', value: '0' }
];

interface PageRecord { slug: string; pageName: string; title: string; content: string; status: boolean; updatedAt: string; locales?: string[]; translations?: Record<string, { title: string; content: string }>; }
const records = ref<PageRecord[]>([]);
const loading = ref(false);

// 支持的语言列表
const LOCALES = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ar', label: 'العربية' },
  { code: 'bn', label: 'বাংলা' }
];

const columns = ref<DataTableColumns>([
  { title: '页面标识', key: 'slug', width: 100, render: (row) => h('span', { style: 'font-weight:bold;' }, { default: () => (row as PageRecord).slug }) },
  { title: '页面名称', key: 'pageName', width: 120 },
  { title: '标题', key: 'title', width: 160 },
  {
    title: '语言', key: 'locales', width: 160,
    render: (row) => {
      const locales = (row as any).locales || ['zh-CN'];
      return h('div', { style: 'display:flex;gap:4px;flex-wrap:wrap;' }, locales.map((l: string) =>
        h('span', { style: 'font-size:11px;background:#e8f4ff;color:#2080f0;padding:1px 6px;border-radius:3px;' }, { default: () => l })
      ));
    }
  },
  {
    title: '状态', key: 'status', width: 70, align: 'center',
    render: (row) => h(NSwitch, {
      value: (row as PageRecord).status,
      'onUpdate:value': (v: boolean) => handleToggleStatus(row as PageRecord, v)
    })
  },
  { title: '更新时间', key: 'updatedAt', width: 150 },
  {
    title: '操作', key: 'action', width: 130, align: 'center',
    render: (row) => h(NSpace, { size: 4 }, () => [
      authStore.hasPermission('content.about.edit') ? h(NButton, { size: 'tiny', quaternary: true, type: 'primary', onClick: () => openEdit(row as PageRecord) }, () => '编辑') : null,
      h(NButton, { size: 'tiny', quaternary: true, onClick: () => openPreview(row as PageRecord) }, () => '预览'),
      authStore.hasPermission('content.about.delete') ? h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row as PageRecord) }, () => '删除') : null
    ])
  }
]);

// ========== 新增页面 ==========
const addVisible = ref(false);
const addForm = ref({ slug: '', pageName: '', title: '', content: '', status: true });

function openAdd() {
  addForm.value = { slug: '', pageName: '', title: '', content: '', status: true };
  addVisible.value = true;
}

async function handleAdd() {
  if (!addForm.value.slug || !addForm.value.pageName || !addForm.value.title) {
    window.$message?.warning('请填写页面标识、页面名称和标题');
    return;
  }
  const payload = {
    slug: addForm.value.slug,
    page_name: addForm.value.pageName,
    title: addForm.value.title,
    content: addForm.value.content,
    status: addForm.value.status ? 1 : 0
  };
  const { error } = await createStaticPage(payload);
  if (!error) {
    window.$message?.success('创建成功');
    addVisible.value = false;
    loadData();
  } else {
    window.$message?.error(error?.msg || '创建失败');
  }
}

// ========== 编辑页面 ==========
const editVisible = ref(false);
const editRecord = ref<PageRecord | null>(null);
const editForm = ref({ title: '', content: '', status: true });
const editTranslations = ref<Record<string, { title: string; content: string }>>({});
const editLang = ref('zh-CN');

async function openEdit(r: PageRecord) {
  editRecord.value = r;
  editLang.value = 'zh-CN';
  editForm.value = { title: r.title, content: r.content, status: r.status };

  // 从接口获取完整数据（含 translations）
  const { fetchStaticPage } = await import('@/service/api');
  const { data, error } = await fetchStaticPage(r.slug);
  if (!error && data) {
    editForm.value.title = data.title || r.title;
    editForm.value.content = data.content || r.content;
    editTranslations.value = data.translations || {};
  } else {
    editTranslations.value = {};
  }

  editVisible.value = true;
}

// 切换语言 Tab 时保存当前语言内容
function switchEditLang(lang: string) {
  // 保存当前语言的内容
  saveCurrentLangContent();
  // 切换到新语言
  editLang.value = lang;
  // 加载新语言的内容
  loadLangContent(lang);
}

function saveCurrentLangContent() {
  const lang = editLang.value;
  if (lang === 'zh-CN') {
    // zh-CN 存在主字段中，更新 editRecord 的引用值
    if (editRecord.value) {
      editRecord.value.title = editForm.value.title;
      editRecord.value.content = editForm.value.content;
    }
  } else {
    // 其他语言存在 translations 中
    editTranslations.value[lang] = {
      title: editForm.value.title,
      content: editForm.value.content
    };
  }
}

function loadLangContent(lang: string) {
  if (lang === 'zh-CN') {
    // zh-CN 使用主字段的值（从 editRecord 中恢复原始值，或使用已保存的修改）
    editForm.value.title = editRecord.value?.title || '';
    editForm.value.content = editRecord.value?.content || '';
  } else {
    const trans = editTranslations.value[lang];
    editForm.value.title = trans?.title || '';
    editForm.value.content = trans?.content || '';
  }
}

async function handleSave() {
  if (editRecord.value) {
    // 先保存当前语言的内容
    saveCurrentLangContent();

    const slug = editRecord.value.slug;
    // 如果当前是 zh-CN，主字段用当前编辑的值；否则用 editRecord 中保存的值
    const zhTitle = editLang.value === 'zh-CN' ? editForm.value.title : (editRecord.value.title || '');
    const zhContent = editLang.value === 'zh-CN' ? editForm.value.content : (editRecord.value.content || '');

    // 构建 payload
    const translations = { ...editTranslations.value };
    // 确保 zh-CN 不在 translations 中
    delete translations['zh-CN'];
    // 移除空内容的语言
    Object.keys(translations).forEach(k => {
      if (!translations[k].title && !translations[k].content) {
        delete translations[k];
      }
    });

    const payload: Record<string, any> = {
      title: zhTitle,
      content: zhContent,
      status: editForm.value.status ? 1 : 0,
      // 序列化为 JSON 字符串，避免 axios 转换内部 key（如 zh-TW → zh-_t_w）
      translations: JSON.stringify(translations)
    };

    const { error } = await updateStaticPage(slug, payload);
    if (!error) { window.$message?.success('保存成功'); editVisible.value = false; loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  }
}

// ========== 切换状态 ==========
async function handleToggleStatus(r: PageRecord, v: boolean) {
  const { error } = await updateStaticPage(r.slug, { status: v ? 1 : 0 });
  if (!error) { r.status = v; window.$message?.success('状态已更新'); }
  else { window.$message?.error(error?.msg || '操作失败'); }
}

// ========== 删除页面 ==========
function handleDelete(r: PageRecord) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除页面「${r.pageName}」吗？此操作不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteStaticPage(r.slug);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error(error?.msg || '删除失败'); }
    }
  });
}

// ========== 预览 ==========
const previewVisible = ref(false);
const previewRecord = ref<PageRecord | null>(null);
function openPreview(r: PageRecord) { previewRecord.value = r; previewVisible.value = true; }

// ========== 加载数据 ==========
async function loadData() {
  loading.value = true;
  const { data, error } = await fetchStaticPages({
    keyword: searchKeyword.value || undefined,
    status: statusFilter.value || undefined
  });
  loading.value = false;
  if (!error) { records.value = data.list || data || []; }
  else { window.$message?.error(error?.msg || '加载失败'); }
}

onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between mb-20px">
        <h2 class="text-18px font-bold m-0">静态页面内容管理</h2>
        <div class="flex items-center gap-8px">
          <NInput v-model:value="searchKeyword" placeholder="搜索..." size="small" class="w-180px">
            <template #prefix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template>
          </NInput>
          <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" class="w-140px" />
          <NButton size="small" @click="loadData">
            <template #icon><SvgIcon icon="ph:magnifying-glass" /></template>
            搜索
          </NButton>
          <div class="w-1px h-20px bg-gray-200 mx-8px"></div>
          <NButton v-permission="'content.about.create'" type="primary" size="small" @click="openAdd">
            <template #icon><SvgIcon icon="ph:plus" /></template>
            新增页面
          </NButton>
        </div>
      </div>

      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="860" :loading="loading" />
    </NCard>

    <!-- 新增页面弹窗 -->
    <NModal v-model:show="addVisible" preset="card" title="新增静态页面" style="width: 640px;" :bordered="false">
      <div class="flex flex-col gap-16px">
        <div>
          <div class="text-13px font-500 mb-6px">页面标识 (slug) <span class="text-red-500">*</span></div>
          <NInput v-model:value="addForm.slug" placeholder="如: privacy、terms、faq（英文标识，创建后不可修改）" />
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">页面名称 <span class="text-red-500">*</span></div>
          <NInput v-model:value="addForm.pageName" placeholder="如: 隐私政策、用户协议" />
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">页面标题 <span class="text-red-500">*</span></div>
          <NInput v-model:value="addForm.title" placeholder="请输入页面标题" />
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">状态</div>
          <NSwitch v-model:value="addForm.status">
            <template #checked>已发布</template>
            <template #unchecked>草稿</template>
          </NSwitch>
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">页面内容</div>
          <RichTextEditor v-model="addForm.content" placeholder="请输入页面内容..." height="300px" />
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="addVisible = false">取消</NButton>
          <NButton type="primary" @click="handleAdd">创建</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 编辑页面弹窗 -->
    <NModal v-model:show="editVisible" preset="card" :title="editRecord ? '编辑 - ' + editRecord.pageName : '编辑'" style="width: 700px;" :bordered="false">
      <div class="flex flex-col gap-16px">
        <!-- 语言 Tab -->
        <div class="lang-tab-bar">
          <span
            v-for="loc in LOCALES" :key="loc.code"
            class="lang-tab" :class="{ active: editLang === loc.code }"
            @click="switchEditLang(loc.code)"
          >{{ loc.label }}</span>
        </div>

        <div>
          <div class="text-13px font-500 mb-6px">页面标题 <span class="text-11px op-40">({{ editLang }})</span></div>
          <NInput v-model:value="editForm.title" placeholder="请输入标题" />
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">状态</div>
          <NSwitch v-model:value="editForm.status">
            <template #checked>已发布</template>
            <template #unchecked>草稿</template>
          </NSwitch>
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">页面内容 <span class="text-11px op-40">({{ editLang }})</span></div>
          <RichTextEditor v-model="editForm.content" placeholder="请输入页面内容..." height="320px" :key="editLang" />
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="editVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSave">保存所有语言</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 预览弹窗 -->
    <NModal v-model:show="previewVisible" preset="card" :title="previewRecord ? '预览 - ' + previewRecord.pageName : '预览'" style="width: 640px;" :bordered="false">
      <template v-if="previewRecord">
        <div class="text-15px font-bold mb-12px">{{ previewRecord.title }}</div>
        <div class="text-12px op-50 mb-16px">最后更新: {{ previewRecord.updatedAt }}</div>
        <div class="preview-content" v-html="previewRecord.content"></div>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton type="primary" @click="previewVisible = false">关闭</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.preview-content { padding: 16px; background: #f8f9fc; border-radius: 8px; min-height: 200px; line-height: 1.8; font-size: 14px; }
.lang-tab-bar { display: flex; gap: 0; border-bottom: 1px solid #eee; margin-bottom: 4px; flex-wrap: wrap; }
.lang-tab { padding: 6px 14px; font-size: 13px; color: #666; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
.lang-tab.active { color: #2080f0; border-bottom-color: #2080f0; font-weight: 500; }
.lang-tab:hover { color: #2080f0; }
</style>
