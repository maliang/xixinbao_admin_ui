<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NInput, NSelect, NModal, NForm, NFormItem, NTag, NCheckbox, NPagination, useDialog } from 'naive-ui';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { fetchPayChannels, createPayChannel, updatePayChannel, deletePayChannel } from '@/service/api';
const dialog = useDialog();

// 筛选
const channelTypeFilter = ref('all');
const coinTypeFilter = ref('');
const bankTypeFilter = ref('');
const statusFilterVal = ref('all');
const searchKeyword = ref('');
const channelTypeOptions = [{ label: '全部通道类型', value: 'all' }, { label: '币种通道', value: 'crypto' }, { label: '银行卡通道', value: 'bank' }];
const statusOpts = [{ label: '全部状态', value: 'all' }, { label: '启用', value: 'enabled' }, { label: '停用', value: 'disabled' }, { label: '维护中', value: 'maintenance' }];

// 列表
const channels = ref<any[]>([]);
const currentPage = ref(1);
const totalRecords = ref(0);
function loadData() {
  fetchPayChannels({
    type: channelTypeFilter.value === 'all' ? undefined : channelTypeFilter.value,
    coinType: coinTypeFilter.value || undefined,
    bankType: bankTypeFilter.value || undefined,
    status: statusFilterVal.value === 'all' ? undefined : statusFilterVal.value,
    keyword: searchKeyword.value || undefined,
    page: currentPage.value,
    pageSize: 10
  }).then(({ data, error }) => {
    if (!error && data) {
      channels.value = data.list || [];
      totalRecords.value = data.total || 0;
    }
  });
}
function handleSearch() { currentPage.value = 1; loadData(); }
function handleReset() { channelTypeFilter.value = 'all'; coinTypeFilter.value = ''; bankTypeFilter.value = ''; statusFilterVal.value = 'all'; searchKeyword.value = ''; handleSearch(); }

// 添加通道弹窗
const addVisible = ref(false);
const addStep = ref(1);
const addType = ref(''); // crypto | bank
const addForm = ref({ icon: '', coin_type: '', bank_type: '', name: '', support_recharge: true, support_withdraw: true, status: 'enabled', holder_name: '', account_number: '', bank_branch: '', qrcode: '', wallet_address: '', recharge_rate: '', withdraw_rate: '', remark: '' });
function openAdd() { addStep.value = 1; addType.value = ''; addVisible.value = true; }
function selectType(t: string) { addType.value = t; }
function nextStep() { if (!addType.value) { window.$message?.warning('请选择通道类型'); return; } addStep.value = 2; addForm.value = { icon: '', coin_type: '', bank_type: '', name: '', support_recharge: true, support_withdraw: true, status: 'enabled', holder_name: '', account_number: '', bank_branch: '', qrcode: '', wallet_address: '', recharge_rate: '', withdraw_rate: '', remark: '' }; }
function prevStep() { addStep.value = 1; }
async function finishAdd() {
  const payload: Record<string, any> = {
    type: addType.value,
    icon: addForm.value.icon,
    name: addForm.value.name,
    supportRecharge: addForm.value.support_recharge,
    supportWithdraw: addForm.value.support_withdraw,
    status: addForm.value.status,
    rechargeRate: addForm.value.recharge_rate,
    withdrawRate: addForm.value.withdraw_rate,
    remark: addForm.value.remark
  };
  if (addType.value === 'crypto') {
    payload.coinType = addForm.value.coin_type;
    payload.walletAddress = addForm.value.wallet_address;
    payload.qrcode = addForm.value.qrcode;
  } else {
    payload.bankType = addForm.value.bank_type;
    payload.holderName = addForm.value.holder_name;
    payload.accountNumber = addForm.value.account_number;
    payload.bankBranch = addForm.value.bank_branch;
  }
  const { error } = await createPayChannel(payload);
  if (!error) {
    addStep.value = 3;
    loadData();
  } else {
    window.$message?.error('创建失败');
  }
}
function closeAdd() { addVisible.value = false; loadData(); }

// ========== 编辑通道 ==========
const editVisible = ref(false);
const editForm = ref<any>({});
function openEdit(ch: any) {
  editForm.value = { ...ch };
  editVisible.value = true;
}
async function handleEditSave() {
  const { error } = await updatePayChannel(editForm.value.id, editForm.value);
  if (!error) { window.$message?.success('更新成功'); editVisible.value = false; loadData(); }
  else { window.$message?.error('更新失败'); }
}
function confirmDelete(ch: any) { dialog.warning({ title: '删除通道', content: `确定删除「${ch.name}」？`, positiveText: '确认', negativeText: '取消', positiveButtonProps: { type: 'error' } as any, onPositiveClick: async () => { const { error } = await deletePayChannel(ch.id); if (!error) { window.$message?.success('已删除'); loadData(); } } }); }

loadData();
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-16px">
      <h4 class="text-15px font-bold">支付通道列表</h4>
      <NButton type="primary" size="small" @click="openAdd"><SvgIcon icon="ph:plus" class="mr-4px" />新增通道</NButton>
    </div>

    <!-- 高级搜索 -->
    <div class="mb-16px">
      <div class="grid grid-cols-4 gap-12px mb-12px">
        <div><div class="field-label">通道类型</div><NSelect v-model:value="channelTypeFilter" :options="channelTypeOptions" size="small" /></div>
        <div><div class="field-label">币种类型</div><NInput v-model:value="coinTypeFilter" placeholder="输入币种筛选" clearable size="small" /></div>
        <div><div class="field-label">银行类型</div><NInput v-model:value="bankTypeFilter" placeholder="输入银行筛选" clearable size="small" /></div>
        <div><div class="field-label">操作状态</div><NSelect v-model:value="statusFilterVal" :options="statusOpts" size="small" /></div>
      </div>
      <div class="flex items-center gap-8px">
        <NInput v-model:value="searchKeyword" placeholder="搜索币种或银行名称..." clearable size="small" class="flex-1">
          <template #prefix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template>
        </NInput>
        <NButton type="primary" size="small" @click="handleSearch"><SvgIcon icon="ph:magnifying-glass" class="mr-4px" />搜索</NButton>
        <NButton size="small" @click="handleReset"><SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />重置</NButton>
      </div>
    </div>

    <!-- 通道列表 -->
    <div v-if="channels.length === 0" class="text-center op-40 py-40px">暂无通道数据</div>
    <div v-for="ch in channels" :key="ch.id" class="channel-card mb-16px">
      <div class="flex gap-20px">
        <!-- 第1列：图标+名称+标签 -->
        <div class="flex-shrink-0" style="width: 160px;">
          <div class="flex items-center gap-10px mb-8px">
            <div class="w-40px h-40px rounded-full bg-blue-50 flex-center flex-shrink-0">
              <img v-if="ch.icon" :src="ch.icon" class="w-28px h-28px rounded-full" />
              <SvgIcon v-else :icon="ch.type === 'crypto' ? 'ph:coins' : 'ph:bank'" class="text-18px text-primary" />
            </div>
            <span class="font-bold text-14px">{{ ch.name }}</span>
          </div>
          <div class="flex items-center gap-4px mb-6px flex-wrap">
            <span class="tag-blue">{{ ch.type === 'crypto' ? '币种通道' : '银行卡通道' }}</span>
            <span :class="ch.status === 'enabled' ? 'tag-green' : ch.status === 'maintenance' ? 'tag-orange' : 'tag-red'">
              {{ ch.status === 'enabled' ? '启用' : ch.status === 'maintenance' ? '维护中' : '停用' }}
            </span>
          </div>
          <div class="flex items-center gap-6px">
            <span v-if="ch.supportRecharge" class="tag-outline">充值</span>
            <span v-if="ch.supportWithdraw" class="tag-outline">提现</span>
          </div>
        </div>

        <!-- 第2列：币种/银行信息+地址 -->
        <div class="flex-1 min-w-0">
          <template v-if="ch.type === 'crypto'">
            <div class="text-11px op-40">币种信息</div>
            <div class="font-bold text-13px mb-8px">{{ ch.coinType || '-' }}</div>
            <div class="text-11px op-40">收款地址</div>
            <div class="text-12px font-500 break-all">{{ ch.walletAddress || '-' }}</div>
          </template>
          <template v-else>
            <div class="text-11px op-40">银行卡账户</div>
            <div class="font-bold text-13px mb-8px">{{ ch.accountNumber || '-' }}</div>
            <div class="text-11px op-40">汇率信息</div>
            <div class="flex items-center gap-12px text-12px">
              <span>充值 <span class="text-primary font-bold">{{ ch.rechargeRate || '1.00' }}</span></span>
              <span>提现 <span class="text-red-500 font-bold">{{ ch.withdrawRate || '0.99' }}</span></span>
            </div>
          </template>
        </div>

        <!-- 第3列：二维码/持卡人+汇率 -->
        <div class="flex-1 min-w-0">
          <template v-if="ch.type === 'crypto'">
            <div v-if="ch.qrcode" class="mb-8px">
              <div class="text-11px op-40">收款二维码</div>
              <div class="w-56px h-56px bg-gray-100 rounded flex-center mt-4px overflow-hidden">
                <img :src="ch.qrcode" class="w-full h-full object-contain" />
              </div>
            </div>
            <div class="text-11px op-40">汇率信息</div>
            <div class="flex items-center gap-12px text-12px">
              <span>充值 <span class="text-primary font-bold">{{ ch.rechargeRate || '1.00' }}</span></span>
              <span>提现 <span class="text-red-500 font-bold">{{ ch.withdrawRate || '0.98' }}</span></span>
            </div>
          </template>
          <template v-else>
            <div class="text-11px op-40">持卡人姓名</div>
            <div class="text-13px mb-8px">{{ ch.holderName || '-' }}</div>
            <div v-if="ch.bankBranch">
              <div class="text-11px op-40">银行支行</div>
              <div class="text-12px">{{ ch.bankBranch }}</div>
            </div>
          </template>
        </div>

        <!-- 第4列：时间+操作 -->
        <div class="flex-shrink-0 text-right" style="width: 130px;">
          <div class="text-11px op-40">创建时间</div>
          <div class="text-12px mb-6px">{{ ch.createdAt || '-' }}</div>
          <div class="text-11px op-40">最后更新</div>
          <div class="text-12px mb-12px">{{ ch.updatedAt || '-' }}</div>
          <div class="flex items-center justify-end gap-8px">
            <span class="cursor-pointer op-50 hover:op-80" @click="openEdit(ch)"><SvgIcon icon="ph:pencil-simple" class="text-16px" /></span>
            <span class="cursor-pointer op-50 hover:op-80 text-red-500" @click="confirmDelete(ch)"><SvgIcon icon="ph:trash" class="text-16px" /></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalRecords > 10" class="flex items-center justify-between mt-16px">
      <span class="text-13px op-50">显示第 1 到 10 条，共 {{ totalRecords }} 条记录</span>
      <NPagination v-model:page="currentPage" :page-count="Math.ceil(totalRecords / 10) || 1" />
    </div>

    <div class="flex justify-end mt-24px"><NButton type="primary" @click="() => {}">保存全部设置</NButton></div>

    <!-- 添加通道弹窗 -->
    <NModal v-model:show="addVisible" preset="card" title="添加新通道" style="width: 560px;" :bordered="false">
      <!-- 步骤条 -->
      <div class="flex items-center justify-center gap-40px mb-24px">
        <div class="step" :class="{ active: addStep >= 1 }"><span class="step-num">1</span><span class="step-label">选择类型</span></div>
        <div class="step-line" :class="{ active: addStep >= 2 }"></div>
        <div class="step" :class="{ active: addStep >= 2 }"><span class="step-num">2</span><span class="step-label">配置信息</span></div>
        <div class="step-line" :class="{ active: addStep >= 3 }"></div>
        <div class="step" :class="{ active: addStep >= 3 }"><span class="step-num">3</span><span class="step-label">完成</span></div>
      </div>

      <!-- Step 1 -->
      <template v-if="addStep === 1">
        <h4 class="font-bold mb-16px">选择通道类型</h4>
        <div class="grid grid-cols-2 gap-16px mb-20px">
          <div class="type-card" :class="{ selected: addType === 'crypto' }" @click="selectType('crypto')">
            <SvgIcon icon="ph:coins" class="text-28px text-primary mb-8px inline-block" />
            <div class="font-500">币种通道</div>
            <div class="text-11px op-50 mt-4px">支持加密货币充值提现</div>
          </div>
          <div class="type-card" :class="{ selected: addType === 'bank' }" @click="selectType('bank')">
            <SvgIcon icon="ph:bank" class="text-28px text-primary mb-8px inline-block" />
            <div class="font-500">银行卡通道</div>
            <div class="text-11px op-50 mt-4px">支持银行卡充值提现</div>
          </div>
        </div>
        <div class="flex justify-end"><NButton type="primary" @click="nextStep">下一步</NButton></div>
      </template>

      <!-- Step 2 -->
      <template v-if="addStep === 2">
        <h4 class="font-bold mb-16px">配置{{ addType === 'crypto' ? '币种' : '银行卡' }}通道信息</h4>
        <NForm label-placement="top" size="small">
          <NFormItem label="通道图标"><div class="flex items-center gap-12px"><ImageUpload v-model="addForm.icon" width="48px" height="48px" /><span class="text-11px op-40">建议尺寸 100×100 像素</span></div></NFormItem>
          <NFormItem :label="addType === 'crypto' ? '币种类型' : '银行类型'">
            <NInput v-if="addType === 'crypto'" v-model:value="addForm.coin_type" placeholder="请输入币种类型，如 BTC、ETH 等" />
            <NInput v-else v-model:value="addForm.bank_type" placeholder="请输入银行名称" />
          </NFormItem>
          <NFormItem label="通道名称"><NInput v-model:value="addForm.name" placeholder="请输入自定义通道名称" /></NFormItem>
          <NFormItem label="支持操作类型"><NCheckbox v-model:checked="addForm.support_recharge">充值</NCheckbox><NCheckbox v-model:checked="addForm.support_withdraw" class="ml-12px">提现</NCheckbox></NFormItem>
          <NFormItem label="初始状态"><NSelect v-model:value="addForm.status" :options="[{label:'启用',value:'enabled'},{label:'停用',value:'disabled'}]" /></NFormItem>
          <template v-if="addType === 'crypto'">
            <NFormItem label="收款二维码"><ImageUpload v-model="addForm.qrcode" width="80px" height="80px" /></NFormItem>
            <NFormItem label="钱包地址"><NInput v-model:value="addForm.wallet_address" placeholder="请输入钱包地址" /></NFormItem>
          </template>
          <template v-else>
            <NFormItem label="持卡人姓名"><NInput v-model:value="addForm.holder_name" placeholder="请输入持卡人姓名" /></NFormItem>
            <NFormItem label="银行账号"><NInput v-model:value="addForm.account_number" placeholder="请输入银行卡号" /></NFormItem>
            <NFormItem label="银行支行"><NInput v-model:value="addForm.bank_branch" placeholder="请输入银行支行" /></NFormItem>
          </template>
          <NFormItem label="充值汇率"><NInput v-model:value="addForm.recharge_rate" placeholder="请输入充值汇率" /></NFormItem>
          <NFormItem label="提现汇率"><NInput v-model:value="addForm.withdraw_rate" placeholder="请输入提现汇率" /></NFormItem>
          <NFormItem label="备注说明"><NInput v-model:value="addForm.remark" type="textarea" :rows="3" placeholder="请输入备注说明（选填）" /></NFormItem>
        </NForm>
        <div class="flex justify-between"><NButton @click="prevStep">上一步</NButton><NButton type="primary" @click="finishAdd">完成</NButton></div>
      </template>

      <!-- Step 3 -->
      <template v-if="addStep === 3">
        <div class="text-center py-24px">
          <SvgIcon icon="ph:check-circle" class="text-48px text-green-500 mb-12px inline-block" />
          <div class="font-bold text-16px mb-4px">通道创建成功</div>
          <div class="text-13px op-50">新的通道已成功添加到系统中</div>
          <NButton type="primary" class="mt-16px" @click="closeAdd">关闭</NButton>
        </div>
      </template>
    </NModal>

    <!-- 编辑通道弹窗 -->
    <NModal v-model:show="editVisible" preset="card" title="编辑通道" style="width: 520px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NFormItem label="通道名称"><NInput v-model:value="editForm.name" /></NFormItem>
        <NFormItem label="状态"><NSelect v-model:value="editForm.status" :options="[{label:'启用',value:'enabled'},{label:'停用',value:'disabled'},{label:'维护中',value:'maintenance'}]" /></NFormItem>
        <NFormItem label="支持操作类型"><NCheckbox v-model:checked="editForm.supportRecharge">充值</NCheckbox><NCheckbox v-model:checked="editForm.supportWithdraw" class="ml-12px">提现</NCheckbox></NFormItem>
        <template v-if="editForm.type === 'crypto'">
          <NFormItem label="币种类型"><NInput v-model:value="editForm.coinType" /></NFormItem>
          <NFormItem label="钱包地址"><NInput v-model:value="editForm.walletAddress" /></NFormItem>
          <NFormItem label="收款二维码"><ImageUpload v-model="editForm.qrcode" width="80px" height="80px" /></NFormItem>
        </template>
        <template v-else>
          <NFormItem label="银行类型"><NInput v-model:value="editForm.bankType" /></NFormItem>
          <NFormItem label="持卡人姓名"><NInput v-model:value="editForm.holderName" /></NFormItem>
          <NFormItem label="银行账号"><NInput v-model:value="editForm.accountNumber" /></NFormItem>
          <NFormItem label="银行支行"><NInput v-model:value="editForm.bankBranch" /></NFormItem>
        </template>
        <NFormItem label="充值汇率"><NInput v-model:value="editForm.rechargeRate" /></NFormItem>
        <NFormItem label="提现汇率"><NInput v-model:value="editForm.withdrawRate" /></NFormItem>
        <NFormItem label="备注"><NInput v-model:value="editForm.remark" type="textarea" :rows="2" /></NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="editVisible = false">取消</NButton>
          <NButton type="primary" @click="handleEditSave">保存</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.field-label { font-size: 12px; color: #666; margin-bottom: 4px; }
.channel-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; padding: 20px 24px; }
.channel-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.tag-blue { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 11px; color: #2080f0; background: #e3f2fd; }
.tag-green { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 11px; color: #18a058; background: #e8f5e9; }
.tag-orange { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 11px; color: #f0a020; background: #fff8e1; }
.tag-red { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 11px; color: #d03050; background: #fde8e8; }
.tag-outline { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 11px; color: #666; border: 1px solid #ddd; }
.type-card { border: 2px solid #eee; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; }
.type-card:hover { border-color: #b3d4fc; }
.type-card.selected { border-color: #2080f0; background: #f0f7ff; }
.step { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: #e0e0e0; color: #999; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
.step.active .step-num { background: #2080f0; color: #fff; }
.step-label { font-size: 11px; color: #999; }
.step.active .step-label { color: #2080f0; }
.step-line { width: 60px; height: 2px; background: #e0e0e0; margin-bottom: 18px; }
.step-line.active { background: #2080f0; }
</style>
