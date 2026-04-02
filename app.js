// 有知有行风格 - 完整功能实现

// ==================== 页面切换 ====================
function showPage(pageId) {
    // 函数内容（5-41行）...
}

// ==================== 知识卡片轮播 ====================
const knowledgeCards = [
    // 卡片数据（46-81行）...
];

let currentKnowledgeIndex = 0;

function nextKnowledgeCard() {
    // 函数内容（86-93行）...
}

// ==================== 财务工具 - 养老金计算器 ====================
function calculatePension() {
    // 函数内容（98-135行）...
}

// ==================== 财务工具 - 存款计算器 ====================
function calculateSavings() {
    // 函数内容（140-166行）...
}

// ==================== 财务工具 - 现金流计算器 ====================
function calculateCashflow() {
    // 函数内容（171-196行）...
}

// ==================== 工具标签页切换 ====================
function switchToolTab(tabId) {
    // 函数内容（201-215行）...
}

// ==================== 资产配置标签页切换 ====================
function switchPortfolioTab(tabId) {
    // 函数内容（220-234行）...
}

// ==================== 基金数据 ====================
const fundData = [
    // 基金数据（239-320行）...
];

// ==================== 基金列表渲染 ====================
function renderFundList() {
    // 函数内容（325-380行）...
}

function filterFunds() {
    // 函数内容（385-388行）...
}

// ==================== 基金详情 ====================
function showFundDetail(fund) {
    // 函数内容（393-434行）...
}

function closeFundDetail() {
    // 函数内容（439-446行）...
}

// ==================== 市场温度计动画 ====================
function animateTemperature() {
    // 函数内容（451-468行）...
}

// ==================== 工具函数 ====================
function formatNumber(num) {
    // 函数内容（473-476行）...
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    // 初始化代码（481-490行）...
});

// ==================== 学习进度更新 ====================
function updateLearningProgress() {
    // 函数内容（495-507行）...
}

// ==================== 欢迎提示 ====================
function showWelcomeMessage() {
    // 函数内容（512-515行）...
}

// 页面加载完成后显示欢迎信息
window.addEventListener('load', showWelcomeMessage);

// ==================== 添加到主屏幕提示 ====================
let deferredPrompt;
const addBtn = document.querySelector('.add-button');
addBtn.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
    // 代码内容（527-548行）...
});

// ==================== 数据持久化 ====================
function saveUserData() {
    // 函数内容（553-563行）...
}

function loadUserData() {
    // 函数内容（568-577行）...
}

// 页面加载时读取数据
window.addEventListener('load', loadUserData);

// 页面卸载时保存数据
window.addEventListener('beforeunload', saveUserData);

console.log('有知有行 - 应用初始化完成');
