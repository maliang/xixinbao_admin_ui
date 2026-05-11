<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NInput, NSwitch, NDatePicker, NButton, NSelect } from 'naive-ui';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { fetchSettings, saveSettings } from '@/service/api';

const form = ref({
  spin_enabled: true,
  spin_free_spins: '1',
  spin_points_per_spin: '100',
  spin_end_date: null as number | null
});

const prizeTypeOptions = [
  { label: '无', value: 'none' },
  { label: '积分', value: 'points' },
  { label: '现金', value: 'cash' },
  { label: '实物', value: 'physical' }
];

interface PrizeItem {
  position: number;
  name: string;
  type: string;
  image: string;
  value: string;
  probability: string;
}

const defaultPrizes: PrizeItem[] = Array.from({ length: 8 }, (_, i) => ({
  position: i + 1,
  name: '',
  type: 'none',
  image: '',
  value: '0',
  probability: '0'
}));

const prizes = ref<PrizeItem[]>([...defaultPrizes]);

async function loadData() {
  const { data, error } = await fetchSettings();
  if (!error && data) {
    const spin = data.spin || {};
    form.value.spin_enabled = spin.spinEnabled === '1' || spin.spinEnabled === 'true';
    form.value.spin_free_spins = spin.spinFreeSpins || '1';
    form.value.spin_points_per_spin = spin.spinPointsPerSpin || '100';
    if (spin.spinEndDate) {
      form.value.spin_end_date = new Date(spin.spinEndDate).getTime();
    }
    if (spin.spinPrizes) {
      try {
        const parsed = JSON.parse(spin.spinPrizes);
        if (Array.isArray(parsed) && parsed.length === 8) {
          prizes.value = parsed;
        }
      } catch (e) { /* 使用默认值 */ }
    }
  }
}

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function handleSave() {
  // 校验概率总和
  const totalProb = prizes.value.reduce((s, p) => s + Number(p.probability || 0), 0);
  if (totalProb !== 100) {
    window.$message?.warning(`中奖概率总和必须等于100%，当前为 ${totalProb}%`);
    return;
  }

  const items = [
    { group: 'spin', key: 'spin_enabled', value: form.value.spin_enabled ? '1' : '0' },
    { group: 'spin', key: 'spin_free_spins', value: form.value.spin_free_spins },
    { group: 'spin', key: 'spin_points_per_spin', value: form.value.spin_points_per_spin },
    { group: 'spin', key: 'spin_end_date', value: form.value.spin_end_date ? toLocalDateStr(form.value.spin_end_date) : '' },
    { group: 'spin', key: 'spin_prizes', value: JSON.stringify(prizes.value) }
  ];
  const { error } = await saveSettings(items);
  if (!error) {
    window.$message?.success('保存成功');
  } else {
    window.$message?.error('保存失败');
  }
}

onMounted(() => { loadData(); });
</script>

<template>
  <div>
    <!-- 幸运转盘活动状态 -->
    <div class="config-card mb-20px">
      <div class="flex items-center justify-between mb-16px">
        <h4 class="font-bold text-15px">幸运转盘活动状态</h4>
        <NSwitch v-model:value="form.spin_enabled" />
      </div>
      <div class="grid grid-cols-3 gap-16px">
        <div><div class="field-label">每日免费抽奖次数</div><NInput v-model:value="form.spin_free_spins" /></div>
        <div><div class="field-label">消耗积分抽奖(次)</div><NInput v-model:value="form.spin_points_per_spin" /></div>
        <div><div class="field-label">活动结束时间</div><NDatePicker v-model:value="form.spin_end_date" type="date" class="w-full" /></div>
      </div>
    </div>

    <!-- 奖品配置 -->
    <div class="config-card mb-24px">
      <div class="flex items-center justify-between mb-12px">
        <h4 class="font-bold text-15px">奖品配置</h4>
        <span class="text-12px op-50">总中奖概率需等于 100% (当前: {{ prizes.reduce((s, p) => s + Number(p.probability), 0) }}%)</span>
      </div>
      <table class="prize-table">
        <thead>
          <tr>
            <th style="width:50px">位置</th>
            <th>奖品名称</th>
            <th style="width:110px">奖品类型</th>
            <th style="width:80px">奖品图片</th>
            <th style="width:90px">价值/数量</th>
            <th style="width:100px">中奖概率(%)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in prizes" :key="p.position">
            <td class="text-center">{{ p.position }}</td>
            <td><NInput v-model:value="p.name" size="small" /></td>
            <td>
              <NSelect v-model:value="p.type" :options="prizeTypeOptions" size="small" />
            </td>
            <td>
              <ImageUpload v-model="p.image" width="40px" height="40px" />
            </td>
            <td><NInput v-model:value="p.value" size="small" /></td>
            <td><NInput v-model:value="p.probability" size="small" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex justify-end"><NButton type="primary" @click="handleSave">保存全部设置</NButton></div>
  </div>
</template>

<style scoped>
.config-card { background: #f9fafb; border-radius: 8px; padding: 20px 24px; }
.field-label { font-size: 13px; color: #333; font-weight: 500; margin-bottom: 6px; }
.prize-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.prize-table th { text-align: left; padding: 10px 12px; color: #666; font-weight: 500; border-bottom: 1px solid #eee; }
.prize-table td { padding: 8px 12px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
</style>
