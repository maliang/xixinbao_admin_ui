<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NInput, NSwitch, NButton, NTimePicker } from 'naive-ui';
import { fetchSettings, saveSettings } from '@/service/api';

const form = ref({
  enabled: true, requireKyc: true,
  startTime: '09:00', endTime: '18:00',
  interval: '1800', minAmount: '100', maxAmount: '5000',
  dailyLimit: '20000', dailyCount: '3', minCredit: '600'
});
const feeMode = ref('count');
const feeRules = ref<{ threshold: string; rate: string }[]>([{ threshold: '2', rate: '1.5' }]);

function addRule() { feeRules.value.push({ threshold: '', rate: '' }); }
function removeRule(i: number) { feeRules.value.splice(i, 1); }

async function loadData() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const w = data.withdraw || {};
    form.value.enabled = w.wdEnabled === '1' || w.wdEnabled === true;
    form.value.requireKyc = w.wdRequireKyc === '1' || w.wdRequireKyc === true;
    form.value.startTime = w.wdStartTime || '09:00';
    form.value.endTime = w.wdEndTime || '18:00';
    form.value.interval = String(w.wdInterval || '1800');
    form.value.minAmount = String(w.wdMinAmount || '100');
    form.value.maxAmount = String(w.wdMaxAmount || '5000');
    form.value.dailyLimit = String(w.wdDailyLimit || '20000');
    form.value.dailyCount = String(w.wdDailyCount || '3');
    form.value.minCredit = String(w.wdMinCredit || '600');
    feeMode.value = w.wdFeeMode || 'count';
    try { feeRules.value = JSON.parse(w.wdFeeRules || '[]'); } catch { feeRules.value = []; }
    if (!feeRules.value.length) feeRules.value = [{ threshold: '2', rate: '1.5' }];
  }
}

async function handleSave() {
  const items = [
    { group: 'withdraw', key: 'wd_enabled', value: form.value.enabled ? '1' : '0' },
    { group: 'withdraw', key: 'wd_require_kyc', value: form.value.requireKyc ? '1' : '0' },
    { group: 'withdraw', key: 'wd_start_time', value: form.value.startTime },
    { group: 'withdraw', key: 'wd_end_time', value: form.value.endTime },
    { group: 'withdraw', key: 'wd_interval', value: form.value.interval },
    { group: 'withdraw', key: 'wd_min_amount', value: form.value.minAmount },
    { group: 'withdraw', key: 'wd_max_amount', value: form.value.maxAmount },
    { group: 'withdraw', key: 'wd_daily_limit', value: form.value.dailyLimit },
    { group: 'withdraw', key: 'wd_daily_count', value: form.value.dailyCount },
    { group: 'withdraw', key: 'wd_min_credit', value: form.value.minCredit },
    { group: 'withdraw', key: 'wd_fee_mode', value: feeMode.value },
    { group: 'withdraw', key: 'wd_fee_rules', value: JSON.stringify(feeRules.value) },
  ];
  const { error } = await saveSettings(items);
  if (!error) window.$message?.success('保存成功');
  else window.$message?.error('保存失败');
}

onMounted(() => { loadData(); });
</script>

<template>
  <div>
    <h4 class="text-15px font-bold mb-16px">提现基础规则配置</h4>
    <div class="config-card mb-20px">
      <div class="flex items-center justify-between mb-16px">
        <div><div class="font-500 text-14px">启用提现功能</div><div class="text-11px op-40 mt-2px">开启后用户可以在APP中进行提现操作</div></div>
        <NSwitch v-model:value="form.enabled" />
      </div>
      <div class="flex items-center justify-between mb-16px">
        <div><div class="font-500 text-14px">提现实名认证</div><div class="text-11px op-40 mt-2px">开启后用户必须通过实名认证才能提现</div></div>
        <NSwitch v-model:value="form.requireKyc" />
      </div>
      <div class="grid grid-cols-2 gap-16px mb-16px">
        <div><div class="field-label">开始时间</div><NTimePicker v-model:formatted-value="form.startTime" format="HH:mm" value-format="HH:mm" class="w-full" /></div>
        <div><div class="field-label">结束时间</div><NTimePicker v-model:formatted-value="form.endTime" format="HH:mm" value-format="HH:mm" class="w-full" /></div>
      </div>
      <div class="grid grid-cols-3 gap-16px mb-16px">
        <div><div class="field-label">提现间隔 (秒)</div><NInput v-model:value="form.interval" /></div>
        <div><div class="field-label">最低提现金额 (元)</div><NInput v-model:value="form.minAmount" /></div>
        <div><div class="field-label">单笔提现上限 (元)</div><NInput v-model:value="form.maxAmount" /></div>
      </div>
      <div class="grid grid-cols-3 gap-16px">
        <div><div class="field-label">每日提现限额 (元)</div><NInput v-model:value="form.dailyLimit" /></div>
        <div><div class="field-label">每日提现次数 (次)</div><NInput v-model:value="form.dailyCount" /></div>
        <div><div class="field-label">最低信用分 (分)</div><NInput v-model:value="form.minCredit" /></div>
      </div>
    </div>

    <h4 class="text-15px font-bold mb-16px">手续费策略配置</h4>
    <div class="config-card mb-24px">
      <div class="field-label mb-8px">手续费计算方式</div>
      <div class="fee-switch mb-16px">
        <div class="fee-option" :class="{ active: feeMode === 'amount' }" @click="feeMode = 'amount'">按金额阶梯</div>
        <div class="fee-option" :class="{ active: feeMode === 'count' }" @click="feeMode = 'count'">按次数阶梯</div>
      </div>
      <div class="flex items-center justify-between mb-8px">
        <span class="font-500 text-13px">{{ feeMode === 'count' ? '次数' : '金额' }}阶梯手续费规则</span>
        <a class="text-primary text-12px cursor-pointer" @click="addRule">+ 添加规则</a>
      </div>
      <div v-for="(rule, i) in feeRules" :key="i" class="flex items-center gap-8px mb-8px">
        <span class="text-12px op-50">{{ feeMode === 'count' ? '次数' : '金额' }} ≥</span>
        <NInput v-model:value="rule.threshold" autosize size="small" class="w-100px" />
        <span class="text-12px op-50">{{ feeMode === 'count' ? '次' : '元' }}</span>
        <NInput v-model:value="rule.rate" autosize size="small" class="w-100px" />
        <span class="text-12px op-50">%</span>
        <span class="text-red-500 cursor-pointer" @click="removeRule(i)"><SvgIcon icon="ph:trash" class="text-14px" /></span>
      </div>
    </div>
    <div class="flex justify-end"><NButton type="primary" @click="handleSave">保存全部设置</NButton></div>
  </div>
</template>

<style scoped>
.config-card { background: #f9fafb; border-radius: 8px; padding: 20px 24px; }
.field-label { font-size: 13px; color: #333; font-weight: 500; margin-bottom: 6px; }
.fee-switch { display: flex; width: 300px; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
.fee-option { flex: 1; text-align: center; padding: 8px 0; cursor: pointer; font-size: 13px; color: #666; transition: all 0.2s; }
.fee-option.active { background: #2080f0; color: #fff; font-weight: 500; }
</style>
