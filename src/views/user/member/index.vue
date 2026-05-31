<script setup lang="ts">
import { ref, h, onMounted, watch } from 'vue';
import {
  NCard, NButton, NSpace, NTag, NInput, NSelect, NDatePicker, NSwitch,
  NPagination, NCollapse, NCollapseItem, NGrid, NGridItem,
  NDrawer, NDrawerContent, NTabs, NTabPane, NForm, NFormItem, NInputNumber,
  NModal, useDialog
} from 'naive-ui';
import { fetchUsers, fetchUser, createUser, updateUser, updateUserStatus, deleteUser, fetchLevels, deleteWallet } from '@/service/api';
import { $t } from '@/locales';

defineOptions({ name: 'UserMemberPage' });
const dialog = useDialog();

// ========== 会员等级选项 ==========
const levelSelectOptions = ref<{ label: string; value: number }[]>([]);
async function loadLevelOptions() {
  const { data, error } = await fetchLevels();
  if (!error && data) {
    const list = data.list || data || [];
    levelSelectOptions.value = (Array.isArray(list) ? list : []).map((l: any) => ({ label: l.name, value: l.id }));
  }
}

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 筛选 ==========
const searchForm = ref({ account: '', name: '', ip: '', status: '' as string, dateRange: null as [number, number] | null, level: '' as string });
const statusOptions = [{ label: $t('biz.common.all'), value: '' }, { label: $t('biz.common.normal'), value: '1' }, { label: $t('biz.common.frozen'), value: '0' }];

// ========== 分页 ==========
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);

// ========== 会员列表 ==========
const members = ref<any[]>([]);

async function loadData() {
  loading.value = true;
  const params: Record<string, any> = {
    page: currentPage.value,
    page_size: pageSize
  };
  if (searchForm.value.account) params.account = searchForm.value.account;
  if (searchForm.value.name) params.name = searchForm.value.name;
  if (searchForm.value.ip) params.ip = searchForm.value.ip;
  if (searchForm.value.status !== '') params.status = searchForm.value.status;
  if (searchForm.value.level !== '') params.level_id = searchForm.value.level;
  if (searchForm.value.dateRange) {
    params.date_start = toLocalDateStr(searchForm.value.dateRange[0]);
    params.date_end = toLocalDateStr(searchForm.value.dateRange[1]);
  }

  const { data, error } = await fetchUsers(params);
  loading.value = false;
  if (!error) {
    members.value = data.list || [];
    totalRecords.value = data.total || 0;
  } else {
    window.$message?.error(error?.msg || $t('biz.common.operateFailed'));
  }
}

function handleReset() {
  searchForm.value = { account: '', name: '', ip: '', status: '', dateRange: null, level: '' };
  currentPage.value = 1;
  loadData();
}

/** 将时间戳转为本地日期字符串 YYYY-MM-DD（避免 UTC 偏移导致日期差一天） */
function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

watch(currentPage, loadData);
onMounted(() => { loadData(); loadLevelOptions(); });

// ========== 编辑抽屉 ==========
const editVisible = ref(false);
const editTab = ref('basic');
const editSubTab = ref('bank');
const editForm = ref({ account: '', balance: '', levelId: null as number | null, name: '', phone: '', idNumber: '', withdrawFee: 1, credit: 100, points: 0, loginPwd: '', payPwd: '', remark: '' });
const editingMemberId = ref<number | null>(null);

// 用户详情数据（证件照片、钱包等）
const userDetail = ref<any>({});
const bankWallets = ref<any[]>([]);
const cryptoWallets = ref<any[]>([]);

async function openEdit(m: any) {
  editingMemberId.value = m.id;
  editForm.value = { account: m.account, balance: String(m.balance || 0), levelId: m.levelId || null, name: m.name || '', phone: m.phone || '', idNumber: m.idCardNumber || m.id_card_number || '', withdrawFee: m.withdrawFeeRate || m.withdraw_fee_rate || 1, credit: m.creditScore || m.credit_score || 100, points: m.points || 0, loginPwd: '', payPwd: '', remark: m.remark || '' };
  editTab.value = 'basic';
  editVisible.value = true;

  // 加载用户详情（含钱包）
  const { data, error } = await fetchUser(m.id);
  if (!error && data) {
    userDetail.value = data;
    // 回填详情中的证件号（详情接口可能有更完整的数据）
    if (data.idCardNumber || data.id_card_number) {
      editForm.value.idNumber = data.idCardNumber || data.id_card_number || editForm.value.idNumber;
    }
    const wallets = data.wallets || [];
    bankWallets.value = wallets.filter((w: any) => {
      const channelType = w.walletType?.type || w.wallet_type?.type || '';
      return channelType !== 'crypto';
    });
    cryptoWallets.value = wallets.filter((w: any) => {
      const channelType = w.walletType?.type || w.wallet_type?.type || '';
      return channelType === 'crypto';
    });
  }
}

async function handleSaveEdit() {
  const payload: Record<string, any> = {
    name: editForm.value.name,
    phone: editForm.value.phone,
    levelId: editForm.value.levelId,
    idCardNumber: editForm.value.idNumber,
    withdrawFeeRate: editForm.value.withdrawFee,
    creditScore: editForm.value.credit,
    points: editForm.value.points,
    remark: editForm.value.remark,
  };
  if (editForm.value.loginPwd) payload.loginPassword = editForm.value.loginPwd;
  if (editForm.value.payPwd) payload.payPassword = editForm.value.payPwd;

  if (editingMemberId.value) {
    // 编辑
    const { error } = await updateUser(editingMemberId.value, payload);
    if (!error) {
      window.$message?.success($t('biz.common.updateSuccess'));
      editVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || $t('biz.common.operateFailed'));
    }
  } else {
    // 新增
    if (!editForm.value.account) { window.$message?.warning($t('biz.common.account')); return; }
    if (!editForm.value.loginPwd) { window.$message?.warning($t('biz.user.member.loginPassword')); return; }
    payload.account = editForm.value.account;
    payload.phone = editForm.value.phone || editForm.value.account;
    const { error } = await createUser(payload);
    if (!error) {
      window.$message?.success($t('biz.common.createSuccess'));
      editVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || $t('biz.common.operateFailed'));
    }
  }
}

// ========== 管控设置弹窗 ==========
const controlVisible = ref(false);
const controlForm = ref({ accountStatus: true, tradeStatus: true, withdrawStatus: true, forceOffline: false, accountDuration: null as number | null, accountUnit: '小时', accountReason: '', tradeDuration: null as number | null, tradeUnit: '小时', tradeReason: '', withdrawDuration: null as number | null, withdrawUnit: '小时', withdrawReason: '', offlineDuration: null as number | null, offlineUnit: '小时', offlineMsg: '' });
const unitOptions = [{ label: $t('biz.user.control.minutes'), value: '分钟' }, { label: $t('biz.user.control.hours'), value: '小时' }, { label: $t('biz.user.control.days'), value: '天' }, { label: $t('biz.user.control.permanent'), value: '永久' }];
const controlMemberId = ref<number | null>(null);

function openControl(m: any) {
  controlMemberId.value = m.id;
  // 从用户数据中回填禁用信息
  let banInfo: any = {};
  try {
    banInfo = m.banInfo ? (typeof m.banInfo === 'string' ? JSON.parse(m.banInfo) : m.banInfo) : {};
  } catch { banInfo = {}; }

  controlForm.value = {
    accountStatus: !!m.status,
    tradeStatus: !!m.tradeStatus,
    withdrawStatus: !!m.withdrawStatus,
    forceOffline: !!banInfo.forceOffline,
    accountDuration: banInfo.accountDuration || null,
    accountUnit: banInfo.accountUnit || '小时',
    accountReason: banInfo.accountReason || '',
    tradeDuration: banInfo.tradeDuration || null,
    tradeUnit: banInfo.tradeUnit || '小时',
    tradeReason: banInfo.tradeReason || '',
    withdrawDuration: banInfo.withdrawDuration || null,
    withdrawUnit: banInfo.withdrawUnit || '小时',
    withdrawReason: banInfo.withdrawReason || '',
    offlineDuration: banInfo.offlineDuration || null,
    offlineUnit: banInfo.offlineUnit || '小时',
    offlineMsg: banInfo.offlineMsg || ''
  };
  controlVisible.value = true;
}

async function handleSaveControl() {
  if (!controlMemberId.value) return;

  // 验证：关闭状态时必须填写时长和理由
  if (!controlForm.value.accountStatus) {
    if (!controlForm.value.accountDuration && controlForm.value.accountUnit !== '永久') { window.$message?.warning($t('biz.user.control.duration')); return; }
    if (!controlForm.value.accountReason) { window.$message?.warning($t('biz.user.control.reason')); return; }
  }
  if (!controlForm.value.tradeStatus) {
    if (!controlForm.value.tradeDuration && controlForm.value.tradeUnit !== '永久') { window.$message?.warning($t('biz.user.control.duration')); return; }
    if (!controlForm.value.tradeReason) { window.$message?.warning($t('biz.user.control.reason')); return; }
  }
  if (!controlForm.value.withdrawStatus) {
    if (!controlForm.value.withdrawDuration && controlForm.value.withdrawUnit !== '永久') { window.$message?.warning($t('biz.user.control.duration')); return; }
    if (!controlForm.value.withdrawReason) { window.$message?.warning($t('biz.user.control.reason')); return; }
  }
  if (controlForm.value.forceOffline) {
    if (!controlForm.value.offlineDuration && controlForm.value.offlineUnit !== '永久') { window.$message?.warning($t('biz.user.control.duration')); return; }
    if (!controlForm.value.offlineMsg) { window.$message?.warning($t('biz.user.control.offlineMsg')); return; }
  }

  const payload: Record<string, any> = {
    status: controlForm.value.accountStatus ? 1 : 0,
    tradeStatus: controlForm.value.tradeStatus ? 1 : 0,
    withdrawStatus: controlForm.value.withdrawStatus ? 1 : 0,
    forceOffline: controlForm.value.forceOffline ? 1 : 0,
    banInfo: {
      accountDuration: controlForm.value.accountDuration,
      accountUnit: controlForm.value.accountUnit,
      accountReason: controlForm.value.accountReason,
      tradeDuration: controlForm.value.tradeDuration,
      tradeUnit: controlForm.value.tradeUnit,
      tradeReason: controlForm.value.tradeReason,
      withdrawDuration: controlForm.value.withdrawDuration,
      withdrawUnit: controlForm.value.withdrawUnit,
      withdrawReason: controlForm.value.withdrawReason,
      offlineDuration: controlForm.value.offlineDuration,
      offlineUnit: controlForm.value.offlineUnit,
      offlineMsg: controlForm.value.offlineMsg,
      forceOffline: controlForm.value.forceOffline,
    }
  };
  const { error } = await updateUserStatus(controlMemberId.value, payload);
  if (!error) {
    window.$message?.success($t('biz.common.operateSuccess'));
    controlVisible.value = false;
    loadData();
  } else {
    window.$message?.error(error?.msg || $t('biz.common.operateFailed'));
  }
}

async function handleUnbindWallet(walletId: number) {
  const { error } = await deleteWallet(walletId);
  if (!error) {
    window.$message?.success($t('biz.user.member.unbindSuccess'));
    // 重新加载详情
    if (editingMemberId.value) {
      const { data } = await fetchUser(editingMemberId.value);
      if (data) {
        const wallets = data.wallets || [];
        bankWallets.value = wallets.filter((w: any) => {
          const channelType = w.walletType?.type || w.wallet_type?.type || '';
          return channelType !== 'crypto';
        });
        cryptoWallets.value = wallets.filter((w: any) => {
          const channelType = w.walletType?.type || w.wallet_type?.type || '';
          return channelType === 'crypto';
        });
      }
    }
  }
}

async function handleDeleteMember(m: any) {
  dialog.warning({
    title: $t('biz.common.confirmDeleteTitle'),
    content: $t('biz.user.member.confirmDeleteUser', { account: m.account }),
    positiveText: $t('biz.common.confirmDeleteTitle'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await deleteUser(m.id);
      if (!error) {
        window.$message?.success($t('biz.common.operateSuccess'));
        loadData();
      } else {
        window.$message?.error(error?.msg || $t('biz.common.operateFailed'));
      }
    }
  });
}

// ========== 新增用户 ==========
function openCreateUser() {
  editingMemberId.value = null;
  editForm.value = { account: '', balance: '0', levelId: null, name: '', phone: '', idNumber: '', withdrawFee: 1, credit: 100, points: 0, loginPwd: '', payPwd: '', remark: '' };
  editTab.value = 'basic';
  editVisible.value = true;
}

// ========== 复制文本 ==========
function copyText(text: string) {
  if (!text) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      window.$message?.success($t('biz.common.operateSuccess'));
    });
  } else {
    // 兼容非 HTTPS 环境
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    window.$message?.success($t('biz.common.operateSuccess'));
  }
}

// ========== 批量删除 ==========
const selectedIds = ref<number[]>([]);

function handleBatchDelete() {
  if (!selectedIds.value.length) {
    window.$message?.warning($t('biz.user.member.batchDeleteConfirm', { count: 0 }));
    return;
  }
  dialog.warning({
    title: $t('biz.user.member.batchDelete'),
    content: $t('biz.user.member.batchDeleteConfirm', { count: selectedIds.value.length }),
    positiveText: $t('biz.common.confirmDeleteTitle'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      for (const id of selectedIds.value) {
        await deleteUser(id);
      }
      window.$message?.success($t('biz.common.deleteSuccess'));
      selectedIds.value = [];
      loadData();
    }
  });
}
</script>

<template>
  <div class="p-16px">
    <!-- 筛选条件 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse>
        <NCollapseItem :title="$t('biz.common.filterConditions')" name="filter">
          <div class="flex items-end gap-12px flex-wrap">
            <div style="width: 130px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">{{ $t('biz.user.member.account') }}</div>
              <NInput v-model:value="searchForm.account" size="small" />
            </div>
            <div style="width: 130px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">{{ $t('biz.user.member.name') }}</div>
              <NInput v-model:value="searchForm.name" size="small" />
            </div>
            <div style="width: 130px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">{{ $t('biz.user.member.ip') }}</div>
              <NInput v-model:value="searchForm.ip" size="small" />
            </div>
            <div style="width: 120px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">{{ $t('biz.common.status') }}</div>
              <NSelect v-model:value="searchForm.status" :options="statusOptions" size="small" />
            </div>
            <div style="width: 120px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">{{ $t('biz.user.member.level') }}</div>
              <NSelect v-model:value="searchForm.level" :options="[{ label: $t('biz.common.all'), value: '' }, ...levelSelectOptions.map(o => ({ ...o, value: String(o.value) }))]" size="small" />
            </div>
            <div style="width: 280px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">{{ $t('biz.common.registerTime') }}</div>
              <NDatePicker v-model:value="searchForm.dateRange" type="daterange" size="small" class="w-full" :start-placeholder="$t('biz.common.startDate')" :end-placeholder="$t('biz.common.endDate')" />
            </div>
            <div class="flex gap-8px" style="flex-shrink: 0;">
              <NButton size="small" @click="handleReset">{{ $t('common.reset') }}</NButton>
              <NButton size="small" type="primary" @click="loadData">{{ $t('common.search') }}</NButton>
            </div>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-8px mb-12px">
      <NButton type="primary" @click="openCreateUser"><SvgIcon icon="ph:plus" class="mr-4px" />{{ $t('biz.user.member.addUser') }}</NButton>
      <NButton type="error" ghost @click="handleBatchDelete"><SvgIcon icon="ph:trash" class="mr-4px" />{{ $t('biz.user.member.batchDelete') }}</NButton>
    </div>

    <!-- 会员卡片列表 -->
    <div class="flex flex-col gap-12px">
      <NCard v-for="m in members" :key="m.id" :bordered="false" class="card-wrapper" content-style="padding: 16px;">
        <div class="flex gap-16px w-full justify-between">
          <!-- 左：基本信息 -->
          <div class="flex-shrink-0" style="min-width: 140px;">
            <div class="flex items-center gap-4px mb-4px"><input type="checkbox" class="mr-4px" :checked="selectedIds.includes(m.id)" @change="(e: any) => { if (e.target.checked) { selectedIds.push(m.id); } else { selectedIds = selectedIds.filter((id: number) => id !== m.id); } }" /><span class="text-12px op-50">ID: {{ m.id }}</span></div>
            <div class="text-15px font-bold">{{ $t('biz.user.member.name') }}: {{ m.name || '-' }}</div>
            <div class="text-12px op-60 mt-2px">{{ $t('biz.user.member.account') }}: {{ m.account }}</div>
            <div class="text-12px op-60 mt-2px">{{ $t('biz.user.member.memberLevel') }}: <span class="font-bold">{{ m.level?.name || '-' }}</span></div>
            <div class="text-12px op-60 mt-2px">{{ $t('biz.user.member.referrer') }}: {{ m.referrer ? (m.referrer.name || m.referrer.account) : '-' }}</div>
          </div>
          <!-- 中：财务数据 -->
          <div class="flex-shrink-0" style="min-width: 140px;">
            <div class="text-12px op-50">{{ $t('biz.user.member.balance') }}: <span class="font-bold">{{ m.balance }}</span></div>
            <div class="text-12px op-50 mt-4px">{{ $t('biz.user.member.frozenBalance') }}: {{ m.frozenBalance }}</div>
            <div class="text-12px op-50 mt-4px">{{ $t('biz.user.member.points') }}: {{ m.points }}</div>
            <div class="text-12px op-50 mt-4px">{{ $t('biz.user.member.creditScore') }}: {{ m.creditScore }}</div>
          </div>
          <!-- 中：状态 -->
          <div class="flex-shrink-0" style="min-width: 120px;">
            <div class="text-12px">{{ $t('biz.user.member.kycStatus') }}: <NTag size="tiny" :type="m.kycStatus === 2 ? 'success' : m.kycStatus === 1 ? 'warning' : 'default'" :bordered="false">{{ m.kycStatus === 0 ? $t('biz.user.member.kycUnverified') : m.kycStatus === 1 ? $t('biz.user.member.kycPending') : m.kycStatus === 2 ? $t('biz.user.member.kycApproved') : $t('biz.user.member.kycRejected') }}</NTag></div>
            <div class="text-12px mt-4px">{{ $t('biz.user.member.userStatus') }}: <NTag size="tiny" :type="m.status ? 'success' : 'error'" :bordered="false">{{ m.status ? $t('biz.common.normal') : $t('biz.common.frozen') }}</NTag></div>
            <div class="text-12px mt-4px">{{ $t('biz.user.member.withdrawStatus') }}: <NTag size="tiny" :type="m.withdrawStatus ? 'success' : 'error'" :bordered="false">{{ m.withdrawStatus ? $t('biz.common.normal') : $t('biz.common.forbidden') }}</NTag></div>
            <div class="text-12px mt-4px">{{ $t('biz.user.member.tradeStatus') }}: <NTag size="tiny" :type="m.tradeStatus ? 'success' : 'error'" :bordered="false">{{ m.tradeStatus ? $t('biz.common.normal') : $t('biz.common.forbidden') }}</NTag></div>
          </div>
          <!-- 右：注册/登录信息 -->
          <div class="flex-shrink-0" style="min-width: 160px;">
            <div class="text-11px op-50">{{ $t('biz.common.registerTime') }}: {{ m.createdAt }}</div>
            <div class="text-11px op-50 mt-2px">{{ $t('biz.user.member.regIp') }}: {{ m.regIp || '-' }}</div>
            <div class="text-11px op-50 mt-2px">{{ $t('biz.user.member.regIsp') }}: {{ m.regIsp || '-' }}</div>
            <div class="text-11px op-50 mt-2px">{{ $t('biz.user.member.regSource') }}: {{ m.referrerUrl || '-' }}</div>
          </div>
          <!-- 最右：最近登录 -->
          <div class="flex-shrink-0" style="min-width: 160px;">
            <div class="text-11px op-50">{{ $t('biz.user.member.lastLogin') }}: {{ m.lastLoginAt || '-' }}</div>
            <div class="text-11px op-50 mt-2px">{{ $t('biz.user.member.lastLoginIp') }}: {{ m.lastLoginIp || '-' }}</div>
            <div class="text-11px op-50 mt-2px">{{ $t('biz.user.member.lastLoginIsp') }}: {{ m.lastLoginIsp || '-' }}</div>
            <div class="flex gap-4px mt-8px">
              <NButton v-permission="'user.member.edit'" size="tiny" quaternary @click="openEdit(m)"><SvgIcon icon="ph:pencil-simple" /></NButton>
              <NButton v-permission="'user.member.freeze'" size="tiny" quaternary @click="openControl(m)"><SvgIcon icon="ph:gear" /></NButton>
              <NButton v-permission="'user.member.edit'" size="tiny" quaternary type="error" @click="handleDeleteMember(m)"><SvgIcon icon="ph:trash" /></NButton>
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- 分页 -->
    <div v-if="totalRecords > pageSize" class="flex items-center justify-between mt-16px">
      <span class="text-13px op-50">{{ $t('biz.common.total', { count: totalRecords }) }}</span>
      <NPagination v-model:page="currentPage" :page-count="Math.ceil(totalRecords / pageSize)" />
    </div>

    <!-- 编辑会员抽屉 -->
    <NDrawer v-model:show="editVisible" :width="720" placement="right">
      <NDrawerContent closable>
        <template #header>
          <div>
            <div class="text-16px font-bold">{{ editingMemberId ? $t('biz.user.member.editMember') : $t('biz.user.member.addUser') }}</div>
            <div v-if="editingMemberId" class="text-12px op-50 mt-12px">{{ $t('biz.user.member.userId') }}: {{ editingMemberId }}</div>
          </div>
        </template>
        <NTabs v-model:value="editTab" type="line">
          <NTabPane name="basic" :tab="$t('biz.user.member.basicInfo')">
            <!-- 账户概览 -->
            <NCard :bordered="false" class="mb-16px" content-style="padding: 16px;">
              <div class="text-15px font-bold mb-12px">{{ $t('biz.user.member.accountOverview') }}</div>
              <NGrid :x-gap="16" :cols="3">
                <NGridItem><NFormItem :label="$t('biz.user.member.account')" :show-feedback="false"><NInput v-model:value="editForm.account" :disabled="!!editingMemberId" :placeholder="$t('biz.user.member.account')"><template v-if="editingMemberId" #suffix><SvgIcon icon="ph:copy" class="cursor-pointer op-50" /></template></NInput></NFormItem></NGridItem>
                <NGridItem><NFormItem :label="$t('biz.user.member.balance')" :show-feedback="false"><NInput :value="editForm.balance" class="text-primary font-bold" disabled /></NFormItem></NGridItem>
                <NGridItem><NFormItem :label="$t('biz.user.member.memberLevel')" :show-feedback="false"><NSelect v-model:value="editForm.levelId" :options="levelSelectOptions" /></NFormItem></NGridItem>
              </NGrid>
            </NCard>
            <!-- 个人信息 -->
            <NCard :bordered="false" content-style="padding: 16px;">
              <div class="text-15px font-bold mb-12px">{{ $t('biz.user.member.personalInfo') }}</div>
              <NGrid :x-gap="16" :y-gap="12" :cols="2">
                <NGridItem><NFormItem :label="$t('biz.user.member.name')" :show-feedback="false"><NInput v-model:value="editForm.name" /></NFormItem></NGridItem>
                <NGridItem><NFormItem :label="$t('biz.common.phone')" :show-feedback="false"><NInput v-model:value="editForm.phone" /></NFormItem></NGridItem>
              </NGrid>
              <NGrid :x-gap="16" :y-gap="12" :cols="3" class="mt-12px">
                <NGridItem><NFormItem :label="$t('biz.user.member.idNumber')" :show-feedback="false"><NInput v-model:value="editForm.idNumber" /></NFormItem></NGridItem>
                <NGridItem><NFormItem :label="$t('biz.user.member.withdrawFee')" :show-feedback="false"><NInputNumber v-model:value="editForm.withdrawFee" :min="0" :max="100"><template #suffix>%</template></NInputNumber></NFormItem></NGridItem>
                <NGridItem><NFormItem :label="$t('biz.user.member.creditScore')" :show-feedback="false"><NInputNumber v-model:value="editForm.credit" :min="0"><template #suffix>分</template></NInputNumber></NFormItem></NGridItem>
                <NGridItem><NFormItem :label="$t('biz.user.member.points')" :show-feedback="false"><NInputNumber v-model:value="editForm.points" :min="0" class="w-full" /></NFormItem></NGridItem>
              </NGrid>
              <NGrid :x-gap="16" :y-gap="12" :cols="2" class="mt-12px">
                <NGridItem><NFormItem :label="$t('biz.user.member.loginPassword')" :show-feedback="false"><NInput v-model:value="editForm.loginPwd" type="password" show-password-on="click" placeholder="********" /></NFormItem></NGridItem>
                <NGridItem><NFormItem :label="$t('biz.user.member.payPassword')" :show-feedback="false"><NInput v-model:value="editForm.payPwd" type="password" show-password-on="click" placeholder="********" /></NFormItem></NGridItem>
              </NGrid>
              <NFormItem :label="$t('biz.common.remark')" class="mt-12px" :show-feedback="false"><NInput v-model:value="editForm.remark" type="textarea" :rows="3" /></NFormItem>
            </NCard>
          </NTabPane>
          <NTabPane name="identity" :tab="$t('biz.user.member.walletInfo')">
            <!-- 证件照片 -->
            <NCard :bordered="false" class="mb-16px" content-style="padding: 16px;">
              <div class="flex items-center justify-between mb-12px">
                <span class="text-15px font-bold">{{ $t('biz.user.kyc.idCardFront') }}</span>
              </div>
              <div class="flex gap-16px">
                <div class="w-1/2 h-160px bg-gray-100 rounded-8px flex-center overflow-hidden">
                  <img v-if="userDetail.idCardFront" :src="userDetail.idCardFront" class="w-full h-full object-cover" />
                  <span v-else class="op-30">{{ $t('biz.user.kyc.idCardFront') }}</span>
                </div>
                <div class="w-1/2 h-160px bg-gray-100 rounded-8px flex-center overflow-hidden">
                  <img v-if="userDetail.idCardBack" :src="userDetail.idCardBack" class="w-full h-full object-cover" />
                  <span v-else class="op-30">{{ $t('biz.user.kyc.idCardBack') }}</span>
                </div>
              </div>
            </NCard>
            <!-- 银行卡/钱包 Tab -->
            <NTabs v-model:value="editSubTab" type="line">
              <NTabPane name="bank" :tab="$t('biz.user.member.bankWallet')">
                <div v-if="bankWallets.length === 0" class="text-center op-40 py-24px">{{ $t('biz.common.noData') }}</div>
                <NCard v-for="w in bankWallets" :key="w.id" :bordered="false" class="mb-12px" content-style="padding: 16px;">
                  <NGrid :x-gap="16" :y-gap="12" :cols="2">
                    <NGridItem><NFormItem :label="$t('biz.user.wallet.bankName')" :show-feedback="false"><NInput :value="w.bankName || '-'" disabled /></NFormItem></NGridItem>
                    <NGridItem><NFormItem :label="$t('biz.user.wallet.accountNumber')" :show-feedback="false"><NInput :value="w.accountNumber || '-'" disabled /></NFormItem></NGridItem>
                    <NGridItem><NFormItem :label="$t('biz.user.wallet.accountName')" :show-feedback="false"><NInput :value="w.accountName || '-'" disabled /></NFormItem></NGridItem>
                    <NGridItem><NFormItem :label="$t('biz.user.wallet.branchName')" :show-feedback="false"><NInput :value="w.branchName || '-'" disabled /></NFormItem></NGridItem>
                  </NGrid>
                  <div class="flex justify-end mt-12px"><NButton size="small" type="error" ghost @click="handleUnbindWallet(w.id)"><SvgIcon icon="ph:link-break" class="mr-2px" />{{ $t('biz.user.member.unbind') }}</NButton></div>
                </NCard>
              </NTabPane>
              <NTabPane name="wallet" :tab="$t('biz.user.member.cryptoWallet')">
                <div v-if="cryptoWallets.length === 0" class="text-center op-40 py-24px">{{ $t('biz.common.noData') }}</div>
                <NCard v-for="w in cryptoWallets" :key="w.id" :bordered="false" class="mb-12px" content-style="padding: 16px;">
                  <div class="flex items-end gap-12px">
                    <NFormItem :label="$t('biz.user.wallet.walletType')" :show-feedback="false" class="w-120px"><NInput :value="w.walletType?.name || w.wallet_type?.name || '-'" disabled /></NFormItem>
                    <NFormItem :label="$t('biz.user.wallet.walletAddress')" :show-feedback="false" class="flex-1"><NInput :value="w.accountNumber || '-'" disabled /></NFormItem>
                    <NButton size="small" quaternary @click="copyText(w.accountNumber || '')"><SvgIcon icon="ph:copy" class="mr-2px" />{{ $t('common.copy') }}</NButton>
                    <NButton size="small" type="error" ghost @click="handleUnbindWallet(w.id)"><SvgIcon icon="ph:link-break" class="mr-2px" />{{ $t('biz.user.member.unbind') }}</NButton>
                  </div>
                </NCard>
              </NTabPane>
            </NTabs>
          </NTabPane>
        </NTabs>
        <template #footer><NSpace justify="end"><NButton @click="editVisible = false">{{ $t('common.cancel') }}</NButton><NButton type="primary" @click="handleSaveEdit">{{ $t('biz.user.member.saveChanges') }}</NButton></NSpace></template>
      </NDrawerContent>
    </NDrawer>

    <!-- 用户管控设置弹窗 -->
    <NModal v-model:show="controlVisible" preset="card" :title="$t('biz.user.control.title')" style="width: 560px;" :bordered="false">
      <!-- 账号状态 -->
      <div class="flex items-center justify-between py-12px border-b border-gray-100">
        <div><div class="font-bold">{{ $t('biz.user.control.accountStatus') }}</div><div class="text-12px op-50">{{ $t('biz.user.control.accountStatus') }}</div></div>
        <NSwitch v-model:value="controlForm.accountStatus" />
      </div>
      <div v-if="!controlForm.accountStatus" class="pl-16px py-8px border-l-2 border-gray-200 ml-8px mt-8px mb-8px">
        <NFormItem :label="$t('biz.user.control.duration')" :show-feedback="false"><div class="flex gap-8px"><NInputNumber v-model:value="controlForm.accountDuration" size="small" class="w-140px" /><NSelect v-model:value="controlForm.accountUnit" :options="unitOptions" size="small" class="w-80px" /></div></NFormItem>
        <NFormItem :label="$t('biz.user.control.reason')" :show-feedback="false" class="mt-8px"><NInput v-model:value="controlForm.accountReason" type="textarea" :rows="3" size="small" /></NFormItem>
      </div>
      <!-- 交易功能 -->
      <div class="flex items-center justify-between py-12px border-b border-gray-100">
        <div><div class="font-bold">{{ $t('biz.user.control.tradeStatus') }}</div><div class="text-12px op-50">{{ $t('biz.user.control.tradeStatus') }}</div></div>
        <NSwitch v-model:value="controlForm.tradeStatus" />
      </div>
      <div v-if="!controlForm.tradeStatus" class="pl-16px py-8px border-l-2 border-gray-200 ml-8px mt-8px mb-8px">
        <NFormItem :label="$t('biz.user.control.duration')" :show-feedback="false"><div class="flex gap-8px"><NInputNumber v-model:value="controlForm.tradeDuration" size="small" class="w-140px" /><NSelect v-model:value="controlForm.tradeUnit" :options="unitOptions" size="small" class="w-80px" /></div></NFormItem>
        <NFormItem :label="$t('biz.user.control.reason')" :show-feedback="false" class="mt-8px"><NInput v-model:value="controlForm.tradeReason" type="textarea" :rows="3" size="small" /></NFormItem>
      </div>
      <!-- 提现功能 -->
      <div class="flex items-center justify-between py-12px border-b border-gray-100">
        <div><div class="font-bold">{{ $t('biz.user.control.withdrawStatus') }}</div><div class="text-12px op-50">{{ $t('biz.user.control.withdrawStatus') }}</div></div>
        <NSwitch v-model:value="controlForm.withdrawStatus" />
      </div>
      <div v-if="!controlForm.withdrawStatus" class="pl-16px py-8px border-l-2 border-gray-200 ml-8px mt-8px mb-8px">
        <NFormItem :label="$t('biz.user.control.duration')" :show-feedback="false"><div class="flex gap-8px"><NInputNumber v-model:value="controlForm.withdrawDuration" size="small" class="w-140px" /><NSelect v-model:value="controlForm.withdrawUnit" :options="unitOptions" size="small" class="w-80px" /></div></NFormItem>
        <NFormItem :label="$t('biz.user.control.reason')" :show-feedback="false" class="mt-8px"><NInput v-model:value="controlForm.withdrawReason" type="textarea" :rows="3" size="small" /></NFormItem>
      </div>
      <!-- 强制下线 -->
      <div class="flex items-center justify-between py-12px">
        <div><div class="font-bold">{{ $t('biz.user.control.forceOffline') }}</div><div class="text-12px op-50">{{ $t('biz.user.control.forceOffline') }}</div></div>
        <NSwitch v-model:value="controlForm.forceOffline" />
      </div>
      <div v-if="controlForm.forceOffline" class="pl-16px py-8px border-l-2 border-gray-200 ml-8px mt-8px">
        <NFormItem :label="$t('biz.user.control.duration')" :show-feedback="false"><div class="flex gap-8px"><NInputNumber v-model:value="controlForm.offlineDuration" size="small" class="w-140px" /><NSelect v-model:value="controlForm.offlineUnit" :options="unitOptions" size="small" class="w-80px" /></div></NFormItem>
        <NFormItem :label="$t('biz.user.control.offlineMsg')" :show-feedback="false" class="mt-8px"><NInput v-model:value="controlForm.offlineMsg" type="textarea" :rows="3" size="small" /></NFormItem>
      </div>
      <template #footer><NSpace justify="end"><NButton @click="controlVisible = false">{{ $t('common.cancel') }}</NButton><NButton type="primary" @click="handleSaveControl">{{ $t('common.confirm') }}</NButton></NSpace></template>
    </NModal>
  </div>
</template>
