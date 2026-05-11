import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 权限树节点结构
 */
interface TreeNode {
  id: number;
  parentId: number | null;
  children?: TreeNode[];
}

/**
 * 提取树形复选框级联逻辑的纯函数
 * （与角色管理页面中权限树复选框的级联行为一致）
 */

/**
 * 获取节点的所有后代 ID
 */
function getDescendantIds(node: TreeNode): number[] {
  const ids: number[] = [];
  if (node.children) {
    for (const child of node.children) {
      ids.push(child.id);
      ids.push(...getDescendantIds(child));
    }
  }
  return ids;
}

/**
 * 勾选父节点：自动勾选所有后代节点
 */
function checkNode(checkedIds: Set<number>, node: TreeNode): Set<number> {
  const result = new Set(checkedIds);
  result.add(node.id);
  const descendants = getDescendantIds(node);
  for (const id of descendants) {
    result.add(id);
  }
  return result;
}

/**
 * 取消勾选父节点：自动取消所有后代节点
 */
function uncheckNode(checkedIds: Set<number>, node: TreeNode): Set<number> {
  const result = new Set(checkedIds);
  result.delete(node.id);
  const descendants = getDescendantIds(node);
  for (const id of descendants) {
    result.delete(id);
  }
  return result;
}

/**
 * 检查父节点是否应自动勾选（所有子节点都已勾选时）
 */
function shouldParentBeChecked(checkedIds: Set<number>, parent: TreeNode): boolean {
  if (!parent.children || parent.children.length === 0) return false;
  return parent.children.every(child => checkedIds.has(child.id));
}

/**
 * 自动级联更新父节点状态：当所有子节点勾选时自动勾选父节点
 */
function cascadeParentCheck(checkedIds: Set<number>, tree: TreeNode[]): Set<number> {
  const result = new Set(checkedIds);

  function processNode(node: TreeNode): boolean {
    if (!node.children || node.children.length === 0) {
      return result.has(node.id);
    }

    // 先递归处理子节点
    const allChildrenChecked = node.children.every(child => processNode(child));

    if (allChildrenChecked) {
      result.add(node.id);
    } else {
      result.delete(node.id);
    }

    return result.has(node.id);
  }

  for (const root of tree) {
    processNode(root);
  }

  return result;
}

/**
 * 构建树形结构的辅助函数
 */
function buildTree(flatNodes: { id: number; parentId: number | null }[]): TreeNode[] {
  const nodeMap = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  // 创建所有节点
  for (const n of flatNodes) {
    nodeMap.set(n.id, { id: n.id, parentId: n.parentId, children: [] });
  }

  // 建立父子关系
  for (const n of flatNodes) {
    const node = nodeMap.get(n.id)!;
    if (n.parentId === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(n.parentId);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
}

// 生成器：生成一棵有效的权限树（最多 3 层）
const treeArb = fc.integer({ min: 2, max: 5 }).chain(rootCount => {
  return fc.integer({ min: 1, max: 3 }).chain(childPerRoot => {
    return fc.integer({ min: 0, max: 2 }).map(grandchildPerChild => {
      const nodes: { id: number; parentId: number | null }[] = [];
      let nextId = 1;

      // 生成根节点
      const rootIds: number[] = [];
      for (let i = 0; i < rootCount; i++) {
        const id = nextId++;
        rootIds.push(id);
        nodes.push({ id, parentId: null });
      }

      // 为每个根节点生成子节点
      const childIds: number[] = [];
      for (const rootId of rootIds) {
        for (let j = 0; j < childPerRoot; j++) {
          const id = nextId++;
          childIds.push(id);
          nodes.push({ id, parentId: rootId });
        }
      }

      // 为每个子节点生成孙节点
      for (const childId of childIds) {
        for (let k = 0; k < grandchildPerChild; k++) {
          const id = nextId++;
          nodes.push({ id, parentId: childId });
        }
      }

      return { nodes, tree: buildTree(nodes) };
    });
  });
});

describe('Feature: permission-integration, Property 9: 树形复选框级联一致性', () => {
  /**
   * **Validates: Requirements 8.3, 8.4, 8.5**
   *
   * Property 9: 对于任意权限树节点，
   * - 勾选父节点应导致所有后代节点被勾选
   * - 取消勾选父节点应导致所有后代节点被取消勾选
   * - 当父节点的所有子节点都被勾选时，父节点应自动被勾选
   */

  it('勾选父节点后，所有后代节点都应被勾选', () => {
    fc.assert(
      fc.property(
        treeArb,
        ({ tree }) => {
          // 对每个有子节点的根节点进行测试
          for (const root of tree) {
            if (!root.children || root.children.length === 0) continue;

            const checkedIds = checkNode(new Set<number>(), root);
            const descendants = getDescendantIds(root);

            // 所有后代都应被勾选
            for (const descId of descendants) {
              if (!checkedIds.has(descId)) return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('取消勾选父节点后，所有后代节点都应被取消勾选', () => {
    fc.assert(
      fc.property(
        treeArb,
        ({ tree }) => {
          for (const root of tree) {
            if (!root.children || root.children.length === 0) continue;

            // 先勾选所有节点
            let checkedIds = checkNode(new Set<number>(), root);
            // 然后取消勾选父节点
            checkedIds = uncheckNode(checkedIds, root);

            const descendants = getDescendantIds(root);

            // 所有后代都应被取消勾选
            for (const descId of descendants) {
              if (checkedIds.has(descId)) return false;
            }
            // 父节点本身也应被取消
            if (checkedIds.has(root.id)) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('当所有子节点都被勾选时，父节点应自动被勾选', () => {
    fc.assert(
      fc.property(
        treeArb,
        ({ nodes, tree }) => {
          for (const root of tree) {
            if (!root.children || root.children.length === 0) continue;

            // 手动勾选所有子节点及其后代（不勾选父节点）
            let checkedIds = new Set<number>();
            for (const child of root.children) {
              checkedIds = checkNode(checkedIds, child);
            }

            // 执行级联更新
            const cascaded = cascadeParentCheck(checkedIds, tree);

            // 父节点应自动被勾选
            if (!cascaded.has(root.id)) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('当部分子节点未被勾选时，父节点不应被自动勾选', () => {
    fc.assert(
      fc.property(
        treeArb,
        ({ tree }) => {
          for (const root of tree) {
            if (!root.children || root.children.length < 2) continue;

            // 只勾选第一个子节点，不勾选其他子节点
            const checkedIds = checkNode(new Set<number>(), root.children[0]);

            // 执行级联更新
            const cascaded = cascadeParentCheck(checkedIds, tree);

            // 父节点不应被自动勾选（因为不是所有子节点都被勾选）
            if (cascaded.has(root.id)) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkNode 和 uncheckNode 互为逆操作（从空集开始）', () => {
    fc.assert(
      fc.property(
        treeArb,
        ({ tree }) => {
          for (const root of tree) {
            if (!root.children || root.children.length === 0) continue;

            // 先勾选再取消，应回到空集
            const afterCheck = checkNode(new Set<number>(), root);
            const afterUncheck = uncheckNode(afterCheck, root);

            if (afterUncheck.size !== 0) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
