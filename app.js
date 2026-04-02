// 页面元素绑定（修复DOM获取）
const pages = {
    portfolio: document.getElementById('portfolioPage'),
    market: document.getElementById('marketPage'),
    financial: document.getElementById('financialPage'),
    selection: document.getElementById('selectionPage'),
    detail: document.getElementById('detailPage')
};
const navItems = {
    portfolio: document.getElementById('nav-portfolio'),
    market: document.getElementById('nav-market'),
    financial: document.getElementById('nav-financial'),
    selection: document.getElementById('nav-selection')
};

// 核心页面切换函数（修复点击无反应）
function switchPage(targetPage) {
    // 1. 隐藏所有页面
    Object.values(pages).forEach(page => {
        page.classList.remove('active');
    });
    // 2. 清除所有导航激活态
    Object.values(navItems).forEach(nav => {
        nav.classList.remove('active');
    });
    // 3. 激活目标页面和对应导航
    pages[targetPage].classList.add('active');
    navItems[targetPage].classList.add('active');

    // 4. 大盘页面自动加载数据
    if (targetPage === 'market') {
        loadMarketIndex();
    }
}

// 绑定导航点击事件（修复Tab点击）
navItems.portfolio.addEventListener('click', () => switchPage('portfolio'));
navItems.market.addEventListener('click', () => switchPage('market'));
navItems.financial.addEventListener('click', () => switchPage('financial'));
navItems.selection.addEventListener('click', () => switchPage('selection'));

// Tushare Token 管理
const TOKEN_KEY = 'TUSHARE_TOKEN';
let token = localStorage.getItem(TOKEN_KEY) || '';

// 弹窗元素
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveTokenBtn = document.getElementById('saveToken');
const tokenInput = document.getElementById('tushareToken');

// 打开/关闭弹窗
document.querySelector('.btn-refresh')?.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    tokenInput.value = token;
});
closeSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

// 保存Token
saveTokenBtn.addEventListener('click', () => {
    const newToken = tokenInput.value.trim();
    if (!newToken) {
        alert('请输入有效的Tushare Token');
        return;
    }
    localStorage.setItem(TOKEN_KEY, newToken);
    token = newToken;
    alert('Token保存成功');
    settingsModal.style.display = 'none';
    filterStocks();
});

// 加载四大盘指数（修复大盘页面）
async function loadMarketIndex() {
    if (!token) {
        alert('请先在设置中填写Tushare Token');
        return;
    }

    const indexList = [
        { code: '000001.SH', name: '上证指数' },
        { code: '399001.SZ', name: '深证成指' },
        { code: '399006.SZ', name: '创业板指' },
        { code: '000688.SH', name: '科创50' }
    ];

    const marketList = document.getElementById('marketList');
    marketList.innerHTML = '<p style="color:#a0a0a0;text-align:center;">加载中...</p>';

    try {
        let html = '';
        for (const item of indexList) {
            const res = await fetch('https://api.tushare.pro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_name: 'index_daily',
                    token: token,
                    params: { ts_code: item.code }
                })
            });
            const data = await res.json();
            if (!data.data || !data.data.items || data.data.items.length === 0) continue;

            const latest = data.data.items[0];
            const pctChg = latest[6] || 0;
            const isUp = pctChg >= 0;

            html += `
            <div class="market-card">
                <div class="market-name">${item.name}</div>
                <div class="market-price">${latest[4]}</div>
                <div class="market-change ${isUp ? 'up' : 'down'}">
                    ${isUp ? '+' : ''}${pctChg.toFixed(2)}%
                </div>
            </div>
            `;
        }
        marketList.innerHTML = html || '<p style="color:#a0a0a0;text-align:center;">暂无数据</p>';
    } catch (err) {
        marketList.innerHTML = '<p style="color:#e94560;text-align:center;">加载失败，请检查Token</p>';
        console.error(err);
    }
}

// 选股筛选（完全保留原有逻辑）
async function filterStocks() {
    if (!token) {
        alert('请先在设置中填写Tushare Token');
        return;
    }

    const maxPe = parseFloat(document.getElementById('maxPe').value) || 999;
    const minRoe = parseFloat(document.getElementById('minRoe').value) || 0;
    const minGross = parseFloat(document.getElementById('minGross').value) || 0;
    const industry = document.getElementById('industry').value;

    const stockResult = document.getElementById('stockResult');
    stockResult.innerHTML = '<p style="color:#a0a0a0;text-align:center;">筛选中...</p>';

    // 示例数据（可替换为真实接口）
    const mockStocks = [
        { ts_code: '600660.SH', name: '福耀玻璃', pe: 18.3, roe: 19.2, gross: 35.6, price: 36.18, industry: '消费' },
        { ts_code: '000858.SZ', name: '五粮液', pe: 25.4, roe: 24.1, gross: 72.3, price: 145.67, industry: '消费' },
        { ts_code: '600519.SH', name: '贵州茅台', pe: 28.9, roe: 28.5, gross: 91.2, price: 1680.00, industry: '消费' },
        { ts_code: '000333.SZ', name: '美的集团', pe: 14.5, roe: 21.6, gross: 25.8, price: 65.32, industry: '家电' }
    ];

    // 筛选逻辑
    const filtered = mockStocks.filter(stock => {
        if (stock.pe > maxPe) return false;
        if (stock.roe < minRoe) return false;
        if (stock.gross < minGross) return false;
        if (industry !== 'all' && stock.industry !== industry) return false;
        return true;
    });

    // 渲染结果
    if (filtered.length === 0) {
        stockResult.innerHTML = '<p style="color:#a0a0a0;text-align:center;">没有符合条件的股票</p>';
        return;
    }

    let html = '';
    filtered.forEach(stock => {
        html += `
        <div class="stock-item" onclick="goStockDetail('${stock.ts_code}','${stock.name}')">
            <div class="stock-info">
                <h4>${stock.name}</h4>
                <p>${stock.ts_code.split('.')[0]} | PE: ${stock.pe} | ROE: ${stock.roe}%</p>
            </div>
            <div class="stock-price">¥${stock.price}</div>
        </div>
        `;
    });
    stockResult.innerHTML = html;
}

// 打开个股详情（修复点击股票跳转）
async function goStockDetail(tsCode, stockName) {
    switchPage('detail');
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = '<p style="color:#a0a0a0;text-align:center;">加载中...</p>';

    try {
        // 个股行情
        const dailyRes = await fetch('https://api.tushare.pro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_name: 'daily',
                token: token,
                params: { ts_code: tsCode }
            })
        });
        const dailyData = await dailyRes.json();
        const latestDay = dailyData.data?.items?.[0] || {};

        // 财务指标
        const finaRes = await fetch('https://api.tushare.pro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_name: 'fina_indicator',
                token: token,
                params: { ts_code: tsCode }
            })
        });
        const finaData = await finaRes.json();
        const latestFina = finaData.data?.items?.[0] || {};

        const pctChg = latestDay[5] || 0;
        const isUp = pctChg >= 0;

        // 渲染详情
        detailContent.innerHTML = `
        <h2>${stockName}（${tsCode.split('.')[0]}）</h2>
        <div class="detail-price ${isUp ? 'up' : 'down'}">${latestDay[2] || '--'}</div>
        <div class="detail-change ${isUp ? 'up' : 'down'}">
            ${isUp ? '+' : ''}${pctChg.toFixed(2)}%
        </div>
        <div class="detail-info">
            <div class="detail-info-item"><span>ROE</span><span>${latestFina[1] || '--'}%</span></div><div class="detail-info-item"><span>净资产收益率</span><span>${latestFina[1] || '--'}%</span></div>
            <div class="detail-info-item"><span>毛利率</span><span>${latestFina[2] || '--'}%</span></div>
            <div class="detail-info-item"><span>净利率</span><span>${latestFina[3] || '--'}%</span></div>净利润率${latestFina[3]||'--'}%
            <div class="detail-info-item"><span>PE</span><span>${latestFina[4] || '--'}</span></div>
            <div class="detail-info-item"><span>PB</span><span>${latestFina[5] || '--'}</span></div>
        </div>
        <div class="detail-info" style="margin-top:16px;">
            <h3>财报点评</h3>
            <div style="margin-top:10px;">
                ${(latestFina[1] || 0) >= 15 ? '✅ ROE优秀，赚钱能力强' : '⚠️ ROE偏低'}<br><br>
                ${(latestFina[2] || 0) >= 30 ? '✅ 毛利率高，有护城河' : '⚠️ 毛利率一般'}<br><br>
                ${(latestFina[4] || 99) < 30 ? '✅ 估值合理' : '⚠️ 估值偏高'}
            </div>
        </div>
        `;
    } catch (err) {
        detailContent.innerHTML = '<p style="color:#e94560;text-align:center;">加载失败，请检查Token</p>';
        console.error(err);控制台.错误(错误);
    }
}

// 返回选股页
function backToSelect() {函数 返回到选择() {
    switchPage('selection');
}

// 绑定筛选按钮
document.getElementById('filterBtn').addEventListener('click', filterStocks);document.getElementById('filterBtn')addEventListener('click',filterStocks);

// 初始化
filterStocks();
