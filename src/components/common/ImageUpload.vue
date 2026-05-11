<script setup lang="ts">
import { ref } from 'vue';
import { uploadImage } from '@/service/api';

defineOptions({ name: 'ImageUpload' });

const props = withDefaults(defineProps<{
  modelValue: string;
  width?: string;
  height?: string;
}>(), {
  width: '120px',
  height: '120px'
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);
const previewUrl = ref('');

function triggerSelect() {
  fileInput.value?.click();
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploading.value = true;
  const { data, error } = await uploadImage(file);
  uploading.value = false;

  if (!error && data) {
    // 存相对路径到数据库，预览用完整URL
    emit('update:modelValue', data.path || data.url || data);
    previewUrl.value = data.url || '';
    window.$message?.success('上传成功');
  } else {
    window.$message?.error('上传失败');
  }

  input.value = '';
}

// 显示用的图片URL：优先用刚上传的预览URL，否则用modelValue（后端返回的完整URL）
function displayUrl(): string {
  return previewUrl.value || props.modelValue;
}
</script>

<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />
    <!-- 已上传：显示图片预览 -->
    <div
      v-if="displayUrl()"
      class="upload-box uploaded"
      :style="{ width: props.width, height: props.height }"
      @click="triggerSelect"
    >
      <img :src="displayUrl()" class="w-full h-full object-contain" />
      <div class="upload-overlay">
        <span class="text-12px text-white">{{ uploading ? '上传中...' : '点击替换' }}</span>
      </div>
    </div>
    <!-- 未上传：虚线框 -->
    <div
      v-else
      class="upload-box empty"
      :style="{ width: props.width, height: props.height }"
      @click="triggerSelect"
    >
      <span v-if="uploading" class="text-14px op-50">上传中...</span>
      <span v-else class="text-14px op-50">点击上传</span>
    </div>
  </div>
</template>

<style scoped>
.upload-box {
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  transition: border-color 0.2s;
}
.upload-box.empty {
  border: 1.5px dashed #d9d9d9;
  background: #fafafa;
}
.upload-box.empty:hover {
  border-color: #4A7FD0;
}
.upload-box.uploaded {
  border: 1px solid #e8e8e8;
}
.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.upload-box.uploaded:hover .upload-overlay {
  opacity: 1;
}
</style>
