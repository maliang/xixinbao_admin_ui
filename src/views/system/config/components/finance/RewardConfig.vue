<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NInput, NSwitch, NCheckbox, NRadioGroup, NRadio, NSelect, NButton } from 'naive-ui';
import { fetchSettings, saveSettings } from '@/service/api';

const registerReward = ref({ enabled: true, levels: [{ label: '一级下线', value: '50' }, { label: '二级下线', value: '30' }, { label: '三级下线', value: '10' }] });
const rechargeReward = ref({ enabled: true, mode: 'cumulative', tiers: [{ threshold: '', rate: '' }], levels: [{ label: '一级下线', type: '固定金额', value: '5' }, { label: '二级下线', type: '固定金额', value: '3' }, { label: '三级下线', type: '固定金额', value: '1' }] });
const investReward = ref({ enabled: true, mode: 'single', levels: [{ label: '一级下线', type: '固定金额', value: '3' }, { label: '二级下线', type: '固定金额', value: '2' }, { label: '三级下线', type: '固定金额', value: '1' }] });
const inviteRegReward = ref({ enabled: true, type: '现金', amount: '' });
const inviteRechargeReward = ref({ enabled: true, mode: 'single', type: '固定金额', amount: '' });
const kycReward = ref({ enabled: true, amount: '30' });

const rewardTypeOptions = [{ label: '现金', value: '现金' }, { label: '积分', value: '积分' }];
const calcTypeOptions = [{ label: '固定金额', value: '固定金额' }, { label: '百分比', value: '百分比' }];

function addRechargeTier() { rechargeReward.value.tiers.push({ threshold: '', rate: '' }); }
function removeRechargeTier(i: number) { rechargeReward.value.tiers.splice(i, 1); }

async function loadData() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const r = data.reward || {};
    registerReward.value.enabled = r.registerRewardEnabled === '1' || r.registerRewardEnabled === true;
    try { registerReward.value.levels = JSON.parse(r.registerRewardLevels || '[]'); } catch { /* keep default */ }
    rechargeReward.value.enabled = r.rechargeRewardEnabled === '1' || r.rechargeRewardEnabled === true;
    rechargeReward.value.mode = r.rechargeRewardMode || 'cumulative';
    try { rechargeReward.value.tiers = JSON.parse(r.rechargeRewardTiers || '[]'); } catch { /* keep default */ }
    try { rechargeReward.value.levels = JSON.parse(r.rechargeRewardLevels || '[]'); } catch { /* keep default */ }
    if (!rechargeReward.value.levels.length) rechargeReward.value.levels = [{ label: '一级下线', type: '固定金额', value: '5' }, { label: '二级下线', type: '固定金额', value: '3' }, { label: '三级下线', type: '固定金额', value: '1' }];
    investReward.value.enabled = r.investRewardEnabled === '1' || r.investRewardEnabled === true;
    investReward.value.mode = r.investRewardMode || 'single';
    try { investReward.value.levels = JSON.parse(r.investRewardLevels || '[]'); } catch { /* keep default */ }
    inviteRegReward.value.enabled = r.inviteRegRewardEnabled === '1' || r.inviteRegRewardEnabled === true;
    inviteRegReward.value.type = r.inviteRegRewardType || '现金';
    inviteRegReward.value.amount = r.inviteRegRewardAmount || '';
    inviteRechargeReward.value.enabled = r.inviteRechargeRewardEnabled === '1' || r.inviteRechargeRewardEnabled === true;
    inviteRechargeReward.value.mode = r.inviteRechargeRewardMode || 'single';
    inviteRechargeReward.value.type = r.inviteRechargeRewardType || '固定金额';
    inviteRechargeReward.value.amount = r.inviteRechargeRewardAmount || '';
    kycReward.value.enabled = r.kycRewardEnabled === '1' || r.kycRewardEnabled === true;
    kycReward.value.amount = r.kycRewardAmount || '30';
  }
}

async function handleSave() {
  const items = [
    { group: 'reward', key: 'register_reward_enabled', value: registerReward.value.enabled ? '1' : '0' },
    { group: 'reward', key: 'register_reward_levels', value: JSON.stringify(registerReward.value.levels) },
    { group: 'reward', key: 'recharge_reward_enabled', value: rechargeReward.value.enabled ? '1' : '0' },
    { group: 'reward', key: 'recharge_reward_mode', value: rechargeReward.value.mode },
    { group: 'reward', key: 'recharge_reward_tiers', value: JSON.stringify(rechargeReward.value.tiers) },
    { group: 'reward', key: 'recharge_reward_levels', value: JSON.stringify(rechargeReward.value.levels) },
    { group: 'reward', key: 'invest_reward_enabled', value: investReward.value.enabled ? '1' : '0' },
    { group: 'reward', key: 'invest_reward_mode', value: investReward.value.mode },
    { group: 'reward', key: 'invest_reward_levels', value: JSON.stringify(investReward.value.levels) },
    { group: 'reward', key: 'invite_reg_reward_enabled', value: inviteRegReward.value.enabled ? '1' : '0' },
    { group: 'reward', key: 'invite_reg_reward_type', value: inviteRegReward.value.type },
    { group: 'reward', key: 'invite_reg_reward_amount', value: inviteRegReward.value.amount },
    { group: 'reward', key: 'invite_recharge_reward_enabled', value: inviteRechargeReward.value.enabled ? '1' : '0' },
    { group: 'reward', key: 'invite_recharge_reward_mode', value: inviteRechargeReward.value.mode },
    { group: 'reward', key: 'invite_recharge_reward_type', value: inviteRechargeReward.value.type },
    { group: 'reward', key: 'invite_recharge_reward_amount', value: inviteRechargeReward.value.amount },
    { group: 'reward', key: 'kyc_reward_enabled', value: kycReward.value.enabled ? '1' : '0' },
    { group: 'reward', key: 'kyc_reward_amount', value: kycReward.value.amount },
  ];
  const { error } = await saveSettings(items);
  if (!error) window.$message?.success('保存成功');
  else window.$message?.error('保存失败');
}

onMounted(() => { loadData(); });
</script>

<template>
  <div>
    <div class="reward-card mb-16px">
      <div class="flex items-center justify-between mb-12px">
        <span class="font-bold text-14px">用户注册赠送 <SvgIcon icon="ph:info" class="text-13px op-40 inline" /></span>
        <NSwitch v-model:value="registerReward.enabled" />
      </div>
      <div v-for="lv in registerReward.levels" :key="lv.label" class="flex items-center gap-12px mb-8px">
        <NCheckbox :checked="true">{{ lv.label }}</NCheckbox>
        <NInput v-model:value="lv.value" autosize size="small" class="w-100px" />
        <span class="text-13px op-50">元</span>
      </div>
    </div>

    <div class="reward-card mb-16px">
      <div class="flex items-center justify-between mb-12px">
        <span class="font-bold text-14px">用户充值赠送 <SvgIcon icon="ph:info" class="text-13px op-40 inline" /></span>
        <NSwitch v-model:value="rechargeReward.enabled" />
      </div>
      <NRadioGroup v-model:value="rechargeReward.mode" class="mb-12px">
        <NRadio value="single">按单次充值奖励</NRadio>
        <NRadio value="cumulative">按累积充值奖励</NRadio>
      </NRadioGroup>
      <div class="tier-box">
        <div class="flex items-center justify-between mb-8px">
          <span class="text-12px op-60">累积充值阶梯设置</span>
          <a class="text-primary text-12px cursor-pointer" @click="addRechargeTier">+ 添加阶梯</a>
        </div>
        <div v-for="(t, i) in rechargeReward.tiers" :key="i" class="flex items-center gap-8px mb-6px">
          <span class="text-12px op-50">≥ 金额</span>
          <NInput v-model:value="t.threshold" autosize size="small" class="w-120px" />
          <span class="text-12px op-50">奖励比例</span>
          <NInput v-model:value="t.rate" autosize size="small" class="w-120px" />
          <span class="text-13px op-50">%</span>
          <span class="text-red-500 cursor-pointer" @click="removeRechargeTier(i)"><SvgIcon icon="ph:trash" class="text-14px" /></span>
        </div>
      </div>
      <div v-for="lv in rechargeReward.levels" :key="lv.label" class="flex items-center gap-8px mb-8px">
        <NCheckbox :checked="true">{{ lv.label }}</NCheckbox>
        <NSelect v-model:value="lv.type" :options="calcTypeOptions" size="small" class="w-120px" />
        <NInput v-model:value="lv.value" autosize size="small" class="w-80px" />
        <span class="text-13px op-50">{{ lv.type === '百分比' ? '%' : '元' }}</span>
      </div>
    </div>

    <div class="reward-card mb-16px">
      <div class="flex items-center justify-between mb-12px">
        <span class="font-bold text-14px">用户投资赠送 <SvgIcon icon="ph:info" class="text-13px op-40 inline" /></span>
        <NSwitch v-model:value="investReward.enabled" />
      </div>
      <NRadioGroup v-model:value="investReward.mode" class="mb-12px">
        <NRadio value="single">按单次投资奖励</NRadio>
        <NRadio value="cumulative">按累积投资奖励</NRadio>
      </NRadioGroup>
      <div v-for="lv in investReward.levels" :key="lv.label" class="flex items-center gap-8px mb-8px">
        <NCheckbox :checked="true">{{ lv.label }}</NCheckbox>
        <NSelect v-model:value="lv.type" :options="calcTypeOptions" size="small" class="w-120px" />
        <NInput v-model:value="lv.value" autosize size="small" class="w-80px" />
        <span class="text-13px op-50">{{ lv.type === '百分比' ? '%' : '元' }}</span>
      </div>
    </div>

    <div class="reward-card mb-16px">
      <div class="flex items-center justify-between mb-12px">
        <span class="font-bold text-14px">邀请注册赠送 <SvgIcon icon="ph:info" class="text-13px op-40 inline" /></span>
        <NSwitch v-model:value="inviteRegReward.enabled" />
      </div>
      <div class="flex items-center gap-8px">
        <span class="text-13px">奖励类型</span>
        <NSelect v-model:value="inviteRegReward.type" :options="rewardTypeOptions" size="small" class="w-120px" />
        <span class="text-13px">奖励金额</span>
        <NInput v-model:value="inviteRegReward.amount" autosize size="small" class="w-100px" />
        <span class="text-13px op-50">元</span>
      </div>
    </div>

    <div class="reward-card mb-16px">
      <div class="flex items-center justify-between mb-12px">
        <span class="font-bold text-14px">邀请充值赠送 <SvgIcon icon="ph:info" class="text-13px op-40 inline" /></span>
        <NSwitch v-model:value="inviteRechargeReward.enabled" />
      </div>
      <NRadioGroup v-model:value="inviteRechargeReward.mode" class="mb-12px">
        <NRadio value="single">按单次充值奖励</NRadio>
        <NRadio value="cumulative">按累积充值奖励</NRadio>
      </NRadioGroup>
      <div class="flex items-center gap-8px">
        <span class="text-13px">奖励金额</span>
        <NSelect v-model:value="inviteRechargeReward.type" :options="calcTypeOptions" size="small" class="w-120px" />
        <NInput v-model:value="inviteRechargeReward.amount" autosize size="small" class="w-100px" />
        <span class="text-13px op-50">{{ inviteRechargeReward.type === '百分比' ? '%' : '元' }}</span>
      </div>
    </div>

    <div class="reward-card mb-24px">
      <div class="flex items-center justify-between mb-12px">
        <span class="font-bold text-14px">实名认证赠送 <SvgIcon icon="ph:info" class="text-13px op-40 inline" /></span>
        <NSwitch v-model:value="kycReward.enabled" />
      </div>
      <div class="flex items-center gap-8px">
        <span class="text-13px">奖励金额</span>
        <NInput v-model:value="kycReward.amount" autosize size="small" class="w-100px" />
        <span class="text-13px op-50">元</span>
      </div>
    </div>

    <div class="flex justify-end"><NButton type="primary" @click="handleSave">保存全部设置</NButton></div>
  </div>
</template>

<style scoped>
.reward-card { background: #f9fafb; border-radius: 8px; padding: 16px 20px; }
.tier-box { border: 1px solid #e8e8ec; border-radius: 6px; padding: 12px 14px; margin-bottom: 12px; }
</style>
