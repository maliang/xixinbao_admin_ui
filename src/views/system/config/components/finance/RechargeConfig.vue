<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NInput, NSwitch, NButton } from 'naive-ui';
import { fetchSettings, saveSettings } from '@/service/api';

const form = ref({ min_amount: '10', max_amount: '50000', interval: '60', require_voucher: true });

async function loadData() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const r = data.recharge || {};
    form.value.min_amount = String(r.rcMinAmount || '10');
    form.value.max_amount = String(r.rcMaxAmount || '50000');
    form.value.interval = String(r.rcInterval || '60');
    form.value.require_voucher = r.rcRequireVoucher === '1' || r.rcRequireVoucher === true;
  }
}

async function handleSave() {
  const items = [
    { group: 'recharge', key: 'rc_min_amount', value: form.value.min_amount },
    { group: 'recharge', key: 'rc_max_amount', value: form.value.max_amount },
    { group: 'recharge', key: 'rc_interval', value: form.value.interval },
    { group: 'recharge', key: 'rc_require_voucher', value: form.value.require_voucher ? '1' : '0' },
  ];
  const { error } = await saveSettings(items);
  if (!error) window.$message?.success('保存成功');
  else window.$message?.error('保存失败');
}

onMounted(() => { loadData(); });
</script>

<template>
  <div>
    <div class="section-title">基础充值限额</div>
    <div class="config-card mb-24px">
      <div class="grid grid-cols-2 gap-20px mb-16px">
        <div><div class="field-label">单笔最小充值金额</div><NInput v-model:value="form.min_amount" /></div>
        <div><div class="field-label">单笔最大充值金额</div><NInput v-model:value="form.max_amount" /></div>
      </div>
      <div class="grid grid-cols-2 gap-20px">
        <div><div class="field-label">充值两次提交间隔时间</div><div class="flex items-center gap-8px"><NInput v-model:value="form.interval" class="flex-1" /><span class="text-13px op-50">秒</span></div></div>
        <div class="flex items-center">
          <div class="config-item-card flex-1">
            <div class="flex items-center justify-between">
              <div><div class="font-500 text-13px">前台充值必须上传凭证</div><div class="text-11px op-40 mt-2px">开启后，用户在前台发起充值时必须上传转账截图或凭证</div></div>
              <NSwitch v-model:value="form.require_voucher" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-end"><NButton type="primary" @click="handleSave">保存全部设置</NButton></div>
  </div>
</template>

<style scoped>
.section-title { font-size: 15px; font-weight: 700; margin-bottom: 14px; padding-left: 10px; border-left: 3px solid #2080f0; }
.config-card { background: #f9fafb; border-radius: 8px; padding: 20px 24px; }
.config-item-card { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 12px 16px; }
.field-label { font-size: 13px; color: #333; font-weight: 500; margin-bottom: 6px; }
</style>
