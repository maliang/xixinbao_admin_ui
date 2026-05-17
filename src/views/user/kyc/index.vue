<script setup lang="ts">
import { ref, h, onMounted, watch, computed } from 'vue';
import {
  NCard, NButton, NInput, NSelect, NDatePicker, NRadio, NRadioGroup,
  NPagination, NCollapse, NCollapseItem, NGrid, NGridItem,
  NModal, NSpace, NDataTable, NTag, NImage, useDialog
} from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchKycList, reviewKyc, deleteKyc, fetchAgents } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';

defineOptions({ name: 'UserKycPage' });

const dialog = useDialog();
const authStore = useAuthStore();

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 筛选 ==========
const searchForm = ref({
  account: '',
  name: '',
  idNumber: '',
  status: null as string | null,
  agentId: null as string | null,
  dateStart: null as number | null,
  dateEnd: null as number | null
});

// 代理选项
const agentOptions = ref<{ label: string; value: string }[]>([{ label: $t('biz.user.kyc.allAgents'), value: '' }]);
async function loadAgentOptions() {
  const { data, error } = await fetchAgents({ pageSize: 200 });
  if (!error && data) {
    const list = data.list || [];
    agentOptions.value = [
      { label: $t('biz.user.kyc.allAgents'), value: '' },
      ...list.map((a: any) => ({ label: `${a.account} (${a.name || a.inviteCode})`, value: String(a.id) }))
    ];
  }
}

const statusOptions = [
  { label: $t('biz.common.all'), value: null },
  { label: $t('biz.common.pending'), value: '1' },
  { label: $t('biz.common.approved'), value: '2' },
  { label: $t('biz.common.rejected'), value: '3' }
];

function handleReset() {
  searchForm.value = { account: '', name: '', idNumber: '', status: null, agentId: null, dateStart: null, dateEnd: null };
  currentPage.value = 1;
  loadData();
}

/** 将时间戳转为本地日期字符串 YYYY-MM-DD（避免 UTC 偏移导致日期差一天） */
function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ========== 分页 ==========
const currentPage = ref(1);
const pageSize = 10;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize));

// ========== 数据 ==========
interface KycRecord {
  id: number;
  index: number;
  account: string;
  name: string;
  idNumber: string;
  frontImg: string;
  backImg: string;
  submitTime: string;
  status: 'pending' | 'approved' | 'rejected';
}

const records = ref<KycRecord[]>([]);

const statusMap: Record<number, { type: 'default' | 'warning' | 'success' | 'error'; label: string }> = {
  0: { type: 'default', label: $t('biz.user.member.kycUnverified') },
  1: { type: 'warning', label: $t('biz.common.pending') },
  2: { type: 'success', label: $t('biz.common.approved') },
  3: { type: 'error', label: $t('biz.common.rejected') }
};

// ========== 表格列定义 ==========
const columns = computed<DataTableColumns>(() => [
  { title: '#', key: 'index', width: 50, align: 'center', render: (_row, index) => index + 1 },
  {
    title: $t('biz.user.kyc.account'), key: 'account', width: 140,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-weight:bold;font-size:13px;' }, row.account),
      h('div', { style: 'font-size:12px;opacity:0.5;' }, row.name || '-')
    ])
  },
  { title: $t('biz.user.kyc.idNumber'), key: 'idCardNumber', width: 180 },
  {
    title: $t('biz.user.kyc.idCardFront'), key: 'photo', width: 120,
    render: (row: any) => h('div', { style: 'display:flex;gap:6px;' }, [
      row.idCardFront
        ? h(NImage, { src: row.idCardFront, width: 48, height: 36, objectFit: 'cover', style: 'border-radius:4px;border:1px solid #e8e8ec;cursor:pointer;' })
        : h('div', { style: 'width:48px;height:36px;background:#f0f0f5;border-radius:4px;display:flex;align-items:center;justify-content:center;border:1px solid #e8e8ec;' }, h('span', { style: 'opacity:0.3;font-size:10px;' }, $t('biz.user.kyc.idCardFront'))),
      row.idCardBack
        ? h(NImage, { src: row.idCardBack, width: 48, height: 36, objectFit: 'cover', style: 'border-radius:4px;border:1px solid #e8e8ec;cursor:pointer;' })
        : h('div', { style: 'width:48px;height:36px;background:#f0f0f5;border-radius:4px;display:flex;align-items:center;justify-content:center;border:1px solid #e8e8ec;' }, h('span', { style: 'opacity:0.3;font-size:10px;' }, $t('biz.user.kyc.idCardBack')))
    ])
  },
  { title: $t('biz.user.kyc.submittedAt'), key: 'kycSubmittedAt', width: 160, render: (row: any) => row.kycSubmittedAt || '-' },
  {
    title: $t('biz.user.kyc.status'), key: 'kycStatus', width: 80, align: 'center',
    render: (row: any) => {
      const s = statusMap[row.kycStatus] || statusMap[0];
      return h(NTag, { type: s.type, size: 'small', bordered: false }, () => s.label);
    }
  },
  {
    title: $t('common.action'), key: 'action', width: 100, align: 'center',
    render: (row: any) => {
      if (row.kycStatus === 1) {
        return authStore.hasPermission('user.kyc.audit') ? h(NButton, { text: true, type: 'primary', onClick: () => openReview(row) }, () => $t('biz.user.kyc.review')) : null;
      }
      return h(NSpace, { size: 8, justify: 'center' }, () => [
        h(NButton, { text: true, type: 'primary', onClick: () => openView(row) }, () => $t('common.view')),
        h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, () => $t('common.delete'))
      ]);
    }
  }
]);

async function loadData() {
  if (searchForm.value.dateStart && searchForm.value.dateEnd && searchForm.value.dateEnd < searchForm.value.dateStart) {
    window.$message?.warning($t('biz.common.endDate')); return;
  }
  loading.value = true;
  const { data, error } = await fetchKycList({
    account: searchForm.value.account || undefined,
    name: searchForm.value.name || undefined,
    idCardNumber: searchForm.value.idNumber || undefined,
    status: searchForm.value.status || undefined,
    agentId: searchForm.value.agentId || undefined,
    dateStart: searchForm.value.dateStart ? toLocalDateStr(searchForm.value.dateStart) : undefined,
    dateEnd: searchForm.value.dateEnd ? toLocalDateStr(searchForm.value.dateEnd) : undefined,
    page: currentPage.value,
    pageSize
  });
  loading.value = false;
  if (!error) {
    records.value = data.list || [];
    totalRecords.value = data.total || 0;
  } else {
    window.$message?.error(error?.msg || $t('biz.common.operateFailed'));
  }
}

watch(currentPage, loadData);
onMounted(() => { loadData(); loadAgentOptions(); });

// ========== 审核弹窗 ==========
const reviewVisible = ref(false);
const reviewRecord = ref<any>(null);
const reviewResult = ref<string>('approved');
const reviewRemark = ref('');

function openReview(r: any) {
  reviewRecord.value = r;
  reviewResult.value = 'approved';
  reviewRemark.value = '';
  reviewVisible.value = true;
}

async function submitReview() {
  if (reviewRecord.value) {
    const { error } = await reviewKyc(reviewRecord.value.id, {
      result: reviewResult.value,
      remark: reviewRemark.value
    });
    if (!error) {
      window.$message?.success($t('biz.common.operateSuccess'));
      reviewVisible.value = false;
      loadData();
      (window as any).__refreshPendingCounts?.();
    } else {
      window.$message?.error(error?.msg || $t('biz.common.operateFailed'));
    }
  }
}

// ========== 查看弹窗 ==========
const viewVisible = ref(false);
const viewRecord = ref<any>(null);

function openView(r: any) {
  viewRecord.value = r;
  viewVisible.value = true;
}

// ========== 删除 ==========
function handleDelete(r: any) {
  dialog.warning({
    title: $t('biz.common.confirmDeleteTitle'),
    content: $t('biz.common.confirmDeleteContent'),
    positiveText: $t('biz.common.confirmDeleteTitle'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await deleteKyc(r.id);
      if (!error) {
        window.$message?.success($t('biz.common.operateSuccess'));
        loadData();
      } else {
        window.$message?.error(error?.msg || $t('biz.common.operateFailed'));
      }
    }
  });
}
</script>

<template>
  <div class="p-16px">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-18px font-bold m-0">{{ $t('biz.user.kyc.title') }}</h2>
      <NButton size="small" @click="loadData">
        <SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />{{ $t('common.refresh') }}
      </NButton>
    </div>

    <!-- 筛选条件 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse>
        <NCollapseItem :title="$t('biz.common.filterConditions')" name="filter">
          <NGrid :x-gap="16" :y-gap="12" :cols="3">
            <NGridItem>
              <div class="text-13px mb-6px">{{ $t('biz.user.kyc.account') }}</div>
              <NInput v-model:value="searchForm.account" placeholder="" />
            </NGridItem>
            <NGridItem>
              <div class="text-13px mb-6px">{{ $t('biz.user.kyc.name') }}</div>
              <NInput v-model:value="searchForm.name" placeholder="" />
            </NGridItem>
            <NGridItem>
              <div class="text-13px mb-6px">{{ $t('biz.user.kyc.idNumber') }}</div>
              <NInput v-model:value="searchForm.idNumber" placeholder="" />
            </NGridItem>
          </NGrid>
          <NGrid :x-gap="16" :y-gap="12" :cols="4" class="mt-12px">
            <NGridItem>
              <div class="text-13px mb-6px">{{ $t('biz.user.kyc.status') }}</div>
              <NSelect v-model:value="searchForm.status" :options="statusOptions" />
            </NGridItem>
            <NGridItem>
              <div class="text-13px mb-6px">{{ $t('biz.user.kyc.agent') }}</div>
              <NSelect v-model:value="searchForm.agentId" :options="agentOptions" clearable />
            </NGridItem>
            <NGridItem :span="2">
              <div class="text-13px mb-6px">{{ $t('biz.user.kyc.submittedAt') }}</div>
              <div class="flex items-center gap-8px">
                <NDatePicker v-model:value="searchForm.dateStart" type="date" placeholder="-/-/-" class="flex-1" />
                <span class="text-13px op-60">~</span>
                <NDatePicker v-model:value="searchForm.dateEnd" type="date" placeholder="-/-/-" class="flex-1" />
              </div>
            </NGridItem>
          </NGrid>
          <div class="flex justify-end gap-8px mt-16px">
            <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
            <NButton type="primary" @click="currentPage = 1; loadData()">{{ $t('common.search') }}</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <!-- 表格 -->
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        :columns="columns"
        :data="records"
        :bordered="false"
        size="small"
        :scroll-x="830"
        :loading="loading"
      />

      <!-- 分页 -->
      <div class="flex items-center justify-between mt-16px pt-12px border-t border-gray-100">
        <span class="text-13px op-50">{{ $t('biz.common.total', { count: totalRecords }) }}</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 审核弹窗 -->
    <NModal v-model:show="reviewVisible" preset="card" :title="$t('biz.user.kyc.review')" style="width: 600px;" :bordered="false">
      <template v-if="reviewRecord">
        <div class="flex gap-16px mb-20px">
          <div class="flex-1">
            <div class="text-13px op-60 mb-6px">{{ $t('biz.user.kyc.account') }}</div>
            <div class="info-box">
              <div class="font-bold text-13px">{{ reviewRecord.account }}</div>
              <div class="text-12px op-50">{{ reviewRecord.name || '-' }}</div>
            </div>
          </div>
          <div class="flex-1">
            <div class="text-13px op-60 mb-6px">{{ $t('biz.user.kyc.idNumber') }}</div>
            <div class="info-box">
              <div class="text-13px">{{ reviewRecord.idCardNumber }}</div>
            </div>
          </div>
        </div>
        <div class="mb-20px">
          <div class="text-13px op-60 mb-6px">{{ $t('biz.user.kyc.idCardFront') }}</div>
          <div class="flex gap-12px">
            <div class="photo-preview">
              <NImage v-if="reviewRecord.idCardFront" :src="reviewRecord.idCardFront" object-fit="contain" style="width:100%;height:100%;" />
              <span v-else class="op-20 text-12px">{{ $t('biz.user.kyc.idCardFront') }}</span>
            </div>
            <div class="photo-preview">
              <NImage v-if="reviewRecord.idCardBack" :src="reviewRecord.idCardBack" object-fit="contain" style="width:100%;height:100%;" />
              <span v-else class="op-20 text-12px">{{ $t('biz.user.kyc.idCardBack') }}</span>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-100 my-16px"></div>
        <div class="mb-16px">
          <div class="text-13px op-60 mb-8px">{{ $t('biz.user.kyc.review') }}</div>
          <NRadioGroup v-model:value="reviewResult">
            <NRadio value="approved">{{ $t('biz.user.kyc.approve') }}</NRadio>
            <NRadio value="rejected" class="ml-16px">{{ $t('biz.user.kyc.reject') }}</NRadio>
          </NRadioGroup>
        </div>
        <div class="mb-8px">
          <div class="text-13px op-60 mb-8px">{{ $t('biz.common.remark') }}</div>
          <NInput v-model:value="reviewRemark" type="textarea" :rows="4" :placeholder="$t('biz.common.remark')" />
        </div>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="reviewVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="submitReview">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 查看弹窗 -->
    <NModal v-model:show="viewVisible" preset="card" :title="$t('biz.user.kyc.title')" style="width: 600px;" :bordered="false">
      <template v-if="viewRecord">
        <div class="flex gap-16px mb-20px">
          <div class="flex-1">
            <div class="text-13px op-60 mb-6px">{{ $t('biz.user.kyc.account') }}</div>
            <div class="info-box">
              <div class="font-bold text-13px">{{ viewRecord.account }}</div>
              <div class="text-12px op-50">{{ viewRecord.name || '-' }}</div>
            </div>
          </div>
          <div class="flex-1">
            <div class="text-13px op-60 mb-6px">{{ $t('biz.user.kyc.idNumber') }}</div>
            <div class="info-box">
              <div class="text-13px">{{ viewRecord.idCardNumber }}</div>
            </div>
          </div>
        </div>
        <div class="mb-20px">
          <div class="text-13px op-60 mb-6px">{{ $t('biz.user.kyc.idCardFront') }}</div>
          <div class="flex gap-12px">
            <div class="photo-preview">
              <NImage v-if="viewRecord.idCardFront" :src="viewRecord.idCardFront" object-fit="contain" style="width:100%;height:100%;" />
              <span v-else class="op-20 text-12px">{{ $t('biz.user.kyc.idCardFront') }}</span>
            </div>
            <div class="photo-preview">
              <NImage v-if="viewRecord.idCardBack" :src="viewRecord.idCardBack" object-fit="contain" style="width:100%;height:100%;" />
              <span v-else class="op-20 text-12px">{{ $t('biz.user.kyc.idCardBack') }}</span>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-100 my-16px"></div>
        <div class="mb-16px">
          <div class="text-13px op-60 mb-8px">{{ $t('biz.user.kyc.status') }}</div>
          <NTag :type="(statusMap[viewRecord.kycStatus] || statusMap[0]).type" size="small" :bordered="false">
            {{ (statusMap[viewRecord.kycStatus] || statusMap[0]).label }}
          </NTag>
        </div>
        <div>
          <div class="text-13px op-60 mb-8px">{{ $t('biz.user.kyc.submittedAt') }}</div>
          <div class="text-13px">{{ viewRecord.kycSubmittedAt || '-' }}</div>
        </div>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="viewVisible = false">{{ $t('common.close') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.info-box {
  background-color: #f7f7fa;
  border-radius: 6px;
  padding: 12px 14px;
  min-height: 48px;
}
.photo-preview {
  width: 200px;
  height: 140px;
  background-color: #f0f0f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e8e8ec;
}
</style>
