<script setup lang="ts">
import { ref } from 'vue';
import { NInput, NInputNumber, NSwitch, NButton } from 'naive-ui';
import { fetchSettings, saveSettings } from '@/service/api';

const form = ref({
  allow_register: true, require_captcha: true, name_conflict_check: true,
  account_min_length: 4, account_max_length: 20,
  same_ip_limit: 1, ip_period: 'forever' as string,
  banned_names: 'test\nadmin\nroot\nsystem\nguest',
  auto_logout: true, idle_timeout: 30
});
const periodOptions = ['永久', '每天', '每周', '每月'];

async function loadData() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const r = data.registerLogin || {};
    form.value.allow_register = r.allowRegister === '1' || r.allowRegister === true;
    form.value.require_captcha = r.requireCaptcha === '1' || r.requireCaptcha === true;
    form.value.name_conflict_check = r.nameConflictCheck === '1' || r.nameConflictCheck === true;
    form.value.account_min_length = Number(r.accountMinLength) || 4;
    form.value.account_max_length = Number(r.accountMaxLength) || 20;
    form.value.same_ip_limit = Number(r.sameIpLimit) || 1;
    form.value.ip_period = r.ipPeriod || 'forever';
    form.value.banned_names = r.bannedNames || '';
    form.value.auto_logout = r.autoLogout === '1' || r.autoLogout === true;
    form.value.idle_timeout = Number(r.idleTimeout) || 30;
  }
}
async function handleSave() {
  const items = Object.entries(form.value).map(([key, value]) => {
    let v: string;
    if (typeof value === 'boolean') v = value ? '1' : '0';
    else v = String(value);
    return { group: 'register_login', key, value: v };
  });
  const { error } = await saveSettings(items);
  if (!error) { window.$message?.success('保存成功'); }
}
loadData();
</script>

<template>
  <div>
    <!-- 注册基础配置 -->
    <div class="section-title">注册基础配置</div>
    <div class="grid grid-cols-2 gap-16px mb-24px">
      <div class="config-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-500 text-14px">允许玩家注册</div>
            <div class="text-12px op-50 mt-2px">关闭后前台将隐藏注册入口</div>
          </div>
          <NSwitch v-model:value="form.allow_register" />
        </div>
      </div>
      <div class="config-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-500 text-14px">注册验证码</div>
            <div class="text-12px op-50 mt-2px">开启后注册需输入图形验证码</div>
          </div>
          <NSwitch v-model:value="form.require_captcha" />
        </div>
      </div>
      <div class="config-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-500 text-14px">账号名称冲突检查</div>
            <div class="text-12px op-50 mt-2px">禁止新注册玩家与代理账号重名</div>
          </div>
          <NSwitch v-model:value="form.name_conflict_check" />
        </div>
      </div>
      <div class="config-card">
        <div>
          <div class="font-500 text-14px mb-8px">账号长度限制</div>
          <div class="flex items-center gap-8px">
            <NInputNumber v-model:value="form.account_min_length" :show-button="false" size="small" class="w-70px" />
            <span class="text-13px op-50">至</span>
            <NInputNumber v-model:value="form.account_max_length" :show-button="false" size="small" class="w-70px" />
            <span class="text-13px op-50">个字符</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 风控限制 -->
    <div class="section-title">风控限制</div>
    <div class="config-card mb-16px">
      <div class="grid grid-cols-2 gap-20px mb-16px">
        <div>
          <div class="font-500 text-13px mb-8px">同一IP允许注册账号数</div>
          <div class="flex items-center gap-8px">
            <NInputNumber v-model:value="form.same_ip_limit" :show-button="false" size="small" class="w-80px" />
            <span class="text-13px op-50">个账号</span>
          </div>
        </div>
        <div>
          <div class="font-500 text-13px mb-8px">统计时间周期</div>
          <div class="flex items-center gap-4px">
            <span
              v-for="p in periodOptions" :key="p"
              class="period-btn" :class="{ active: form.ip_period === p }"
              @click="form.ip_period = p"
            >{{ p }}</span>
          </div>
        </div>
      </div>
      <div>
        <div class="font-500 text-13px mb-8px">禁止注册的用户名称</div>
        <NInput v-model:value="form.banned_names" type="textarea" :rows="5" placeholder="每行一个用户名" />
        <div class="text-11px op-40 mt-4px">这些名称将无法作为用户名被注册，增强系统安全性</div>
      </div>
    </div>

    <!-- 登录安全 -->
    <div class="section-title">登录安全</div>
    <div class="config-card mb-24px">
      <div class="flex items-center justify-between mb-12px">
        <div>
          <div class="font-500 text-14px">开启自动登出</div>
          <div class="text-12px op-50 mt-2px">用户长时间无操作后自动断开连接</div>
        </div>
        <NSwitch v-model:value="form.auto_logout" />
      </div>
      <div v-if="form.auto_logout">
        <div class="font-500 text-13px mb-8px">无操作超时时间</div>
        <div class="flex items-center gap-8px">
          <NInputNumber v-model:value="form.idle_timeout" :show-button="false" size="small" class="w-100px" />
          <span class="text-13px op-50">分钟</span>
        </div>
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
.period-btn { padding: 4px 14px; border-radius: 4px; font-size: 13px; cursor: pointer; background: #f0f0f0; color: #666; transition: all 0.2s; }
.period-btn.active { background: #2080f0; color: #fff; }
</style>
