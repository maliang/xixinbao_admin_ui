<script setup lang="ts">
/**
 * 富文本编辑器组件（基于 wangeditor v5）
 * 图片上传复用项目已有的 uploadImage API，自动携带 token
 */
import { shallowRef, onBeforeUnmount, watch } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IEditorConfig, IToolbarConfig, IDomEditor } from '@wangeditor/editor';
import { uploadImage } from '@/service/api';

const props = withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  height?: string;
}>(), {
  placeholder: '请输入内容...',
  height: '360px'
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// 编辑器实例（用 shallowRef 避免深度响应）
const editorRef = shallowRef<IDomEditor>();
const mode = 'default';

// 工具栏配置
const toolbarConfig: Partial<IToolbarConfig> = {};

// 编辑器配置
const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  MENU_CONF: {
    uploadImage: {
      maxFileSize: 5 * 1024 * 1024,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      // 使用自定义上传，复用项目的 request 实例（自动携带 token）
      async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
        const { data, error } = await uploadImage(file);
        if (!error && data) {
          const url = data.url || data.path || '';
          if (url) {
            insertFn(url, '', '');
            return;
          }
        }
        window.$message?.error('图片上传失败');
      }
    }
  }
};

// 编辑器创建完成
function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

// 内容变化
function handleChange(editor: IDomEditor) {
  const html = editor.getHtml();
  emit('update:modelValue', html);
}

// 监听外部 modelValue 变化，同步到编辑器
watch(() => props.modelValue, (val) => {
  if (!editorRef.value) return;
  if (editorRef.value.getHtml() !== val) {
    editorRef.value.setHtml(val || '');
  }
});

// 组件销毁前，销毁编辑器实例
onBeforeUnmount(() => {
  editorRef.value?.destroy();
});
</script>

<template>
  <div class="rich-text-editor">
    <Toolbar
      class="editor-toolbar"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      class="editor-content"
      :style="{ height: props.height }"
      :defaultConfig="editorConfig"
      :mode="mode"
      :modelValue="props.modelValue"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<style>
/* wangeditor 样式必须全局引入 */
@import '@wangeditor/editor/dist/css/style.css';
</style>

<style scoped>
.rich-text-editor {
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  overflow: hidden;
}
.editor-toolbar {
  border-bottom: 1px solid #f0f0f5;
}
.editor-content {
  overflow-y: auto;
}
</style>
