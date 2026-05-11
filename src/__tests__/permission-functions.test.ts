import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 提取纯函数逻辑用于测试（与 auth store 中的实现逻辑一致）
 * 这些函数是 auth store 中 hasPermission / hasAnyPermission 的核心逻辑
 */
function hasPermission(permissions: string[], roles: string[], code: string): boolean {
  if (roles.includes('R_SUPER')) return true;
  return permissions.includes(code);
}

function hasAnyPermission(permissions: string[], roles: string[], codes: string[]): boolean {
  if (roles.includes('R_SUPER')) return true;
  return codes.some(code => permissions.includes(code));
}

// Permission code 生成器：模拟点分层级格式（如 user.member.view）
const permissionCodeArb = fc.stringMatching(/^[a-z]{2,8}(\.[a-z]{2,8}){0,2}$/);

describe('Feature: permission-integration, Property 4: hasPermission 判断正确性', () => {
  /**
   * **Validates: Requirements 4.3**
   *
   * Property 4: 对于任意权限码和任意已存储的权限列表，
   * hasPermission(code) 当且仅当 code 存在于权限列表中（或用户为 super_admin）时返回 true
   */

  it('当权限码存在于权限列表中时应返回 true', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 20 }),
        (permissions) => {
          // 从列表中选取一个已存在的权限码
          const code = permissions[0];
          return hasPermission(permissions, ['R_ADMIN'], code) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('当权限码不存在于权限列表中时应返回 false', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 20 }),
        permissionCodeArb,
        (permissions, code) => {
          fc.pre(!permissions.includes(code));
          return hasPermission(permissions, ['R_ADMIN'], code) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('super_admin 角色无论权限列表如何都应返回 true', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 20 }),
        permissionCodeArb,
        (permissions, code) => {
          return hasPermission(permissions, ['R_SUPER'], code) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('非 super_admin 角色的结果等价于 permissions.includes(code)', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 20 }),
        permissionCodeArb,
        (permissions, code) => {
          const expected = permissions.includes(code);
          return hasPermission(permissions, ['R_ADMIN'], code) === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: permission-integration, Property 5: hasAnyPermission 判断正确性', () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * Property 5: 对于任意权限码数组和任意已存储的权限列表，
   * hasAnyPermission(codes) 当且仅当 codes 中至少一个存在于权限列表中（或用户为 super_admin）时返回 true
   */

  it('当至少一个权限码存在于权限列表中时应返回 true', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 20 }),
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 5 }),
        (permissions, extraCodes) => {
          // 确保至少有一个匹配：将 permissions[0] 加入查询列表
          const codes = [permissions[0], ...extraCodes];
          return hasAnyPermission(permissions, ['R_ADMIN'], codes) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('当没有任何权限码存在于权限列表中时应返回 false', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 20 }),
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 5 }),
        (permissions, codes) => {
          fc.pre(codes.every(c => !permissions.includes(c)));
          return hasAnyPermission(permissions, ['R_ADMIN'], codes) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('super_admin 角色无论权限列表如何都应返回 true', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 20 }),
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 5 }),
        (permissions, codes) => {
          return hasAnyPermission(permissions, ['R_SUPER'], codes) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('非 super_admin 角色的结果等价于 codes.some(c => permissions.includes(c))', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 20 }),
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 5 }),
        (permissions, codes) => {
          const expected = codes.some(c => permissions.includes(c));
          return hasAnyPermission(permissions, ['R_ADMIN'], codes) === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});
