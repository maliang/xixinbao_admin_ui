<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import {
  NCard, NButton, NModal, NForm, NFormItem, NInput,
  NDataTable, NSpace, NTree, useDialog
} from 'naive-ui';
import type { DataTableColumns, TreeOption } from 'naive-ui';
import { fetchRoles, createRole, updateRole, deleteRole, fetchPermissions } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'SystemRolePage' });
const dialog = useDialog();
const authStore = useAuthStore();

// ==================== 角色列表 ====================
const data = ref<any[]>([]);
const loading = ref(false);

const columns = ref<DataTableColumns>([
  { title: 'ID', key: 'id', width: 60 },
  { title: '角色名称', key: 'name', width: 120 },
  { title: '描述', key: 'description', width: 200, render: (row) => row.description || '-' },
  { title: '权限数', key: 'permissionCount', width: 80, render: (row) => row.permissions?.length || 0 },
  { title: '创建时间', key: 'createdAt', width: 160 },
  {
    title: '操作', key: 'action', width: 120,
    render: (row) => h(NSpace, { size: 8 }, () => [
      authStore.hasPermission('system.role.edit') ? h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row) }, () => '编辑') : null,
      authStore.hasPermission('system.role.delete') ? h(NButton, { text: true, type: 'error', onClick: () => confirmDelete(row) }, () => '删除') : null
    ])
  }
]);

async function loadData() {
  loading.value = true;
  const { data: resData, error } = await fetchRoles();
  loading.value = false;
  if (!error) {
    data.value = resData?.list || resData || [];
  } else {
    window.$message?.error('加载角色列表失败');
  }
}

// ==================== 权限树 ====================
interface PermItem {
  id: number;
  name: string;
  code: string;
  parentId: number;
  sort: number;
}

const permissionTreeData = ref<TreeOption[]>([]);
const permissionLoading = ref(false);
const allPermissions = ref<PermItem[]>([]);

/** 将扁平权限列表构建为 NTree 所需的树形结构 */
function buildPermissionTree(list: PermItem[]): TreeOption[] {
  const map: Record<number, TreeOption> = {};
  const roots: TreeOption[] = [];

  // 先创建所有节点
  list.forEach(item => {
    map[item.id] = { key: item.id, label: item.name, children: [] };
  });

  // 建立父子关系
  list.forEach(item => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children!.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });

  // 移除空 children 数组（叶子节点不需要 children）
  function cleanEmpty(nodes: TreeOption[]) {
    nodes.forEach(n => {
      if (n.children && n.children.length === 0) {
        delete n.children;
      } else if (n.children) {
        cleanEmpty(n.children);
      }
    });
  }
  cleanEmpty(roots);
  return roots;
}

/** 加载权限列表并构建树 */
async function loadPermissions() {
  permissionLoading.value = true;
  const { data: resData, error } = await fetchPermissions();
  permissionLoading.value = false;
  if (!error) {
    const list: PermItem[] = resData?.list || resData || [];
    allPermissions.value = list;
    permissionTreeData.value = buildPermissionTree(list);
  } else {
    window.$message?.error('加载权限列表失败');
  }
}

// ==================== 创建/编辑表单 ====================
const modalVisible = ref(false);
const modalTitle = ref('新增角色');
const formData = ref({
  id: null as number | null,
  name: '',
  description: '',
  permissions: [] as number[]
});

// 权限树勾选的 keys
const checkedKeys = ref<number[]>([]);

function openCreate() {
  modalTitle.value = '新增角色';
  formData.value = { id: null, name: '', description: '', permissions: [] };
  checkedKeys.value = [];
  modalVisible.value = true;
  loadPermissions();
}

function openEdit(row: any) {
  modalTitle.value = '编辑角色';
  formData.value = {
    id: row.id,
    name: row.name,
    description: row.description || '',
    permissions: row.permissions || []
  };
  // 回显已有权限（勾选状态）
  checkedKeys.value = [...(row.permissions || [])];
  modalVisible.value = true;
  loadPermissions();
}

async function handleSave() {
  if (!formData.value.name) {
    window.$message?.warning('请输入角色名称');
    return;
  }

  const payload = {
    name: formData.value.name,
    description: formData.value.description,
    permissions: checkedKeys.value
  };

  if (formData.value.id) {
    const { error } = await updateRole(formData.value.id, payload);
    if (!error) {
      window.$message?.success('更新成功');
      modalVisible.value = false;
      loadData();
    } else {
      window.$message?.error('操作失败');
    }
  } else {
    const { error } = await createRole(payload);
    if (!error) {
      window.$message?.success('创建成功');
      modalVisible.value = false;
      loadData();
    } else {
      window.$message?.error('操作失败');
    }
  }
}

function confirmDelete(row: any) {
  dialog.warning({
    title: '删除角色',
    content: `确定要删除角色「${row.name}」吗？`,
    positiveText: '确认删除',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteRole(row.id);
      if (!error) {
        window.$message?.success('删除成功');
        loadData();
      } else {
        window.$message?.error('删除失败');
      }
    }
  });
}

onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between mb-16px">
        <h3 class="text-18px font-bold m-0">角色管理</h3>
        <div class="flex items-center gap-12px">
          <NButton v-permission="'system.role.create'" type="primary" @click="openCreate">
            <SvgIcon icon="ph:plus" class="mr-4px" />新增角色
          </NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="data"
        :bordered="false"
        size="small"
        :scroll-x="820"
        :loading="loading"
      />
    </NCard>

    <!-- 创建/编辑角色弹窗 -->
    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 600px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NFormItem label="角色名称" required>
          <NInput v-model:value="formData.name" placeholder="请输入角色名称" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="formData.description" type="textarea" :rows="2" placeholder="请输入角色描述" />
        </NFormItem>
        <NFormItem label="权限分配">
          <div class="w-full border border-gray-200 rounded-6px p-12px max-h-400px overflow-auto">
            <NTree
              v-model:checked-keys="checkedKeys"
              :data="permissionTreeData"
              checkable
              cascade
              :selectable="false"
              check-strategy="all"
              :loading="permissionLoading"
              block-line
              expand-on-click
              default-expand-all
              key-field="key"
              label-field="label"
              children-field="children"
            />
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
