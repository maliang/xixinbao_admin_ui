<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  NCard, NButton, NSwitch, NInput, NRadio, NRadioGroup, NInputNumber, NTimePicker
} from 'naive-ui';
import { fetchCheckinSettings, saveCheckinSettings } from '@/service/api';

defineOptions({ name: 'UserCheckinPage' });

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 基础设置 ==========
const checkinEnabled = ref(true);

// ========== 时间与周期设置 ==========
interface TimeSlot {
  id: number;
  startTime: number | null;
  endTime: number | null;
}

let slotIdCounter = 1;
const timeSlots = ref<TimeSlot[]>([]);

function addTimeSlot() {
  timeSlots.value.push({ id: slotIdCounter++, startTime: getDefaultStart(), endTime: getDefaultEnd() });
}

function removeTimeSlot(id: number) {
  const idx = timeSlots.value.findIndex(s => s.id === id);
  if (idx !== -1) timeSlots.value.splice(idx, 1);
}

// 时间字符串 "HH:mm" 转当天的毫秒时间戳
function timeStrToMs(str: string): number | null {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}
// 毫秒时间戳转 "HH:mm"
function msToTimeStr(ms: number | null): string {
  if (ms === null || ms === undefined) return '00:00';
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getDefaultStart(): number {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}
function getDefaultEnd(): number {
  const d = new Date(); d.setHours(23, 59, 0, 0); return d.getTime();
}

// 连续签到规则
const consecutiveRule = ref('reset');

// 主页访问控制
const homepageRule = ref('immediate');
const requiredDays = ref(3);

const previewText = computed(() => {
  if (homepageRule.value === 'immediate') return '';
  return `预览提示文案: "用户需连续签到 ${requiredDays.value} 天后方可进入主页"`;
});

// ========== 奖励规则配置 ==========
const rewardType = ref<'amount' | 'points'>('amount');

interface RewardRule {
  id: number;
  dayLabel: string;
  reward: number | null;
  randomMin: number | null;
  randomMax: number | null;
}

let ruleIdCounter = 1;
const rewardRules = ref<RewardRule[]>([]);

function addRewardRule() {
  const nextDay = rewardRules.value.length + 1;
  rewardRules.value.push({
    id: ruleIdCounter++,
    dayLabel: `第${nextDay}天`,
    reward: null,
    randomMin: 0,
    randomMax: 0
  });
}

function removeRewardRule(id: number) {
  const idx = rewardRules.value.findIndex(r => r.id === id);
  if (idx !== -1) rewardRules.value.splice(idx, 1);
}

// ========== 累计签到奖励配置 ==========
const cumulativeRewardType = ref<'amount' | 'points'>('amount');

interface CumulativeRewardRule {
  day: number | null;
  reward: number | null;
}

const cumulativeRules = ref<CumulativeRewardRule[]>([
  { day: null, reward: null },
  { day: null, reward: null },
  { day: null, reward: null },
  { day: null, reward: null },
  { day: null, reward: null },
  { day: null, reward: null },
  { day: null, reward: null }
]);

function allowOnlyDigits(value: string) {
  return !value || /^\d*$/.test(value);
}

// ========== 加载设置 ==========
async function loadSettings() {
  loading.value = true;
  const { data, error } = await fetchCheckinSettings();
  loading.value = false;
  if (!error && data) {
    // 后端返回 { settings: {...}, timeSlots: [...], rewards: [...] }
    const s = data.settings || data || {};
    checkinEnabled.value = s.enabled ?? true;
    consecutiveRule.value = s.consecutiveRule || 'reset';
    homepageRule.value = s.homepageRule || 'immediate';
    requiredDays.value = s.requiredDays || 3;
    rewardType.value = s.rewardType || 'amount';

    const slots = data.timeSlots || [];
    if (slots.length) {
      timeSlots.value = slots.map((sl: any, i: number) => ({
        id: i + 1,
        startTime: timeStrToMs(sl.startTime || '00:00'),
        endTime: timeStrToMs(sl.endTime || '23:59')
      }));
      slotIdCounter = timeSlots.value.length + 1;
    } else {
      timeSlots.value = [{ id: 1, startTime: getDefaultStart(), endTime: getDefaultEnd() }];
      slotIdCounter = 2;
    }

    const rules = data.rewards || [];
    if (rules.length) {
      rewardRules.value = rules.map((r: any, i: number) => ({
        id: i + 1,
        dayLabel: r.dayLabel || `第${r.dayNumber || i + 1}天`,
        reward: r.rewardAmount ?? r.reward ?? null,
        randomMin: r.randomMin ?? 0,
        randomMax: r.randomMax ?? 0
      }));
      ruleIdCounter = rewardRules.value.length + 1;
    }

    // 累计签到奖励
    const cumulative = data.cumulativeRewards || [];
    cumulativeRewardType.value = s.cumulativeRewardType || 'amount';
    if (cumulative.length) {
      for (let i = 0; i < 7; i++) {
        if (cumulative[i]) {
          cumulativeRules.value[i] = {
            day: cumulative[i].day ?? null,
            reward: cumulative[i].reward ?? null
          };
        }
      }
    }
  }
}

onMounted(() => { loadSettings(); });

// ========== 构建保存数据 ==========
function buildPayload() {
  return {
    settings: {
      enabled: checkinEnabled.value,
      consecutiveRule: consecutiveRule.value,
      homepageRule: homepageRule.value,
      requiredDays: requiredDays.value,
      rewardType: rewardType.value,
      cumulativeRewardType: cumulativeRewardType.value,
    },
    timeSlots: timeSlots.value.map(s => ({
      startTime: msToTimeStr(s.startTime),
      endTime: msToTimeStr(s.endTime)
    })),
    rewards: rewardRules.value.map((r, i) => ({
      dayNumber: i + 1,
      rewardAmount: r.reward,
      randomMin: r.randomMin,
      randomMax: r.randomMax
    })),
    cumulativeRewards: cumulativeRules.value
      .filter(r => r.day !== null && r.reward !== null)
      .map(r => ({ day: r.day, reward: r.reward }))
  };
}

// ========== 保存草稿（不启用） ==========
async function handleSaveDraft() {
  const payload = buildPayload();
  payload.settings.enabled = false;
  const { error } = await saveCheckinSettings(payload);
  if (!error) {
    window.$message?.success('草稿已保存');
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}

// ========== 发布生效 ==========
async function handlePublish() {
  const payload = buildPayload();
  const { error } = await saveCheckinSettings(payload);
  if (!error) {
    window.$message?.success('操作成功');
  } else {
    window.$message?.error(error?.msg || '操作失败');
  }
}
</script>

<template>
  <div class="p-16px">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between mb-20px">
      <h2 class="text-18px font-bold m-0">签到管理设置</h2>
    </div>

    <!-- 基础设置 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <div class="text-16px font-bold mb-16px">基础设置</div>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-14px font-500">签到功能总开关</div>
          <div class="text-12px op-50 mt-2px">开启后用户可在APP/网页端进行签到</div>
        </div>
        <NSwitch v-model:value="checkinEnabled" />
      </div>
    </NCard>

    <!-- 时间与周期设置 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <div class="text-16px font-bold mb-20px">时间与周期设置</div>

      <!-- 每日签到时段 -->
      <div class="mb-24px">
        <div class="text-14px font-500 mb-12px">每日签到时段</div>
        <div class="flex flex-col gap-10px">
          <div v-for="(slot, idx) in timeSlots" :key="slot.id" class="flex items-center gap-8px">
            <NTimePicker v-model:value="slot.startTime" format="HH:mm" class="w-120px" size="small" />
            <span class="text-13px op-60">至</span>
            <NTimePicker v-model:value="slot.endTime" format="HH:mm" class="w-120px" size="small" />
            <!-- 第一行显示添加按钮，其他行显示删除按钮 -->
            <template v-if="idx === 0">
              <a class="text-13px text-primary cursor-pointer ml-8px" @click="addTimeSlot">+ 添加时段</a>
            </template>
            <template v-else>
              <a class="text-13px text-error cursor-pointer ml-8px" @click="removeTimeSlot(slot.id)"><SvgIcon icon="ph:trash" class="mr-2px" />删除</a>
            </template>
          </div>
        </div>
      </div>

      <!-- 连续签到规则 -->
      <div class="mb-24px">
        <div class="text-14px font-500 mb-10px">连续签到规则</div>
        <NRadioGroup v-model:value="consecutiveRule">
          <NRadio value="reset">中断后重新计算</NRadio>
          <NRadio value="allow_makeup" class="ml-12px">允许补签保持连续</NRadio>
        </NRadioGroup>
      </div>

      <!-- 主页访问控制 -->
      <div>
        <div class="text-14px font-500 mb-10px">主页访问控制</div>
        <div class="flex items-center gap-8px mb-10px">
          <NRadioGroup v-model:value="homepageRule" class="flex items-center">
            <NRadio value="immediate">立即显示主页面</NRadio>
            <NRadio value="after_days" class="ml-12px">累计签到</NRadio>
          </NRadioGroup>
          <template v-if="homepageRule === 'after_days'">
            <NInputNumber
              v-model:value="requiredDays"
              :min="1"
              size="small"
              class="w-70px"
              :show-button="false"
            />
            <span class="text-13px">天后显示主页面</span>
          </template>
        </div>
        <div v-if="homepageRule === 'after_days' && previewText" class="preview-box">
          {{ previewText }}
        </div>
      </div>
    </NCard>

    <!-- 奖励规则配置 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <div class="text-16px font-bold mb-20px">奖励规则配置</div>

      <!-- 奖励类型 -->
      <div class="mb-16px">
        <div class="text-14px font-500 mb-10px">奖励类型</div>
        <div class="method-switch">
          <button
            class="method-btn"
            :class="{ active: rewardType === 'amount' }"
            @click="rewardType = 'amount'"
          >
            赠送金额
          </button>
          <button
            class="method-btn"
            :class="{ active: rewardType === 'points' }"
            @click="rewardType = 'points'"
          >
            赠送积分
          </button>
        </div>
      </div>

      <!-- 奖励规则表格 -->
      <div class="overflow-x-auto">
        <table class="reward-table">
          <thead>
            <tr>
              <th>连续天数</th>
              <th>{{ rewardType === 'amount' ? '奖励金额' : '奖励积分' }}</th>
              <th>随机范围</th>
              <th class="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rewardRules" :key="rule.id">
              <td>{{ rule.dayLabel }}</td>
              <td>
                <NInputNumber
                  v-model:value="rule.reward"
                  :min="0"
                  size="small"
                  class="w-80px"
                  :show-button="false"
                />
              </td>
              <td>
                <div class="flex items-center gap-6px">
                  <NInputNumber
                    v-model:value="rule.randomMin"
                    :min="0"
                    size="small"
                    class="w-70px"
                    :show-button="false"
                  />
                  <span class="text-13px op-60">至</span>
                  <NInputNumber
                    v-model:value="rule.randomMax"
                    :min="0"
                    size="small"
                    class="w-70px"
                    :show-button="false"
                  />
                </div>
              </td>
              <td class="col-action">
                <span class="text-error cursor-pointer text-16px" @click="removeRewardRule(rule.id)"><SvgIcon icon="ph:trash" /></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 添加奖励规则 -->
      <NButton type="primary" class="mt-16px" @click="addRewardRule">
        + 添加奖励规则
      </NButton>
    </NCard>

    <!-- 累计签到奖励配置 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <div class="text-16px font-bold mb-20px">累计签到奖励配置</div>

      <!-- 奖励类型 -->
      <div class="mb-16px">
        <div class="text-14px font-500 mb-10px">奖励类型</div>
        <div class="method-switch">
          <button
            class="method-btn"
            :class="{ active: cumulativeRewardType === 'amount' }"
            @click="cumulativeRewardType = 'amount'"
          >
            赠送金额
          </button>
          <button
            class="method-btn"
            :class="{ active: cumulativeRewardType === 'points' }"
            @click="cumulativeRewardType = 'points'"
          >
            赠送积分
          </button>
        </div>
      </div>

      <!-- 累计奖励规则（固定7行） -->
      <div class="flex flex-col gap-12px">
        <div v-for="(rule, idx) in cumulativeRules" :key="idx" class="flex items-center gap-10px">
          <span class="text-13px" style="flex-shrink: 0;">第</span>
          <NInput
            v-model:value="rule.day"
            autosize
            :allow-input="allowOnlyDigits"
            size="small"
            class="w-60px"
            placeholder=""
          />
          <span class="text-13px" style="flex-shrink: 0;">天</span>
          <span class="text-13px op-50 ml-12px" style="flex-shrink: 0;">{{ cumulativeRewardType === 'amount' ? '奖励金额' : '奖励积分' }}</span>
          <NInput
            v-model:value="rule.reward"
            autosize
            :allow-input="allowOnlyDigits"
            size="small"
            class="w-100px"
            placeholder=""
          />
          <span class="text-13px op-50">{{ cumulativeRewardType === 'amount' ? '元' : '积分' }}</span>
        </div>
      </div>
    </NCard>

    <!-- 底部操作栏 -->
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex justify-end gap-8px">
        <NButton @click="loadSettings">取消</NButton>
        <NButton v-permission="'user.checkin.edit'" @click="handleSaveDraft">保存草稿</NButton>
        <NButton v-permission="'user.checkin.edit'" type="primary" @click="handlePublish">发布生效</NButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.text-primary { color: #2080f0; }
.text-error { color: #d03050; }

/* 预览提示框 */
.preview-box {
  background-color: #fff8e6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: #8a6d3b;
  margin-top: 8px;
}

/* 收款方式切换 */
.method-switch {
  display: inline-flex;
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  overflow: hidden;
}

.method-btn {
  padding: 7px 20px;
  font-size: 13px;
  border: none;
  background: #fff;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;
}

.method-btn.active {
  background: #2080f0;
  color: #fff;
}

.method-btn:not(.active):hover {
  background: #f5f5f8;
}

/* 奖励规则表格 */
.reward-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.reward-table thead th {
  text-align: left;
  padding: 12px 10px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid #efeff5;
  font-size: 13px;
}

.reward-table tbody td {
  padding: 14px 10px;
  border-bottom: 1px solid #f5f5f8;
  color: rgba(0, 0, 0, 0.75);
  vertical-align: middle;
}

.reward-table tbody tr:hover {
  background-color: #fafafa;
}

.reward-table .col-action {
  width: 60px;
  text-align: center !important;
}
</style>
