<script setup lang="ts">
import { ref } from 'vue';
import RechargeConfig from './finance/RechargeConfig.vue';
import WithdrawConfig from './finance/WithdrawConfig.vue';
import PayChannelConfig from './finance/PayChannelConfig.vue';
import SpinConfig from './finance/SpinConfig.vue';
import RewardConfig from './finance/RewardConfig.vue';

const subTab = ref('recharge');
</script>

<template>
  <div>
    <div class="sub-tab-bar mb-20px">
      <span class="sub-tab" :class="{ active: subTab === 'recharge' }" @click="subTab = 'recharge'">充值设置</span>
      <span class="sub-tab" :class="{ active: subTab === 'withdraw' }" @click="subTab = 'withdraw'">提现设置</span>
      <span class="sub-tab" :class="{ active: subTab === 'channel' }" @click="subTab = 'channel'">支付通道配置</span>
      <span class="sub-tab" :class="{ active: subTab === 'spin' }" @click="subTab = 'spin'">转盘配置</span>
      <span class="sub-tab" :class="{ active: subTab === 'reward' }" @click="subTab = 'reward'">奖励配置</span>
    </div>
    <RechargeConfig v-if="subTab === 'recharge'" />
    <WithdrawConfig v-if="subTab === 'withdraw'" />
    <PayChannelConfig v-if="subTab === 'channel'" />
    <SpinConfig v-if="subTab === 'spin'" />
    <RewardConfig v-if="subTab === 'reward'" />
  </div>
</template>

<style scoped>
.sub-tab-bar { border-bottom: 1px solid #eee; }
.sub-tab { display: inline-block; padding: 8px 0; margin-right: 24px; font-size: 13px; color: #666; cursor: pointer; border-bottom: 2px solid transparent; }
.sub-tab.active { color: #2080f0; border-bottom-color: #2080f0; font-weight: 500; }
</style>
