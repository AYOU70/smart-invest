// 页面切换逻辑
const pages = {
    portfolio: document.getElementById('portfolioPage'),
    market: document.getElementById('marketPage'),
    financial: document.getElementById('financialPage'),
    selection: document.getElementById('selectionPage'),
    detail: document.getElementById('detailPage')
};
const tabs = {
    portfolio: document.getElementById('tab-portfolio'),
    market: document.getElementById('tab-market'),
    financial: document.getElementById('tab-financial'),
    selection: document.getElementById('tab-selection')
};

// 切换页面
function switchTab(tabName) {
    // 隐藏所有页面
    Object.values(pages).forEach(page => {
        page.classList.remove('active');
    });
    Object.values(tabs).forEach(tab => {
        tab.classList.remove('active');
    });

    // 显示目标页面
    if (tabName === 'market') {
        pages.market.classList.add('active');
        tabs.market.classList.add('active');
        loadMarketIndex();
    } else if (tabName === 'detail') {
        pages.detail.classList.add('active');
    } else {
        pages[tabName].classList.add('active');
        tabs[tabName].classList.add('active');
    }
}

// 绑定导航点击
Object.keys(tabs).forEach(key => {
    tabs[key].addEventListener('click', () => {
        if (key !== 'market') switchTab(key);
    });
});

// Tushare Token 管理
const TOKEN_KEY = 'TUSHARE_TOKEN';
let token = localStorage.getItem(TOKEN_KEY) || '';

// 弹窗元素
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveTokenBtn = document.getElementById('saveToken');
const tokenInput = document.getElementById('tushareToken');

// 打开/关闭弹窗
document.querySelector('.btn-refresh').addEventListener('click', () => {
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
    // 刷新选股数据
    filterStocks();
});

// 加载大盘指数
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
        for (const index of indexList) {
            const res = await fetch('https://api.tushare.pro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_name: 'index_daily',
                    token: token,
                    params: { ts_code: index.code, start_date: '20250101', end_date: '20251231' }
                })
            });
            const data = await res.json();
            if (!data.data || !data.data.items || data.data.items.length === 0) continue;

            const latest = data.data.items[0];
            const pctChg = latest[6] || 0;
            const isUp = pctChg >= 0;

            html += `
            <div class="market-card">
                <div class="market-name">${index.name}</div>
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

// 选股筛选
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

    try {
        // 这里用示例数据，实际可调用Tushare接口获取全量股票数据
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
            <div class="stock-item" onclick="goStockDetail('${stock.ts_code}')">
                <div class="stock-info">
                    <h4>${stock.name}</h4>
                    <p>${stock.ts_code.split('.')[0]} | PE: ${stock.pe} | ROE: ${stock.roe}%</p>
                </div>
                <div class="stock-price">¥${stock.price}</div>
            </div>
            `;
        });
        stockResult.innerHTML = html;
    } catch (err) {
        stockResult.innerHTML = '<p style="color:#e94560;text-align:center;">筛选失败，请检查Token</p>';
        console.error(err);
    }
}

// 打开个股详情
async function goStockDetail(tsCode) {
    switchTab('detail');
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = '<p style="color:#a0a0a0;text-align:center;">加载中...</p>';

    try {
        // 获取个股行情
        const dayRes = await fetch('https://api.tushare.pro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_name: 'daily',
                token: token,
                params: { ts_code: tsCode, start_date: '20250101', end_date: '20251231' }
            })
        });
        const dayData = await dayRes.json();
        const latestDay = dayData.data?.items?.[0] || {};

        // 获取个股财务指标
        const finaRes = await fetch('https://api.tushare.pro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_name: 'fina_indicator',
                token: token,
                params: { ts_code: tsCode, start_date: '20250101', end_date: '20251231' }
            })
        });
        const finaData = await finaRes.json();
        const latestFina = finaData.data?.items?.[0] || {};

        const pctChg = latestDay[5] || 0;
        const isUp = pctChg >= 0;

        // 渲染详情
        detailContent.innerHTML = `
        <div class="detail-price ${isUp ? 'up' : 'down'}">${latestDay[2] || '--'}</div>
        <div class="detail-change ${isUp ? 'up' : 'down'}">
            ${isUp ? '+' : ''}${pctChg.toFixed(2)}%
        </div>
        <div class="detail-info">
            <div class="detail-info-item">
                <span>ROE</span>
                <span>${latestFina[1] || '--'}%</span>
            </div>
            <div class="detail-info-item">
                <span>毛利率</span>
                <span>${latestFina[2] || '--'}%</span>
            </div>
            <div class="detail-info-item">
                <span>PE</span><span>市盈率</span><span>市盈率</span><span>PE</span>
                <span>${latestFina[3] || '--'}</span>
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
    switchTab('selection');切换选项卡('选择');
}

// 绑定筛选按钮
document.getElementById('filterBtn').addEventListener('click', filterStocks);document.getElementById('filterBtn')addEventListener('click',filterStocks);

// 初始化
filterStocks();
