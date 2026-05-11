<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NTabs, NTabPane } from 'naive-ui';
import GeneralSettings from './components/GeneralSettings.vue';
import DesensitizeSettings from './components/DesensitizeSettings.vue';
import CustomerServiceSettings from './components/CustomerServiceSettings.vue';
import RegisterLoginSettings from './components/RegisterLoginSettings.vue';
import SecuritySettings from './components/SecuritySettings.vue';
import ContentNotifySettings from './components/ContentNotifySettings.vue';
import FinanceSettings from './components/FinanceSettings.vue';

defineOptions({ name: 'SystemConfigPage' });

const mainTab = ref('basic');
const subTab = ref('general');
</script>

<template>
  <div class="p-16px">
    <NCard :bordered="false" class="card-wrapper">
      <h3 class="text-18px font-bold mb-20px">站点配置</h3>

      <!-- 一级 Tab -->
      <NTabs v-model:value="mainTab" type="line" class="mb-4px">
        <NTabPane name="basic" tab="基本设置" />
        <NTabPane name="security" tab="安全与访问" />
        <NTabPane name="content" tab="内容与通知" />
        <NTabPane name="finance" tab="财务与营销" />
      </NTabs>

      <!-- 基本设置 - 二级 Tab -->
      <template v-if="mainTab === 'basic'">
        <NTabs v-model:value="subTab" type="line" size="small" class="mb-20px">
          <NTabPane name="general" tab="通用设置" />
          <NTabPane name="desensitize" tab="信息脱敏" />
          <NTabPane name="customer" tab="客服渠道" />
          <NTabPane name="register" tab="注册与登录设置" />
        </NTabs>

        <GeneralSettings v-if="subTab === 'general'" />
        <DesensitizeSettings v-if="subTab === 'desensitize'" />
        <CustomerServiceSettings v-if="subTab === 'customer'" />
        <RegisterLoginSettings v-if="subTab === 'register'" />
      </template>

      <!-- 安全与访问 -->
      <template v-if="mainTab === 'security'">
        <SecuritySettings />
      </template>

      <!-- 内容与通知 -->
      <template v-if="mainTab === 'content'">
        <ContentNotifySettings />
      </template>

      <!-- 财务与营销 -->
      <template v-if="mainTab === 'finance'">
        <FinanceSettings />
      </template>
    </NCard>
  </div>
</template>
