<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { NButton, NInput, NSelect, NModal, NForm, NFormItem, NDatePicker, NPagination, useDialog } from 'naive-ui';
import ImageUpload from '@/components/common/ImageUpload.vue';
import { fetchActivities, fetchActivity, createActivity, updateActivity, deleteActivity, toggleActivity, fetchActivityTypes, createActivityType, updateActivityType, deleteActivityType } from '@/service/api';
defineOptions({ name: 'ActivityPage' });
const dialog = useDialog();
const keyword = ref('');
const statusFilter = ref('all');
const typeFilter = ref('all');
const sortBy = ref('newest');
const statusOptions = [{ label: '全部', value: 'all' },{ label: '进行中', value: 'active' },{ label: '即将开始', value: 'upcoming' },{ label: '已结束', value: 'ended' }];
const sortOptions = [{ label: '最新创建', value: 'newest' },{ label: '最早创建', value: 'oldest' },{ label: '即将开始', value: 'start_asc' },{ label: '即将结束', value: 'end_asc' }];
const activityTypes = ref<{ id: number; name: string; editing?: boolean; editName?: string }[]>([]);
const typeOptions = computed(() => [{ label: '全部类型', value: 'all' }, ...activityTypes.value.map(t => ({ label: t.name, value: String(t.id) }))]);
const typeFormOptions = computed(() => typeOptions.value.filter(o => o.value !== 'all'));
const currentPage = ref(1);
const pageSize = 6;
const totalRecords = ref(0);
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize) || 1);
const activities = ref<any[]>([]);
const loading = ref(false);
function getStatusInfo(s: string) { const m: Record<string,{label:string;color:string;bg:string}> = { active:{label:'进行中',color:'#18a058',bg:'#e8f5e9'}, upcoming:{label:'即将开始',color:'#2080f0',bg:'#e3f2fd'}, ended:{label:'已结束',color:'#909399',bg:'#f0f0f0'}, offline:{label:'已下架',color:'#d03050',bg:'#fde8e8'} }; return m[s]||m.ended; }
async function loadData() {
  loading.value = true;
  const { data, error } = await fetchActivities({
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    typeId: typeFilter.value === 'all' ? undefined : typeFilter.value,
    keyword: keyword.value || undefined,
    sortBy: sortBy.value,
    page: currentPage.value,
    pageSize: 6
  });
  if (!error && data) {
    activities.value = data.list || [];
    totalRecords.value = data.total || 0;
  }
  loading.value = false;
}
function handleSearch() { currentPage.value = 1; loadData(); }

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

watch(currentPage, loadData);
const editVisible = ref(false);
const editTitle = ref('新建活动');
const editForm = ref({ id: null as number|null, title: '', cover: '', startDate: null as number|null, endDate: null as number|null, typeId: null as string|null, content: '' });
function openCreate() { editTitle.value='新建活动'; editForm.value={id:null,title:'',cover:'',startDate:null,endDate:null,typeId:null,content:''}; editVisible.value=true; }
function openEdit(item: any) { editTitle.value='编辑活动信息'; editForm.value={id:item.id,title:item.title,cover:item.cover||'',startDate:item.startDate?new Date(item.startDate).getTime():null,endDate:item.endDate?new Date(item.endDate).getTime():null,typeId:item.typeId?String(item.typeId):null,content:item.content||''}; editVisible.value=true; }
async function handleSave() {
  if (!editForm.value.title) { window.$message?.warning('请输入活动标题'); return; }
  if (editForm.value.startDate && editForm.value.endDate && editForm.value.endDate < editForm.value.startDate) {
    window.$message?.warning('结束时间必须大于开始时间'); return;
  }
  const payload = {
    title: editForm.value.title,
    cover: editForm.value.cover,
    startDate: editForm.value.startDate ? toLocalDateStr(editForm.value.startDate) : undefined,
    endDate: editForm.value.endDate ? toLocalDateStr(editForm.value.endDate) : undefined,
    typeId: editForm.value.typeId,
    content: editForm.value.content
  };
  const { error } = editForm.value.id
    ? await updateActivity(editForm.value.id, payload)
    : await createActivity(payload);
  if (!error) {
    window.$message?.success(editForm.value.id ? '更新成功' : '创建成功');
    editVisible.value = false;
    loadData();
  }
}
function handleOffline(item: any) { dialog.warning({title: item.status === 'offline' ? '上架活动' : '下架活动', content: item.status === 'offline' ? `确定要上架「${item.title}」吗？` : `确定要下架「${item.title}」吗？`, positiveText:'确认', negativeText:'取消', onPositiveClick:async()=>{
  const { error } = await toggleActivity(item.id);
  if (!error) { window.$message?.success(item.status === 'offline' ? '已上架' : '已下架'); loadData(); }
}}); }
function handleDelete(item: any) { dialog.error({title:'删除活动',content:`确定要删除「${item.title}」吗？此操作不可恢复。`,positiveText:'确认删除',negativeText:'取消',positiveButtonProps:{type:'error'} as any,onPositiveClick:async()=>{
  const { error } = await deleteActivity(item.id);
  if (!error) { window.$message?.success('删除成功'); loadData(); }
}}); }
const typeModalVisible = ref(false);
const newTypeName = ref('');
async function loadTypes() {
  const { data, error } = await fetchActivityTypes();
  if (!error && data) { activityTypes.value = data || []; }
}
function openTypeModal() { typeModalVisible.value = true; loadTypes(); }
async function addType() {
  if (!newTypeName.value.trim()) { window.$message?.warning('请输入类型名称'); return; }
  const { error } = await createActivityType({ name: newTypeName.value.trim() });
  if (!error) { newTypeName.value = ''; window.$message?.success('添加成功'); loadTypes(); }
}
function startEditType(t: any) { t.editing=true; t.editName=t.name; }
async function saveEditType(t: any) {
  if (!t.editName?.trim()) return;
  const { error } = await updateActivityType(t.id, { name: t.editName.trim() });
  if (!error) { t.name = t.editName.trim(); t.editing = false; window.$message?.success('已更新'); }
}
function cancelEditType(t: any) { t.editing=false; }
async function deleteType(t: any) { dialog.warning({title:'删除类型',content:`确定要删除「${t.name}」吗？`,positiveText:'确认',negativeText:'取消',positiveButtonProps:{type:'error'} as any,onPositiveClick:async()=>{
  const { error } = await deleteActivityType(t.id);
  if (!error) { window.$message?.success('删除成功'); loadTypes(); }
}}); }
// ========== 查看详情弹窗 ==========
const detailVisible = ref(false);
const detailData = ref<any>({});
async function openDetail(item: any) {
  const { data, error } = await fetchActivity(item.id);
  if (!error && data) {
    detailData.value = data;
    detailVisible.value = true;
  }
}

onMounted(() => { loadTypes(); loadData(); });
</script>

<template>
  <div class="p-16px">
    <!-- 顶部标题栏 -->
    <div class="flex items-center justify-between mb-20px">
      <h2 class="text-22px font-bold">活动管理中心</h2>
      <div class="flex items-center gap-12px">
        <NInput v-model:value="keyword" placeholder="搜索活动名称或ID..." clearable size="small" class="w-240px" @keydown.enter="handleSearch">
          <template #prefix><SvgIcon icon="ph:magnifying-glass" class="op-40" /></template>
        </NInput>
        <NButton v-permission="'activity.create'" type="primary" @click="openCreate">新建活动</NButton>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="flex items-center gap-16px mb-20px flex-wrap">
      <div class="flex items-center gap-8px">
        <span class="text-13px op-60">活动状态:</span>
        <NSelect v-model:value="statusFilter" :options="statusOptions" size="small" class="w-110px" @update:value="handleSearch" />
      </div>
      <div class="flex items-center gap-8px">
        <span class="text-13px op-60">活动类型:</span>
        <NSelect v-model:value="typeFilter" :options="typeOptions" size="small" class="w-130px" @update:value="handleSearch">
          <template #action>
            <div class="flex items-center gap-4px cursor-pointer text-primary text-12px py-4px" @click.stop="openTypeModal">
              <SvgIcon icon="ph:gear" class="text-14px" />
              <span>管理类型</span>
            </div>
          </template>
        </NSelect>
      </div>
      <div class="flex items-center gap-8px">
        <span class="text-13px op-60">排序方式:</span>
        <NSelect v-model:value="sortBy" :options="sortOptions" size="small" class="w-130px" @update:value="handleSearch" />
      </div>
    </div>

    <!-- 活动卡片列表 -->
    <div v-if="activities.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-16px">
      <div v-for="item in activities" :key="item.id" class="activity-card">
        <!-- 封面图 -->
        <div class="card-cover">
          <img v-if="item.cover" :src="item.cover" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex-center">
            <SvgIcon icon="ph:image" class="text-40px text-white op-50" />
          </div>
          <!-- 状态标签 -->
          <span class="status-badge" :style="{ color: getStatusInfo(item.status).color, background: getStatusInfo(item.status).bg }">
            {{ getStatusInfo(item.status).label }}
          </span>
        </div>
        <!-- 信息区 -->
        <div class="card-body">
          <div class="flex items-center justify-between mb-6px">
            <h3 class="text-15px font-bold truncate flex-1">{{ item.title }}</h3>
            <span v-permission="'activity.edit'" class="cursor-pointer op-40 hover:op-80 flex-shrink-0 ml-8px" @click="openEdit(item)">
              <SvgIcon icon="ph:pencil-simple" class="text-16px" />
            </span>
          </div>
          <div class="flex items-center gap-4px text-12px op-50 mb-10px">
            <SvgIcon icon="ph:calendar-blank" class="text-14px" />
            <span>{{ item.startDate }} 至 {{ item.endDate }}</span>
          </div>
          <div class="flex items-center justify-between">
            <a class="flex items-center gap-4px text-12px text-primary cursor-pointer" @click="openDetail(item)">
              <SvgIcon icon="ph:eye" class="text-14px" />
              <span>查看详情</span>
            </a>
            <div class="flex items-center gap-12px">
              <a v-permission="'activity.toggle'" class="flex items-center gap-2px text-12px op-50 hover:op-80 cursor-pointer" @click="handleOffline(item)">
                <SvgIcon :icon="item.status === 'offline' ? 'ph:arrow-up' : 'ph:arrow-down'" class="text-13px" />
                <span>{{ item.status === 'offline' ? '上架' : '下架' }}</span>
              </a>
              <a v-permission="'activity.delete'" class="flex items-center gap-2px text-12px text-red-500 cursor-pointer" @click="handleDelete(item)">
                <SvgIcon icon="ph:trash" class="text-13px" />
                <span>删除</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center py-80px op-40">
      <SvgIcon icon="ph:calendar-x" class="text-48px mb-12px" />
      <span class="text-14px">暂无活动数据</span>
    </div>

    <!-- 分页 -->
    <div v-if="totalRecords > pageSize" class="flex justify-center mt-24px">
      <NPagination v-model:page="currentPage" :page-count="totalPages" />
    </div>

    <!-- 新建/编辑弹窗 -->
    <NModal v-model:show="editVisible" preset="card" :title="editTitle" style="width: 600px;" :bordered="false">
      <div class="flex gap-20px">
        <div class="flex-shrink-0">
          <ImageUpload v-model="editForm.cover" width="160px" height="200px" />
          <div class="text-12px text-primary text-center mt-6px">点击上传封面</div>
        </div>
        <div class="flex-1">
          <NForm label-placement="top" size="small">
            <NFormItem label="活动标题">
              <NInput v-model:value="editForm.title" placeholder="输入活动标题" />
            </NFormItem>
            <NFormItem label="活动时间">
              <div class="flex items-center gap-8px w-full">
                <NDatePicker v-model:value="editForm.startDate" type="date" class="flex-1" />
                <NDatePicker v-model:value="editForm.endDate" type="date" class="flex-1" />
              </div>
            </NFormItem>
            <NFormItem label="活动类型">
              <div class="flex items-center gap-8px w-full">
                <NSelect v-model:value="editForm.typeId" :options="typeFormOptions" placeholder="选择类型" class="flex-1" />
                <NButton size="small" type="primary" @click="openTypeModal">
                  <SvgIcon icon="ph:plus" />
                </NButton>
              </div>
            </NFormItem>
          </NForm>
        </div>
      </div>
      <NFormItem label="活动内容" class="mt-12px">
        <NInput v-model:value="editForm.content" type="textarea" :rows="8" placeholder="请输入活动内容..." />
      </NFormItem>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <NButton @click="editVisible = false">取消</NButton>
          <NButton type="primary" @click="handleSave">保存更改</NButton>
        </div>
      </template>
    </NModal>

    <!-- 活动类型管理弹窗 -->
    <NModal v-model:show="typeModalVisible" preset="card" title="活动类型管理" style="width: 480px;" :bordered="false">
      <div class="mb-16px">
        <div class="text-13px font-500 mb-8px">新类型名称</div>
        <div class="flex items-center gap-8px">
          <NInput v-model:value="newTypeName" placeholder="请输入活动类型名称" class="flex-1" @keydown.enter="addType" />
          <NButton type="primary" @click="addType">保存</NButton>
        </div>
      </div>
      <div>
        <div class="text-13px font-500 mb-8px op-60">已保存类型</div>
        <div v-if="activityTypes.length === 0" class="text-13px op-40 py-16px text-center">暂无类型</div>
        <div v-for="t in activityTypes" :key="t.id" class="flex items-center justify-between py-10px border-b border-gray-100">
          <template v-if="t.editing">
            <NInput v-model:value="t.editName" size="small" class="flex-1 mr-8px" @keydown.enter="saveEditType(t)" />
            <div class="flex gap-4px">
              <NButton size="tiny" type="primary" @click="saveEditType(t)">保存</NButton>
              <NButton size="tiny" @click="cancelEditType(t)">取消</NButton>
            </div>
          </template>
          <template v-else>
            <span class="text-14px">{{ t.name }}</span>
            <div class="flex items-center gap-8px">
              <span class="cursor-pointer op-40 hover:op-80" @click="startEditType(t)">
                <SvgIcon icon="ph:pencil-simple" class="text-15px" />
              </span>
              <span class="cursor-pointer op-40 hover:op-80 text-red-500" @click="deleteType(t)">
                <SvgIcon icon="ph:trash" class="text-15px" />
              </span>
            </div>
          </template>
        </div>
      </div>
    </NModal>

    <!-- 查看详情弹窗 -->
    <NModal v-model:show="detailVisible" preset="card" title="活动详情" style="width: 600px;" :bordered="false">
      <div v-if="detailData.cover" class="mb-16px rounded-8px overflow-hidden" style="height: 200px;">
        <img :src="detailData.cover" class="w-full h-full object-cover" />
      </div>
      <div class="flex items-center gap-8px mb-12px">
        <span class="text-12px px-8px py-2px rounded-4px" :style="{ color: getStatusInfo(detailData.status).color, background: getStatusInfo(detailData.status).bg }">
          {{ getStatusInfo(detailData.status).label }}
        </span>
        <span class="text-12px op-50">{{ detailData.startDate }} 至 {{ detailData.endDate }}</span>
      </div>
      <h3 class="text-16px font-bold mb-12px">{{ detailData.title }}</h3>
      <div v-if="detailData.typeName" class="text-12px op-50 mb-12px">类型：{{ detailData.typeName }}</div>
      <div v-if="detailData.content" class="text-13px leading-relaxed" v-html="detailData.content"></div>
      <div v-else class="text-13px op-40">暂无活动内容</div>
    </NModal>
  </div>
</template>

<style scoped>
.activity-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s, transform 0.2s;
}
.activity-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.card-cover {
  position: relative;
  height: 180px;
  overflow: hidden;
}
.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.card-body {
  padding: 14px 16px 16px;
}
</style>
