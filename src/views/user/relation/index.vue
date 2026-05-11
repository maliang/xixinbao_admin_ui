<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NButton, NInput, NTag } from 'naive-ui';
import { searchRelation, fetchRelationParent, fetchRelationChildren, fetchRelationTeamStats } from '@/service/api';

defineOptions({ name: 'UserRelationPage' });

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 搜索 ==========
const keyword = ref('');

// ========== 最近查询 ==========
const recentQueries = ref<{ name: string; account: string }[]>([]);

// ========== 当前查询会员 ==========
const currentMember = ref<any>(null);

// ========== 上级推荐人 ==========
const parentMember = ref<any>(null);

// ========== 直接下级 ==========
const directMembers = ref<any[]>([]);

const showMoreVisible = ref(true);

// ========== 方法 ==========
async function handleSearch() {
  if (!keyword.value) return;
  loading.value = true;
  const { data, error } = await searchRelation(keyword.value);
  if (!error && data) {
    // data 可能是数组或单个对象
    const member = Array.isArray(data) ? data[0] : data;
    if (!member) {
      window.$message?.error('未找到该会员');
      currentMember.value = null;
      parentMember.value = null;
      directMembers.value = [];
      loading.value = false;
      return;
    }
    currentMember.value = member;
    // 添加到最近查询
    const exists = recentQueries.value.find(q => q.account === member.account);
    if (!exists) {
      recentQueries.value.unshift({ name: member.name, account: member.account });
      if (recentQueries.value.length > 5) recentQueries.value.pop();
    }
    // 加载团队统计
    const { data: statsData, error: statsError } = await fetchRelationTeamStats(member.id);
    if (!statsError && statsData) {
      currentMember.value.directCount = statsData.directCount || statsData.direct_count || 0;
      currentMember.value.teamCount = statsData.teamCount || statsData.team_count || 0;
    }
    // 加载上级推荐人
    const { data: parentData, error: parentError } = await fetchRelationParent(member.id);
    if (!parentError) {
      parentMember.value = parentData;
    }
    // 加载直接下级
    const { data: childrenData, error: childrenError } = await fetchRelationChildren(member.id);
    if (!childrenError) {
      directMembers.value = childrenData?.list || (Array.isArray(childrenData) ? childrenData : []);
      showMoreVisible.value = directMembers.value.length < (currentMember.value.directCount || 0);
    }
  } else {
    window.$message?.error(error?.msg || '未找到该会员');
    currentMember.value = null;
    parentMember.value = null;
    directMembers.value = [];
  }
  loading.value = false;
}

function handleReset() {
  keyword.value = '';
  currentMember.value = null;
  parentMember.value = null;
  directMembers.value = [];
}

function handleRecentClick(item: { name: string; account: string }) {
  keyword.value = item.account;
  handleSearch();
}

function handleViewParent() {
  if (parentMember.value) {
    keyword.value = parentMember.value.account;
    handleSearch();
  }
}

function handleViewChild(child: any) {
  keyword.value = child.account;
  handleSearch();
}

async function handleLoadMore() {
  if (!currentMember.value) return;
  const { data, error } = await fetchRelationChildren(currentMember.value.id, {
    page: Math.ceil(directMembers.value.length / 10) + 1
  });
  if (!error) {
    const newItems = data.list || data || [];
    directMembers.value.push(...newItems);
    if (newItems.length < 10) showMoreVisible.value = false;
  }
}

function getLevelColor(level: string) {
  if (level === 'VIP5') return '#2080f0';
  if (level === 'VIP4') return '#18a058';
  if (level === 'VIP3') return '#f0a020';
  return '#909399';
}
</script>

<template>
  <div class="p-16px">
    <!-- 搜索区域 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <h2 class="text-18px font-bold m-0 mb-16px">会员关系网络查询</h2>

      <!-- 搜索栏 -->
      <div class="flex items-center gap-8px mb-12px">
        <NInput
          v-model:value="keyword"
          placeholder="输入会员ID、姓名或手机号"
          class="flex-1"
          size="large"
        >
          <template #prefix>
            <SvgIcon icon="ph:magnifying-glass" class="op-40" />
          </template>
        </NInput>
        <NButton type="primary" size="large" @click="handleSearch">
          <SvgIcon icon="ph:magnifying-glass" class="mr-4px" />查询
        </NButton>
        <NButton size="large" @click="handleReset">
          <SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />重置
        </NButton>
      </div>

      <!-- 最近查询 -->
      <div class="flex items-center gap-8px">
        <span class="text-12px op-50 flex-shrink-0">最近查询:</span>
        <div class="flex gap-6px flex-wrap">
          <NTag
            v-for="item in recentQueries"
            :key="item.account"
            size="small"
            round
            :bordered="false"
            class="cursor-pointer recent-tag"
            @click="handleRecentClick(item)"
          >
            {{ item.name }} (账号: {{ item.account }})
          </NTag>
        </div>
      </div>
    </NCard>

    <!-- 当前查询会员 -->
    <NCard v-if="currentMember" :bordered="false" class="card-wrapper mb-16px">
      <div class="text-15px font-bold mb-16px">当前查询会员</div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-14px">
          <!-- 头像 -->
          <div class="avatar-circle avatar-lg">
            <SvgIcon icon="ph:user" class="op-40 text-20px" />
          </div>
          <!-- 信息 -->
          <div>
            <div class="flex items-center gap-8px mb-4px">
              <span class="text-16px font-bold">{{ currentMember.name || currentMember.account }}</span>
              <span class="text-13px op-50">账号: {{ currentMember.account }}</span>
            </div>
            <div class="flex items-center gap-8px">
              <span
                v-if="currentMember.level && currentMember.level.name"
                class="level-badge"
                :style="{ backgroundColor: getLevelColor(currentMember.level.name) }"
              >
                {{ currentMember.level.name }}
              </span>
              <span
                v-else-if="currentMember.levelName"
                class="level-badge"
                :style="{ backgroundColor: getLevelColor(currentMember.levelName) }"
              >
                {{ currentMember.levelName }}
              </span>
              <span class="text-12px op-50">注册时间: {{ currentMember.createdAt || '--' }}</span>
            </div>
          </div>
        </div>
        <!-- 右侧统计 -->
        <div class="flex gap-24px">
          <div class="text-center">
            <div class="text-22px font-bold text-primary">{{ currentMember.directCount }}</div>
            <div class="text-11px op-50">直接下级</div>
          </div>
          <div class="text-center">
            <div class="text-22px font-bold text-primary">{{ currentMember.teamCount }}</div>
            <div class="text-11px op-50">团队总人数</div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 上级推荐人 -->
    <NCard v-if="parentMember" :bordered="false" class="card-wrapper mb-16px">
      <div class="text-15px font-bold mb-16px">上级推荐人</div>
      <div
        class="member-row"
        @click="handleViewParent"
      >
        <div class="flex items-center gap-12px">
          <!-- 头像 -->
          <div class="avatar-circle avatar-md">
            <SvgIcon icon="ph:user" class="op-40 text-16px" />
          </div>
          <!-- 信息 -->
          <div>
            <div class="flex items-center gap-8px mb-2px">
              <span class="text-14px font-bold">{{ parentMember.name || parentMember.account }}</span>
              <span class="text-12px op-50">账号: {{ parentMember.account }}</span>
            </div>
            <div class="flex items-center gap-8px">
              <span
                v-if="parentMember.level && parentMember.level.name"
                class="level-badge"
                :style="{ backgroundColor: getLevelColor(parentMember.level.name) }"
              >
                {{ parentMember.level.name }}
              </span>
              <span
                v-else-if="parentMember.levelName"
                class="level-badge"
                :style="{ backgroundColor: getLevelColor(parentMember.levelName) }"
              >
                {{ parentMember.levelName }}
              </span>
              <span class="text-11px op-50">注册时间: {{ parentMember.createdAt || '--' }}</span>
            </div>
          </div>
        </div>
        <span class="text-16px op-30">›</span>
      </div>
    </NCard>

    <!-- 直接下级 -->
    <NCard v-if="currentMember" :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between mb-16px">
        <div class="text-15px font-bold">直接下级 ({{ currentMember.directCount || 0 }}人)</div>
        <NButton size="small" quaternary>
          <SvgIcon icon="ph:arrows-down-up" class="mr-4px" />排序
        </NButton>
      </div>

      <!-- 下级列表 -->
      <div class="flex flex-col">
        <div
          v-for="child in directMembers"
          :key="child.account"
          class="member-row"
          @click="handleViewChild(child)"
        >
          <div class="flex items-center gap-12px">
            <!-- 头像 -->
            <div class="avatar-circle avatar-md">
              <SvgIcon icon="ph:user" class="op-40 text-16px" />
            </div>
            <!-- 信息 -->
            <div>
              <div class="flex items-center gap-8px mb-2px">
                <span class="text-14px font-bold">{{ child.name || child.account }}</span>
                <span class="text-12px op-50">账号: {{ child.account }}</span>
              </div>
              <div class="flex items-center gap-8px">
                <span
                  v-if="child.level && child.level.name"
                  class="level-badge"
                  :style="{ backgroundColor: getLevelColor(child.level.name) }"
                >
                  {{ child.level.name }}
                </span>
                <span
                  v-else-if="child.levelName"
                  class="level-badge"
                  :style="{ backgroundColor: getLevelColor(child.levelName) }"
                >
                  {{ child.levelName }}
                </span>
                <span class="text-11px op-50">注册时间: {{ child.createdAt || '--' }}</span>
                <span class="flex items-center op-50 ml-4px">
                  <SvgIcon icon="ph:users" class="text-14px mr-6px" />
                  <span class="text-12px">{{ child.subCount || 0 }}人</span>
                </span>
              </div>
            </div>
          </div>
          <span class="text-16px op-30">›</span>
        </div>
      </div>

      <!-- 查看更多 -->
      <div
        v-if="showMoreVisible"
        class="text-center py-12px mt-8px cursor-pointer"
        @click="handleLoadMore"
      >
        <span class="text-13px text-primary">⌄ 查看更多</span>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
/* 头像 */
.avatar-circle {
  border-radius: 50%;
  background-color: #e8e8ec;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-lg {
  width: 56px;
  height: 56px;
}

.avatar-md {
  width: 44px;
  height: 44px;
}

/* 等级标签 */
.level-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
  font-weight: 500;
}

/* 会员行 */
.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.member-row:hover {
  background-color: #f8f8fa;
}

/* 统计数字颜色 */
.text-primary {
  color: #2080f0;
}

/* 最近查询标签 */
.recent-tag {
  background-color: #f0f0f5 !important;
}

.recent-tag:hover {
  background-color: #e8e8ec !important;
}
</style>
