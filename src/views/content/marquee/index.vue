<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NInputNumber, NPagination,
  NModal, NSpace, NSwitch, NDataTable, NTag, NTabs, NTabPane, useDialog
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchMarquees, fetchMarqueeDetail, createMarquee, updateMarquee, deleteMarquee, toggleMarquee } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { useLanguageEditor } from '@/hooks/business/useLanguageEditor';

defineOptions({ name: 'ContentMarqueePage' });
const dialog = useDialog();
const authStore = useAuthStore();

// 多语言编辑器（可翻译字段：content）
const {
  currentLang, locales, formFields, switchLang, initEditor, buildPayload, loadLocales
} = useLanguageEditor({ fields: ['content'] });

const searchKeyword = ref('');
const statusFilter = ref('' as string);
const statusFilterOptions = [
  { label: '全部', value: '' }, { label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }
];

const loading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);

interface MarqueeRecord {
  id: number; index: number; content: string; sort: number; status: boolean;
  createdAt: string; link: string; remark: string; translations?: any;
}
const records = ref<MarqueeRecord[]>([]);

// 排序值变更，防抖保存到后端
let _sortTimer: ReturnType<typeof setTimeout> | null = null;
async function handleSortChange(r: MarqueeRecord, sort: number) {
  if (_sortTimer) clearTimeout(_sortTimer);
  _sortTimer = setTimeout(async () => {
    const { error } = await updateMarquee((r as any).id, { sort });
    if (!error) { window.$message?.success('排序已更新'); loadData(); }
    else { window.$message?.error(error?.msg || '排序更新失败'); }
  }, 500);
}

const columns = computed<DataTableColumns>(() => [
  { title: '序号', key: '_index', width: 50, align: 'center', render: (_row, index) => index + 1 },
  { title: '消息内容', key: 'content', minWidth: 200 },
  { title: '链接地址', key: 'link', minWidth: 160, ellipsis: { tooltip: true } },
  { title: '备注', key: 'remark', minWidth: 120, ellipsis: { tooltip: true } },
  { title: '排序顺序', key: 'sort', width: 120, align: 'center',
    render: (row) => h(NInputNumber, {
      value: (row as MarqueeRecord).sort,
      size: 'small',
      min: 1,
      buttonPlacement: 'both',
      style: 'width: 100px',
      'onUpdate:value': (v: number | null) => {
        if (v !== null) {
          (row as MarqueeRecord).sort = v;
          handleSortChange(row as MarqueeRecord, v);
        }
      }
    })
  },
  {
    title: '状态', key: 'status', width: 70, align: 'center',
    render: (row) => h(NSwitch, { value: (row as MarqueeRecord).status, 'onUpdate:value': (v: boolean) => { (row as MarqueeRecord).status = v; } })
  },
  {
    title: '语言', key: 'locales', width: 120,
    render: (row) => {
      const locales = (row as any).locales || ['zh-CN'];
      return h(NSpace, { size: 4 }, () => locales.map((code: string) => h(NTag, { size: 'tiny', bordered: false }, () => code)));
    }
  },
  { title: '创建时间', key: 'createdAt', width: 160 },
  {
    title: '操作', key: 'action', width: 120, align: 'center',
    render: (row) => h(NSpace, { size: 4, justify: 'center' }, () => [
      authStore.hasPermission('content.marquee.edit') ? h(NButton, { size: 'tiny', quaternary: true, onClick: () => openEdit(row as MarqueeRecord) }, () => '编辑') : null,
      authStore.hasPermission('content.marquee.delete') ? h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row as MarqueeRecord) }, () => '删除') : null
    ])
  }
]);

const editVisible = ref(false);
const editTitle = ref('新增轮播消息');
const isEdit = ref(false);
const editIndex = ref(-1);
const editForm = ref({ sort: 50, status: true, link: '', remark: '' });
const contentError = ref(false);
const contentLength = computed(() => (formFields.value.content || '').length);

function openCreate() {
  editTitle.value = '新增轮播消息'; isEdit.value = false;
  editForm.value = { sort: 50, status: true, link: '', remark: '' };
  initEditor({ content: '' }, {});
  contentError.value = false; editVisible.value = true;
}

async function openEdit(r: MarqueeRecord) {
  editTitle.value = '编辑轮播消息'; isEdit.value = true; editIndex.value = r.id;
  editForm.value = { sort: r.sort, status: r.status, link: r.link, remark: r.remark };
  contentError.value = false;

  // 从详情接口获取完整 translations 数据
  const { data, error } = await fetchMarqueeDetail(r.id);
  if (!error && data) {
    const translations = data.translations || {};
    initEditor({ content: data.content || '' }, translations);
  } else {
    initEditor({ content: r.content || '' }, {});
  }
  editVisible.value = true;
}

async function handleSubmit() {
  if (!formFields.value.content.trim() && currentLang.value === 'zh-CN') {
    contentError.value = true; return;
  }
  contentError.value = false;

  // 构建多语言 payload
  const { zhFields, translationsJson } = buildPayload();

  const payload: Record<string, any> = {
    content: zhFields.content,
    sort: editForm.value.sort,
    status: editForm.value.status,
    link: editForm.value.link,
    remark: editForm.value.remark,
    translations: translationsJson
  };

  if (isEdit.value) {
    const { error } = await updateMarquee(editIndex.value, payload);
    if (!error) { window.$message?.success('更新成功'); editVisible.value = false; loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  } else {
    const { error } = await createMarquee(payload);
    if (!error) { window.$message?.success('创建成功'); editVisible.value = false; loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  }
}

function handleDelete(r: MarqueeRecord) {
  dialog.warning({
    title: '确认删除', content: '确定要删除该轮播消息吗？',
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteMarquee((r as any).id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error(error?.msg || '操作失败'); }
    }
  });
}

async function loadData() {
  loading.value = true;
  const params: Record<string, any> = { page: currentPage.value, page_size: pageSize };
  if (searchKeyword.value) params.keyword = searchKeyword.value;
  if (statusFilter.value) params.status = statusFilter.value;
  const { data, error } = await fetchMarquees(params);
  loading.value = false;
  if (!error) { records.value = data.list || []; totalRecords.value = data.total || 0; }
  else { window.$message?.error(error?.msg || '加载失败'); }
}

watch(currentPage, loadData);
onMounted(() => { loadLocales(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between mb-16px">
        <h2 class="text-18px font-bold m-0">轮播消息管理</h2>
        <NButton v-permission="'content.marquee.create'" type="primary" @click="openCreate">+ 新增轮播消息</NButton>
      </div>
      <div class="flex items-center gap-8px mb-16px">
        <NInput v-model:value="searchKeyword" autosize placeholder="按消息内容搜索" class="w-300px"><template #prefix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template></NInput>
        <NSelect v-model:value="statusFilter" :options="statusFilterOptions" size="medium" class="w-100px" />
        <NButton size="medium" @click="loadData">
          <template #icon><SvgIcon icon="ph:magnifying-glass" /></template>
          搜索
        </NButton>
      </div>

      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="1000" :loading="loading" />

      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ records.length }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <NModal v-model:show="editVisible" preset="card" :title="editTitle" style="width: 520px;" :bordered="false">
      <div class="flex flex-col gap-18px">
        <!-- Language Tab -->
        <NTabs v-if="locales.length > 1" :value="currentLang" type="segment" size="small" @update:value="switchLang">
          <NTabPane v-for="locale in locales" :key="locale.code" :name="locale.code" :tab="locale.label" />
        </NTabs>

        <div>
          <div class="text-13px font-500 mb-6px">
            消息内容
            <span v-if="currentLang === 'zh-CN'" style="color:#d03050;">*</span>
          </div>
          <NInput v-model:value="formFields.content" type="textarea" :rows="3" placeholder="请输入走马灯展示的文字，建议不超过 80 字" :maxlength="100" :status="contentError ? 'error' : undefined" />
          <div class="flex items-center justify-between mt-4px">
            <span v-if="contentError" class="text-11px" style="color:#d03050;">请输入消息内容</span><span v-else></span>
            <span class="text-11px op-40">{{ contentLength }}/100</span>
          </div>
        </div>

        <!-- 以下字段仅在 zh-CN 时显示（非翻译字段） -->
        <template v-if="currentLang === 'zh-CN'">
          <div><div class="text-13px font-500 mb-6px">排序顺序 <span style="color:#d03050;">*</span></div><NInputNumber v-model:value="editForm.sort" :min="1" class="w-full" /><div class="text-11px op-40 mt-4px">数值越小越靠前滚动</div></div>
          <div><div class="text-13px font-500 mb-6px">状态</div><div class="flex items-center gap-8px"><NSwitch v-model:value="editForm.status" /><span class="text-13px">启用</span></div></div>
          <div><div class="text-13px font-500 mb-6px">链接地址</div><NInput v-model:value="editForm.link" placeholder="https://... 用户点击走马灯后可跳转（不填则不跳转）" /></div>
          <div><div class="text-13px font-500 mb-6px">备注</div><NInput v-model:value="editForm.remark" placeholder="仅后台使用，前台不展示" /></div>
        </template>
      </div>
      <template #footer><NSpace justify="end"><NButton @click="editVisible = false">取消</NButton><NButton type="primary" @click="handleSubmit">确定</NButton></NSpace></template>
    </NModal>
  </div>
</template>
