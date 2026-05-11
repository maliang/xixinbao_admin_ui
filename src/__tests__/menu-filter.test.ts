import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 提取菜单过滤纯函数逻辑（与 route/shared.ts 中 filterAuthRoutesByPermissions 一致）
 */
interface SimpleRoute {
  name: string;
  meta?: {
    permissions?: string[];
  };
  children?: SimpleRoute[];
}

function filterAuthRoutesByPermissions(
  routes: SimpleRoute[],
  permissions: string[],
  isSuperAdmin: boolean
): SimpleRoute[] {
  if (isSuperAdmin) return routes;
  return routes.flatMap(route => filterRouteByPermissions(route, permissions));
}

function filterRouteByPermissions(route: SimpleRoute, permissions: string[]): SimpleRoute[] {
  const routePermissions = route.meta?.permissions || [];
  const isEmptyPermissions = !routePermissions.length;
  const hasPermission = routePermissions.some(p => permissions.includes(p));

  const filterRoute = { ...route };

  if (filterRoute.children?.length) {
    filterRoute.children = filterRoute.children.flatMap(item =>
      filterRouteByPermissions(item, permissions)
    );
  }

  // 父级菜单所有子菜单被移除时，移除父级
  if (filterRoute.children?.length === 0 && route.children?.length) {
    return [];
  }

  return hasPermission || isEmptyPermissions ? [filterRoute] : [];
}

/** 收集过滤结果中所有叶子路由 */
function collectAllRoutes(routes: SimpleRoute[]): SimpleRoute[] {
  const result: SimpleRoute[] = [];
  for (const route of routes) {
    result.push(route);
    if (route.children?.length) {
      result.push(...collectAllRoutes(route.children));
    }
  }
  return result;
}

// 权限码生成器
const permissionCodeArb = fc.stringMatching(/^[a-z]{2,6}(\.[a-z]{2,6}){0,2}$/);

// 叶子路由生成器（无子路由）
const leafRouteArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 10 }),
  meta: fc.record({
    permissions: fc.array(permissionCodeArb, { minLength: 0, maxLength: 3 }),
  }),
});

// 带子路由的父级路由生成器（最多两层）
const parentRouteArb: fc.Arbitrary<SimpleRoute> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 10 }),
  meta: fc.record({
    permissions: fc.array(permissionCodeArb, { minLength: 0, maxLength: 2 }),
  }),
  children: fc.array(leafRouteArb, { minLength: 1, maxLength: 5 }),
});

// 混合路由树生成器
const routeTreeArb = fc.array(
  fc.oneof(leafRouteArb, parentRouteArb),
  { minLength: 1, maxLength: 8 }
);

describe('Feature: permission-integration, Property 6: 菜单权限过滤正确性', () => {
  /**
   * **Validates: Requirements 5.1, 5.2, 5.3**
   *
   * Property 6: 对于任意路由树和任意用户权限列表，
   * 过滤后的菜单仅包含 permissions meta 为空或至少有一个权限码存在于用户权限列表中的路由
   */

  it('过滤结果中的每个路由要么 permissions 为空，要么至少有一个权限码匹配', () => {
    fc.assert(
      fc.property(
        routeTreeArb,
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 10 }),
        (routes, userPermissions) => {
          const filtered = filterAuthRoutesByPermissions(routes, userPermissions, false);
          const allRoutes = collectAllRoutes(filtered);

          return allRoutes.every(route => {
            const routePerms = route.meta?.permissions || [];
            if (routePerms.length === 0) return true;
            return routePerms.some(p => userPermissions.includes(p));
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('super_admin 应返回完整的路由树（不过滤）', () => {
    fc.assert(
      fc.property(
        routeTreeArb,
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 5 }),
        (routes, userPermissions) => {
          const filtered = filterAuthRoutesByPermissions(routes, userPermissions, true);
          // super_admin 返回原始路由树
          return filtered === routes;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('permissions 为空的路由始终保留在过滤结果中（无子路由时）', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 10 }),
        (userPermissions) => {
          const routes: SimpleRoute[] = [
            { name: 'open-route', meta: { permissions: [] } },
          ];
          const filtered = filterAuthRoutesByPermissions(routes, userPermissions, false);
          return filtered.length === 1 && filtered[0].name === 'open-route';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('用户拥有路由所需权限中的任一个即可保留该路由', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 5 }),
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 5 }),
        (routePerms, extraUserPerms) => {
          // 确保用户拥有路由所需权限中的第一个
          const userPermissions = [routePerms[0], ...extraUserPerms];
          const routes: SimpleRoute[] = [
            { name: 'protected-route', meta: { permissions: routePerms } },
          ];
          const filtered = filterAuthRoutesByPermissions(routes, userPermissions, false);
          return filtered.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: permission-integration, Property 7: 父级菜单递归移除', () => {
  /**
   * **Validates: Requirements 5.4**
   *
   * Property 7: 对于任意父级路由，当其所有子路由都被过滤掉（没有匹配权限）时，
   * 父级路由本身也应从过滤结果中移除
   */

  it('当所有子路由都无匹配权限时，父级路由应被移除', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 3 }),
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 3 }),
        fc.array(permissionCodeArb, { minLength: 0, maxLength: 5 }),
        (childPerms1, childPerms2, userPermissions) => {
          // 确保用户权限与子路由权限完全不匹配
          fc.pre(childPerms1.every(p => !userPermissions.includes(p)));
          fc.pre(childPerms2.every(p => !userPermissions.includes(p)));

          const routes: SimpleRoute[] = [
            {
              name: 'parent',
              meta: { permissions: [] }, // 父级本身无权限要求
              children: [
                { name: 'child1', meta: { permissions: childPerms1 } },
                { name: 'child2', meta: { permissions: childPerms2 } },
              ],
            },
          ];

          const filtered = filterAuthRoutesByPermissions(routes, userPermissions, false);
          // 父级应被移除，因为所有子路由都被过滤掉了
          return filtered.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('当至少一个子路由有匹配权限时，父级路由应保留', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 3 }),
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 3 }),
        (childPerms, extraUserPerms) => {
          // 确保用户拥有第一个子路由的权限
          const userPermissions = [childPerms[0], ...extraUserPerms];

          const routes: SimpleRoute[] = [
            {
              name: 'parent',
              meta: { permissions: [] },
              children: [
                { name: 'child-match', meta: { permissions: childPerms } },
                { name: 'child-no-match', meta: { permissions: ['zzz.zzz.zzz'] } },
              ],
            },
          ];

          fc.pre(!userPermissions.includes('zzz.zzz.zzz'));

          const filtered = filterAuthRoutesByPermissions(routes, userPermissions, false);
          // 父级应保留
          return filtered.length === 1 && filtered[0].name === 'parent';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('过滤后保留的父级路由的 children 中不包含无权限的子路由', () => {
    fc.assert(
      fc.property(
        fc.array(permissionCodeArb, { minLength: 1, maxLength: 3 }),
        (matchPerms) => {
          const userPermissions = [matchPerms[0]];

          const routes: SimpleRoute[] = [
            {
              name: 'parent',
              meta: { permissions: [] },
              children: [
                { name: 'child-match', meta: { permissions: matchPerms } },
                { name: 'child-no-match', meta: { permissions: ['zzz.zzz.zzz'] } },
              ],
            },
          ];

          const filtered = filterAuthRoutesByPermissions(routes, userPermissions, false);
          if (filtered.length === 0) return true;

          const parent = filtered[0];
          // 保留的子路由中不应包含无权限的子路由
          return (parent.children || []).every(child => {
            const perms = child.meta?.permissions || [];
            return perms.length === 0 || perms.some(p => userPermissions.includes(p));
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
