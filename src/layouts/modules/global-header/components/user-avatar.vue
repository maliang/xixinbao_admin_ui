<script setup lang="ts">
import { computed, ref } from 'vue';
import type { VNode } from 'vue';
import { NModal, NForm, NFormItem, NInput, NButton } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import { $t } from '@/locales';
import { request } from '@/service/request';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { routerPushByKey, toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'change-password' | 'logout';

type DropdownOption =
  | {
      key: DropdownKey;
      label: string;
      icon?: () => VNode;
    }
  | {
      type: 'divider';
      key: string;
    };

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: '修改密码',
      key: 'change-password',
      icon: SvgIconVNode({ icon: 'ph:lock-key', fontSize: 18 })
    },
    {
      type: 'divider',
      key: 'divider'
    },
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  ];

  return opts;
});

function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      authStore.resetStore();
    }
  });
}

// ========== 修改密码弹窗 ==========
const passwordVisible = ref(false);
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const saving = ref(false);

async function handleChangePassword() {
  if (!passwordForm.value.oldPassword) { window.$message?.warning('请输入原密码'); return; }
  if (!passwordForm.value.newPassword) { window.$message?.warning('请输入新密码'); return; }
  if (passwordForm.value.newPassword.length < 6) { window.$message?.warning('新密码长度至少6位'); return; }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) { window.$message?.warning('两次输入的密码不一致'); return; }

  saving.value = true;
  const { error } = await request({
    url: '/auth/password',
    method: 'put',
    data: {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    }
  });
  saving.value = false;

  if (!error) {
    window.$message?.success('密码修改成功，请重新登录');
    passwordVisible.value = false;
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    setTimeout(() => { authStore.resetStore(); }, 1500);
  } else {
    window.$message?.error((error as any)?.msg || '修改失败');
  }
}

function handleDropdown(key: DropdownKey) {
  if (key === 'logout') {
    logout();
  } else if (key === 'change-password') {
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    passwordVisible.value = true;
  } else {
    routerPushByKey(key);
  }
}
</script>

<template>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <NDropdown v-else placement="bottom" trigger="click" :options="options" @select="handleDropdown">
    <div>
      <ButtonIcon>
        <SvgIcon icon="ph:user-circle" class="text-icon-large" />
        <span class="text-16px font-medium">{{ authStore.userInfo.userName }}</span>
      </ButtonIcon>
    </div>
  </NDropdown>

  <!-- 修改密码弹窗 -->
  <NModal v-model:show="passwordVisible" preset="card" title="修改密码" style="width: 420px;" :bordered="false">
    <NForm label-placement="top" size="small">
      <NFormItem label="原密码" required>
        <NInput v-model:value="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password-on="click" />
      </NFormItem>
      <NFormItem label="新密码" required>
        <NInput v-model:value="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password-on="click" />
      </NFormItem>
      <NFormItem label="确认新密码" required>
        <NInput v-model:value="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password-on="click" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="passwordVisible = false">取消</NButton>
        <NButton type="primary" :loading="saving" @click="handleChangePassword">确认修改</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped></style>
