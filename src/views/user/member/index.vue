<script setup lang="ts">
import { ref, h, onMounted, watch } from 'vue';
import {
  NCard, NButton, NSpace, NTag, NInput, NSelect, NDatePicker, NSwitch,
  NPagination, NCollapse, NCollapseItem, NGrid, NGridItem,
  NDrawer, NDrawerContent, NTabs, NTabPane, NForm, NFormItem, NInputNumber,
  NModal, useDialog
} from 'naive-ui';
import { fetchUsers, fetchUser, createUser, updateUser, updateUserStatus, deleteUser, fetchLevels, deleteWallet } from '@/service/api';

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
const statusOptions = [{ label: '全部', value: '' }, { label: '正常', value: '1' }, { label: '冻结', value: '0' }];

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
    window.$message?.error(error?.msg || '操作失败');
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
const editForm = ref({ account: '', balance: '', levelId: null as number | null, name: '', phone: '', idNumber: '', withdrawFee: 1, credit: 100, loginPwd: '', payPwd: '', remark: '' });
const editingMemberId = ref<number | null>(null);

// 用户详情数据（证件照片、钱包等）
const userDetail = ref<any>({});
const bankWallets = ref<any[]>([]);
const cryptoWallets = ref<any[]>([]);

async function openEdit(m: any) {
  editingMemberId.value = m.id;
  editForm.value = { account: m.account, balance: String(m.balance || 0), levelId: m.levelId || null, name: m.name || '', phone: m.phone || '', idNumber: m.idCardNumber || m.id_card_number || '', withdrawFee: m.withdrawFeeRate || m.withdraw_fee_rate || 1, credit: m.creditScore || m.credit_score || 100, loginPwd: '', payPwd: '', remark: m.remark || '' };
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
    bankWallets.value = wallets.filter((w: any) => w.walletTypeId && !w.coinType);
    cryptoWallets.value = wallets.filter((w: any) => w.coinType);
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
    remark: editForm.value.remark,
  };
  if (editForm.value.loginPwd) payload.loginPassword = editForm.value.loginPwd;
  if (editForm.value.payPwd) payload.payPassword = editForm.value.payPwd;

  if (editingMemberId.value) {
    // 编辑
    const { error } = await updateUser(editingMemberId.value, payload);
    if (!error) {
      window.$message?.success('更新成功');
      editVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || '操作失败');
    }
  } else {
    // 新增
    if (!editForm.value.account) { window.$message?.warning('请输入用户账号'); return; }
    if (!editForm.value.loginPwd) { window.$message?.warning('请输入登录密码'); return; }
    payload.account = editForm.value.account;
    payload.phone = editForm.value.phone || editForm.value.account;
    const { error } = await createUser(payload);
    if (!error) {
      window.$message?.success('创建成功');
      editVisible.value = false;
      loadData();
    } else {
      window.$message?.error(error?.msg || '操作失败');
    }
  }
}

// ========== 管控设置弹窗 ==========
const controlVisible = ref(false);
const controlForm = ref({ accountStatus: true, tradeStatus: true, withdrawStatus: true, forceOffline: false, accountDuration: null as number | null, accountUnit: '小时', accountReason: '', tradeDuration: null as number | null, tradeUnit: '小时', tradeReason: '', withdrawDuration: null as number | null, withdrawUnit: '小时', withdrawReason: '', offlineDuration: null as number | null, offlineUnit: '小时', offlineMsg: '' });
const unitOptions = [{ label: '分钟', value: '分钟' }, { label: '小时', value: '小时' }, { label: '天', value: '天' }, { label: '永久', value: '永久' }];
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
    if (!controlForm.value.accountDuration && controlForm.value.accountUnit !== '永久') { window.$message?.warning('请填写账号禁用时长'); return; }
    if (!controlForm.value.accountReason) { window.$message?.warning('请填写账号禁用理由'); return; }
  }
  if (!controlForm.value.tradeStatus) {
    if (!controlForm.value.tradeDuration && controlForm.value.tradeUnit !== '永久') { window.$message?.warning('请填写交易禁用时长'); return; }
    if (!controlForm.value.tradeReason) { window.$message?.warning('请填写交易禁用理由'); return; }
  }
  if (!controlForm.value.withdrawStatus) {
    if (!controlForm.value.withdrawDuration && controlForm.value.withdrawUnit !== '永久') { window.$message?.warning('请填写提现禁用时长'); return; }
    if (!controlForm.value.withdrawReason) { window.$message?.warning('请填写提现禁用理由'); return; }
  }
  if (controlForm.value.forceOffline) {
    if (!controlForm.value.offlineDuration && controlForm.value.offlineUnit !== '永久') { window.$message?.warning('请填写强制下线时长'); return; }
    if (!controlForm.value.offlineMsg) { window.$message?.warning('请填写下线提示信息'); return; }
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
    window.$message?.success('操作成功');
    controlVisible.value = false;
    loadData();
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

async function handleUnbindWallet(walletId: number) {
  const { error } = await deleteWallet(walletId);
  if (!error) {
    window.$message?.success('解绑成功');
    // 重新加载详情
    if (editingMemberId.value) {
      const { data } = await fetchUser(editingMemberId.value);
      if (data) {
        const wallets = data.wallets || [];
        bankWallets.value = wallets.filter((w: any) => w.walletTypeId && !w.coinType);
        cryptoWallets.value = wallets.filter((w: any) => w.coinType);
      }
    }
  }
}

async function handleDeleteMember(m: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除用户 ${m.account}（${m.name}）吗？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteUser(m.id);
      if (!error) {
        window.$message?.success('操作成功');
        loadData();
      } else {
        window.$message?.error(error?.msg || '操作失败');
      }
    }
  });
}

// ========== 新增用户 ==========
function openCreateUser() {
  editingMemberId.value = null;
  editForm.value = { account: '', balance: '0', levelId: null, name: '', phone: '', idNumber: '', withdrawFee: 1, credit: 100, loginPwd: '', payPwd: '', remark: '' };
  editTab.value = 'basic';
  editVisible.value = true;
}

// ========== 批量删除 ==========
const selectedIds = ref<number[]>([]);

function handleBatchDelete() {
  if (!selectedIds.value.length) {
    window.$message?.warning('请先选择要删除的用户');
    return;
  }
  dialog.warning({
    title: '批量删除',
    content: `确定要删除选中的 ${selectedIds.value.length} 个用户吗？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      for (const id of selectedIds.value) {
        await deleteUser(id);
      }
      window.$message?.success('删除成功');
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
        <NCollapseItem title="筛选条件" name="filter">
          <div class="flex items-end gap-12px flex-wrap">
            <div style="width: 130px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">账户</div>
              <NInput v-model:value="searchForm.account" size="small" />
            </div>
            <div style="width: 130px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">姓名</div>
              <NInput v-model:value="searchForm.name" size="small" />
            </div>
            <div style="width: 130px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">IP</div>
              <NInput v-model:value="searchForm.ip" size="small" />
            </div>
            <div style="width: 120px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">状态</div>
              <NSelect v-model:value="searchForm.status" :options="statusOptions" size="small" />
            </div>
            <div style="width: 120px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">等级</div>
              <NSelect v-model:value="searchForm.level" :options="[{ label: '全部', value: '' }, ...levelSelectOptions.map(o => ({ ...o, value: String(o.value) }))]" size="small" />
            </div>
            <div style="width: 280px; flex-shrink: 0;">
              <div class="text-12px op-60 mb-4px">注册时间</div>
              <NDatePicker v-model:value="searchForm.dateRange" type="daterange" size="small" class="w-full" start-placeholder="开始日期" end-placeholder="结束日期" />
            </div>
            <div class="flex gap-8px" style="flex-shrink: 0;">
              <NButton size="small" @click="handleReset">重置</NButton>
              <NButton size="small" type="primary" @click="loadData">搜索</NButton>
            </div>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-8px mb-12px">
      <NButton type="primary" @click="openCreateUser"><SvgIcon icon="ph:plus" class="mr-4px" />新增用户</NButton>
      <NButton type="error" ghost @click="handleBatchDelete"><SvgIcon icon="ph:trash" class="mr-4px" />批量删除</NButton>
    </div>

    <!-- 会员卡片列表 -->
    <div class="flex flex-col gap-12px">
      <NCard v-for="m in members" :key="m.id" :bordered="false" class="card-wrapper" content-style="padding: 16px;">
        <div class="flex gap-16px w-full justify-between">
          <!-- 左：基本信息 -->
          <div class="flex-shrink-0" style="min-width: 140px;">
            <div class="flex items-center gap-4px mb-4px"><input type="checkbox" class="mr-4px" :checked="selectedIds.includes(m.id)" @change="(e: any) => { if (e.target.checked) { selectedIds.push(m.id); } else { selectedIds = selectedIds.filter((id: number) => id !== m.id); } }" /><span class="text-12px op-50">ID: {{ m.id }}</span></div>
            <div class="text-15px font-bold">姓名: {{ m.name || '-' }}</div>
            <div class="text-12px op-60 mt-2px">用户名: {{ m.account }}</div>
            <div class="text-12px op-60 mt-2px">会员等级: <span class="font-bold">{{ m.level?.name || '-' }}</span></div>
            <div class="text-12px op-60 mt-2px">推荐人: {{ m.referrer ? (m.referrer.name || m.referrer.account) : '-' }}</div>
          </div>
          <!-- 中：财务数据 -->
          <div class="flex-shrink-0" style="min-width: 140px;">
            <div class="text-12px op-50">账户余额: <span class="font-bold">{{ m.balance }}</span></div>
            <div class="text-12px op-50 mt-4px">冻结金额: {{ m.frozenBalance }}</div>
            <div class="text-12px op-50 mt-4px">积分: {{ m.points }}</div>
            <div class="text-12px op-50 mt-4px">信用分: {{ m.creditScore }}</div>
          </div>
          <!-- 中：状态 -->
          <div class="flex-shrink-0" style="min-width: 120px;">
            <div class="text-12px">实名状态: <NTag size="tiny" :type="m.kycStatus === 2 ? 'success' : m.kycStatus === 1 ? 'warning' : 'default'" :bordered="false">{{ m.kycStatus === 0 ? '未认证' : m.kycStatus === 1 ? '待审核' : m.kycStatus === 2 ? '已通过' : '已拒绝' }}</NTag></div>
            <div class="text-12px mt-4px">用户状态: <NTag size="tiny" :type="m.status ? 'success' : 'error'" :bordered="false">{{ m.status ? '正常' : '冻结' }}</NTag></div>
            <div class="text-12px mt-4px">提现状态: <NTag size="tiny" :type="m.withdrawStatus ? 'success' : 'error'" :bordered="false">{{ m.withdrawStatus ? '正常' : '禁止' }}</NTag></div>
            <div class="text-12px mt-4px">交易状态: <NTag size="tiny" :type="m.tradeStatus ? 'success' : 'error'" :bordered="false">{{ m.tradeStatus ? '正常' : '禁止' }}</NTag></div>
          </div>
          <!-- 右：注册/登录信息 -->
          <div class="flex-shrink-0" style="min-width: 160px;">
            <div class="text-11px op-50">注册时间: {{ m.createdAt }}</div>
            <div class="text-11px op-50 mt-2px">注册IP: {{ m.regIp || '-' }}</div>
            <div class="text-11px op-50 mt-2px">ISP(注册): {{ m.regIsp || '-' }}</div>
            <div class="text-11px op-50 mt-2px">注册来源: {{ m.referrerUrl || '-' }}</div>
          </div>
          <!-- 最右：最近登录 -->
          <div class="flex-shrink-0" style="min-width: 160px;">
            <div class="text-11px op-50">最后登录: {{ m.lastLoginAt || '-' }}</div>
            <div class="text-11px op-50 mt-2px">最后登录IP: {{ m.lastLoginIp || '-' }}</div>
            <div class="text-11px op-50 mt-2px">ISP(登录): {{ m.lastLoginIsp || '-' }}</div>
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
      <span class="text-13px op-50">共 {{ totalRecords }} 条记录</span>
      <NPagination v-model:page="currentPage" :page-count="Math.ceil(totalRecords / pageSize)" />
    </div>

    <!-- 编辑会员抽屉 -->
    <NDrawer v-model:show="editVisible" :width="720" placement="right">
      <NDrawerContent closable>
        <template #header>
          <div>
            <div class="text-16px font-bold">{{ editingMemberId ? '编辑会员信息' : '新增用户' }}</div>
            <div v-if="editingMemberId" class="text-12px op-50 mt-12px">用户 ID: {{ editingMemberId }}</div>
          </div>
        </template>
        <NTabs v-model:value="editTab" type="line">
          <NTabPane name="basic" tab="基础档案">
            <!-- 账户概览 -->
            <NCard :bordered="false" class="mb-16px" content-style="padding: 16px;">
              <div class="text-15px font-bold mb-12px">账户概览</div>
              <NGrid :x-gap="16" :cols="3">
                <NGridItem><NFormItem label="用户账户" :show-feedback="false"><NInput v-model:value="editForm.account" :disabled="!!editingMemberId" placeholder="请输入账号"><template v-if="editingMemberId" #suffix><SvgIcon icon="ph:copy" class="cursor-pointer op-50" /></template></NInput></NFormItem></NGridItem>
                <NGridItem><NFormItem label="当前余额" :show-feedback="false"><NInput :value="editForm.balance" class="text-primary font-bold" disabled /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="会员等级" :show-feedback="false"><NSelect v-model:value="editForm.levelId" :options="levelSelectOptions" /></NFormItem></NGridItem>
              </NGrid>
            </NCard>
            <!-- 个人信息 -->
            <NCard :bordered="false" content-style="padding: 16px;">
              <div class="text-15px font-bold mb-12px">个人信息</div>
              <NGrid :x-gap="16" :y-gap="12" :cols="2">
                <NGridItem><NFormItem label="姓名" :show-feedback="false"><NInput v-model:value="editForm.name" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="手机号码" :show-feedback="false"><NInput v-model:value="editForm.phone" /></NFormItem></NGridItem>
              </NGrid>
              <NGrid :x-gap="16" :y-gap="12" :cols="3" class="mt-12px">
                <NGridItem><NFormItem label="证件号" :show-feedback="false"><NInput v-model:value="editForm.idNumber" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="提现手续费" :show-feedback="false"><NInputNumber v-model:value="editForm.withdrawFee" :min="0" :max="100"><template #suffix>%</template></NInputNumber></NFormItem></NGridItem>
                <NGridItem><NFormItem label="信用分" :show-feedback="false"><NInputNumber v-model:value="editForm.credit" :min="0"><template #suffix>分</template></NInputNumber></NFormItem></NGridItem>
              </NGrid>
              <NGrid :x-gap="16" :y-gap="12" :cols="2" class="mt-12px">
                <NGridItem><NFormItem label="登录密码" :show-feedback="false"><NInput v-model:value="editForm.loginPwd" type="password" show-password-on="click" placeholder="********" /></NFormItem></NGridItem>
                <NGridItem><NFormItem label="支付密码" :show-feedback="false"><NInput v-model:value="editForm.payPwd" type="password" show-password-on="click" placeholder="********" /></NFormItem></NGridItem>
              </NGrid>
              <NFormItem label="备注" class="mt-12px" :show-feedback="false"><NInput v-model:value="editForm.remark" type="textarea" :rows="3" /></NFormItem>
            </NCard>
          </NTabPane>
          <NTabPane name="identity" tab="身份与钱包">
            <!-- 证件照片 -->
            <NCard :bordered="false" class="mb-16px" content-style="padding: 16px;">
              <div class="flex items-center justify-between mb-12px">
                <span class="text-15px font-bold">证件照片</span>
              </div>
              <div class="flex gap-16px">
                <div class="w-1/2 h-160px bg-gray-100 rounded-8px flex-center overflow-hidden">
                  <img v-if="userDetail.idCardFront" :src="userDetail.idCardFront" class="w-full h-full object-cover" />
                  <span v-else class="op-30">证件正面</span>
                </div>
                <div class="w-1/2 h-160px bg-gray-100 rounded-8px flex-center overflow-hidden">
                  <img v-if="userDetail.idCardBack" :src="userDetail.idCardBack" class="w-full h-full object-cover" />
                  <span v-else class="op-30">证件反面</span>
                </div>
              </div>
            </NCard>
            <!-- 银行卡/钱包 Tab -->
            <NTabs v-model:value="editSubTab" type="line">
              <NTabPane name="bank" tab="银行卡信息">
                <div v-if="bankWallets.length === 0" class="text-center op-40 py-24px">暂无银行卡</div>
                <NCard v-for="w in bankWallets" :key="w.id" :bordered="false" class="mb-12px" content-style="padding: 16px;">
                  <NGrid :x-gap="16" :y-gap="12" :cols="2">
                    <NGridItem><NFormItem label="银行名称" :show-feedback="false"><NInput :value="w.bankName || '-'" disabled /></NFormItem></NGridItem>
                    <NGridItem><NFormItem label="卡号" :show-feedback="false"><NInput :value="w.accountNumber || '-'" disabled /></NFormItem></NGridItem>
                    <NGridItem><NFormItem label="持卡人姓名" :show-feedback="false"><NInput :value="w.accountName || '-'" disabled /></NFormItem></NGridItem>
                    <NGridItem><NFormItem label="开户行" :show-feedback="false"><NInput :value="w.branchName || '-'" disabled /></NFormItem></NGridItem>
                  </NGrid>
                  <div class="flex justify-end mt-12px"><NButton size="small" type="error" ghost @click="handleUnbindWallet(w.id)"><SvgIcon icon="ph:link-break" class="mr-2px" />解绑</NButton></div>
                </NCard>
              </NTabPane>
              <NTabPane name="wallet" tab="钱包信息">
                <div v-if="cryptoWallets.length === 0" class="text-center op-40 py-24px">暂无数字钱包</div>
                <NCard v-for="w in cryptoWallets" :key="w.id" :bordered="false" class="mb-12px" content-style="padding: 16px;">
                  <div class="flex items-end gap-12px">
                    <NFormItem label="钱包类型" :show-feedback="false" class="w-120px"><NInput :value="w.coinType || '-'" disabled /></NFormItem>
                    <NFormItem label="钱包地址" :show-feedback="false" class="flex-1"><NInput :value="w.accountNumber || '-'" disabled /></NFormItem>
                    <NButton size="small" quaternary @click="() => { navigator.clipboard.writeText(w.accountNumber || ''); window.$message?.success('已复制'); }"><SvgIcon icon="ph:copy" class="mr-2px" />复制</NButton>
                    <NButton size="small" type="error" ghost @click="handleUnbindWallet(w.id)"><SvgIcon icon="ph:link-break" class="mr-2px" />解绑</NButton>
                  </div>
                </NCard>
              </NTabPane>
            </NTabs>
          </NTabPane>
        </NTabs>
        <template #footer><NSpace justify="end"><NButton @click="editVisible = false">取消</NButton><NButton type="primary" @click="handleSaveEdit">保存更改</NButton></NSpace></template>
      </NDrawerContent>
    </NDrawer>

    <!-- 用户管控设置弹窗 -->
    <NModal v-model:show="controlVisible" preset="card" title="用户管控设置" style="width: 560px;" :bordered="false">
      <!-- 账号状态 -->
      <div class="flex items-center justify-between py-12px border-b border-gray-100">
        <div><div class="font-bold">用户账号状态</div><div class="text-12px op-50">禁用后用户将无法登录系统</div></div>
        <NSwitch v-model:value="controlForm.accountStatus" />
      </div>
      <div v-if="!controlForm.accountStatus" class="pl-16px py-8px border-l-2 border-gray-200 ml-8px mt-8px mb-8px">
        <NFormItem label="禁止时长" :show-feedback="false"><div class="flex gap-8px"><NInputNumber v-model:value="controlForm.accountDuration" size="small" class="w-140px" /><NSelect v-model:value="controlForm.accountUnit" :options="unitOptions" size="small" class="w-80px" /></div></NFormItem>
        <NFormItem label="禁止理由" :show-feedback="false" class="mt-8px"><NInput v-model:value="controlForm.accountReason" type="textarea" :rows="3" placeholder="请输入封禁具体原因" size="small" /></NFormItem>
      </div>
      <!-- 交易功能 -->
      <div class="flex items-center justify-between py-12px border-b border-gray-100">
        <div><div class="font-bold">交易功能状态</div><div class="text-12px op-50">禁用后用户将无法进行任何交易</div></div>
        <NSwitch v-model:value="controlForm.tradeStatus" />
      </div>
      <div v-if="!controlForm.tradeStatus" class="pl-16px py-8px border-l-2 border-gray-200 ml-8px mt-8px mb-8px">
        <NFormItem label="禁止时长" :show-feedback="false"><div class="flex gap-8px"><NInputNumber v-model:value="controlForm.tradeDuration" size="small" class="w-140px" /><NSelect v-model:value="controlForm.tradeUnit" :options="unitOptions" size="small" class="w-80px" /></div></NFormItem>
        <NFormItem label="禁止理由" :show-feedback="false" class="mt-8px"><NInput v-model:value="controlForm.tradeReason" type="textarea" :rows="3" placeholder="请输入交易功能封禁原因" size="small" /></NFormItem>
      </div>
      <!-- 提现功能 -->
      <div class="flex items-center justify-between py-12px border-b border-gray-100">
        <div><div class="font-bold">提现功能状态</div><div class="text-12px op-50">禁用后用户将无法进行提现操作</div></div>
        <NSwitch v-model:value="controlForm.withdrawStatus" />
      </div>
      <div v-if="!controlForm.withdrawStatus" class="pl-16px py-8px border-l-2 border-gray-200 ml-8px mt-8px mb-8px">
        <NFormItem label="禁止时长" :show-feedback="false"><div class="flex gap-8px"><NInputNumber v-model:value="controlForm.withdrawDuration" size="small" class="w-140px" /><NSelect v-model:value="controlForm.withdrawUnit" :options="unitOptions" size="small" class="w-80px" /></div></NFormItem>
        <NFormItem label="禁止理由" :show-feedback="false" class="mt-8px"><NInput v-model:value="controlForm.withdrawReason" type="textarea" :rows="3" placeholder="请输入提现功能封禁原因" size="small" /></NFormItem>
      </div>
      <!-- 强制下线 -->
      <div class="flex items-center justify-between py-12px">
        <div><div class="font-bold">强制下线</div><div class="text-12px op-50">启用后用户将被强制退出登录</div></div>
        <NSwitch v-model:value="controlForm.forceOffline" />
      </div>
      <div v-if="controlForm.forceOffline" class="pl-16px py-8px border-l-2 border-gray-200 ml-8px mt-8px">
        <NFormItem label="禁止登录时长" :show-feedback="false"><div class="flex gap-8px"><NInputNumber v-model:value="controlForm.offlineDuration" size="small" class="w-140px" /><NSelect v-model:value="controlForm.offlineUnit" :options="unitOptions" size="small" class="w-80px" /></div></NFormItem>
        <NFormItem label="登录页提示信息" :show-feedback="false" class="mt-8px"><NInput v-model:value="controlForm.offlineMsg" type="textarea" :rows="3" placeholder="用户再次登录时将看到此消息" size="small" /></NFormItem>
      </div>
      <template #footer><NSpace justify="end"><NButton @click="controlVisible = false">取消</NButton><NButton type="primary" @click="handleSaveControl">确认</NButton></NSpace></template>
    </NModal>
  </div>
</template>
