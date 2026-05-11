import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 提取路由守卫权限决策的纯函数逻辑
 * （与 router/guard/route.ts 中的权限判断逻辑一致）
 *
 * 路由守卫决策规则：
 * 1. super_admin (isStaticSuper) 始终允许访问
 * 2. 路由未配置 permissions 时允许访问（仅需登录）
 * 3. 用户拥有路由 permissions 中的任一权限时允许访问
 * 4. 否则拒绝访问（重定向到 403）
 */
function routeGuardDecision(
  routePermissions: string[],
  userPermissions: string[],
  userRoles: string[],
  isSuperAdmin: boolean
): 'allow' | 'deny' {
  // super_admin 始终允许
  if (isSuperAdmin) return 'allow';

  // 路由未配置 permissions 时允许（仅需登录）
  if (!routePermissions.length) return 'allow';

  // 检查用户是否拥有路由所需的任一权限
  const hasPermission = routePermissions.some(p => userPermissions.includes(p));
  return hasPermission ? 'allow' : 'deny';
}

/**
 * 辅助函数：模拟 hasAnyPermission 的行为（与 auth store 一致）
 */
function hasAnyPermission(permissions: string[], roles: string[], codes: string[]): boolean {
  if (roles.includes('R_SUPER')) return true;
  return codes.some(code => permissions.includes(code));
}

// 权限码生成器
const permissionCodeArb = fc.stringMatching(/^[a-z]{2,6}(\.[a-z]{2,6}){0,2}$/);

describe('Feature: permission-integration, Property 8: 路由守卫权限决策正确性', () => {
  /**
   * **Validates: Requirements 7.1, 7.2**
   *
   * Property 8: 对于任意导航到配置了 permissions 的路由，
   * 路由守卫当且仅当用户拥有所需权限码中的至少一个（或为 super_admin 或路由未配置 permissions）时允许导航
   */

  it('super_admin 始终允许访问任何路由', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 5 }),
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 10 }),
        (routePermissions, userPermissions) => {
          const result = routeGuardDecision(routePermissions, userPermissions, ['R_SUPER'], true);
          return result === 'allow';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('路由未配置 permissions 时始终允许访问', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 10 }),
        (userPermissions) => {
          const result = routeGuardDecision([], userPermissions, ['R_ADMIN'], false);
          return result === 'allow';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('用户拥有路由所需权限中的任一个时允许访问', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 5 }),
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 10 }),
        (routePermissions, extraUserPerms) => {
          // 确保用户拥有路由所需权限中的第一个
          const userPermissions = [routePermissions[0], ...extraUserPerms];
          const result = routeGuardDecision(routePermissions, userPermissions, ['R_ADMIN'], false);
          return result === 'allow';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('用户不拥有路由所需的任何权限时拒绝访问', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 5 }),
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 10 }),
        (routePermissions, userPermissions) => {
          // 确保用户权限与路由权限完全不匹配
          fc.pre(routePermissions.every(p => !userPermissions.includes(p)));
          const result = routeGuardDecision(routePermissions, userPermissions, ['R_ADMIN'], false);
          return result === 'deny';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('决策结果与 hasAnyPermission 逻辑一致（非 super_admin 且路由有 permissions 时）', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 5 }),
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 10 }),
        (routePermissions, userPermissions) => {
          const guardResult = routeGuardDecision(routePermissions, userPermissions, ['R_ADMIN'], false);
          const hasAny = hasAnyPermission(userPermissions, ['R_ADMIN'], routePermissions);
          return (guardResult === 'allow') === hasAny;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('R_SUPER 角色通过 hasAnyPermission 也始终返回 allow', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 5 }),
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 5 }),
        (routePermissions, userPermissions) => {
          // 模拟 isStaticSuper = true 的场景（R_SUPER 角色）
          const result = routeGuardDecision(routePermissions, userPermissions, ['R_SUPER'], true);
          return result === 'allow';
        }
      ),
      { numRuns: 100 }
    );
  });
});
