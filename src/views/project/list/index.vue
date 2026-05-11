<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue';
import {
  NCard, NButton, NSpace, NTag, NInput, NSelect, NSwitch, NCollapse, NCollapseItem,
  NGrid, NGridItem, NPagination, NProgress, NDrawer, NDrawerContent, NForm, NFormItem,
  NInputNumber, NRadioGroup, NRadio, NDatePicker, useDialog
} from 'naive-ui';
import { fetchProjects, createProject, updateProject, deleteProject, toggleProject, fetchProjectCategories, fetchGuarantors, fetchLevels } from '@/service/api';
import ImageUpload from '@/components/common/ImageUpload.vue';

defineOptions({ name: 'ProjectListPage' });

const dialog = useDialog();

// ========== 筛选 ==========
const keyword = ref('');
const categoryFilter = ref<string>('all');
const statusFilter = ref<string>('all');
const guarantorFilter = ref<string>('all');

const categoryOptions = ref<{ label: string; value: string }[]>([
  { label: '全部', value: 'all' }
]);
const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '投资中', value: 'investing' },
  { label: '已满额', value: 'full' },
  { label: '已结束', value: 'ended' }
];
const guarantorOptions = ref<{ label: string; value: string }[]>([
  { label: '全部', value: 'all' }
]);

// 表单用选项（不含"全部"）
const categoryFormOptions = computed(() => categoryOptions.value.filter(o => o.value !== 'all'));
const guarantorFormOptions = computed(() => guarantorOptions.value.filter(o => o.value !== 'all'));

// 加载筛选选项
async function loadFilterOptions() {
  const [catRes, guaRes] = await Promise.all([
    fetchProjectCategories({ page_size: 100 }),
    fetchGuarantors({ page_size: 100 })
  ]);
  if (!catRes.error && catRes.data) {
    const list = catRes.data.list || catRes.data || [];
    categoryOptions.value = [
      { label: '全部', value: 'all' },
      ...list.map((item: any) => ({ label: item.name, value: String(item.id) }))
    ];
  }
  if (!guaRes.error && guaRes.data) {
    const list = guaRes.data.list || guaRes.data || [];
    guarantorOptions.value = [
      { label: '全部', value: 'all' },
      ...list.map((item: any) => ({ label: item.name, value: String(item.id) }))
    ];
  }
}

// ========== 加载状态 ==========
const loading = ref(false);

// ========== 列表数据 ==========
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const projects = ref<any[]>([]);

// ========== 状态映射 ==========
const statusMap: Record<string, { label: string; type: string }> = {
  investing: { label: '投资中', type: 'success' },
  full: { label: '已满额', type: 'warning' },
  ended: { label: '已结束', type: 'default' }
};

// 期限单位映射
const periodUnitMap: Record<string, string> = {
  day: '天',
  workday: '工作日',
  month: '月',
  '自然日': '天',
  '工作日': '工作日',
  '月': '月'
};

function getStatusLabel(status: string) {
  return statusMap[status]?.label || status;
}
function getStatusType(status: string) {
  return statusMap[status]?.type || 'default';
}
function getPeriodText(p: any) {
  const unit = periodUnitMap[p.periodUnit] || p.periodUnit || '';
  return `${p.periodValue || ''}${unit}`;
}

// ========== 新增/编辑项目抽屉 ==========
const drawerVisible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);

const defaultFormData = () => ({
  categoryId: null as string | null,
  sort: null as number | null,
  minLevelId: null as string | null,
  name: '',
  subtitle: '',
  guarantorId: null as string | null,
  scale: null as number | null,
  amountTip: '',
  progress: null as number | null,
  autoProgress: false,
  returnMultiple: null as number | null,
  periodValue: null as number | null,
  periodUnit: 'day',
  projectReturn: false,
  status: 'investing',
  publishedAt: null as number | null,
  image: '' as string,
  couponType: '' as string,
  interestType: '' as string,
  description: '',
  minAmount: null as number | null,
  maxAmount: null as number | null,
  investorCount: null as number | null,
  returnMethod: '按天付收益到期还本',
  canRepeatInvest: true,
  repeatInvestTimes: null as number | null,
  profitRate: null as number | null,
  subInvestType: 'system',
  level1Rate: null as number | null,
  level2Rate: null as number | null,
  level3Rate: null as number | null
});

const formData = ref(defaultFormData());

const memberLevelOptions = ref<{ label: string; value: string }[]>([]);

async function loadLevelOptions() {
  const { data, error } = await fetchLevels();
  if (!error && data) {
    const list = data.list || data || [];
    memberLevelOptions.value = (Array.isArray(list) ? list : []).map((l: any) => ({ label: l.name, value: String(l.id) }));
  }
}

const periodUnitOptions = [
  { label: '自然日', value: 'day' },
  { label: '工作日', value: 'workday' },
  { label: '月', value: 'month' }
];
const investStatusOptions = [
  { label: '投资中', value: 'investing' },
  { label: '已满额', value: 'full' },
  { label: '已结束', value: 'ended' }
];
const returnMethodOptions = [
  { label: '按天付收益到期还本', value: '按天付收益到期还本' },
  { label: '到期一次性还本付息', value: '到期一次性还本付息' }
];
const subInvestOptions = [
  { label: '系统比例', value: 'system' },
  { label: '自定义比例', value: 'custom' }
];
const couponOptions = [
  { label: '不使用优惠券', value: '' },
  { label: '满减券', value: '满减券' },
  { label: '折扣券', value: '折扣券' }
];
const interestOptions = [
  { label: '不使用加息券', value: '' },
  { label: '加息0.5%', value: '加息0.5%' },
  { label: '加息1%', value: '加息1%' }
];

function openDrawer(project?: any) {
  if (project) {
    isEdit.value = true;
    editId.value = project.id;
    formData.value = {
      categoryId: project.categoryId ? String(project.categoryId) : null,
      sort: project.sort,
      minLevelId: project.minLevelId ? String(project.minLevelId) : null,
      name: project.name || '',
      subtitle: project.subtitle || '',
      guarantorId: project.guarantorId ? String(project.guarantorId) : null,
      scale: project.scale ? project.scale / 10000 : null,
      amountTip: project.amountTip || '',
      progress: project.progress,
      autoProgress: !!project.autoProgress,
      returnMultiple: project.returnMultiple,
      periodValue: project.periodValue,
      periodUnit: project.periodUnit || 'day',
      projectReturn: !!project.projectReturn,
      status: project.status || 'investing',
      publishedAt: project.publishedAt ? new Date(project.publishedAt).getTime() : null,
      image: project.image || '',
      couponType: project.couponType || '',
      interestType: project.interestType || '',
      description: project.description || '',
      minAmount: project.minAmount ? project.minAmount / 10000 : null,
      maxAmount: project.maxAmount ? project.maxAmount / 10000 : null,
      investorCount: project.investorCount,
      returnMethod: project.returnMethod || '按天付收益到期还本',
      canRepeatInvest: project.canRepeatInvest !== false,
      repeatInvestTimes: project.repeatInvestTimes,
      profitRate: project.profitRate,
      subInvestType: project.subInvestType || 'system',
      level1Rate: project.level1Rate,
      level2Rate: project.level2Rate,
      level3Rate: project.level3Rate
    };
  } else {
    isEdit.value = false;
    editId.value = null;
    formData.value = defaultFormData();
  }
  drawerVisible.value = true;
}

// ========== 保存项目 ==========
async function handleSaveProject() {
  const payload = { ...formData.value };
  let res;
  if (isEdit.value && editId.value) {
    res = await updateProject(editId.value, payload);
  } else {
    res = await createProject(payload);
  }
  if (!res.error) {
    window.$message?.success(isEdit.value ? '更新成功' : '创建成功');
    drawerVisible.value = false;
    loadData();
  } else {
    window.$message?.error(res.error?.msg || '操作失败');
  }
}

// ========== 删除项目 ==========
function handleDeleteProject(p: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除项目「${p.name}」吗？此操作不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const { error } = await deleteProject(p.id);
      if (!error) {
        window.$message?.success('删除成功');
        loadData();
      } else {
        window.$message?.error(error?.msg || '操作失败');
      }
    }
  });
}

// ========== 切换项目显示 ==========
async function handleToggle(p: any, field: string, value: boolean) {
  const { error } = await toggleProject(p.id, { field, value });
  if (!error) {
    p[field === 'show_project' ? 'showProject' : 'showHome'] = value;
  } else {
    // 回滚开关状态
    p[field === 'show_project' ? 'showProject' : 'showHome'] = !value;
    window.$message?.error(error?.msg || '操作失败');
  }
}

// ========== 筛选操作 ==========
function handleSearch() {
  currentPage.value = 1;
  loadData();
}
function handleReset() {
  keyword.value = '';
  categoryFilter.value = 'all';
  statusFilter.value = 'all';
  guarantorFilter.value = 'all';
  currentPage.value = 1;
  loadData();
}

// ========== 数据加载 ==========
async function loadData() {
  loading.value = true;
  const { data, error } = await fetchProjects({
    name: keyword.value || undefined,
    category_id: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    guarantor_id: guarantorFilter.value === 'all' ? undefined : guarantorFilter.value,
    page: currentPage.value,
    page_size: pageSize.value
  });
  loading.value = false;
  if (!error) {
    projects.value = data.list || [];
    total.value = data.total || 0;
  } else {
    window.$message?.error(error?.msg || '加载失败');
  }
}

watch(currentPage, loadData);
onMounted(() => {
  loadFilterOptions();
  loadLevelOptions();
  loadData();
});
</script>

<template>
  <div class="p-16px">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-16px">
      <h2 class="text-20px font-bold">项目列表</h2>
      <NButton v-permission="'project.list.create'" type="primary" @click="openDrawer()">新增项目</NButton>
    </div>

    <!-- 筛选条件 -->
    <NCard :bordered="false" class="card-wrapper mb-16px">
      <NCollapse>
        <NCollapseItem title="筛选条件" name="filter">
          <NGrid :x-gap="16" :y-gap="12" :cols="4">
            <NGridItem>
              <div class="text-12px op-60 mb-4px">项目名称</div>
              <NInput v-model:value="keyword" placeholder="输入项目名称" clearable size="small" @keyup.enter="handleSearch">
                <template #suffix>
                  <SvgIcon icon="ph:magnifying-glass" class="op-40" />
                </template>
              </NInput>
            </NGridItem>
            <NGridItem>
              <div class="text-12px op-60 mb-4px">项目分类</div>
              <NSelect v-model:value="categoryFilter" :options="categoryOptions" size="small" />
            </NGridItem>
            <NGridItem>
              <div class="text-12px op-60 mb-4px">项目状态</div>
              <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" />
            </NGridItem>
            <NGridItem>
              <div class="text-12px op-60 mb-4px">担保机构</div>
              <NSelect v-model:value="guarantorFilter" :options="guarantorOptions" size="small" />
            </NGridItem>
          </NGrid>
          <div class="flex justify-end gap-8px mt-12px">
            <NButton size="small" @click="handleReset">重置</NButton>
            <NButton size="small" type="primary" @click="handleSearch">查询</NButton>
          </div>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <!-- 项目卡片列表 -->
    <div class="flex flex-col gap-12px">
      <NCard v-for="p in projects" :key="p.id" :bordered="false" class="card-wrapper" content-style="padding: 16px 20px;">
        <div class="flex items-center">
          <!-- 编号 + 排序 -->
          <div class="text-left flex-1">
            <div class="text-11px op-50">编号</div>
            <div class="text-13px font-medium">{{ p.id }}</div>
            <div class="text-11px op-50 mt-6px">排序</div>
            <div class="text-13px">{{ p.sort }}</div>
          </div>

          <!-- 分类标签 + 名称 + 担保 -->
          <div class="min-w-0" style="flex: 2;">
            <NTag :bordered="false" size="small" type="info">
              {{ p.category?.name || '-' }}
            </NTag>
            <div class="text-15px font-bold mt-4px truncate">{{ p.name }}</div>
            <div class="text-12px op-50 mt-2px truncate">{{ p.guarantor?.name || '-' }}</div>
          </div>

          <!-- 规模 -->
          <div class="text-center flex-1">
            <div class="text-11px op-50">规模(万)</div>
            <div class="text-16px font-bold">{{ p.scale ? (p.scale / 10000) : '-' }}</div>
          </div>

          <!-- 进度 -->
          <div class="text-center flex-1">
            <div class="text-11px op-50">进度</div>
            <div class="flex items-center justify-center gap-4px mt-4px">
              <NProgress :percentage="p.progress || 0" :show-indicator="false" :height="6" style="width: 40px;" />
              <span class="text-13px font-medium text-primary">{{ p.progress ?? 0 }}%</span>
            </div>
          </div>

          <!-- 交易收益 -->
          <div class="text-center flex-1">
            <div class="text-11px op-50">交易收益</div>
            <div class="text-15px font-bold text-primary">{{ p.profitRate ?? '-' }}%</div>
          </div>

          <!-- 起投金额 -->
          <div class="text-center flex-1">
            <div class="text-11px op-50">起投金额(万)</div>
            <div class="text-14px font-medium">{{ p.minAmount ? (p.minAmount / 10000) : '-' }}</div>
          </div>

          <!-- 状态 -->
          <div class="text-center flex-1">
            <div class="text-11px op-50">状态</div>
            <NTag :type="getStatusType(p.status) as any" size="small" :bordered="false" class="mt-2px">
              {{ getStatusLabel(p.status) }}
            </NTag>
          </div>

          <!-- 期限 -->
          <div class="text-center flex-1">
            <div class="text-11px op-50">期限</div>
            <div class="text-14px font-medium">{{ getPeriodText(p) }}</div>
          </div>

          <!-- 开关 -->
          <div v-permission="'project.list.toggle'" class="flex flex-col items-center gap-4px flex-1">
            <div class="flex items-center gap-4px">
              <NSwitch :value="p.showProject" size="small" @update:value="(v: boolean) => handleToggle(p, 'show_project', v)" />
              <span class="text-11px op-60">项目</span>
            </div>
            <div class="flex items-center gap-4px">
              <NSwitch :value="p.showHome" size="small" @update:value="(v: boolean) => handleToggle(p, 'show_home', v)" />
              <span class="text-11px op-60">首页</span>
            </div>
          </div>

          <!-- 日期 + 操作 -->
          <div class="flex flex-col items-center gap-4px flex-1">
            <span class="text-12px op-50">{{ (p.publishedAt || p.createdAt || '').substring(0, 10) || '-' }}</span>
            <NSpace :size="4">
              <NButton v-permission="'project.list.edit'" size="tiny" type="primary" quaternary @click="openDrawer(p)">
                <SvgIcon icon="ph:pencil-simple" />
              </NButton>
              <NButton v-permission="'project.list.delete'" size="tiny" type="error" quaternary @click="handleDeleteProject(p)">
                <SvgIcon icon="ph:trash" />
              </NButton>
            </NSpace>
          </div>
        </div>
      </NCard>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && projects.length === 0" class="text-center py-40px op-40">
      暂无项目数据
    </div>

    <!-- 分页 -->
    <div class="flex items-center justify-between mt-16px">
      <span class="text-13px op-50">显示 1 到 {{ projects.length }} 项，共 {{ total }} 项</span>
      <NPagination v-model:page="currentPage" :page-count="Math.ceil(total / pageSize) || 1" />
    </div>

    <!-- 新增/编辑项目抽屉 -->
    <NDrawer v-model:show="drawerVisible" :width="680" placement="right">
      <NDrawerContent :title="isEdit ? '编辑项目' : '新增项目'" closable>
        <NForm label-placement="top" label-width="auto" size="small">
          <NGrid :x-gap="16" :y-gap="0" :cols="2">
            <NGridItem>
              <NFormItem label="分类选择">
                <NSelect v-model:value="formData.categoryId" :options="categoryFormOptions" placeholder="选择分类" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="起投金额（万）">
                <NInputNumber v-model:value="formData.minAmount" placeholder="请输入起投金额" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="排序设置">
                <NInputNumber v-model:value="formData.sort" placeholder="" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="最高金额（万）">
                <NInputNumber v-model:value="formData.maxAmount" placeholder="留空表示无限制" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="会员等级">
                <NSelect v-model:value="formData.minLevelId" :options="memberLevelOptions" placeholder="选择会员等级" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="投资人数">
                <NInputNumber v-model:value="formData.investorCount" placeholder="请输入投资人数" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="项目名称">
                <NInput v-model:value="formData.name" placeholder="请输入项目名称" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="还款方式">
                <NSelect v-model:value="formData.returnMethod" :options="returnMethodOptions" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="项目副标题">
                <NInput v-model:value="formData.subtitle" placeholder="请输入项目副标题" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="是否可以重复投资">
                <NRadioGroup v-model:value="formData.canRepeatInvest">
                  <NRadio :value="false">不可以</NRadio>
                  <NRadio :value="true">可以</NRadio>
                </NRadioGroup>
              </NFormItem>
              <NFormItem v-if="formData.canRepeatInvest" label="重复投资次数">
                <NInputNumber v-model:value="formData.repeatInvestTimes" placeholder="请输入重复投资次数" class="w-full" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="担保机构">
                <NSelect v-model:value="formData.guarantorId" :options="guarantorFormOptions" placeholder="选择担保机构" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="项目规模（万）">
                <NInputNumber v-model:value="formData.scale" placeholder="请输入项目规模" class="w-full" />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <NGrid :x-gap="16" :y-gap="0" :cols="2">
            <NGridItem>
              <NFormItem label="交易收益(%)">
                <NInputNumber v-model:value="formData.profitRate" placeholder="请输入交易收益" class="w-full" />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <NFormItem label="可投金额提示">
            <NInput v-model:value="formData.amountTip" placeholder="例如：投资期间只要产品未设置，投资者均可自由投资。" />
          </NFormItem>
          <NFormItem label="投资进度(%)">
            <NInputNumber v-model:value="formData.progress" placeholder="请输入投资进度(支持两位小数)" class="w-full" />
          </NFormItem>
          <NFormItem label="自动进度增长">
            <NRadioGroup v-model:value="formData.autoProgress">
              <NRadio :value="false">关闭</NRadio>
              <NRadio :value="true">开启</NRadio>
            </NRadioGroup>
          </NFormItem>
          <NFormItem label="收益资金倍数">
            <NInputNumber v-model:value="formData.returnMultiple" placeholder="请输入资金倍数" class="w-full" />
          </NFormItem>
          <NFormItem label="项目期限">
            <div class="flex gap-8px w-full">
              <NInputNumber v-model:value="formData.periodValue" placeholder="期限" class="w-100px" />
              <NSelect v-model:value="formData.periodUnit" :options="periodUnitOptions" class="flex-1" />
            </div>
          </NFormItem>
          <NFormItem label="项目返润">
            <NRadioGroup v-model:value="formData.projectReturn">
              <NRadio :value="false">关闭</NRadio>
              <NRadio :value="true">开启</NRadio>
            </NRadioGroup>
          </NFormItem>
          <NGrid :x-gap="16" :cols="2">
            <NGridItem>
              <NFormItem label="下线投资分成">
                <NSelect v-model:value="formData.subInvestType" :options="subInvestOptions" />
              </NFormItem>
            </NGridItem>
            <NGridItem />
          </NGrid>
          <template v-if="formData.subInvestType === 'custom'">
            <NGrid :x-gap="16" :cols="3">
              <NGridItem>
                <NFormItem label="一级会员提成(%)">
                  <NInputNumber v-model:value="formData.level1Rate" placeholder="" class="w-full" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="二级会员提成(%)">
                  <NInputNumber v-model:value="formData.level2Rate" placeholder="" class="w-full" />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label="三级会员提成(%)">
                  <NInputNumber v-model:value="formData.level3Rate" placeholder="" class="w-full" />
                </NFormItem>
              </NGridItem>
            </NGrid>
          </template>
          <NFormItem label="投资状态">
            <NSelect v-model:value="formData.status" :options="investStatusOptions" />
          </NFormItem>
          <NFormItem label="发布时间">
            <NDatePicker v-model:value="formData.publishedAt" type="date" class="w-full" />
          </NFormItem>
          <NFormItem label="产品图片">
            <ImageUpload v-model="formData.image" />
          </NFormItem>
          <NGrid :x-gap="16" :cols="2">
            <NGridItem>
              <NFormItem label="优惠券类型">
                <NSelect v-model:value="formData.couponType" :options="couponOptions" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="加息券类型">
                <NSelect v-model:value="formData.interestType" :options="interestOptions" />
              </NFormItem>
            </NGridItem>
          </NGrid>
          <NFormItem label="产品说明">
            <NInput v-model:value="formData.description" type="textarea" :rows="6" placeholder="请输入产品说明" />
          </NFormItem>
        </NForm>

        <template #footer>
          <NSpace justify="end">
            <NButton @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" @click="handleSaveProject">保存</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
