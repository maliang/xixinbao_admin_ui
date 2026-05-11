import { request } from '../request';

/**
 * 管理员登录
 */
export function fetchLogin(userName: string, password: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/login',
    method: 'post',
    data: {
      username: userName,
      password
    }
  });
}

/**
 * 获取当前管理员信息
 */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/auth/profile' });
}

/**
 * 退出登录
 */
export function fetchLogout() {
  return request({ url: '/auth/logout', method: 'post' });
}

/**
 * 修改密码
 */
export function fetchChangePassword(oldPassword: string, newPassword: string) {
  return request({
    url: '/auth/password',
    method: 'put',
    data: { old_password: oldPassword, new_password: newPassword }
  });
}

/**
 * Refresh token (后端暂不支持，保留接口)
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/login',
    method: 'post',
    data: { refreshToken }
  });
}
