<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { NCard, NButton, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NDataTable, NSpace, NTag, useDialog } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchPermissions, createPermission, updatePermission, deletePermission } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'SystemPermissionPage' });
const dialog = useDialog();
const authStore = useAuthStore();

interface PermRecord {
  id: number; name: string; code: string; parentId: number; parentName: string; sort: number;
  children?: PermRecord[];
}

const treeData = ref<PermRecord[]>([]);
const flatData = ref<PermRecord[]>([]);
const loading = ref(false);

// 将扁平列表转为树结构
function buildTree(list: PermRecord[]): PermRecord[] {
  const map: Record<number, PermRecord> = {};
  const roots: PermRecord[] = [];

  list.forEach(item => {
    map[item.id] = { ...item, children: [] };
  });

  list.forEach(item => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children!.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });

  // 移除空 children
  function clean(nodes: PermRecord[]) {
    nodes.forEach(n => {
      if (n.children && n.children.length === 0) delete n.children;
      else if (n.children) clean(n.children);
    });
  }
  clean(roots);
  return roots;
}

const columns: DataTableColumns<PermRecord> = [
  { title: '权限名称', key: 'name', width: 200, tree: true },
  {
    title: '权限标识', key: 'code', width: 220,
    render: (row) => h('code', { style: 'font-size:12px;background:#f5f5f5;padding:2px 6px;border-radius:3px;' }, { default: () => row.code })
  },
  { title: '排序', key: 'sort', width: 60, align: 'center' },
  {
    title: '层级', key: 'level', width: 80, align: 'center',
    render: (row) => {
      const dots = row.code.split('.').length;
      const labels = ['模块', '页面', '操作'];
      const types: Array<'info' | 'success' | 'warning'> = ['info', 'success', 'warning'];
      return h(NTag, { type: types[dots - 1] || 'default', size: 'small', bordered: false }, () => labels[dots - 1] || `L${dots}`);
    }
  },
  {
    title: '操作', key: 'action', width: 120, align: 'center',
    render: (row) => h(NSpace, { size: 8 }, () => [
      authStore.hasPermission('system.permission.manage') ? h(NButton, { text: true, type: 'primary', onClick: () => openEdit(row) }, () => '编辑') : null,
      authStore.hasPermission('system.permission.manage') ? h(NButton, { text: true, type: 'error', onClick: () => confirmDelete(row) }, () => '删除') : null
    ])
  }
];

async function loadData() {
  loading.value = true;
  const { data, error } = await fetchPermissions();
  loading.value = false;
  if (!error) {
    const list = data.list || data || [];
    flatData.value = list;
    treeData.value = buildTree(list);
  } else {
    window.$message?.error(error?.msg || '加载失败');
  }
}

// 构建上级权限选项（只允许选择模块和页面级别作为上级）
const parentOptions = ref<{ label: string; value: number }[]>([]);
function buildParentOptions(excludeId?: number) {
  const opts: { label: string; value: number }[] = [];
  flatData.value.forEach(p => {
    // 最多允许 3 层，所以只有 1-2 层的可以作为上级
    const depth = p.code.split('.').length;
    if (depth <= 2 && p.id !== excludeId) {
      const prefix = depth === 1 ? '' : '  └ ';
      opts.push({ label: prefix + p.name + ' (' + p.code + ')', value: p.id });
    }
  });
  parentOptions.value = opts;
}

const modalVisible = ref(false);
const modalTitle = ref('新增权限');
const formData = ref({ id: null as number | null, name: '', code: '', parentId: null as number | null, sort: 0 });

function openCreate() {
  modalTitle.value = '新增权限';
  formData.value = { id: null, name: '', code: '', parentId: null, sort: 0 };
  buildParentOptions();
  modalVisible.value = true;
}

function openEdit(row: PermRecord) {
  modalTitle.value = '编辑权限';
  formData.value = { id: row.id, name: row.name, code: row.code, parentId: row.parentId || null, sort: row.sort || 0 };
  buildParentOptions(row.id);
  modalVisible.value = true;
}

async function handleSave() {
  if (!formData.value.name || !formData.value.code) {
    window.$message?.warning('请填写权限名称和标识');
    return;
  }
  const payload = { name: formData.value.name, code: formData.value.code, parentId: formData.value.parentId || 0, sort: formData.value.sort };
  if (formData.value.id) {
    const { error } = await updatePermission(formData.value.id, payload);
    if (!error) { window.$message?.success('更新成功'); modalVisible.value = false; loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  } else {
    const { error } = await createPermission(payload);
    if (!error) { window.$message?.success('创建成功'); modalVisible.value = false; loadData(); }
    else { window.$message?.error(error?.msg || '操作失败'); }
  }
}

function confirmDelete(row: PermRecord) {
  dialog.warning({
    title: '删除权限',
    content: `确定要删除权限「${row.name}」吗？${row.children ? '其子权限也将失去上级关联。' : ''}`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deletePermission(row.id);
      if (!error) { window.$message?.success('删除成功'); loadData(); }
      else { window.$message?.error(error?.msg || '操作失败'); }
    }
  });
}

onMounted(() => { loadData(); });
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between mb-16px">
        <h3 class="text-18px font-bold m-0">权限管理</h3>
        <NButton v-permission="'system.permission.manage'" type="primary" @click="openCreate"><SvgIcon icon="ph:plus" class="mr-4px" />新增权限</NButton>
      </div>

      <NDataTable
        :columns="columns"
        :data="treeData"
        :bordered="false"
        size="small"
        :scroll-x="680"
        :loading="loading"
        :row-key="(row: PermRecord) => row.id"
        default-expand-all
      />
    </NCard>

    <NModal v-model:show="modalVisible" preset="card" :title="modalTitle" style="width: 480px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NFormItem label="权限名称" required><NInput v-model:value="formData.name" placeholder="如：用户管理" /></NFormItem>
        <NFormItem label="权限标识" required><NInput v-model:value="formData.code" placeholder="如：user.member.view" /></NFormItem>
        <NFormItem label="上级权限"><NSelect v-model:value="formData.parentId" :options="parentOptions" clearable placeholder="无（顶级权限）" /></NFormItem>
        <NFormItem label="排序"><NInputNumber v-model:value="formData.sort" class="w-full" /></NFormItem>
      </NForm>
      <template #footer><div class="flex justify-end gap-12px"><NButton @click="modalVisible = false">取消</NButton><NButton type="primary" @click="handleSave">保存</NButton></div></template>
    </NModal>
  </div>
</template>
