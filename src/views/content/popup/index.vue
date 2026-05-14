<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NInputNumber, NPagination, NSelect, NCheckboxGroup, NCheckbox, NSwitch,
  NModal, NRadio, NRadioGroup, NDatePicker, NDataTable, NTag, NSpace, NTabs, NTabPane, useDialog
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchPopups, fetchPopupDetail, createPopup, updatePopup, deletePopup, fetchLevels } from '@/service/api';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { useAuthStore } from '@/store/modules/auth';
import { useLanguageEditor } from '@/hooks/business/useLanguageEditor';

defineOptions({ name: 'ContentPopupPage' });
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
} = useLanguageEditor({ fields: ['title', 'text_content'] });

const searchKeyword = ref('');
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);

interface PopupRecord {
  id: number; title: string; contentType: 'image' | 'text'; image: string;
  textContent: string; targetType: string; targetValue: string;
  frequency: string; timeType: string; startAt: string; endAt: string;
  sort: number; status: boolean; createdAt: string;
}
const records = ref<PopupRecord[]>([]);

const frequencyMap: Record<string, string> = {
  every: '每次打开首页', reopen: '重开浏览器后', '24h': '24小时后'
};
const targetTypeMap: Record<string, string> = {
  all: '所有玩家', level: '按等级', specific: '指定玩家'
};

const columns = computed<DataTableColumns>(() => [
  {
    title: '预览', key: 'title', width: 200,
    render: (row) => {
      const r = row as PopupRecord;
      return h('div', { style: 'display:flex;align-items:center;gap:10px;' }, [
        r.image
          ? h('img', { src: r.image, style: 'width:48px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #e8e8ec;flex-shrink:0;' })
          : h('div', { style: 'width:48px;height:36px;background:#f0f0f5;border-radius:4px;display:flex;align-items:center;justify-content:center;border:1px solid #e8e8ec;flex-shrink:0;' }),
        h('div', {}, [
          h('div', { style: 'font-size:13px;font-weight:bold;' }, { default: () => r.title || '--' }),
          ...(r.textContent ? [h('div', { style: 'font-size:11px;opacity:0.5;' }, { default: () => r.textContent.substring(0, 20) })] : [])
        ])
      ]);
    }
  },
  { title: '类型', key: 'contentType', width: 60, render: (row) => (row as PopupRecord).contentType === 'image' ? '图片' : '文字' },
  { title: '显示对象', key: 'targetType', width: 100, render: (row) => targetTypeMap[(row as PopupRecord).targetType] || (row as PopupRecord).targetType },
  { title: '触发频率', key: 'frequency', width: 120, render: (row) => frequencyMap[(row as PopupRecord).frequency] || (row as PopupRecord).frequency },
  {
    title: '有效期', key: 'timeType', width: 180,
    render: (row) => {
      const r = row as PopupRecord;
      if (r.timeType === 'forever') return '长期';
      return (r.startAt || '--') + ' ~ ' + (r.endAt || '--');
    }
  },
  { title: '排序', key: 'sort', width: 50, align: 'center' },
  {
    title: '状态', key: 'status', width: 70, align: 'center',
    render: (row) => {
      const v = (row as PopupRecord).status;
      return h(NTag, { type: v ? 'success' : 'default', size: 'small', bordered: false }, () => v ? '启用' : '禁用');
    }
  },
  {
    title: '语言', key: 'locales', width: 120,
    render: (row) => {
      const locales = (row as any).locales || ['zh-CN'];
      return h(NSpace, { size: 4 }, () => locales.map((code: string) => h(NTag, { size: 'tiny', bordered: false }, () => code)));
    }
  },
  {
    title: '操作', key: 'action', width: 100, align: 'center',
    render: (row) => h(NSpace, { size: 4, justify: 'center' }, () => [
      authStore.hasPermission('content.popup.edit') ? h(NButton, { size: 'tiny', quaternary: true, type: 'primary', onClick: () => openEdit(row as PopupRecord) }, () => '编辑') : null,
      authStore.hasPermission('content.popup.delete') ? h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => handleDelete(row as PopupRecord) }, () => '删除') : null
    ])
  }
]);

const configVisible = ref(false);
const editingPopupId = ref<number | null>(null);
const levels = ref<any[]>([]);
const configForm = ref({
  contentType: 'image' as 'image' | 'text', image: '', sort: 1,
  frequency: 'every' as 'every' | 'reopen' | '24h', targetType: 'all' as 'all' | 'level' | 'specific',
  targetLevelIds: [] as number[], playerIds: '', timeType: 'forever' as 'forever' | 'range', startTime: null as number | null, endTime: null as number | null,
  status: true
});

async function loadLevels() {
  const { data, error } = await fetchLevels();
  if (!error) { levels.value = data.list || data || []; }
}

function openCreate() {
  editingPopupId.value = null;
  configForm.value = { contentType: 'image', image: '', sort: 1, frequency: 'every', targetType: 'all', targetLevelIds: [], playerIds: '', timeType: 'forever', startTime: null, endTime: null, status: true };
  // 初始化多语言编辑器（新建时主字段为空，无翻译数据）
  initEditor({ title: '', text_content: '' }, {});
  loadLevels();
  configVisible.value = true;
}

async function openEdit(r: PopupRecord) {
  editingPopupId.value = r.id;
  configForm.value = {
    contentType: r.contentType, image: r.image || '',
    sort: r.sort, frequency: r.frequency as any || 'every',
    targetType: r.targetType as any || 'all',
    targetLevelIds: r.targetValue ? (function() { try { return JSON.parse(r.targetValue); } catch(e) { return []; } })() : [],
    playerIds: r.targetType === 'specific' ? (r.targetValue || '') : '',
    timeType: r.timeType as any || 'forever', startTime: null, endTime: null,
    status: !!r.status
  };
  // 获取详情（含 translations）
  const { data, error } = await fetchPopupDetail(r.id);
  if (!error && data) {
    const detail = data as any;
    // 初始化多语言编辑器
    initEditor(
      { title: detail.title || r.title || '', text_content: detail.textContent || r.textContent || '' },
      detail.translations || {}
    );
  } else {
    // 接口失败时用列表数据初始化
    initEditor({ title: r.title || '', text_content: r.textContent || '' }, {});
  }
  loadLevels();
  configVisible.value = true;
}

function handleDelete(r: PopupRecord) {
  dialog.warning({
    title: '确认删除', content: `确定要删除弹窗"${r.title}"吗？`,
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deletePopup(r.id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error(error?.msg || '操作失败'); }
    }
  });
}

async function handleSavePopup() {
  // 构建多语言 payload
  const { zhFields, translationsJson } = buildPayload();

  const f = configForm.value;
  const payload: Record<string, any> = {
    // 用多语言编辑器中的 zh-CN 字段覆盖主字段
    title: zhFields.title || '',
    contentType: f.contentType,
    image: f.image || '',
    textContent: zhFields.text_content || '',
    sort: f.sort,
    frequency: f.frequency,
    targetType: f.targetType,
    timeType: f.timeType,
    startAt: f.startTime,
    endAt: f.endTime,
    status: f.status,
    // 将 translations 序列化为 JSON 字符串后提交（避免 axios 拦截器转换 key）
    translations: translationsJson
  };

  // target_value: 按等级存 JSON 数组，指定玩家存逗号分隔的 ID
  if (f.targetType === 'level') {
    payload.targetValue = JSON.stringify(f.targetLevelIds);
  } else if (f.targetType === 'specific') {
    payload.targetValue = f.playerIds;
  } else {
    payload.targetValue = '';
  }

  if (editingPopupId.value) {
    const { error } = await updatePopup(editingPopupId.value, payload);
    if (!error) { window.$message?.success('保存成功'); configVisible.value = false; loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  } else {
    const { error } = await createPopup(payload);
    if (!error) { window.$message?.success('创建成功'); configVisible.value = false; loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  }
}

async function loadData() {
  loading.value = true;
  const { data, error } = await fetchPopups({ page: currentPage.value, page_size: pageSize, keyword: searchKeyword.value || undefined });
  loading.value = false;
  if (!error) { records.value = data.list || []; totalRecords.value = data.total || 0; }
  else { window.$message?.error(error?.msg || '加载失败'); }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); loadLocales(); });
</script>

<template>
  <div class="p-16px">
    <h2 class="text-18px font-bold m-0 mb-16px">弹窗管理</h2>
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between mb-16px">
        <div class="text-15px font-bold">已添加弹窗</div>
        <div class="flex items-center gap-8px">
          <NInput v-model:value="searchKeyword" placeholder="搜索..." size="small" class="w-160px" @keydown.enter="loadData" clearable @clear="loadData" />
          <NButton size="small" type="primary" @click="loadData">搜索</NButton>
          <NButton size="small" @click="searchKeyword = ''; loadData()">重置</NButton>
          <div style="width: 24px;"></div>
          <NButton v-permission="'content.popup.create'" type="primary" size="small" @click="openCreate">+ 新增弹窗</NButton>
        </div>
      </div>

      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="870" :loading="loading" />

      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 弹窗配置 -->
    <NModal v-model:show="configVisible" preset="card" title="弹窗配置" style="width: 600px;" :bordered="false">
      <div class="flex flex-col gap-20px">
        <!-- Language Tab 多语言切换 -->
        <NTabs :value="currentLang" type="segment" size="small" @update:value="switchLang">
          <NTabPane v-for="locale in locales" :key="locale.code" :name="locale.code" :tab="locale.label" />
        </NTabs>

        <div>
          <div class="text-13px font-500 mb-8px">内容类型</div>
          <div class="type-switch">
            <button type="button" class="type-btn" :class="{ active: configForm.contentType === 'image' }" @click="configForm.contentType = 'image';">只用图片</button>
            <button type="button" class="type-btn" :class="{ active: configForm.contentType === 'text' }" @click="configForm.contentType = 'text'; configForm.image = '';">输入文字</button>
          </div>
        </div>
        <div v-if="configForm.contentType === 'image'">
          <div class="text-13px font-500 mb-6px">弹窗图片</div>
          <ImageUpload v-model="configForm.image" width="200px" height="140px" />
          <div class="text-11px op-40 mt-4px">支持 JPG, PNG 格式，建议尺寸 750x500px</div>
        </div>
        <div><div class="text-13px font-500 mb-6px">弹窗标题</div><NInput v-model:value="formFields.title" placeholder="请输入弹窗标题" /></div>
        <div v-if="configForm.contentType === 'text'">
          <div class="text-13px font-500 mb-6px">文字内容</div><NInput v-model:value="formFields.text_content" type="textarea" :rows="4" placeholder="请输入弹窗文字内容" />
        </div>
        <div><div class="text-13px font-500 mb-6px">排序</div><NInputNumber v-model:value="configForm.sort" :min="1" class="w-80px" :show-button="false" /><div class="text-11px op-40 mt-4px">数值越小显示越靠前</div></div>
        <div><div class="text-13px font-500 mb-8px">显示方式</div><NRadioGroup v-model:value="configForm.frequency"><NRadio value="every">每次打开首页时显示</NRadio><NRadio value="reopen" class="ml-16px">重开浏览器后再显示</NRadio><NRadio value="24h" class="ml-16px">24小时后显示</NRadio></NRadioGroup></div>
        <div><div class="text-13px font-500 mb-8px">显示对象</div><NRadioGroup v-model:value="configForm.targetType"><NRadio value="all">所有玩家</NRadio><NRadio value="level" class="ml-16px">按等级</NRadio><NRadio value="specific" class="ml-16px">指定玩家</NRadio></NRadioGroup></div>
        <div v-if="configForm.targetType === 'level'">
          <div class="text-13px font-500 mb-6px">选择等级</div>
          <NCheckboxGroup v-model:value="configForm.targetLevelIds">
            <div class="flex flex-wrap gap-8px">
              <NCheckbox v-for="lv in levels" :key="lv.id" :value="lv.id" :label="lv.name" />
            </div>
          </NCheckboxGroup>
          <div v-if="!levels.length" class="text-12px op-40 mt-4px">暂无等级数据</div>
        </div>
        <div v-if="configForm.targetType === 'specific'"><div class="text-13px font-500 mb-6px">玩家ID (多个ID用逗号分隔)</div><NInput v-model:value="configForm.playerIds" type="textarea" :rows="2" /></div>
        <div><div class="text-13px font-500 mb-8px">显示时间</div><NRadioGroup v-model:value="configForm.timeType"><NRadio value="forever">长期</NRadio><NRadio value="range" class="ml-16px">指定时间</NRadio></NRadioGroup></div>
        <div v-if="configForm.timeType === 'range'" class="flex gap-16px">
          <div class="flex-1"><div class="text-13px mb-6px">开始时间</div><NDatePicker v-model:value="configForm.startTime" type="datetime" placeholder="-/-/- --:--" class="w-full" /></div>
          <div class="flex-1"><div class="text-13px mb-6px">结束时间</div><NDatePicker v-model:value="configForm.endTime" type="datetime" placeholder="-/-/- --:--" class="w-full" /></div>
        </div>
        <div><div class="text-13px font-500 mb-6px">是否启用</div><div class="flex items-center gap-8px"><NSwitch v-model:value="configForm.status" /><span class="text-13px">{{ configForm.status ? '启用' : '禁用' }}</span></div></div>
      </div>
      <template #footer><div class="flex justify-end"><NButton type="primary" @click="handleSavePopup"><SvgIcon icon="ph:floppy-disk" class="mr-4px" />保存修改</NButton></div></template>
    </NModal>
  </div>
</template>

<style scoped>
.type-switch { display: inline-flex; border: 1px solid #e0e0e6; border-radius: 6px; overflow: hidden; }
.type-btn { padding: 8px 18px; font-size: 13px; border: none; background: #fff; cursor: pointer; color: #333; transition: all 0.2s; }
.type-btn.active { background: #2080f0; color: #fff; }
.type-btn:not(.active):hover { background: #f5f5f8; }
</style>
