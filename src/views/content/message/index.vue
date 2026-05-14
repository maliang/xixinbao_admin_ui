<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NDatePicker, NPagination,
  NCollapse, NCollapseItem, NGrid, NGridItem, NModal, NSpace,
  NRadio, NRadioGroup, NTag, NDynamicTags, NDataTable, NTabs, NTabPane, useDialog
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchMessages, createMessage, updateMessage, deleteMessage, sendMessage } from '@/service/api';
import ImageUpload from '@/components/common/ImageUpload.vue';
import RichTextEditor from '@/components/common/RichTextEditor.vue';
import { useAuthStore } from '@/store/modules/auth';
import { useLanguageEditor } from '@/hooks/business/useLanguageEditor';

defineOptions({ name: 'ContentMessagePage' });
const dialog = useDialog();
const authStore = useAuthStore();

// 多语言编辑器（可翻译字段：title, content）
const {
  currentLang, locales, formFields: langFields,
  loadLocales, switchLang, initEditor, buildPayload, saveCurrentContent
} = useLanguageEditor({ fields: ['title', 'content'] });

const searchForm = ref({
  keyword: '', type: '' as string, status: '' as string,
  dateStart: null as number | null, dateEnd: null as number | null, target: '' as string
});
const typeOptions = [
  { label: '全部类型', value: '' }, { label: '系统通知', value: 'system' },
  { label: '活动促销', value: 'promo' }, { label: '安全预警', value: 'security' }, { label: '其他', value: 'other' }
];
const statusFilterOptions = [
  { label: '全部状态', value: '' }, { label: '已发送', value: 'sent' },
  { label: '待发送', value: 'pending' }, { label: '草稿', value: 'draft' }
];
const targetFilterOptions = [
  { label: '全部', value: '' }, { label: '所有会员', value: 'all' }, { label: '指定会员', value: 'specific' }
];
function handleReset() {
  searchForm.value = { keyword: '', type: '', status: '', dateStart: null, dateEnd: null, target: '' };
  loadData();
}

const loading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);

interface MessageRecord {
  id: number; title: string; content: string; type: string; targetType: string;
  image: string; status: 'sent' | 'pending' | 'draft'; sendAt: string; createdAt: string;
}
const records = ref<MessageRecord[]>([]);

const typeColorMap: Record<string, { type: 'info' | 'success' | 'warning' | 'default' }> = {
  system: { type: 'info' }, promo: { type: 'success' }, security: { type: 'warning' }, other: { type: 'default' }
};
const typeNameMap: Record<string, string> = {
  system: '系统通知', promo: '活动促销', security: '安全预警', other: '其他'
};
const statusConfig: Record<string, { type: 'success' | 'warning' | 'default' | 'info'; label: string }> = {
  sent: { type: 'success', label: '已发送' }, pending: { type: 'info', label: '定时待发' }, draft: { type: 'default', label: '草稿' }
};

const columns = computed<DataTableColumns>(() => [
  { title: '序号', key: '_index', width: 45, align: 'center', render: (_row, index) => index + 1 },
  { title: '标题', key: 'title', width: 120, render: (row) => h('span', { style: 'font-weight:bold;' }, { default: () => row.title }) },
  {
    title: '内容', key: 'content', width: 200, ellipsis: { tooltip: true },
    render: (row) => h('span', { style: 'font-size:12px;opacity:0.6;' }, { default: () => row.content })
  },
  {
    title: '类型', key: 'type', width: 80,
    render: (row) => {
      const r = row as MessageRecord;
      const t = typeColorMap[r.type] || { type: 'default' as const };
      return h(NTag, { type: t.type, size: 'small', bordered: false }, () => typeNameMap[r.type] || r.type);
    }
  },
  {
    title: '发送对象', key: 'targetType', width: 100,
    render: (row) => (row as MessageRecord).targetType === 'all' ? '所有会员' : '指定会员'
  },
  {
    title: '状态', key: 'status', width: 80,
    render: (row) => {
      const s = statusConfig[(row as MessageRecord).status] || { type: 'default' as const, label: (row as MessageRecord).status };
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
  { title: '创建时间', key: 'createdAt', width: 130 },
  { title: '推送时间', key: 'sendAt', width: 130 },
  {
    title: '操作', key: 'action', width: 100,
    render: (row) => h(NSpace, { size: 8 }, () => [
      authStore.hasPermission('content.message.edit') ? h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row as MessageRecord) }, () => '编辑') : null,
      authStore.hasPermission('content.message.delete') ? h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row as MessageRecord) }, () => '删除') : null
    ])
  }
]);

const editVisible = ref(false);
const editForm = ref({
  id: null as number | null,
  targetType: 'all' as 'specific' | 'all', targetMembers: [] as string[],
  title: '', messageType: 'system', content: '', image: '', publishType: 'now' as 'now' | 'schedule', scheduleTime: null as number | null
});

function openCreate() {
  editForm.value = { id: null, targetType: 'all', targetMembers: [], title: '', messageType: 'system', content: '', image: '', publishType: 'now', scheduleTime: null };
  initEditor({ title: '', content: '' }, {});
  editVisible.value = true;
}

async function openEdit(r: MessageRecord) {
  // 先获取消息详情（含目标用户账号和 translations）
  const { fetchMessageDetail } = await import('@/service/api');
  const { data, error } = await fetchMessageDetail(r.id);
  const detail = !error && data ? data : r;

  editForm.value = {
    id: r.id,
    targetType: (detail.targetType || detail.target_type || 'all') === 'all' ? 'all' : 'specific',
    targetMembers: detail.targetMembers || detail.target_members || [],
    title: detail.title || r.title,
    messageType: detail.type || detail.messageType || r.type,
    content: detail.content || r.content,
    image: detail.image || r.image || '',
    publishType: 'now',
    scheduleTime: null
  };

  // 初始化多语言编辑器
  const translations = detail.translations || {};
  initEditor(
    { title: editForm.value.title, content: editForm.value.content },
    translations
  );

  editVisible.value = true;
}

function handleDelete(r: MessageRecord) {
  dialog.warning({
    title: '确认删除', content: `确定要删除消息"${r.title}"吗？`,
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteMessage(r.id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error(error?.msg || '操作失败'); }
    }
  });
}

async function handleSave(action: 'draft' | 'send') {
  const editingId = editForm.value.id;
  // 构建 payload，将 messageType 映射为 type，并包含多语言数据
  function buildFormPayload() {
    // 获取多语言 payload
    const { zhFields, translationsJson } = buildPayload();

    const { messageType, publishType, scheduleTime, ...rest } = editForm.value;
    const payload: Record<string, any> = {
      ...rest,
      type: messageType,
      publishType,
      scheduleTime,
      // 使用多语言编辑器中的 zh-CN 字段值
      title: zhFields.title,
      content: zhFields.content,
      // translations 序列化为 JSON 字符串提交
      translations: translationsJson
    };
    return payload;
  }

  if (editingId) {
    // 编辑模式：先更新内容
    const payload = buildFormPayload();
    delete payload.id;
    if (action === 'draft') payload.status = 'draft';
    const { error } = await updateMessage(editingId, payload);
    if (!error) {
      // 如果选择发送，调用发送接口
      if (action === 'send' && editForm.value.publishType === 'now') await sendMessage(editingId);
      window.$message?.success('操作成功'); editVisible.value = false; loadData();
    } else { window.$message?.error(error?.msg || '操作失败'); }
  } else {
    // 新增模式
    const payload = buildFormPayload();
    delete payload.id;
    if (action === 'send') {
      if (editForm.value.publishType === 'schedule' && editForm.value.scheduleTime) {
        // 定时发布：后端会设为 pending
        payload.status = 'sent'; // 标记意图为发送，后端根据 publishType 判断
      } else {
        payload.status = 'sent';
      }
    } else {
      payload.status = 'draft';
    }
    const { error } = await createMessage(payload);
    if (!error) {
      window.$message?.success(editForm.value.publishType === 'schedule' ? '定时发布设置成功' : '操作成功');
      editVisible.value = false; loadData();
    } else { window.$message?.error(error?.msg || '操作失败'); }
  }
}

async function loadData() {
  if (searchForm.value.dateStart && searchForm.value.dateEnd && searchForm.value.dateEnd < searchForm.value.dateStart) {
    window.$message?.warning('结束时间必须大于开始时间'); return;
  }
  loading.value = true;
  const params: Record<string, any> = { page: currentPage.value, page_size: pageSize };
  if (searchForm.value.keyword) params.keyword = searchForm.value.keyword;
  if (searchForm.value.type) params.type = searchForm.value.type;
  if (searchForm.value.status) params.status = searchForm.value.status;
  if (searchForm.value.target) params.target = searchForm.value.target;
  if (searchForm.value.dateStart) {
    const d = new Date(searchForm.value.dateStart);
    params.dateStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (searchForm.value.dateEnd) {
    const d = new Date(searchForm.value.dateEnd);
    params.dateEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const { data, error } = await fetchMessages(params);
  loading.value = false;
  if (!error) { records.value = data.list || []; totalRecords.value = data.total || 0; }
  else { window.$message?.error(error?.msg || '加载失败'); }
}

watch(currentPage, loadData);
onMounted(() => { loadLocales(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-18px font-bold m-0">站内消息管理</h2>
      <NButton v-permission="'content.message.create'" type="success" @click="openCreate">+ 新增站内信</NButton>
    </div>

    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse>
        <NCollapseItem title="筛选条件" name="filter">
          <NGrid :x-gap="16" :y-gap="12" :cols="3">
            <NGridItem><div class="text-13px mb-6px">标题关键词</div><NInput v-model:value="searchForm.keyword" placeholder="输入标题关键词"><template #suffix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template></NInput></NGridItem>
            <NGridItem><div class="text-13px mb-6px">消息类型</div><NSelect v-model:value="searchForm.type" :options="typeOptions" placeholder="全部类型" /></NGridItem>
            <NGridItem><div class="text-13px mb-6px">状态</div><NSelect v-model:value="searchForm.status" :options="statusFilterOptions" placeholder="全部状态" /></NGridItem>
          </NGrid>
          <NGrid :x-gap="16" :y-gap="12" :cols="3" class="mt-12px">
            <NGridItem>
              <div class="text-13px mb-6px">创建时间</div>
              <div class="flex items-center gap-8px">
                <NDatePicker v-model:value="searchForm.dateStart" type="date" placeholder="-/-/-" class="flex-1" />
                <span class="text-13px op-60">至</span>
                <NDatePicker v-model:value="searchForm.dateEnd" type="date" placeholder="-/-/-" class="flex-1" />
              </div>
            </NGridItem>
            <NGridItem><div class="text-13px mb-6px">发送对象</div><NSelect v-model:value="searchForm.target" :options="targetFilterOptions" placeholder="全部" /></NGridItem>
            <NGridItem class="flex items-end justify-end gap-8px">
              <NButton @click="handleReset"><SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />重置</NButton>
              <NButton type="primary" @click="loadData"><SvgIcon icon="ph:magnifying-glass" class="mr-4px" />搜索</NButton>
            </NGridItem>
          </NGrid>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="records" :bordered="false" size="small" :scroll-x="965" :loading="loading" />
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 新增/编辑站内信弹窗 -->
    <NModal v-model:show="editVisible" preset="card" :title="editForm.id ? '编辑站内信' : '新增站内信'" style="width: 600px;" :bordered="false">
      <div class="flex flex-col gap-18px">
        <div>
          <div class="text-13px font-500 mb-8px">发送对象</div>
          <NRadioGroup v-model:value="editForm.targetType">
            <NRadio value="specific">指定会员</NRadio>
            <NRadio value="all" class="ml-16px">所有会员</NRadio>
          </NRadioGroup>
          <div v-if="editForm.targetType === 'specific'" class="mt-8px">
            <NDynamicTags v-model:value="editForm.targetMembers" />
            <div class="text-11px op-40 mt-4px">可输入多个会员账号，用逗号或回车分隔</div>
          </div>
          <div v-if="editForm.targetType === 'all'" class="hint-box mt-8px">消息将发送给平台所有注册会员</div>
        </div>

        <!-- 多语言 Tab -->
        <NTabs v-model:value="currentLang" type="segment" size="small" @update:value="switchLang">
          <NTabPane v-for="loc in locales" :key="loc.code" :name="loc.code" :tab="loc.label" />
        </NTabs>

        <div><div class="text-13px font-500 mb-6px">标题</div><NInput v-model:value="langFields.title" placeholder="输入消息标题" /></div>
        <div><div class="text-13px font-500 mb-6px">消息类型</div><NSelect v-model:value="editForm.messageType" :options="[{label:'系统通知',value:'system'},{label:'活动促销',value:'promo'},{label:'安全预警',value:'security'},{label:'其他',value:'other'}]" /></div>
        <div>
          <div class="text-13px font-500 mb-6px">消息配图</div>
          <ImageUpload v-model="editForm.image" width="120px" height="80px" />
          <div class="text-11px op-40 mt-4px">支持JPG、PNG格式，大小不超过5MB</div>
        </div>
        <div>
          <div class="text-13px font-500 mb-6px">内容</div>
          <RichTextEditor v-model="langFields.content" placeholder="请输入消息内容..." height="240px" />
        </div>
        <div>
          <div class="text-13px font-500 mb-8px">发布设置</div>
          <NRadioGroup v-model:value="editForm.publishType">
            <NRadio value="now">立即发布</NRadio>
            <NRadio value="schedule" class="ml-16px">定时发布</NRadio>
          </NRadioGroup>
          <div v-if="editForm.publishType === 'schedule'" class="mt-8px">
            <NDatePicker v-model:value="editForm.scheduleTime" type="datetime" placeholder="选择发布时间" class="w-full" />
          </div>
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="editVisible = false">取消</NButton>
          <NButton @click="handleSave('draft')">保存为草稿</NButton>
          <NButton v-permission="'content.message.send'" type="primary" @click="handleSave('send')">确认发送</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.hint-box { background-color: #f0f7ff; border: 1px solid #d6e8ff; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #4080c0; }
</style>
