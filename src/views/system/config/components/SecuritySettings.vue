<script setup lang="ts">
import { ref } from 'vue';
import { NInput, NButton, NRadioGroup, NRadio, NSelect } from 'naive-ui';
import { fetchSettings, saveSettings } from '@/service/api';

// ========== 全球地区登录限制 ==========
const regionMode = ref('off');
const selectedRegions = ref<string[]>(['中国大陆', '中国香港']);
const regionOptions = [
  { label: '中国大陆', value: '中国大陆' }, { label: '中国香港', value: '中国香港' },
  { label: '中国台湾', value: '中国台湾' }, { label: '日本', value: '日本' },
  { label: '韩国', value: '韩国' }, { label: '美国', value: '美国' },
  { label: '英国', value: '英国' }, { label: '新加坡', value: '新加坡' },
  { label: '马来西亚', value: '马来西亚' }, { label: '泰国', value: '泰国' },
  { label: '越南', value: '越南' }, { label: '菲律宾', value: '菲律宾' }
];

// ========== IP访问控制 ==========
const ipWhitelist = ref('');
const ipBlacklist = ref('');
const ipScope = ref('all');

async function loadData() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const s = data.security || {};
    regionMode.value = s.regionMode || 'off';
    selectedRegions.value = s.selectedRegions ? JSON.parse(s.selectedRegions) : [];
    ipWhitelist.value = s.ipWhitelist || '';
    ipBlacklist.value = s.ipBlacklist || '';
    ipScope.value = s.ipScope || 'all';
  }
}
async function handleSave() {
  const items = [
    { group: 'security', key: 'region_mode', value: regionMode.value },
    { group: 'security', key: 'selected_regions', value: JSON.stringify(selectedRegions.value) },
    { group: 'security', key: 'ip_whitelist', value: ipWhitelist.value },
    { group: 'security', key: 'ip_blacklist', value: ipBlacklist.value },
    { group: 'security', key: 'ip_scope', value: ipScope.value }
  ];
  const { error } = await saveSettings(items);
  if (!error) { window.$message?.success('保存成功'); }
}
loadData();
</script>

<template>
  <div>
    <!-- 二级Tab：地区与IP限制 -->
    <div class="sub-tab-bar mb-20px">
      <span class="sub-tab active">地区与IP限制</span>
    </div>

    <!-- 全球地区登录限制 -->
    <div class="section-title">全球地区登录限制</div>
    <div class="config-card mb-24px">
      <div class="grid grid-cols-2 gap-24px">
        <div>
          <div class="font-500 text-13px mb-10px">控制模式</div>
          <NRadioGroup v-model:value="regionMode">
            <NRadio value="whitelist">白名单模式</NRadio>
            <NRadio value="blacklist">黑名单模式</NRadio>
            <NRadio value="off">关闭限制</NRadio>
          </NRadioGroup>
          <div class="text-11px op-40 mt-8px">白名单模式下，仅允许选中地区的IP访问系统</div>
        </div>
        <div>
          <div class="font-500 text-13px mb-10px">生效国家与地区</div>
          <NSelect v-model:value="selectedRegions" :options="regionOptions" multiple placeholder="支持多选全球各个国家和地区" size="small" />
          <div class="text-11px op-40 mt-8px">支持多选全球各个国家和地区</div>
        </div>
      </div>
    </div>

    <!-- IP访问控制 -->
    <div class="section-title">IP访问控制</div>
    <div class="grid grid-cols-2 gap-20px mb-16px">
      <div>
        <div class="flex items-center justify-between mb-6px">
          <span class="font-500 text-13px">IP白名单</span>
          <span class="text-11px op-40">支持单个IP或CIDR格式，每行一个</span>
        </div>
        <NInput v-model:value="ipWhitelist" type="textarea" :rows="6" placeholder="192.168.1.1&#10;10.0.0.0/24" />
      </div>
      <div>
        <div class="flex items-center justify-between mb-6px">
          <span class="font-500 text-13px">IP黑名单</span>
          <span class="text-11px op-40">命中黑名单的IP将直接被拒绝访问</span>
        </div>
        <NInput v-model:value="ipBlacklist" type="textarea" :rows="6" placeholder="10.0.0.1&#10;192.168.100.25" />
      </div>
    </div>

    <!-- IP策略生效范围 -->
    <div class="config-card mb-24px">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-500 text-13px">IP策略生效范围</div>
          <div class="text-11px op-40 mt-2px">配置上述IP黑白名单应用的终端范围</div>
        </div>
        <NRadioGroup v-model:value="ipScope">
          <NRadio value="front">仅前台</NRadio>
          <NRadio value="admin">仅后台</NRadio>
          <NRadio value="all">全部生效</NRadio>
        </NRadioGroup>
      </div>
    </div>

    <div class="flex justify-end">
      <NButton v-permission="'system.config.edit'" type="primary" @click="handleSave">保存全部设置</NButton>
    </div>
  </div>
</template>

<style scoped>
.section-title { font-size: 15px; font-weight: 700; margin-bottom: 14px; padding-left: 10px; border-left: 3px solid #2080f0; }
.config-card { background: #f9fafb; border-radius: 8px; padding: 16px 20px; }
.sub-tab-bar { border-bottom: 1px solid #eee; padding-bottom: 0; }
.sub-tab { display: inline-block; padding: 8px 0; margin-right: 24px; font-size: 13px; color: #666; cursor: pointer; border-bottom: 2px solid transparent; }
.sub-tab.active { color: #2080f0; border-bottom-color: #2080f0; font-weight: 500; }
</style>
