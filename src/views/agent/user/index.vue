<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';
import { NCard, NButton, NInput, NSelect, NModal, NForm, NFormItem, NInputNumber, NSwitch, NCheckbox, NPagination, NDataTable, NTag, NSpace, useDialog } from 'naive-ui';
import { fetchAgents, createAgent, updateAgent, deleteAgent, fetchAgentRoles } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
defineOptions({ name: 'AgentUserPage' });
const dialog = useDialog();
const authStore = useAuthStore();

// ========== 筛选 ==========
const inviteCode = ref('');
const keyword = ref('');
const statusFilter = ref('all');
const statusOptions = [{ label: $t('biz.common.all'), value: 'all' }, { label: $t('biz.common.enabled'), value: '1' }, { label: $t('biz.common.disabled'), value: '0' }];

// ========== 分页与列表 ==========
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 15;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);
const data = ref<any[]>([]);

async function loadData() {
  loading.value = true;
  const { data: resData, error } = await fetchAgents({
    invite_code: inviteCode.value || undefined,
    keyword: keyword.value || undefined,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    page: currentPage.value,
    page_size: pageSize
  });
  if (!error && resData) {
    data.value = resData.list || [];
    totalRecords.value = resData.total || 0;
  }
  loading.value = false;
}
function handleSearch() { currentPage.value = 1; loadData(); }
function handleReset() { inviteCode.value = ''; keyword.value = ''; statusFilter.value = 'all'; handleSearch(); }
watch(currentPage, loadData);

// ========== 表格列 ==========
const columns = [
  { title: $t('biz.agent.user.agentId'), key: 'id', width: 80 },
  { title: $t('biz.agent.user.inviteCode'), key: 'inviteCode', width: 120 },
  { title: $t('biz.agent.user.account'), key: 'account', width: 160, render: (row: any) => `${row.account} / ${row.name || '-'}` },
  { title: $t('biz.agent.user.role'), key: 'roleName', width: 100, render: (row: any) => row.role?.name || '-' },
  { title: $t('biz.agent.user.subCount'), key: 'subCount', width: 110, render: (row: any) => `${row.subCount || 0}` },
  { title: $t('biz.agent.user.teamAmount'), key: 'teamAmount', width: 120, align: 'right' as const },
  { title: $t('biz.agent.user.commission'), key: 'commission', width: 100, align: 'right' as const },
  { title: $t('biz.common.status'), key: 'status', width: 80, align: 'center' as const, render: (row: any) => h(NTag, { type: (row.status === 1 || row.status === true) ? 'success' : 'default', size: 'small', bordered: false }, () => (row.status === 1 || row.status === true) ? $t('biz.common.enabled') : $t('biz.common.disabled')) },
  { title: $t('biz.agent.user.createdAt'), key: 'createdAt', width: 160 },
  { title: $t('common.action'), key: 'action', width: 100, align: 'center' as const, render: (row: any) => h(NSpace, { size: 8 }, () => [
    authStore.hasPermission('agent.user.edit') ? h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row) }, () => $t('common.edit')) : null,
    authStore.hasPermission('agent.user.delete') ? h(NButton, { text: true, type: 'error', onClick: () => confirmDelete(row) }, () => $t('common.delete')) : null
  ]) }
];

// ========== 新增/编辑弹窗 ==========
const modalVisible = ref(false);
const modalTitle = ref($t('biz.agent.user.addAgent'));
const formData = ref({
  id: null as number | null,
  account: '',
  name: '',
  phone: '',
  invite_code: '',
  reset_password: false,
  parent_id: null as string | null,
  role_id: null as number | null,
  commission_rate: null as number | null,
  status: true
});
// 上级代理选项
const parentOptions = ref<{ label: string; value: string }[]>([{ label: '无', value: '' }]);
// 代理角色选项
const agentRoleOptions = ref<{ label: string; value: number }[]>([]);

async function loadAgentRoles() {
  const { data, error } = await fetchAgentRoles();
  if (!error && data) {
    const list = Array.isArray(data) ? data : (data.list || []);
    agentRoleOptions.value = list.map((r: any) => ({ label: r.name, value: r.id }));
  }
}

async function loadParentOptions() {
  const { data, error } = await fetchAgents({ pageSize: 200 });
  if (!error && data) {
    const list = data.list || [];
    parentOptions.value = [
      { label: '无', value: '' },
      ...list.map((a: any) => ({ label: `${a.account}${a.name ? ' (' + a.name + ')' : ''}`, value: String(a.id) }))
    ];
  }
}

function openCreate() {
  modalTitle.value = $t('biz.agent.user.addAgent');
  formData.value = { id: null, account: '', name: '', phone: '', invite_code: '', reset_password: false, parent_id: null, role_id: null, commission_rate: null, status: true };
  modalVisible.value = true;
}
function openEdit(row: any) {
  modalTitle.value = $t('biz.agent.user.editAgent');
  formData.value = {
    id: row.id, account: row.account, name: row.name || '', phone: row.phone || '',
    invite_code: row.inviteCode || row.invite_code || '', reset_password: false,
    parent_id: row.parentId ? String(row.parentId) : null,
    role_id: row.roleId || row.role_id || null,
    commission_rate: row.commissionRate ?? row.commission_rate ?? null,
    status: row.status === 1 || row.status === true
  };
  modalVisible.value = true;
}
function allowOnlyDigits(value: string) {
  return !value || /^\d+$/.test(value);
}

async function handleSave() {
  if (!formData.value.account) { window.$message?.warning($t('biz.common.account')); return; }
  if (!formData.value.id && !formData.value.invite_code) { window.$message?.warning($t('biz.agent.user.inviteCode')); return; }
  if (formData.value.phone && !/^\d+$/.test(formData.value.phone)) { window.$message?.warning($t('biz.common.phone')); return; }
  const payload = {
    account: formData.value.account,
    name: formData.value.name,
    phone: formData.value.phone,
    invite_code: formData.value.invite_code,
    reset_password: formData.value.reset_password,
    parent_id: formData.value.parent_id,
    role_id: formData.value.role_id,
    commission_rate: formData.value.commission_rate,
    status: formData.value.status ? 1 : 0
  };
  const { error } = formData.value.id
    ? await updateAgent(formData.value.id, payload)
    : await createAgent(payload);
  if (!error) {
    window.$message?.success(formData.value.id ? $t('biz.common.updateSuccess') : $t('biz.common.createSuccess'));
    modalVisible.value = false;
    loadData();
  }
}

// ========== 删除 ==========
function confirmDelete(row: any) {
  dialog.warning({
    title: $t('biz.common.confirmDeleteTitle'), content: $t('biz.agent.user.confirmDelete', { account: row.account }),
    positiveText: $t('biz.common.confirmDeleteTitle'), negativeText: $t('common.cancel'), positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteAgent(row.id);
      if (!error) { window.$message?.success($t('biz.common.deleteSuccess')); loadData(); }
    }
  });
}

onMounted(() => { loadAgentRoles(); loadParentOptions(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-20px">
        <h3 class="text-18px font-bold">{{ $t('biz.agent.user.title') }}</h3>
        <div class="flex items-center gap-8px">
          <NButton v-permission="'agent.user.create'" type="primary" @click="openCreate">
            <SvgIcon icon="ph:plus" class="mr-4px" />
            {{ $t('biz.agent.user.addAgent') }}
          </NButton>
          <NButton quaternary>
            <SvgIcon icon="ph:magnifying-glass" class="mr-4px" />
            {{ $t('biz.common.filterConditions') }}
          </NButton>
        </div>
      </div>

      <!-- 筛选条件 -->
      <div class="flex items-center gap-12px mb-20px flex-wrap">
        <NInput v-model:value="inviteCode" autosize :placeholder="$t('biz.agent.user.inviteCode')" clearable size="small" class="w-180px" />
        <NInput v-model:value="keyword" autosize :placeholder="$t('biz.agent.user.account')" clearable size="small" class="w-180px" />
        <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" class="w-140px" />
        <NButton size="small" @click="handleReset">{{ $t('common.reset') }}</NButton>
        <NButton type="primary" size="small" @click="handleSearch">{{ $t('common.search') }}</NButton>
      </div>

      <!-- 表格 -->
      <NDataTable :columns="columns" :data="data" :loading="loading" :bordered="false" size="small" :scroll-x="1100" />

      <!-- 分页 -->
      <div v-if="totalRecords > pageSize" class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">{{ $t('biz.common.total', { count: totalRecords }) }}</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" />
      </div>
    </NCard>

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 520px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NFormItem :label="$t('biz.common.account')" required>
          <NInput v-model:value="formData.account" :placeholder="$t('biz.common.account')" />
        </NFormItem>
        <NFormItem :label="$t('biz.common.name')">
          <NInput v-model:value="formData.name" :placeholder="$t('biz.common.name')" />
        </NFormItem>
        <NFormItem :label="$t('biz.common.phone')">
          <NInput v-model:value="formData.phone" :placeholder="$t('biz.common.phone')" :allow-input="allowOnlyDigits" />
        </NFormItem>
        <NFormItem :label="$t('biz.agent.user.inviteCode')" required>
          <NInput v-model:value="formData.invite_code" :placeholder="$t('biz.agent.user.inviteCode')" />
        </NFormItem>
        <NFormItem v-if="formData.id" :show-label="false">
          <NCheckbox v-model:checked="formData.reset_password">{{ $t('biz.agent.user.resetPassword') }}</NCheckbox>
        </NFormItem>
        <NFormItem :label="$t('biz.agent.user.parentAgent')">
          <NSelect v-model:value="formData.parent_id" :options="parentOptions" placeholder="无" clearable />
        </NFormItem>
        <NFormItem :label="$t('biz.agent.user.role')">
          <NSelect v-model:value="formData.role_id" :options="agentRoleOptions" clearable />
        </NFormItem>
        <NFormItem :label="$t('biz.agent.user.commissionRate')">
          <NInput v-model:value="formData.commission_rate" :placeholder="$t('biz.agent.user.commissionRate')">
            <template #suffix>%</template>
          </NInput>
        </NFormItem>
        <NFormItem :label="$t('biz.common.status')">
          <div class="flex items-center gap-8px">
            <NSwitch v-model:value="formData.status" />
            <span class="text-13px">{{ formData.status ? $t('biz.common.enabled') : $t('biz.common.disabled') }}</span>
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="modalVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSave">{{ $t('common.save') }}</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped></style>
