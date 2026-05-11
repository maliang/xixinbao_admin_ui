<script setup lang="ts">
import { ref } from 'vue';
import { NInput, NButton } from 'naive-ui';
import { fetchSettings, saveSettings } from '@/service/api';

const form = ref({
  bank_prefix: 4, bank_suffix: 4,
  id_prefix: 3, id_suffix: 4
});

async function loadData() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const d = data.desensitize || {};
    form.value.bank_prefix = Number(d.bankPrefix) || 4;
    form.value.bank_suffix = Number(d.bankSuffix) || 4;
    form.value.id_prefix = Number(d.idPrefix) || 3;
    form.value.id_suffix = Number(d.idSuffix) || 4;
  }
}
async function handleSave() {
  const items = Object.entries(form.value).map(([key, value]) => ({ group: 'desensitize', key, value: String(value) }));
  const { error } = await saveSettings(items);
  if (!error) { window.$message?.success('保存成功'); }
}
loadData();
</script>

<template>
  <div>
    <!-- 银行卡号隐藏规则 -->
    <h4 class="text-15px font-bold mb-16px">银行卡号隐藏规则</h4>
    <div class="grid grid-cols-2 gap-20px mb-24px">
      <div>
        <div class="field-label">开头保留位数</div>
        <NInput v-model:value="form.bank_prefix" />
      </div>
      <div>
        <div class="field-label">结尾保留位数</div>
        <NInput v-model:value="form.bank_suffix" />
      </div>
    </div>

    <!-- 证件号隐藏规则 -->
    <h4 class="text-15px font-bold mb-16px">证件号隐藏规则</h4>
    <div class="grid grid-cols-2 gap-20px mb-24px">
      <div>
        <div class="field-label">开头保留位数</div>
        <NInput v-model:value="form.id_prefix" />
      </div>
      <div>
        <div class="field-label">结尾保留位数</div>
        <NInput v-model:value="form.id_suffix" />
      </div>
    </div>

    <div class="flex justify-end">
      <NButton v-permission="'system.config.edit'" type="primary" @click="handleSave">保存全部设置</NButton>
    </div>
  </div>
</template>

<style scoped>
.field-label { font-size: 13px; color: #333; font-weight: 500; margin-bottom: 6px; }
</style>
