<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';
import { NCard, NButton, NInput, NSelect, NModal, NForm, NFormItem, NInputNumber, NSwitch, NCheckbox, NPagination, NDataTable, NTag, NSpace, useDialog } from 'naive-ui';
import { fetchAgents, createAgent, updateAgent, deleteAgent, fetchAgentRoles } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
defineOptions({ name: 'AgentUserPage' });
const dialog = useDialog();
const authStore = useAuthStore();

// ========== 筛选 ==========
const inviteCode = ref('');
const keyword = ref('');
const statusFilter = ref('all');
const statusOptions = [{ label: '全部状态', value: 'all' }, { label: '启用', value: '1' }, { label: '禁用', value: '0' }];

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
  { title: '代理ID', key: 'id', width: 80 },
  { title: '邀请码', key: 'inviteCode', width: 120 },
  { title: '代理账号/姓名', key: 'account', width: 160, render: (row: any) => `${row.account} / ${row.name || '-'}` },
  { title: '角色', key: 'roleName', width: 100, render: (row: any) => row.role?.name || '-' },
  { title: '直接下线数', key: 'subCount', width: 110, render: (row: any) => `下线${row.subCount || 0}人` },
  { title: '团队总业绩', key: 'teamAmount', width: 120, align: 'right' as const },
  { title: '当前佣金', key: 'commission', width: 100, align: 'right' as const },
  { title: '状态', key: 'status', width: 80, align: 'center' as const, render: (row: any) => h(NTag, { type: (row.status === 1 || row.status === true) ? 'success' : 'default', size: 'small', bordered: false }, () => (row.status === 1 || row.status === true) ? '启用' : '禁用') },
  { title: '注册时间', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 100, align: 'center' as const, render: (row: any) => h(NSpace, { size: 8 }, () => [
    authStore.hasPermission('agent.user.edit') ? h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row) }, () => '编辑') : null,
    authStore.hasPermission('agent.user.delete') ? h(NButton, { text: true, type: 'error', onClick: () => confirmDelete(row) }, () => '删除') : null
  ]) }
];

// ========== 新增/编辑弹窗 ==========
const modalVisible = ref(false);
const modalTitle = ref('新增代理');
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

function openCreate() {
  modalTitle.value = '新增代理';
  formData.value = { id: null, account: '', name: '', phone: '', invite_code: '', reset_password: false, parent_id: null, role_id: null, commission_rate: null, status: true };
  modalVisible.value = true;
}
function openEdit(row: any) {
  modalTitle.value = '编辑代理';
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
async function handleSave() {
  if (!formData.value.account) { window.$message?.warning('请输入账号'); return; }
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
    window.$message?.success(formData.value.id ? '更新成功' : '创建成功');
    modalVisible.value = false;
    loadData();
  }
}

// ========== 删除 ==========
function confirmDelete(row: any) {
  dialog.warning({
    title: '删除代理', content: `确定要删除代理「${row.account}」吗？此操作不可恢复。`,
    positiveText: '确认删除', negativeText: '取消', positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteAgent(row.id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
    }
  });
}

onMounted(() => { loadAgentRoles(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between mb-20px">
        <h3 class="text-18px font-bold">代理用户</h3>
        <div class="flex items-center gap-8px">
          <NButton v-permission="'agent.user.create'" type="primary" @click="openCreate">
            <SvgIcon icon="ph:plus" class="mr-4px" />
            新增代理
          </NButton>
          <NButton quaternary>
            <SvgIcon icon="ph:magnifying-glass" class="mr-4px" />
            筛选
          </NButton>
        </div>
      </div>

      <!-- 筛选条件 -->
      <div class="flex items-center gap-12px mb-20px flex-wrap">
        <NInput v-model:value="inviteCode" autosize placeholder="邀请码" clearable size="small" class="w-180px" />
        <NInput v-model:value="keyword" autosize placeholder="账号/姓名" clearable size="small" class="w-180px" />
        <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" class="w-140px" />
        <NButton size="small" @click="handleReset">重置</NButton>
        <NButton type="primary" size="small" @click="handleSearch">查询</NButton>
      </div>

      <!-- 表格 -->
      <NDataTable :columns="columns" :data="data" :loading="loading" :bordered="false" size="small" :scroll-x="1100" />

      <!-- 分页 -->
      <div v-if="totalRecords > pageSize" class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">共 {{ totalRecords }} 条记录</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" />
      </div>
    </NCard>

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 520px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NFormItem label="账号" required>
          <NInput v-model:value="formData.account" placeholder="请输入账号" />
        </NFormItem>
        <NFormItem label="姓名">
          <NInput v-model:value="formData.name" placeholder="请输入姓名" />
        </NFormItem>
        <NFormItem label="手机号">
          <NInput v-model:value="formData.phone" placeholder="请输入手机号" />
        </NFormItem>
        <NFormItem label="邀请码">
          <NInput v-model:value="formData.invite_code" placeholder="请输入邀请码" />
        </NFormItem>
        <NFormItem v-if="formData.id" :show-label="false">
          <NCheckbox v-model:checked="formData.reset_password">重置密码（重置为 123456）</NCheckbox>
        </NFormItem>
        <NFormItem label="上级代理">
          <NSelect v-model:value="formData.parent_id" :options="parentOptions" placeholder="无" clearable />
        </NFormItem>
        <NFormItem label="角色">
          <NSelect v-model:value="formData.role_id" :options="agentRoleOptions" placeholder="请选择角色" clearable />
        </NFormItem>
        <NFormItem label="佣金比例">
          <NInput v-model:value="formData.commission_rate" placeholder="请输入佣金比例">
            <template #suffix>%</template>
          </NInput>
        </NFormItem>
        <NFormItem label="状态">
          <div class="flex items-center gap-8px">
            <NSwitch v-model:value="formData.status" />
            <span class="text-13px">{{ formData.status ? '启用' : '禁用' }}</span>
          </div>
        </NFormItem>
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

<style scoped></style>
