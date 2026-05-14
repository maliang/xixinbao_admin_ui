/**
 * 管理端 API 接口
 * 所有接口基于 /api/admin 前缀（已在 baseURL 中配置）
 */
import { request } from '../request';

// ==================== 仪表板 ====================
export function fetchDashboardSummary() {
  return request({ url: '/dashboard/summary' });
}
export function fetchDashboardToday() {
  return request({ url: '/dashboard/today' });
}
export function fetchDashboardReport() {
  return request({ url: '/dashboard/report' });
}
export function fetchDashboardDaily(params: Record<string, any>) {
  return request({ url: '/dashboard/daily', params });
}
export function fetchPendingCounts() {
  return request({ url: '/dashboard/pending-counts' });
}

// ==================== 用户管理 ====================
export function fetchUsers(params: Record<string, any>) {
  return request({ url: '/users', params });
}
export function fetchUser(id: number) {
  return request({ url: `/users/${id}` });
}
export function updateUser(id: number, data: Record<string, any>) {
  return request({ url: `/users/${id}`, method: 'put', data });
}
export function createUser(data: Record<string, any>) {
  return request({ url: '/users', method: 'post', data });
}
export function updateUserStatus(id: number, data: Record<string, any>) {
  return request({ url: `/users/${id}/status`, method: 'put', data });
}
export function deleteUser(id: number) {
  return request({ url: `/users/${id}`, method: 'delete' });
}
export function adjustUserBalance(data: Record<string, any>) {
  return request({ url: '/users/adjust-balance', method: 'post', data });
}

// ==================== 登录记录 ====================
export function fetchLoginLogs(params: Record<string, any>) {
  return request({ url: '/login-logs', params });
}

// ==================== 在线会员 ====================
export function fetchOnlineUsers(params: Record<string, any>) {
  return request({ url: '/online-users', params });
}
export function kickOnlineUser(id: number) {
  return request({ url: `/online-users/${id}/kick`, method: 'post' });
}

// ==================== 实名管理 ====================
export function fetchKycList(params: Record<string, any>) {
  return request({ url: '/kyc', params });
}
export function fetchKycDetail(id: number) {
  return request({ url: `/kyc/${id}` });
}
export function reviewKyc(id: number, data: Record<string, any>) {
  return request({ url: `/kyc/${id}/review`, method: 'post', data });
}
export function deleteKyc(id: number) {
  return request({ url: `/kyc/${id}`, method: 'delete' });
}

// ==================== 钱包管理 ====================
export function fetchBankWallets(params: Record<string, any>) {
  return request({ url: '/wallets/banks', params });
}
export function fetchCryptoWallets(params: Record<string, any>) {
  return request({ url: '/wallets/cryptos', params });
}
export function updateWallet(id: number, data: Record<string, any>) {
  return request({ url: `/wallets/${id}`, method: 'put', data });
}
export function deleteWallet(id: number) {
  return request({ url: `/wallets/${id}`, method: 'delete' });
}

// ==================== 会员等级 ====================
export function fetchLevels(params?: Record<string, any>) {
  return request({ url: '/levels', params });
}
export function createLevel(data: Record<string, any>) {
  return request({ url: '/levels', method: 'post', data });
}
export function updateLevel(id: number, data: Record<string, any>) {
  return request({ url: `/levels/${id}`, method: 'put', data });
}
export function deleteLevel(id: number) {
  return request({ url: `/levels/${id}`, method: 'delete' });
}

// ==================== 会员关系 ====================
export function searchRelation(keyword: string) {
  return request({ url: '/relations/search', params: { keyword } });
}
export function fetchRelationParent(id: number) {
  return request({ url: `/relations/${id}/parent` });
}
export function fetchRelationChildren(id: number, params?: Record<string, any>) {
  return request({ url: `/relations/${id}/children`, params });
}
export function fetchRelationTeamStats(id: number) {
  return request({ url: `/relations/${id}/team-stats` });
}

// ==================== 签到管理 ====================
export function fetchCheckinSettings() {
  return request({ url: '/checkin/settings' });
}
export function saveCheckinSettings(data: Record<string, any>) {
  return request({ url: '/checkin/settings', method: 'put', data });
}
export function fetchCheckinLogs(params: Record<string, any>) {
  return request({ url: '/checkin/logs', params });
}
export function fetchCheckinStats() {
  return request({ url: '/checkin/stats' });
}

// ==================== 充值审核 ====================
export function fetchRechargePending(params: Record<string, any>) {
  return request({ url: '/recharge/pending', params });
}
export function fetchRechargeHistory(params: Record<string, any>) {
  return request({ url: '/recharge/history', params });
}
export function fetchRechargeDetail(id: number) {
  return request({ url: `/recharge/${id}` });
}
export function reviewRecharge(id: number, data: Record<string, any>) {
  return request({ url: `/recharge/${id}/review`, method: 'post', data });
}
export function deleteRecharge(id: number) {
  return request({ url: `/recharge/${id}`, method: 'delete' });
}
export function batchDeleteRecharge(ids: number[]) {
  return request({ url: '/recharge/batch', method: 'delete', data: { ids } });
}

// ==================== 提现审核 ====================
export function fetchWithdrawPending(params: Record<string, any>) {
  return request({ url: '/withdraw/pending', params });
}
export function fetchWithdrawHistory(params: Record<string, any>) {
  return request({ url: '/withdraw/history', params });
}
export function fetchWithdrawDetail(id: number) {
  return request({ url: `/withdraw/${id}` });
}
export function reviewWithdraw(id: number, data: Record<string, any>) {
  return request({ url: `/withdraw/${id}/review`, method: 'post', data });
}
export function deleteWithdraw(id: number) {
  return request({ url: `/withdraw/${id}`, method: 'delete' });
}

// ==================== 流水记录 ====================
export function fetchTransactions(params: Record<string, any>) {
  return request({ url: '/transactions', params });
}

// ==================== 转盘记录 ====================
export function fetchSpinRecords(params: Record<string, any>) {
  return request({ url: '/spin-records', params });
}
export function fetchSpinStats() {
  return request({ url: '/spin-records/stats' });
}
export function updateSpinRecord(id: number, data: Record<string, any>) {
  return request({ url: `/spin-records/${id}`, method: 'put', data });
}

// ==================== 项目分类 ====================
export function fetchProjectCategories(params?: Record<string, any>) {
  return request({ url: '/project-categories', params });
}
export function fetchProjectCategoryDetail(id: number) {
  return request({ url: `/project-categories/${id}` });
}
export function createProjectCategory(data: Record<string, any>) {
  return request({ url: '/project-categories', method: 'post', data });
}
export function updateProjectCategory(id: number, data: Record<string, any>) {
  return request({ url: `/project-categories/${id}`, method: 'put', data });
}
export function deleteProjectCategory(id: number) {
  return request({ url: `/project-categories/${id}`, method: 'delete' });
}
export function toggleProjectCategoryStatus(id: number) {
  return request({ url: `/project-categories/${id}/status`, method: 'put' });
}

// ==================== 担保机构 ====================
export function fetchGuarantors(params?: Record<string, any>) {
  return request({ url: '/guarantors', params });
}
export function fetchGuarantorDetail(id: number) {
  return request({ url: `/guarantors/${id}` });
}
export function createGuarantor(data: Record<string, any>) {
  return request({ url: '/guarantors', method: 'post', data });
}
export function updateGuarantor(id: number, data: Record<string, any>) {
  return request({ url: `/guarantors/${id}`, method: 'put', data });
}
export function deleteGuarantor(id: number) {
  return request({ url: `/guarantors/${id}`, method: 'delete' });
}

// ==================== 项目管理 ====================
export function fetchProjects(params: Record<string, any>) {
  return request({ url: '/projects', params });
}
export function fetchProject(id: number) {
  return request({ url: `/projects/${id}` });
}
export function createProject(data: Record<string, any>) {
  return request({ url: '/projects', method: 'post', data });
}
export function updateProject(id: number, data: Record<string, any>) {
  return request({ url: `/projects/${id}`, method: 'put', data });
}
export function toggleProject(id: number, data: Record<string, any>) {
  return request({ url: `/projects/${id}/toggle`, method: 'put', data });
}
export function deleteProject(id: number) {
  return request({ url: `/projects/${id}`, method: 'delete' });
}

// ==================== 项目订单 ====================
export function fetchProjectOrders(params: Record<string, any>) {
  return request({ url: '/project-orders', params });
}
export function fetchProjectOrder(id: number) {
  return request({ url: `/project-orders/${id}` });
}
export function updateProjectOrder(id: number, data: Record<string, any>) {
  return request({ url: `/project-orders/${id}`, method: 'put', data });
}
export function deleteProjectOrder(id: number) {
  return request({ url: `/project-orders/${id}`, method: 'delete' });
}
export function batchRebateOrders(ids: number[]) {
  return request({ url: '/project-orders/batch-rebate', method: 'post', data: { ids } });
}
export function rebateOrder(id: number) {
  return request({ url: `/project-orders/${id}/rebate`, method: 'post' });
}

// ==================== 商品分类 ====================
export function fetchMallCategories(params?: Record<string, any>) {
  return request({ url: '/mall-categories', params });
}
export function fetchMallCategoryDetail(id: number) {
  return request({ url: `/mall-categories/${id}` });
}
export function createMallCategory(data: Record<string, any>) {
  return request({ url: '/mall-categories', method: 'post', data });
}
export function updateMallCategory(id: number, data: Record<string, any>) {
  return request({ url: `/mall-categories/${id}`, method: 'put', data });
}
export function deleteMallCategory(id: number) {
  return request({ url: `/mall-categories/${id}`, method: 'delete' });
}
export function sortMallCategories(items: { id: number; sort: number }[]) {
  return request({ url: '/mall-categories/sort', method: 'put', data: { items } });
}

// ==================== 商品管理 ====================
export function fetchMallGoods(params: Record<string, any>) {
  return request({ url: '/mall-goods', params });
}
export function fetchMallGoodsDetail(id: number) {
  return request({ url: `/mall-goods/${id}` });
}
export function createMallGoods(data: Record<string, any>) {
  return request({ url: '/mall-goods', method: 'post', data });
}
export function updateMallGoods(id: number, data: Record<string, any>) {
  return request({ url: `/mall-goods/${id}`, method: 'put', data });
}
export function deleteMallGoods(id: number) {
  return request({ url: `/mall-goods/${id}`, method: 'delete' });
}

// ==================== 发货管理 ====================
export function fetchShippingOrders(params: Record<string, any>) {
  return request({ url: '/shipping', params });
}
export function fetchShippingDetail(id: number) {
  return request({ url: `/shipping/${id}/detail` });
}
export function updateShippingLogistics(id: number, data: Record<string, any>) {
  return request({ url: `/shipping/${id}/logistics`, method: 'put', data });
}

// ==================== 站内消息 ====================
export function fetchMessages(params: Record<string, any>) {
  return request({ url: '/messages', params });
}
export function fetchMessageDetail(id: number) {
  return request({ url: `/messages/${id}` });
}
export function createMessage(data: Record<string, any>) {
  return request({ url: '/messages', method: 'post', data });
}
export function updateMessage(id: number, data: Record<string, any>) {
  return request({ url: `/messages/${id}`, method: 'put', data });
}
export function deleteMessage(id: number) {
  return request({ url: `/messages/${id}`, method: 'delete' });
}
export function sendMessage(id: number) {
  return request({ url: `/messages/${id}/send`, method: 'post' });
}

// ==================== 弹窗管理 ====================
export function fetchPopups(params?: Record<string, any>) {
  return request({ url: '/popups', params });
}
export function fetchPopupDetail(id: number) {
  return request({ url: `/popups/${id}` });
}
export function createPopup(data: Record<string, any>) {
  return request({ url: '/popups', method: 'post', data });
}
export function updatePopup(id: number, data: Record<string, any>) {
  return request({ url: `/popups/${id}`, method: 'put', data });
}
export function deletePopup(id: number) {
  return request({ url: `/popups/${id}`, method: 'delete' });
}

// ==================== 轮播消息 ====================
export function fetchMarquees(params?: Record<string, any>) {
  return request({ url: '/marquees', params });
}
export function fetchMarqueeDetail(id: number) {
  return request({ url: `/marquees/${id}` });
}
export function createMarquee(data: Record<string, any>) {
  return request({ url: '/marquees', method: 'post', data });
}
export function updateMarquee(id: number, data: Record<string, any>) {
  return request({ url: `/marquees/${id}`, method: 'put', data });
}
export function deleteMarquee(id: number) {
  return request({ url: `/marquees/${id}`, method: 'delete' });
}
export function toggleMarquee(id: number) {
  return request({ url: `/marquees/${id}/toggle`, method: 'put' });
}

// ==================== 静态页面 ====================
export function fetchStaticPages(params?: Record<string, any>) {
  return request({ url: '/pages', params });
}
export function fetchStaticPage(slug: string) {
  return request({ url: `/pages/${slug}` });
}
export function createStaticPage(data: Record<string, any>) {
  return request({ url: '/pages', method: 'post', data });
}
export function updateStaticPage(slug: string, data: Record<string, any>) {
  return request({ url: `/pages/${slug}`, method: 'put', data });
}
export function deleteStaticPage(slug: string) {
  return request({ url: `/pages/${slug}`, method: 'delete' });
}

// ==================== 新闻管理 ====================
export function fetchNewsList(params: Record<string, any>) {
  return request({ url: '/news', params });
}
export function fetchNewsDetail(id: number) {
  return request({ url: `/news/${id}` });
}
export function createNews(data: Record<string, any>) {
  return request({ url: '/news', method: 'post', data });
}
export function updateNews(id: number, data: Record<string, any>) {
  return request({ url: `/news/${id}`, method: 'put', data });
}
export function deleteNews(id: number) {
  return request({ url: `/news/${id}`, method: 'delete' });
}

// ==================== 新闻分类 ====================
export function fetchNewsCategories() {
  return request({ url: '/news-categories' });
}
export function createNewsCategory(data: Record<string, any>) {
  return request({ url: '/news-categories', method: 'post', data });
}
export function updateNewsCategory(id: number, data: Record<string, any>) {
  return request({ url: `/news-categories/${id}`, method: 'put', data });
}
export function deleteNewsCategory(id: number) {
  return request({ url: `/news-categories/${id}`, method: 'delete' });
}

// ==================== 快速处理中心 ====================
export function fetchQuickProcess(params?: Record<string, any>) {
  return request({ url: '/quick-process', params });
}

// ==================== 文件上传 ====================
export function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request({
    url: '/upload/image',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// ==================== 活动管理 ====================
export function fetchActivities(params: Record<string, any>) {
  return request({ url: '/activities', params });
}
export function fetchActivity(id: number) {
  return request({ url: `/activities/${id}` });
}
export function createActivity(data: Record<string, any>) {
  return request({ url: '/activities', method: 'post', data });
}
export function updateActivity(id: number, data: Record<string, any>) {
  return request({ url: `/activities/${id}`, method: 'put', data });
}
export function toggleActivity(id: number) {
  return request({ url: `/activities/${id}/toggle`, method: 'put' });
}
export function deleteActivity(id: number) {
  return request({ url: `/activities/${id}`, method: 'delete' });
}

// ==================== 活动类型 ====================
export function fetchActivityTypes() {
  return request({ url: '/activity-types' });
}
export function createActivityType(data: Record<string, any>) {
  return request({ url: '/activity-types', method: 'post', data });
}
export function updateActivityType(id: number, data: Record<string, any>) {
  return request({ url: `/activity-types/${id}`, method: 'put', data });
}
export function deleteActivityType(id: number) {
  return request({ url: `/activity-types/${id}`, method: 'delete' });
}

// ==================== 代理管理 ====================
export function fetchAgents(params: Record<string, any>) {
  return request({ url: '/agents', params });
}
export function createAgent(data: Record<string, any>) {
  return request({ url: '/agents', method: 'post', data });
}
export function updateAgent(id: number, data: Record<string, any>) {
  return request({ url: `/agents/${id}`, method: 'put', data });
}
export function deleteAgent(id: number) {
  return request({ url: `/agents/${id}`, method: 'delete' });
}

// ==================== 代理报表 ====================
export function fetchAgentReportSummary(params?: Record<string, any>) {
  return request({ url: '/agent-report/summary', params });
}
export function fetchAgentReport(params: Record<string, any>) {
  return request({ url: '/agent-report', params });
}

// ==================== 余额宝产品 ====================
export function fetchBalanceProducts() {
  return request({ url: '/balance-products' });
}
export function fetchBalanceProductDetail(id: number) {
  return request({ url: `/balance-products/${id}` });
}
export function createBalanceProduct(data: Record<string, any>) {
  return request({ url: '/balance-products', method: 'post', data });
}
export function updateBalanceProduct(id: number, data: Record<string, any>) {
  return request({ url: `/balance-products/${id}`, method: 'put', data });
}
export function toggleBalanceProduct(id: number) {
  return request({ url: `/balance-products/${id}/toggle`, method: 'put' });
}
export function deleteBalanceProduct(id: number) {
  return request({ url: `/balance-products/${id}`, method: 'delete' });
}

// ==================== 余额宝订单 ====================
export function fetchBalanceOrderSummary() {
  return request({ url: '/balance-orders/summary' });
}
export function fetchBalanceOrders(params: Record<string, any>) {
  return request({ url: '/balance-orders', params });
}
export function redeemBalanceOrder(id: number, data?: Record<string, any>) {
  return request({ url: `/balance-orders/${id}/redeem`, method: 'post', data });
}

// ==================== 操作日志 ====================
export function fetchOperationLogs(params: Record<string, any>) {
  return request({ url: '/operation-logs', params });
}

// ==================== 管理员用户 ====================
export function fetchAdminUsers(params: Record<string, any>) {
  return request({ url: '/admin-users', params });
}
export function createAdminUser(data: Record<string, any>) {
  return request({ url: '/admin-users', method: 'post', data });
}
export function updateAdminUser(id: number, data: Record<string, any>) {
  return request({ url: `/admin-users/${id}`, method: 'put', data });
}
export function deleteAdminUser(id: number) {
  return request({ url: `/admin-users/${id}`, method: 'delete' });
}

// ==================== 角色管理（系统角色） ====================
export function fetchRoles(params?: Record<string, any>) {
  return request({ url: '/roles', params });
}
export function createRole(data: Record<string, any>) {
  return request({ url: '/roles', method: 'post', data });
}
export function updateRole(id: number, data: Record<string, any>) {
  return request({ url: `/roles/${id}`, method: 'put', data });
}
export function deleteRole(id: number) {
  return request({ url: `/roles/${id}`, method: 'delete' });
}

// ==================== 角色管理（代理角色） ====================
export function fetchAgentRoles(params?: Record<string, any>) {
  return request({ url: '/agent-roles', params });
}
export function createAgentRole(data: Record<string, any>) {
  return request({ url: '/agent-roles', method: 'post', data });
}
export function updateAgentRole(id: number, data: Record<string, any>) {
  return request({ url: `/agent-roles/${id}`, method: 'put', data });
}
export function deleteAgentRole(id: number) {
  return request({ url: `/agent-roles/${id}`, method: 'delete' });
}

// ==================== 权限管理 ====================
export function fetchPermissions() {
  return request({ url: '/permissions' });
}
export function createPermission(data: Record<string, any>) {
  return request({ url: '/permissions', method: 'post', data });
}
export function updatePermission(id: number, data: Record<string, any>) {
  return request({ url: `/permissions/${id}`, method: 'put', data });
}
export function deletePermission(id: number) {
  return request({ url: `/permissions/${id}`, method: 'delete' });
}

// ==================== 支付通道 ====================
export function fetchPayChannels(params: Record<string, any>) {
  return request({ url: '/pay-channels', params });
}
export function createPayChannel(data: Record<string, any>) {
  return request({ url: '/pay-channels', method: 'post', data });
}
export function updatePayChannel(id: number, data: Record<string, any>) {
  return request({ url: `/pay-channels/${id}`, method: 'put', data });
}
export function deletePayChannel(id: number) {
  return request({ url: `/pay-channels/${id}`, method: 'delete' });
}

// ==================== 系统设置 ====================
export function fetchSettings() {
  return request({ url: '/settings' });
}
export function saveSettings(items: Record<string, any>[]) {
  return request({ url: '/settings', method: 'post', data: { items } });
}

// ==================== 多语言管理 ====================
/** 语言项类型 */
export interface LocaleItem {
  id: number;
  code: string;
  label: string;
  sort: number;
  status: number;
}

/** 获取启用的语言列表（供 Language Tab 使用） */
export function fetchActiveLocales() {
  return request<LocaleItem[]>({ url: '/locales/active' });
}

// ==================== 轮播图管理 ====================
export function fetchBanners() {
  return request({ url: '/banners' });
}
export function fetchBannerDetail(id: number) {
  return request({ url: `/banners/${id}` });
}
export function createBanner(data: Record<string, any>) {
  return request({ url: '/banners', method: 'post', data });
}
export function updateBanner(id: number, data: Record<string, any>) {
  return request({ url: `/banners/${id}`, method: 'put', data });
}
export function deleteBanner(id: number) {
  return request({ url: `/banners/${id}`, method: 'delete' });
}
