import type { Directive, DirectiveBinding } from 'vue';
import { useAuthStore } from '@/store/modules/auth';

/**
 * v-permission 自定义指令
 * 用于按钮/操作级别的权限控制，无权限时从 DOM 移除元素
 *
 * 使用方式：
 * - 单个权限码：v-permission="'user.member.edit'"
 * - 多个权限码（任一匹配即可）：v-permission="['user.member.delete', 'user.member.edit']"
 */
export const vPermission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const authStore = useAuthStore();
    const permissions = Array.isArray(binding.value) ? binding.value : [binding.value];

    if (!authStore.hasAnyPermission(permissions)) {
      el.parentNode?.removeChild(el);
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const authStore = useAuthStore();
    const permissions = Array.isArray(binding.value) ? binding.value : [binding.value];

    if (!authStore.hasAnyPermission(permissions)) {
      el.parentNode?.removeChild(el);
    }
  }
};
