<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import { NCard, NButton, NInput, NSelect, NModal, NForm, NFormItem, NSwitch, NPagination, NDataTable, NTag, NSpace, useDialog } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, fetchRoles } from '@/service/api';

defineOptions({ name: 'SystemAdminUserPage' });
const dialog = useDialog();
const authStore = useAuthStore();

const keyword = ref('');
const roleFilter = ref('' as string);
const roleOptions = ref<{ label: string; value: string }[]>([{ label: '全部角色', value: '' }]);

// 从 API 加载角色列表
async function loadRoles() {
  const { data, error } = await fetchRoles();
  if (!error && data) {
    const list = Array.isArray(data) ? data : (data.list || []);
    roleOptions.value = [{ label: '全部角色', value: '' }];
    list.forEach((r: any) => {
      roleOptions.value.push({ label: r.name, value: String(r.id) });
    });
  }
}

const loading = ref(false);
const currentPage = ref(1);
const pageSize = 15;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);
const data = ref<any[]>([]);

const columns = computed<DataTableColumns>(() => [
  { title: 'ID', key: 'id', width: 60 },
  { title: '用户名', key: 'username', width: 120 },
  { title: '姓名', key: 'name', width: 100 },
  { title: '角色', key: 'roleName', width: 100, render: (row: any) => row.roleRelation?.name || '-' },
  {
    title: '状态', key: 'status', width: 80,
    render: (row) => h(NTag, {
      type: row.status === 1 || row.status === true ? 'success' : 'default',
      size: 'small', bordered: false
    }, () => row.status === 1 || row.status === true ? '启用' : '禁用')
  },
  { title: '最后登录', key: 'lastLoginAt', width: 160, render: (row: any) => row.lastLoginAt || '-' },
  { title: '创建时间', key: 'createdAt', width: 160 },
  {
    title: '操作', key: 'action', width: 80,
    render: (row) => h(NSpace, { size: 8 }, () => [
      authStore.hasPermission('system.admin-user.edit') ? h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row) }, () => '编辑') : null,
      authStore.hasPermission('system.admin-user.delete') ? h(NButton, { text: true, type: 'error', onClick: () => confirmDelete(row) }, () => '删除') : null
    ])
  }
]);

async function loadData() {
  loading.value = true;
  const params: Record<string, any> = { page: currentPage.value, page_size: pageSize };
  if (keyword.value) params.keyword = keyword.value;
  if (roleFilter.value) params.role_id = roleFilter.value;
  const { data: resData, error } = await fetchAdminUsers(params);
  loading.value = false;
  if (!error && resData) {
    data.value = resData.list || resData || [];
    totalRecords.value = resData.total || 0;
  }
}
function handleSearch() { currentPage.value = 1; loadData(); }
function handleReset() { keyword.value = ''; roleFilter.value = ''; handleSearch(); }
watch(currentPage, loadData);

const modalVisible = ref(false);
const modalTitle = ref('新增用户');
const formData = ref({ id: null as number | null, username: '', name: '', password: '', roleId: '' as string, status: true });

function openCreate() {
  modalTitle.value = '新增用户';
  formData.value = { id: null, username: '', name: '', password: '', roleId: '', status: true };
  modalVisible.value = true;
}
function openEdit(row: any) {
  modalTitle.value = '编辑用户';
  formData.value = { id: row.id, username: row.username, name: row.name, password: '', roleId: row.roleId ? String(row.roleId) : '', status: row.status === 1 || row.status === true };
  modalVisible.value = true;
}
async function handleSave() {
  if (!formData.value.username) { window.$message?.warning('请输入用户名'); return; }
  const payload: Record<string, any> = {
    username: formData.value.username,
    name: formData.value.name,
    roleId: formData.value.roleId ? Number(formData.value.roleId) : null,
    status: formData.value.status ? 1 : 0
  };
  if (formData.value.password) payload.password = formData.value.password;

  if (formData.value.id) {
    const { error } = await updateAdminUser(formData.value.id, payload);
    if (!error) { window.$message?.success('更新成功'); modalVisible.value = false; loadData(); }
    else { window.$message?.error('操作失败'); }
  } else {
    if (!formData.value.password) { window.$message?.warning('请输入密码'); return; }
    payload.password = formData.value.password;
    const { error } = await createAdminUser(payload);
    if (!error) { window.$message?.success('创建成功'); modalVisible.value = false; loadData(); }
    else { window.$message?.error('操作失败'); }
  }
}
function confirmDelete(row: any) {
  dialog.warning({
    title: '删除用户', content: `确定要删除「${row.username}」吗？`,
    positiveText: '确认删除', negativeText: '取消', positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteAdminUser(row.id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error('删除失败'); }
    }
  });
}

onMounted(() => { loadRoles(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between mb-16px">
        <h3 class="text-18px font-bold">系统用户</h3>
        <NButton v-permission="'system.admin-user.create'" type="primary" @click="openCreate"><SvgIcon icon="ph:plus" class="mr-4px" />新增用户</NButton>
      </div>
      <div class="flex items-center gap-12px mb-16px flex-wrap">
        <NInput v-model:value="keyword" autosize placeholder="搜索用户名/姓名..." clearable size="small" class="w-200px" />
        <NSelect v-model:value="roleFilter" :options="roleOptions" size="small" class="w-140px" />
        <NButton size="small" @click="handleReset">重置</NButton>
        <NButton type="primary" size="small" @click="handleSearch">查询</NButton>
      </div>

      <NDataTable :columns="columns" :data="data" :bordered="false" size="small" :scroll-x="860" :loading="loading" />

      <div v-if="totalRecords > pageSize" class="flex items-center justify-between mt-16px">
        <span class="text-13px op-50">共 {{ totalRecords }} 条记录</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" />
      </div>
    </NCard>

    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 480px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NFormItem label="用户名" required><NInput v-model:value="formData.username" placeholder="请输入用户名" /></NFormItem>
        <NFormItem label="姓名"><NInput v-model:value="formData.name" placeholder="请输入姓名" /></NFormItem>
        <NFormItem :label="formData.id ? '重置密码（留空不修改）' : '密码'"><NInput v-model:value="formData.password" type="password" placeholder="请输入密码" /></NFormItem>
        <NFormItem label="角色"><NSelect v-model:value="formData.roleId" :options="roleOptions.filter(o => o.value !== '')" placeholder="请选择角色" /></NFormItem>
        <NFormItem label="状态"><div class="flex items-center gap-8px"><NSwitch v-model:value="formData.status" /><span class="text-13px">{{ formData.status ? '启用' : '禁用' }}</span></div></NFormItem>
      </NForm>
      <template #footer><div class="flex justify-end gap-12px"><NButton @click="modalVisible = false">取消</NButton><NButton type="primary" @click="handleSave">保存</NButton></div></template>
    </NModal>
  </div>
</template>
