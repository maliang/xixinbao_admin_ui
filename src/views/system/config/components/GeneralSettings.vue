<script setup lang="ts">
import { ref } from 'vue';
import { NInput, NButton, NSwitch } from 'naive-ui';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { fetchSettings, saveSettings } from '@/service/api';

const form = ref({
  site_name: '', site_title: '', app_download_url: '',
  company_name: '', company_seal: '',
  front_logo: '', admin_logo: '', default_avatar: '',
  splash_enabled: true, splash_image: ''
});

async function loadData() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const general = data.general || {};
    form.value.site_name = general.siteName || '';
    form.value.site_title = general.siteTitle || '';
    form.value.app_download_url = general.appDownloadUrl || '';
    form.value.company_name = general.companyName || '';
    form.value.company_seal = general.companySeal || '';
    form.value.front_logo = general.frontLogo || '';
    form.value.admin_logo = general.adminLogo || '';
    form.value.default_avatar = general.defaultAvatar || '';
    form.value.splash_image = general.splashImage || '';
    form.value.splash_enabled = general.splashEnabled !== '0' && general.splashEnabled !== false;
  }
}
async function handleSave() {
  const items = Object.entries(form.value).map(([key, value]) => {
    let v: string;
    if (typeof value === 'boolean') v = value ? '1' : '0';
    else v = String(value ?? '');
    return { group: 'general', key, value: v };
  });
  const { error } = await saveSettings(items);
  if (!error) {
    // 清除站点配置缓存，下次加载时重新从接口获取
    localStorage.removeItem('site_config_cache');
    window.$message?.success('保存成功');
  }
}
loadData();
</script>

<template>
  <div>
    <!-- 网站名称 / 网站标题 -->
    <div class="grid grid-cols-2 gap-20px mb-20px">
      <div>
        <div class="field-label">网站名称</div>
        <NInput v-model:value="form.site_name" placeholder="游戏平台" />
      </div>
      <div>
        <div class="field-label">网站标题</div>
        <NInput v-model:value="form.site_title" placeholder="欢迎来到游戏平台" />
      </div>
    </div>

    <!-- APP下载域名 -->
    <div class="mb-24px">
      <div class="field-label">APP下载域名</div>
      <NInput v-model:value="form.app_download_url" placeholder="https://download.game.com" class="max-w-480px" />
    </div>

    <!-- 图片上传 -->
    <h4 class="text-15px font-bold mb-16px">图片上传</h4>
    <div class="grid grid-cols-3 gap-24px mb-24px">
      <div>
        <div class="field-label mb-8px">前台Logo</div>
        <ImageUpload v-model="form.front_logo" width="100px" height="100px" />
      </div>
      <div>
        <div class="field-label mb-8px">后台Logo</div>
        <ImageUpload v-model="form.admin_logo" width="100px" height="100px" />
      </div>
      <div>
        <div class="field-label mb-8px">默认用户头像</div>
        <ImageUpload v-model="form.default_avatar" width="100px" height="100px" />
      </div>
    </div>

    <!-- 启动图配置 -->
    <h4 class="text-15px font-bold mb-16px">启动图配置</h4>
    <div class="mb-24px">
      <div class="flex items-center justify-between mb-12px">
        <div>
          <div class="font-500 text-14px">启用启动图</div>
          <div class="text-12px op-50 mt-2px">关闭后移动端将跳过启动图直接进入应用</div>
        </div>
        <NSwitch v-model:value="form.splash_enabled" />
      </div>
      <template v-if="form.splash_enabled">
        <div class="field-label mb-8px">移动端启动图（建议尺寸 750×1334）</div>
        <ImageUpload v-model="form.splash_image" width="120px" height="213px" />
        <div class="text-11px op-40 mt-6px">配置后移动端启动页将显示此图片，未配置则使用默认启动图</div>
      </template>
    </div>

    <!-- 公司信息 -->
    <h4 class="text-15px font-bold mb-16px">公司信息</h4>
    <div class="grid grid-cols-2 gap-20px mb-24px">
      <div>
        <div class="field-label">公司名称</div>
        <NInput v-model:value="form.company_name" placeholder="请输入公司全称，用于合同等场景" />
      </div>
      <div>
        <div class="field-label mb-8px">公司用章</div>
        <ImageUpload v-model="form.company_seal" width="100px" height="100px" />
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
