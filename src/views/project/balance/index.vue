<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { NCard, NButton, NModal, NForm, NFormItem, NInput, NInputNumber, NCheckbox, NDataTable, NTag, NSpace, NTabs, NTabPane, useDialog } from 'naive-ui';
import { fetchBalanceProducts, fetchBalanceProductDetail, createBalanceProduct, updateBalanceProduct, toggleBalanceProduct, deleteBalanceProduct } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { useLanguageEditor } from '@/hooks/business/useLanguageEditor';
defineOptions({ name: 'ProjectBalancePage' });
const dialog = useDialog();
const authStore = useAuthStore();

// 多语言编辑器（可翻译字段：name）
const {
  currentLang, locales, formFields: langFields, switchLang, initEditor, buildPayload, loadLocales
} = useLanguageEditor({ fields: ['name'] });

// ========== 列表 ==========
const data = ref<any[]>([]);
const loading = ref(false);

async function loadData() {
  loading.value = true;
  const { data: resData, error } = await fetchBalanceProducts();
  if (!error && resData) {
    data.value = resData || [];
  }
  loading.value = false;
}

// ========== 表格列 ==========
const columns = [
  { title: '项目名称', key: 'name', width: 140 },
  { title: '年化利率', key: 'rate', width: 100, render: (row: any) => `${row.rate}%` },
  { title: '期限', key: 'period', width: 80, render: (row: any) => `${row.period}天` },
  { title: '结算方式', key: 'settleType', width: 130, render: (row: any) => h('span', { class: 'flex items-center gap-4px' }, [h('span', { class: `inline-block w-8px h-8px rounded-full ${row.settleType === 'daily' ? 'bg-green-500' : 'bg-blue-500'}` }), row.settleType === 'daily' ? '按日返息' : '到期返本息']) },
  { title: '提前赎回配置', key: 'earlyRedeemRate', width: 160, render: (row: any) => {
    if (!row.earlyRedeemRate && !row.earlyRedeemPrincipalOnly) return h('span', {}, '—');
    return h('div', {}, [
      row.earlyRedeemRate ? h('div', { style: 'font-size:13px;' }, `赎回利率 ${row.earlyRedeemRate}%`) : null,
      row.earlyRedeemPrincipalOnly ? h(NTag, { size: 'tiny', type: 'warning', bordered: false, style: 'margin-top:2px;' }, () => '仅退本金') : null
    ]);
  }},
  { title: '状态', key: 'status', width: 90, align: 'center' as const, render: (row: any) => h(NTag, { type: row.status === 'on' ? 'success' : 'error', size: 'small', bordered: false }, () => row.status === 'on' ? '上架中' : '已下架') },
  {
    title: '语言', key: 'locales', width: 120,
    render: (row: any) => {
      const locales = row.locales || ['zh-CN'];
      return h(NSpace, { size: 4 }, () => locales.map((code: string) => h(NTag, { size: 'tiny', bordered: false }, () => code)));
    }
  },
  { title: '操作', key: 'action', width: 180, render: (row: any) => h(NSpace, { size: 4 }, () => [
    authStore.hasPermission('project.balance.edit') ? h(NButton, { size: 'tiny', quaternary: true, onClick: () => openEdit(row) }, () => '编辑') : null,
    authStore.hasPermission('project.balance.delete') ? h(NButton, { size: 'tiny', quaternary: true, type: 'error', onClick: () => confirmDelete(row) }, () => '删除') : null,
    h(NButton, { size: 'tiny', quaternary: true, onClick: () => handleToggle(row) }, () => row.status === 'on' ? '下架' : '上架')
  ]) }
];

// ========== 新建/编辑弹窗 ==========
const modalVisible = ref(false);
const modalTitle = ref('新建项目');
const formData = ref({
  id: null as number | null,
  rate: null as number | null,
  period: null as number | null,
  settle_type: 'daily' as 'daily' | 'maturity',
  early_redeem_rate: null as number | null,
  early_redeem_principal_only: false
});

function openCreate() {
  modalTitle.value = '新建项目';
  formData.value = { id: null, rate: null, period: null, settle_type: 'daily', early_redeem_rate: null, early_redeem_principal_only: false };
  initEditor({ name: '' }, {});
  modalVisible.value = true;
}
async function openEdit(row: any) {
  modalTitle.value = '编辑项目';
  formData.value = {
    id: row.id,
    rate: row.rate, period: row.period,
    settle_type: row.settleType || 'daily',
    early_redeem_rate: row.earlyRedeemRate ?? null,
    early_redeem_principal_only: row.earlyRedeemPrincipalOnly || false
  };

  // 从详情接口获取完整 translations 数据
  const { data: detail, error } = await fetchBalanceProductDetail(row.id);
  if (!error && detail) {
    const translations = detail.translations || {};
    initEditor({ name: detail.name || '' }, translations);
  } else {
    initEditor({ name: row.name || '' }, {});
  }
  modalVisible.value = true;
}
async function handleSave() {
  if (!langFields.value.name && currentLang.value === 'zh-CN') { window.$message?.warning('请输入项目名称'); return; }

  // 构建多语言 payload
  const { zhFields, translationsJson } = buildPayload();

  const payload: Record<string, any> = {
    name: zhFields.name,
    rate: formData.value.rate,
    period: formData.value.period,
    settle_type: formData.value.settle_type,
    early_redeem_rate: formData.value.early_redeem_rate,
    early_redeem_principal_only: formData.value.early_redeem_principal_only,
    translations: translationsJson
  };
  const { error } = formData.value.id
    ? await updateBalanceProduct(formData.value.id, payload)
    : await createBalanceProduct(payload);
  if (!error) {
    window.$message?.success(formData.value.id ? '更新成功' : '创建成功');
    modalVisible.value = false;
    loadData();
  }
}

// ========== 上架/下架 ==========
async function handleToggle(row: any) {
  const action = row.status === 'on' ? '下架' : '上架';
  const { error } = await toggleBalanceProduct(row.id);
  if (!error) {
    window.$message?.success(`已${action}`);
    loadData();
  }
}

// ========== 删除 ==========
function confirmDelete(row: any) {
  dialog.warning({
    title: '删除项目', content: `确定要删除「${row.name}」吗？此操作不可恢复。`,
    positiveText: '确认删除', negativeText: '取消', positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteBalanceProduct(row.id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
    }
  });
}

onMounted(() => { loadLocales(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <!-- 页面标题 -->
    <div class="flex items-center gap-8px mb-16px">
      <SvgIcon icon="ph:chart-line-up" class="text-22px text-primary" />
      <h2 class="text-18px font-bold">余额宝产品管理</h2>
    </div>

    <NCard :bordered="false" class="card-wrapper">
      <!-- 新建按钮 -->
      <div class="flex justify-end mb-16px">
        <NButton v-permission="'project.balance.create'" type="primary" @click="openCreate">
          <SvgIcon icon="ph:plus" class="mr-4px" />
          新建项目
        </NButton>
      </div>

      <!-- 表格 -->
      <NDataTable :columns="columns" :data="data" :loading="loading" :bordered="false" size="small" :scroll-x="870" />
    </NCard>

    <!-- 新建/编辑弹窗 -->
    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 520px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <!-- Language Tab -->
        <NTabs v-if="locales.length > 1" :value="currentLang" type="segment" size="small" @update:value="switchLang" class="mb-16px">
          <NTabPane v-for="locale in locales" :key="locale.code" :name="locale.code" :tab="locale.label" />
        </NTabs>

        <NFormItem label="项目名称">
          <NInput v-model:value="langFields.name" placeholder="例：天天增益宝" />
        </NFormItem>

        <!-- 以下字段仅在 zh-CN 时显示（非翻译字段） -->
        <template v-if="currentLang === 'zh-CN'">
          <div class="flex gap-12px">
            <NFormItem label="年化利率" class="flex-1">
              <NInput v-model:value="formData.rate" placeholder="2.85">
                <template #suffix>%</template>
              </NInput>
            </NFormItem>
            <NFormItem label="期限 (天)" class="flex-1">
              <NInputNumber v-model:value="formData.period" placeholder="30" :show-button="false" class="w-full" />
            </NFormItem>
          </div>
          <NFormItem label="收益结算规则">
            <div class="settle-switch">
              <div class="settle-option" :class="{ active: formData.settle_type === 'daily' }" @click="formData.settle_type = 'daily'">按日返息</div>
              <div class="settle-option" :class="{ active: formData.settle_type === 'maturity' }" @click="formData.settle_type = 'maturity'">到期返本息</div>
            </div>
          </NFormItem>
          <!-- 按日返息说明 -->
          <div v-if="formData.settle_type === 'daily'" class="settle-desc">
            每日收益 = 剩余本金 × 日利率，自动发放。提前转出仅退本金。
          </div>
          <!-- 到期返本息：提前赎回配置 -->
          <template v-if="formData.settle_type === 'maturity'">
            <NFormItem label="提前赎回利率">
              <NInput v-model:value="formData.early_redeem_rate" placeholder="0.50">
                <template #suffix>%</template>
              </NInput>
            </NFormItem>
            <NCheckbox v-model:checked="formData.early_redeem_principal_only">
              仅退本金（提前赎回收益为0）
            </NCheckbox>
          </template>
        </template>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSave">保存</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.settle-switch { display: flex; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; width: 100%; }
.settle-option { flex: 1; text-align: center; padding: 8px 0; cursor: pointer; font-size: 13px; color: #666; transition: all 0.2s; }
.settle-option.active { background: #f0f7ff; color: #2080f0; font-weight: 500; border: 1px solid #2080f0; border-radius: 5px; margin: -1px; }
.settle-desc { background: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #999; margin-bottom: 12px; }
</style>
