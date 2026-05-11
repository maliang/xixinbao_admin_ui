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
const agentOptions = ref<{ label: string; value: string }[]>([{ label: '全部代理', value: '' }]);
async function loadAgentOptions() {
  const { data, error } = await fetchAgents({ pageSize: 200 });
  if (!error && data) {
    const list = data.list || [];
    agentOptions.value = [
      { label: '全部代理', value: '' },
      ...list.map((a: any) => ({ label: `${a.account} (${a.name || a.inviteCode})`, value: String(a.id) }))
    ];
  }
}

const statusOptions = [
  { label: '全部', value: null },
  { label: '未审核', value: '1' },
  { label: '已通过', value: '2' },
  { label: '已拒绝', value: '3' }
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
  0: { type: 'default', label: '未认证' },
  1: { type: 'warning', label: '待审核' },
  2: { type: 'success', label: '已通过' },
  3: { type: 'error', label: '已拒绝' }
};

// ========== 表格列定义 ==========
const columns = computed<DataTableColumns>(() => [
  { title: '序号', key: 'index', width: 50, align: 'center', render: (_row, index) => index + 1 },
  {
    title: '用户信息', key: 'account', width: 140,
    render: (row: any) => h('div', {}, [
      h('div', { style: 'font-weight:bold;font-size:13px;' }, row.account),
      h('div', { style: 'font-size:12px;opacity:0.5;' }, row.name || '-')
    ])
  },
  { title: '证件号', key: 'idCardNumber', width: 180 },
  {
    title: '证件图片', key: 'photo', width: 120,
    render: (row: any) => h('div', { style: 'display:flex;gap:6px;' }, [
      row.idCardFront
        ? h(NImage, { src: row.idCardFront, width: 48, height: 36, objectFit: 'cover', style: 'border-radius:4px;border:1px solid #e8e8ec;cursor:pointer;' })
        : h('div', { style: 'width:48px;height:36px;background:#f0f0f5;border-radius:4px;display:flex;align-items:center;justify-content:center;border:1px solid #e8e8ec;' }, h('span', { style: 'opacity:0.3;font-size:10px;' }, '正面')),
      row.idCardBack
        ? h(NImage, { src: row.idCardBack, width: 48, height: 36, objectFit: 'cover', style: 'border-radius:4px;border:1px solid #e8e8ec;cursor:pointer;' })
        : h('div', { style: 'width:48px;height:36px;background:#f0f0f5;border-radius:4px;display:flex;align-items:center;justify-content:center;border:1px solid #e8e8ec;' }, h('span', { style: 'opacity:0.3;font-size:10px;' }, '反面'))
    ])
  },
  { title: '提交时间', key: 'kycSubmittedAt', width: 160, render: (row: any) => row.kycSubmittedAt || '-' },
  {
    title: '状态', key: 'kycStatus', width: 80, align: 'center',
    render: (row: any) => {
      const s = statusMap[row.kycStatus] || statusMap[0];
      return h(NTag, { type: s.type, size: 'small', bordered: false }, () => s.label);
    }
  },
  {
    title: '操作', key: 'action', width: 100, align: 'center',
    render: (row: any) => {
      if (row.kycStatus === 1) {
        return authStore.hasPermission('user.kyc.audit') ? h(NButton, { text: true, type: 'primary', onClick: () => openReview(row) }, () => '审核') : null;
      }
      return h(NSpace, { size: 8 }, () => [
        h(NButton, { text: true, type: 'primary', onClick: () => openView(row) }, () => '查看'),
        h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, () => '删除')
      ]);
    }
  }
]);

async function loadData() {
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
    window.$message?.error(error?.msg || '操作失败');
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
      window.$message?.success('操作成功');
      reviewVisible.value = false;
      loadData();
      (window as any).__refreshPendingCounts?.();
    } else {
      window.$message?.error(error?.msg || '操作失败');
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
    title: '确认删除',
    content: `确定要删除用户 ${r.account}（${r.name}）的实名认证记录吗？此操作不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteKyc(r.id);
      if (!error) {
        window.$message?.success('操作成功');
        loadData();
      } else {
        window.$message?.error(error?.msg || '操作失败');
      }
    }
  });
}
</script>

<template>
  <div class="p-16px">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-18px font-bold m-0">实名认证管理</h2>
      <NButton size="small" @click="loadData">
        <SvgIcon icon="ph:arrows-clockwise" class="mr-4px" />刷新
      </NButton>
    </div>

    <!-- 筛选条件 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse>
        <NCollapseItem title="筛选条件" name="filter">
          <NGrid :x-gap="16" :y-gap="12" :cols="3">
            <NGridItem>
              <div class="text-13px mb-6px">账号</div>
              <NInput v-model:value="searchForm.account" placeholder="" />
            </NGridItem>
            <NGridItem>
              <div class="text-13px mb-6px">姓名</div>
              <NInput v-model:value="searchForm.name" placeholder="" />
            </NGridItem>
            <NGridItem>
              <div class="text-13px mb-6px">证件号</div>
              <NInput v-model:value="searchForm.idNumber" placeholder="" />
            </NGridItem>
          </NGrid>
          <NGrid :x-gap="16" :y-gap="12" :cols="4" class="mt-12px">
            <NGridItem>
              <div class="text-13px mb-6px">状态</div>
              <NSelect v-model:value="searchForm.status" :options="statusOptions" />
            </NGridItem>
            <NGridItem>
              <div class="text-13px mb-6px">所属代理</div>
              <NSelect v-model:value="searchForm.agentId" :options="agentOptions" clearable />
            </NGridItem>
            <NGridItem :span="2">
              <div class="text-13px mb-6px">实名时间</div>
              <div class="flex items-center gap-8px">
                <NDatePicker v-model:value="searchForm.dateStart" type="date" placeholder="-/-/-" class="flex-1" />
                <span class="text-13px op-60">至</span>
                <NDatePicker v-model:value="searchForm.dateEnd" type="date" placeholder="-/-/-" class="flex-1" />
              </div>
            </NGridItem>
          </NGrid>
          <div class="flex justify-end gap-8px mt-16px">
            <NButton @click="handleReset">重置</NButton>
            <NButton type="primary" @click="currentPage = 1; loadData()">查询</NButton>
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
        <span class="text-13px op-50">显示 1 到 {{ records.length }} 条，共 {{ totalRecords }} 条</span>
        <NPagination v-model:page="currentPage" :page-count="totalPages" :page-slot="5" />
      </div>
    </NCard>

    <!-- 审核弹窗 -->
    <NModal v-model:show="reviewVisible" preset="card" title="实名认证审核" style="width: 600px;" :bordered="false">
      <template v-if="reviewRecord">
        <div class="flex gap-16px mb-20px">
          <div class="flex-1">
            <div class="text-13px op-60 mb-6px">用户信息</div>
            <div class="info-box">
              <div class="font-bold text-13px">{{ reviewRecord.account }}</div>
              <div class="text-12px op-50">{{ reviewRecord.name || '-' }}</div>
            </div>
          </div>
          <div class="flex-1">
            <div class="text-13px op-60 mb-6px">证件号码</div>
            <div class="info-box">
              <div class="text-13px">{{ reviewRecord.idCardNumber }}</div>
            </div>
          </div>
        </div>
        <div class="mb-20px">
          <div class="text-13px op-60 mb-6px">证件图片</div>
          <div class="flex gap-12px">
            <div class="photo-preview">
              <NImage v-if="reviewRecord.idCardFront" :src="reviewRecord.idCardFront" object-fit="contain" style="width:100%;height:100%;" />
              <span v-else class="op-20 text-12px">证件正面</span>
            </div>
            <div class="photo-preview">
              <NImage v-if="reviewRecord.idCardBack" :src="reviewRecord.idCardBack" object-fit="contain" style="width:100%;height:100%;" />
              <span v-else class="op-20 text-12px">证件反面</span>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-100 my-16px"></div>
        <div class="mb-16px">
          <div class="text-13px op-60 mb-8px">审核结果</div>
          <NRadioGroup v-model:value="reviewResult">
            <NRadio value="approved">通过</NRadio>
            <NRadio value="rejected" class="ml-16px">拒绝</NRadio>
          </NRadioGroup>
        </div>
        <div class="mb-8px">
          <div class="text-13px op-60 mb-8px">审核备注</div>
          <NInput v-model:value="reviewRemark" type="textarea" :rows="4" placeholder="请输入审核备注（选填）" />
        </div>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="reviewVisible = false">取消</NButton>
          <NButton type="primary" @click="submitReview">提交审核</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 查看弹窗 -->
    <NModal v-model:show="viewVisible" preset="card" title="实名认证详情" style="width: 600px;" :bordered="false">
      <template v-if="viewRecord">
        <div class="flex gap-16px mb-20px">
          <div class="flex-1">
            <div class="text-13px op-60 mb-6px">用户信息</div>
            <div class="info-box">
              <div class="font-bold text-13px">{{ viewRecord.account }}</div>
              <div class="text-12px op-50">{{ viewRecord.name || '-' }}</div>
            </div>
          </div>
          <div class="flex-1">
            <div class="text-13px op-60 mb-6px">证件号码</div>
            <div class="info-box">
              <div class="text-13px">{{ viewRecord.idCardNumber }}</div>
            </div>
          </div>
        </div>
        <div class="mb-20px">
          <div class="text-13px op-60 mb-6px">证件图片</div>
          <div class="flex gap-12px">
            <div class="photo-preview">
              <NImage v-if="viewRecord.idCardFront" :src="viewRecord.idCardFront" object-fit="contain" style="width:100%;height:100%;" />
              <span v-else class="op-20 text-12px">证件正面</span>
            </div>
            <div class="photo-preview">
              <NImage v-if="viewRecord.idCardBack" :src="viewRecord.idCardBack" object-fit="contain" style="width:100%;height:100%;" />
              <span v-else class="op-20 text-12px">证件反面</span>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-100 my-16px"></div>
        <div class="mb-16px">
          <div class="text-13px op-60 mb-8px">审核结果</div>
          <NTag :type="(statusMap[viewRecord.kycStatus] || statusMap[0]).type" size="small" :bordered="false">
            {{ (statusMap[viewRecord.kycStatus] || statusMap[0]).label }}
          </NTag>
        </div>
        <div>
          <div class="text-13px op-60 mb-8px">提交时间</div>
          <div class="text-13px">{{ viewRecord.kycSubmittedAt || '-' }}</div>
        </div>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="viewVisible = false">关闭</NButton>
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
