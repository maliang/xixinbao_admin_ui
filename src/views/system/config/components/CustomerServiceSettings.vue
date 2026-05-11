<script setup lang="ts">
import { ref } from 'vue';
import { NInput, NSwitch, NButton } from 'naive-ui';
import { fetchSettings, saveSettings } from '@/service/api';

const channels = ref([
  { name: '在线客服', enabled: true, url: '' },
  { name: 'WhatsApp', enabled: false, url: '' },
  { name: 'Telegram', enabled: true, url: '' },
  { name: 'Line', enabled: false, url: '' }
]);

async function loadData() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const cs = data.customerService || {};
    channels.value.forEach(ch => {
      const enabledKey = ch.name + 'Enabled';
      const urlKey = ch.name + 'Url';
      if (enabledKey in cs) ch.enabled = cs[enabledKey] === '1' || cs[enabledKey] === true;
      if (urlKey in cs) ch.url = cs[urlKey] || '';
    });
  }
}
async function handleSave() {
  const items: { group: string; key: string; value: string }[] = [];
  for (const ch of channels.value) {
    items.push({ group: 'customer_service', key: `${ch.name}_enabled`, value: ch.enabled ? '1' : '0' });
    items.push({ group: 'customer_service', key: `${ch.name}_url`, value: ch.url });
  }
  const { error } = await saveSettings(items);
  if (!error) { window.$message?.success('保存成功'); }
}
loadData();
</script>

<template>
  <div>
    <table class="channel-table">
      <thead>
        <tr><th>渠道</th><th>显示开关</th><th>链接地址</th></tr>
      </thead>
      <tbody>
        <tr v-for="ch in channels" :key="ch.name">
          <td class="font-500">{{ ch.name }}</td>
          <td><NSwitch v-model:value="ch.enabled" /></td>
          <td><NInput v-model:value="ch.url" placeholder="https://" size="small" /></td>
        </tr>
      </tbody>
    </table>

    <div class="flex justify-end mt-24px">
      <NButton v-permission="'system.config.edit'" type="primary" @click="handleSave">保存全部设置</NButton>
    </div>
  </div>
</template>

<style scoped>
.channel-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.channel-table th { text-align: left; padding: 12px 16px; color: #666; font-weight: 500; border-bottom: 1px solid #eee; }
.channel-table td { padding: 14px 16px; border-bottom: 1px solid #f5f5f5; }
</style>
