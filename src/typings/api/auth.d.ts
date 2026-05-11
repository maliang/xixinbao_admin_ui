declare namespace Api {
  namespace Auth {
    /** 登录返回的 token 信息 */
    interface LoginToken {
      token: string;
      refreshToken: string;
      user: {
        id: number;
        username: string;
        name: string;
        avatar: string | null;
        role: string;
        permissions?: string[];
        is_agent?: boolean;
        agent_id?: number | null;
      };
    }

    /** 用户信息 */
    interface UserInfo {
      userId: string;
      userName: string;
      roles: string[];
      buttons: string[];
      permissions: string[];
      isAgent: boolean;
    }
  }
}
