<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NInput, NInputNumber, NSelect, NSwitch, NCheckbox, NModal, NForm, NFormItem, NTag, useDialog } from 'naive-ui';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { fetchBanners, createBanner, updateBanner, deleteBanner, fetchSettings, saveSettings } from '@/service/api';

const dialog = useDialog();
const subTab = ref('banner');

// ========== 轮播图管理 ==========
const banners = ref<any[]>([]);
const bannerModalVisible = ref(false);
const bannerModalTitle = ref('新增轮播图');
const bannerForm = ref({ id: null as number | null, image: '', title: '', link: '', sort: 0, status: true });

async function loadBanners() {
  const { data, error } = await fetchBanners();
  if (!error) {
    banners.value = Array.isArray(data) ? data : (data?.list || []);
  }
}
function openBannerCreate() { bannerModalTitle.value = '新增轮播图'; bannerForm.value = { id: null, image: '', title: '', link: '', sort: 0, status: true }; bannerModalVisible.value = true; }
function openBannerEdit(row: any) { bannerModalTitle.value = '编辑轮播图'; bannerForm.value = { id: row.id, image: row.image || '', title: row.title, link: row.link || '', sort: row.sort, status: row.status }; bannerModalVisible.value = true; }
async function handleBannerSave() {
  if (!bannerForm.value.image) { window.$message?.warning('请上传轮播图片'); return; }
  const payload = {
    image: bannerForm.value.image,
    title: bannerForm.value.title,
    link: bannerForm.value.link,
    sort: bannerForm.value.sort,
    status: bannerForm.value.status
  };
  if (bannerForm.value.id) {
    const { error } = await updateBanner(bannerForm.value.id, payload);
    if (!error) { window.$message?.success('更新成功'); bannerModalVisible.value = false; loadBanners(); }
    else { window.$message?.error('操作失败'); }
  } else {
    const { error } = await createBanner(payload);
    if (!error) { window.$message?.success('创建成功'); bannerModalVisible.value = false; loadBanners(); }
    else { window.$message?.error('操作失败'); }
  }
}
function confirmBannerDelete(row: any) {
  dialog.warning({
    title: '删除轮播图', content: `确定要删除「${row.title}」吗？`,
    positiveText: '确认', negativeText: '取消', positiveButtonProps: { type: 'error' } as any,
    onPositiveClick: async () => {
      const { error } = await deleteBanner(row.id);
      if (!error) { window.$message?.success('删除成功'); loadBanners(); }
      else { window.$message?.error('删除失败'); }
    }
  });
}
const movingBannerId = ref<number | null>(null);

async function moveBanner(row: any, dir: 'up' | 'down') {
  const idx = banners.value.findIndex((b: any) => b.id === row.id);
  if (idx < 0) return;
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= banners.value.length) {
    window.$message?.warning(dir === 'up' ? '已经是第一个了' : '已经是最后一个了');
    return;
  }
  movingBannerId.value = row.id;
  // 交换 sort 值并保存
  const currentSort = banners.value[idx].sort;
  const targetSort = banners.value[swapIdx].sort;
  // 如果 sort 值相同，手动分配
  const sortA = currentSort === targetSort ? targetSort - 1 : targetSort;
  const sortB = currentSort === targetSort ? currentSort : currentSort;
  await updateBanner(row.id, { sort: sortA });
  await updateBanner(banners.value[swapIdx].id, { sort: sortB });
  await loadBanners();
  movingBannerId.value = null;
  window.$message?.success('排序已更新');
}

// ========== 系统提示音 ==========
const ringModeOptions = [{ label: '新增时响铃一次', value: 'once' }, { label: '循环响铃直到处理', value: 'loop' }, { label: '每隔5分钟响铃', value: 'interval' }];
const soundOptions = [{ label: '默认提示音 (叮咚)', value: 'default' }, { label: '金币掉落声', value: 'coin' }, { label: '急促警报', value: 'alert' }, { label: '急促警报 (长鸣)', value: 'alert_long' }];

const sounds = ref([
  { key: 'kyc', label: '实名待审核', icon: 'ph:user-circle', iconColor: '#2080f0', enabled: false, mode: 'once', sound: 'default' },
  { key: 'recharge', label: '充值提醒', icon: 'ph:currency-circle-dollar', iconColor: '#18a058', enabled: false, mode: 'once', sound: 'coin' },
  { key: 'withdraw', label: '提现申请待处理', icon: 'ph:arrow-circle-down', iconColor: '#f0a020', enabled: false, mode: 'loop', sound: 'alert' },
  { key: 'order', label: '订单提示', icon: 'ph:warning-circle', iconColor: '#d03050', enabled: false, mode: 'loop', sound: 'alert_long' }
]);

async function loadSoundSettings() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const notify = data.notify || {};
    if (notify.soundConfig) {
      try {
        const config = JSON.parse(notify.soundConfig);
        if (Array.isArray(config)) {
          config.forEach((item: any) => {
            const s = sounds.value.find(x => x.key === item.key);
            if (s) {
              s.enabled = item.enabled ?? false;
              s.mode = item.mode || 'once';
              s.sound = item.sound || 'default';
            }
          });
        }
      } catch { /* 使用默认值 */ }
    }
    // 加载自定义音频 URL
    if (notify.soundCustomUrls) {
      try { customSoundUrls.value = JSON.parse(notify.soundCustomUrls); } catch { /* 忽略 */ }
    }
  }
}

async function handleSave() {
  const items = [
    { group: 'notify', key: 'sound_config', value: JSON.stringify(sounds.value.map(s => ({ key: s.key, enabled: s.enabled, mode: s.mode, sound: s.sound }))) },
    { group: 'notify', key: 'sound_custom_urls', value: JSON.stringify(customSoundUrls.value) }
  ];
  const { error } = await saveSettings(items);
  if (!error) {
    window.$message?.success('保存成功');
    // 通知 header-shortcuts 重新加载提示音配置，立即生效
    if ((window as any).__reloadSoundConfig) {
      (window as any).__reloadSoundConfig();
    }
  }
  else window.$message?.error('保存失败');
}

const defaultSoundFiles: Record<string, string> = {
  default: '/static/dingdong.mp3',
  coin: '/static/yingbi.mp3',
  alert: '/static/jingming.mp3',
  alert_long: '/static/changming.mp3'
};

// 自定义音频 URL（上传后保存的完整地址）
const customSoundUrls = ref<Record<string, string>>({});

function getSoundUrl(soundKey: string): string {
  // 优先使用自定义上传的 URL，否则用默认文件
  return customSoundUrls.value[soundKey] || defaultSoundFiles[soundKey] || defaultSoundFiles.default;
}

let previewAudio: HTMLAudioElement | null = null;

function previewSound(soundKey: string) {
  const src = getSoundUrl(soundKey);
  if (previewAudio) { previewAudio.pause(); previewAudio = null; }
  previewAudio = new Audio(src);
  previewAudio.play().catch((e) => {
    console.warn('Audio play failed:', e);
    window.$message?.warning('音频播放失败，请检查音频文件是否存在');
  });
}

async function handleSoundUpload(event: Event, soundKey: string) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const { request } = await import('@/service/request');
    const { data, error } = await request({ url: '/upload/file', method: 'post', data: formData });
    if (!error && data) {
      const url = typeof data === 'string' ? data : data.url || data;
      customSoundUrls.value[soundKey] = url;
      window.$message?.success('上传成功');
    } else {
      window.$message?.error('上传失败');
    }
  } catch {
    window.$message?.error('上传失败');
  }
  input.value = '';
}

loadBanners();
loadSoundSettings();
</script>

<template>
  <div>
    <!-- 二级Tab -->
    <div class="sub-tab-bar mb-20px">
      <span class="sub-tab" :class="{ active: subTab === 'banner' }" @click="subTab = 'banner'">轮播图管理</span>
      <span class="sub-tab" :class="{ active: subTab === 'sound' }" @click="subTab = 'sound'">系统提示音</span>
    </div>

    <!-- 轮播图管理 -->
    <template v-if="subTab === 'banner'">
      <NButton type="primary" size="small" class="mb-16px" @click="openBannerCreate">
        <SvgIcon icon="ph:plus" class="mr-4px" />
        新增轮播图
      </NButton>

      <table class="banner-table">
        <thead>
          <tr><th>缩略图</th><th>标题</th><th>链接</th><th>排序</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-if="banners.length === 0"><td colspan="6" class="text-center op-40 py-40px">暂无轮播图</td></tr>
          <tr v-for="row in banners" :key="row.id">
            <td>
              <div class="w-60px h-40px rounded bg-gray-100 flex-center overflow-hidden">
                <img v-if="row.image" :src="row.image" class="w-full h-full object-cover" />
                <SvgIcon v-else icon="ph:image" class="text-18px op-30" />
              </div>
            </td>
            <td>{{ row.title }}</td>
            <td class="text-12px op-60">{{ row.link || '-' }}</td>
            <td>{{ row.sort }}</td>
            <td><NTag :type="row.status ? 'success' : 'default'" size="small" :bordered="false">{{ row.status ? '显示' : '隐藏' }}</NTag></td>
            <td>
              <div class="flex items-center gap-8px">
                <a class="text-primary text-12px cursor-pointer" @click="openBannerEdit(row)">编辑</a>
                <a class="text-red-500 text-12px cursor-pointer" @click="confirmBannerDelete(row)">删除</a>
                <a
                  class="text-12px cursor-pointer"
                  :class="movingBannerId === row.id ? 'op-40 pointer-events-none' : 'op-60'"
                  @click="moveBanner(row, 'up')"
                >{{ movingBannerId === row.id ? '移动中...' : '上移' }}</a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="flex justify-end mt-24px">
        <NButton v-permission="'system.config.edit'" type="primary" @click="handleSave">保存全部设置</NButton>
      </div>
    </template>

    <!-- 系统提示音 -->
    <template v-if="subTab === 'sound'">
      <div class="grid grid-cols-2 gap-16px mb-16px">
        <div v-for="s in sounds" :key="s.key" class="sound-card">
          <div class="flex items-center gap-6px mb-12px">
            <SvgIcon :icon="s.icon" class="text-16px" :style="{ color: s.iconColor }" />
            <span class="font-500 text-14px">{{ s.label }}</span>
          </div>
          <div class="flex items-center justify-between mb-10px">
            <NCheckbox v-model:checked="s.enabled">启用提示音</NCheckbox>
            <NSelect v-model:value="s.mode" :options="ringModeOptions" size="small" class="w-160px" />
          </div>
          <div class="flex items-center gap-8px">
            <div class="w-32px h-32px rounded-full bg-gray-100 flex-center cursor-pointer" @click="previewSound(s.sound)">
              <SvgIcon icon="ph:play" class="text-14px" />
            </div>
            <NSelect v-model:value="s.sound" :options="soundOptions" size="small" class="flex-1" />
            <label class="w-32px h-32px rounded-full bg-gray-100 flex-center cursor-pointer">
              <SvgIcon icon="ph:upload-simple" class="text-14px" />
              <input type="file" accept="audio/*" style="display:none;" @change="(e: any) => handleSoundUpload(e, s.sound)" />
            </label>
          </div>
        </div>
      </div>

      <!-- 提示音说明 -->
      <div class="info-box mb-24px">
        <div class="flex items-start gap-8px">
          <SvgIcon icon="ph:info" class="text-primary text-16px flex-shrink-0 mt-2px" />
          <div class="text-12px">
            <p class="font-500 mb-4px">提示音设置说明：</p>
            <ul class="list-disc ml-14px text-primary">
              <li>浏览器可能限制自动播放音频，建议首次登录后点击页面任意位置以授权音频播放。</li>
              <li>自定义音频建议上传格式为 mp3、wav，文件大小不超过 2MB。</li>
              <li>循环响铃模式下，只有相关人员处理了对应事件，提示音才会停止。</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <NButton v-permission="'system.config.edit'" type="primary" @click="handleSave">保存全部设置</NButton>
      </div>
    </template>

    <!-- 新增/编辑轮播图弹窗 -->
    <NModal v-model:show="bannerModalVisible" preset="card" :title="bannerModalTitle" style="width: 520px;" :bordered="false">
      <NForm label-placement="top" size="small">
        <NFormItem label="轮播图片" required>
          <div class="flex items-start gap-16px">
            <ImageUpload v-model="bannerForm.image" width="100px" height="100px" />
            <div class="text-11px op-40 pt-8px">
              <p>建议尺寸: 1920 x 400 px</p>
              <p>支持 jpg, png 格式，大小不超过 2MB</p>
            </div>
          </div>
        </NFormItem>
        <NFormItem label="图片标题">
          <NInput v-model:value="bannerForm.title" placeholder="请输入轮播图标题" />
        </NFormItem>
        <NFormItem label="跳转链接">
          <NInput v-model:value="bannerForm.link" placeholder="例如: /activity/spring 或 https://..." />
        </NFormItem>
        <div class="flex gap-16px">
          <NFormItem label="排序" class="flex-1">
            <NInputNumber v-model:value="bannerForm.sort" :show-button="false" class="w-full" />
          </NFormItem>
          <NFormItem label="状态" class="flex-1">
            <div class="flex items-center gap-8px">
              <NSwitch v-model:value="bannerForm.status" />
              <span class="text-13px">{{ bannerForm.status ? '显示' : '隐藏' }}</span>
            </div>
          </NFormItem>
        </div>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="bannerModalVisible = false">取消</NButton>
          <NButton type="primary" @click="handleBannerSave">确定</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.sub-tab-bar { border-bottom: 1px solid #eee; }
.sub-tab { display: inline-block; padding: 8px 0; margin-right: 24px; font-size: 13px; color: #666; cursor: pointer; border-bottom: 2px solid transparent; }
.sub-tab.active { color: #2080f0; border-bottom-color: #2080f0; font-weight: 500; }
.banner-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.banner-table th { text-align: left; padding: 10px 14px; color: #666; font-weight: 500; border-bottom: 1px solid #eee; }
.banner-table td { padding: 12px 14px; border-bottom: 1px solid #f5f5f5; }
.sound-card { background: #f9fafb; border-radius: 8px; padding: 16px 20px; }
.info-box { background: #f0f7ff; border-radius: 8px; padding: 14px 16px; }
</style>
