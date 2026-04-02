const AppState = {
    currentPage: 'portfolio',
    apiToken: '',
    proxyUrl: 'http://localhost:5000/api',
    useRealAPI: false,
    holdings: [
        { code: '300760', name: '迈瑞医疗', cost: 280, shares: 100, targetBuy: 260, targetSell: 350, currentPrice: 285.32, changePercent: 2.35 },
        { code: '600660', name: '福耀玻璃', cost: 35, shares: 500, targetBuy: 32, targetSell: 40, currentPrice: 36.18, changePercent: -1.24 },
        { code: '600600', name: '青岛啤酒', cost: 90, shares: 200, targetBuy: 85, targetSell: 100, currentPrice: 87.45, changePercent: 0.89 },
        { code: '000999', name: '华润三九', cost: 45, shares: 300, targetBuy: 42, targetSell: 50, currentPrice: 67.23, changePercent: 1.56 },
        { code: '162412', name: '医疗基金LOF', cost: 0.643, shares: 5000, targetBuy: 0.6, targetSell: 0.7, currentPrice: 0.658, changePercent: 3.21 }
    ],
    watchlist: [],
    stockData: {}
};

const staticStockPrices = {
    '300760': { name: '迈瑞医疗', price: 285.32, change: 2.35 },
    '600660': { name: '福耀玻璃', price: 36.18, change: -1.24 },
    '600600': { name: '青岛啤酒', price: 87.45, change: 0.89 },
    '000999': { name: '华润三九', price: 67.23, change: 1.56 },
    '162412': { name: '医疗基金LOF', price: 0.658, change: 3.21 }
};

const API = {
    async checkHealth() {
        try {
            const response = await fetch(`${AppState.proxyUrl}/health`);
            const data = await response.json();
            return data.status === 'ok';
        } catch (e) {
            console.warn('代理服务器不可用，使用静态数据');
            return false;
        }
    },

    async getPortfolioRealtime(holdings) {
        if (!AppState.useRealAPI) return null;
        try {
            const response = await fetch(`${AppState.proxyUrl}/realtime/portfolio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ holdings: holdings })
            });
            const result = await response.json();
            return result.status === 'success' ? result.data : null;
        } catch (e) {
            console.error('获取持仓行情失败:', e);
            return null;
        }
    },

    async searchStock(query) {
        if (!AppState.useRealAPI) return null;
        try {
            const response = await fetch(`${AppState.proxyUrl}/stock/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });
            const result = await response.json();
            return result.status === 'success' ? result.data : null;
        } catch (e) {
            console.error('搜索股票失败:', e);
            return null;
        }
    },

    async getKline(code, period = 'daily', startDate = '', endDate = '') {
        if (!AppState.useRealAPI) return null;
        try {
            const response = await fetch(`${AppState.proxyUrl}/stock/kline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, period, startDate, endDate })
            });
            const result = await response.json();
            return result.status === 'success' ? result.data : null;
        } catch (e) {
            console.error('获取K线数据失败:', e);
            return null;
        }
    },

    async getFinancial(code) {
        if (!AppState.useRealAPI) return null;
        try {
            const response = await fetch(`${AppState.proxyUrl}/stock/financial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const result = await response.json();
            return result.status === 'success' ? result.data : null;
        } catch (e) {
            console.error('获取财务数据失败:', e);
            return null;
        }
    },

    async stockSelection(filters) {
        if (!AppState.useRealAPI) return null;
        try {
            const response = await fetch(`${AppState.proxyUrl}/stock/selection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            const result = await response.json();
            return result.status === 'success' ? result.data : null;
        } catch (e) {
            console.error('股票筛选失败:', e);
            return null;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('智投应用初始化...');
    loadSettings();
    initHoldings();
    setupNavigation();
    checkAPIAndInit();
    renderPortfolio();
    updateTime();
    console.log('智投应用初始化完成，持仓数据已渲染');
});

async function checkAPIAndInit() {
    const isHealthy = await API.checkHealth();
    if (isHealthy) {
        console.log('✅ 代理服务器连接成功，启用实时数据');
        AppState.useRealAPI = true;
        await updatePortfolioRealtime();
        setupAutoRefresh();
    } else {
        console.log('⚠️ 代理服务器未启动，使用静态数据');
        AppState.useRealAPI = false;
        showAPIStatus('代理服务器未启动，使用模拟数据');
    }
}

function setupAutoRefresh() {
    setInterval(async () => {
        if (AppState.currentPage === 'portfolio') {
            await updatePortfolioRealtime();
        }
    }, 30000);
    
    setInterval(async () => {
        if (AppState.currentPage === 'market' && currentSearchCode) {
            await refreshMarketData(currentSearchCode);
        }
    }, 15000);
}

function showAPIStatus(message) {
    const statusEl = document.getElementById('api-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

function setupNavigation() {
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
}

function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'portfolio';
    console.log('切换到页面:', hash);
    AppState.currentPage = hash;
    
    document.querySelectorAll('.tab-item').forEach(tab => {
        const tabHash = tab.getAttribute('href')?.slice(1) || '';
        if (tabHash === hash) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.page').forEach(page => {
        const pageId = page.id;
        if (pageId === `page-${hash}`) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
    
    if (hash === 'portfolio') {
        renderPortfolio();
    } else if (hash === 'market') {
        renderWatchlist();
    }
}

function initHoldings() {
    const savedHoldings = localStorage.getItem('stockHoldings');
    if (savedHoldings) {
        try {
            AppState.holdings = JSON.parse(savedHoldings);
        } catch (e) {
            console.error('持仓数据解析失败');
        }
    }
}

async function updatePortfolioRealtime() {
    console.log('开始更新持仓实时数据...');
    
    if (!AppState.useRealAPI) {
        console.log('使用静态数据');
        return;
    }
    
    try {
        const realData = await API.getPortfolioRealtime(AppState.holdings);
        
        if (realData && realData.length > 0) {
            AppState.holdings.forEach(holding => {
                const marketData = realData.find(d => d.code === holding.code);
                if (marketData) {
                    holding.currentPrice = marketData.current_price;
                    holding.changePercent = marketData.change_percent;
                    holding.pe = marketData.pe;
                    holding.pb = marketData.pb;
                    holding.totalMv = marketData.total_mv;
                }
            });
            
            console.log('实时数据更新成功:', realData);
            showAPIStatus('✅ 数据已更新');
        }
    } catch (e) {
        console.error('更新持仓数据失败:', e);
        showAPIStatus('❌ 数据更新失败');
    }
}

function renderPortfolio() {
    const container = document.getElementById('holding-list');
    const totalAssetEl = document.getElementById('total-asset');
    const totalChangeEl = document.getElementById('total-change');
    
    console.log('开始渲染持仓数据，持仓数量:', AppState.holdings.length);
    
    if (!container) {
        console.error('未找到持仓列表容器元素 #holding-list');
        return;
    }
    
    let totalAsset = 0;
    let totalCost = 0;
    let html = '';
    
    AppState.holdings.forEach((holding) => {
        const currentPrice = holding.currentPrice || staticStockPrices[holding.code]?.price || holding.cost;
        const changePercent = holding.changePercent !== undefined ? holding.changePercent : 
                             (staticStockPrices[holding.code]?.change || 0);
        
        const marketValue = currentPrice * holding.shares;
        const costValue = holding.cost * holding.shares;
        const floatProfit = marketValue - costValue;
        const floatProfitPercent = holding.cost > 0 ? ((currentPrice - holding.cost) / holding.cost * 100) : 0;
        const changeClass = parseFloat(changePercent) >= 0 ? 'up' : 'down';
        
        totalAsset += marketValue;
        totalCost += costValue;
        
        const formatPrice = (price) => {
            if (price >= 100) return price.toFixed(2);
            if (price >= 10) return price.toFixed(2);
            if (price >= 1) return price.toFixed(3);
            return price.toFixed(4);
        };
        
        html += `
            <div class="holding-item">
                <div class="holding-info">
                    <h3>${holding.name}</h3>
                    <div class="holding-code">${holding.code}</div>
                    <div class="holding-details">
                        <div>现价: <span class="text-${changeClass}" style="font-weight: 600;">${formatPrice(currentPrice)}</span></div>
                        <div>成本: ${formatPrice(holding.cost)}</div>
                        <div>浮盈: <span class="${floatProfit >= 0 ? 'text-up' : 'text-down'}">${floatProfit >= 0 ? '+' : ''}${floatProfit.toFixed(2)}</span> (${floatProfitPercent >= 0 ? '+' : ''}${floatProfitPercent.toFixed(2)}%)</div>
                        <div>
                            补仓: <span style="color: var(--down-color);">${holding.targetBuy ? formatPrice(holding.targetBuy) : '--'}</span> 
                            | 止盈: <span style="color: var(--up-color);">${holding.targetSell ? formatPrice(holding.targetSell) : '--'}</span>
                        </div>
                        ${holding.pe ? `<div style="font-size: 11px; color: var(--text-secondary);">PE: ${holding.pe.toFixed(1)} | PB: ${holding.pb ? holding.pb.toFixed(1) : '--'}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    console.log('持仓HTML已生成并注入');
    
    const totalChange = totalCost > 0 ? ((totalAsset - totalCost) / totalCost * 100).toFixed(2) : 0;
    if (totalAssetEl) totalAssetEl.textContent = `¥${totalAsset.toFixed(2)}`;
    if (totalChangeEl) {
        totalChangeEl.textContent = `${totalChange >= 0 ? '+' : ''}${totalChange}%`;
        totalChangeEl.className = `total-change ${totalChange >= 0 ? 'up' : 'down'}`;
    }
    
    console.log('持仓渲染完成，总资产:', totalAsset, '总收益率:', totalChange + '%');
}

let currentSearchCode = null;

async function searchStock() {
    const query = document.getElementById('search-input')?.value.trim();
    
    if (!query || query.length < 2) return;
    
    let results = null;
    if (AppState.useRealAPI) {
        results = await API.searchStock(query);
    }
    
    if (results && results.length > 0) {
        displaySearchResults(results);
    } else {
        const mockResults = [
            { code: '300760', name: '迈瑞医疗', price: 285.32, change: 2.35 },
            { code: '600660', name: '福耀玻璃', price: 36.18, change: -1.24 },
            { code: '600600', name: '青岛啤酒', price: 87.45, change: 0.89 },
            { code: '000999', name: '华润三九', price: 67.23, change: 1.56 },
            { code: '162412', name: '医疗基金LOF', price: 0.658, change: 3.21 },
            { code: '000858', name: '五粮液', price: 145.67, change: -0.45 },
            { code: '600519', name: '贵州茅台', price: 1680.00, change: 1.23 },
            { code: '300750', name: '宁德时代', price: 185.40, change: 2.78 }
        ];
        
        const filteredResults = mockResults.filter(stock => 
            stock.name.includes(query) || stock.code.includes(query)
        );
        
        displaySearchResults(filteredResults.map(s => ({
            code: s.code,
            name: s.name,
            industry: '未知',
            area: '未知',
            price: s.price,
            change: s.change
        })));
    }
}

function displaySearchResults(results) {
    const watchlistContainer = document.getElementById('watchlist');
    if (!watchlistContainer) return;
    
    if (results.length === 0) {
        watchlistContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">未找到相关股票</div>';
        return;
    }
    
    let html = '';
    results.forEach(stock => {
        const price = stock.price || staticStockPrices[stock.code]?.price || '--';
        const change = stock.change !== undefined ? stock.change : (staticStockPrices[stock.code]?.change || 0);
        const changeClass = change >= 0 ? 'up' : 'down';
        
        html += `
            <div class="stock-item" onclick="viewStockDetail('${stock.code}', '${stock.name}')" style="cursor: pointer;">
                <div>
                    <div class="stock-name">${stock.name}</div>
                    <div class="stock-code">${stock.code} ${stock.industry ? '| ' + stock.industry : ''}</div>
                </div>
                <div class="stock-price">
                    <div class="price text-${changeClass}">${typeof price === 'number' ? price.toFixed(3) : price}</div>
                    <div class="change ${changeClass}">${change >= 0 ? '+' : ''}${change}%</div>
                </div>
            </div>
        `;
    });
    
    watchlistContainer.innerHTML = html;
}

async function viewStockDetail(code, name) {
    currentSearchCode = code;
    const detailContainer = document.getElementById('stock-detail');
    if (detailContainer) {
        detailContainer.innerHTML = `
            <div class="loading">加载中...</div>
            <div class="detail-header">
                <h3>${name} (${code})</h3>
                <button onclick="closeStockDetail()" style="padding: 5px 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;">关闭</button>
            </div>
            <div class="kline-container" id="kline-chart">
                <div class="loading">K线图加载中...</div>
            </div>
            <div class="stock-metrics" id="stock-metrics">
            </div>
        `;
        detailContainer.style.display = 'block';
    }
    
    if (AppState.useRealAPI) {
        const klineData = await API.getKline(code, 'daily');
        if (klineData) {
            renderKlineChart(klineData);
        } else {
            document.getElementById('kline-chart').innerHTML = '<div class="loading">K线数据加载失败</div>';
        }
    } else {
        const mockKlineData = generateMockKlineData(code);
        renderKlineChart(mockKlineData);
    }
}

function generateMockKlineData(code) {
    const basePrice = staticStockPrices[code]?.price || 100;
    const data = [];
    const now = new Date();
    
    for (let i = 90; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const volatility = basePrice * 0.03;
        const open = basePrice + (Math.random() - 0.5) * volatility;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        
        data.push({
            date: date.toISOString().split('T')[0].replace(/-/g, ''),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: Math.floor(Math.random() * 1000000),
            amount: Math.floor(Math.random() * 100000000) / 1000
        });
    }
    
    return data;
}

function renderKlineChart(data) {
    const container = document.getElementById('kline-chart');
    if (!container) return;
    
    const recentData = data.slice(-20);
    
    let html = `
        <div class="kline-table">
            <div class="kline-row kline-header">
                <span>日期</span>
                <span>开盘</span>
                <span>最高</span>
                <span>最低</span>
                <span>收盘</span>
                <span>涨跌</span>
            </div>
    `;
    
    recentData.forEach(item => {
        const change = ((item.close - item.open) / item.open * 100).toFixed(2);
        const changeClass = change >= 0 ? 'text-up' : 'text-down';
        
        html += `
            <div class="kline-row">
                <span>${item.date.slice(4, 6)}/${item.date.slice(6, 8)}</span>
                <span>${item.open.toFixed(2)}</span>
                <span>${item.high.toFixed(2)}</span>
                <span>${item.low.toFixed(2)}</span>
                <span class="${changeClass}">${item.close.toFixed(2)}</span>
                <span class="${changeClass}">${change >= 0 ? '+' : ''}${change}%</span>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function closeStockDetail() {
    const detailContainer = document.getElementById('stock-detail');
    if (detailContainer) {
        detailContainer.style.display = 'none';
    }
    currentSearchCode = null;
}

async function refreshMarketData(code) {
    if (!code) return;
    
    const stockData = await API.getKline(code, 'daily');
    if (stockData && stockData.length > 0) {
        const latest = stockData[stockData.length - 1];
        const priceEl = document.querySelector('.stock-price .price');
        const changeEl = document.querySelector('.stock-price .change');
        
        if (priceEl && changeEl) {
            const change = ((latest.close - latest.open) / latest.open * 100);
            const changeClass = change >= 0 ? 'text-up' : 'text-down';
            
            priceEl.textContent = latest.close.toFixed(2);
            priceEl.className = `price ${changeClass}`;
            changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeEl.className = `change ${changeClass}`;
        }
        
        showAPIStatus('✅ 行情已更新');
    }
}

function renderWatchlist() {
    const container = document.getElementById('watchlist');
    if (!container) return;
    
    if (AppState.watchlist.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无自选股，请搜索添加</div>';
        return;
    }
    
    let html = '';
    AppState.watchlist.forEach(stock => {
        const stockData = staticStockPrices[stock.code] || { price: 100, change: 0 };
        const changeClass = stockData.change >= 0 ? 'up' : 'down';
        
        html += `
            <div class="stock-item">
                <div>
                    <div class="stock-name">${stock.name}</div>
                    <div class="stock-code">${stock.code}</div>
                </div>
                <div class="stock-price">
                    <div class="price text-${changeClass}">${stockData.price.toFixed(3)}</div>
                    <div class="change ${changeClass}">${stockData.change >= 0 ? '+' : ''}${stockData.change}%</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function analyzeFinancial() {
    const code = document.getElementById('financial-search-input')?.value.trim();
    
    if (!code) {
        alert('请输入股票代码');
        return;
    }
    
    const resultContainer = document.getElementById('financial-result');
    const aiContainer = document.getElementById('ai-interpretation');
    
    if (resultContainer) resultContainer.style.display = 'none';
    if (aiContainer) aiContainer.innerHTML = '<div class="loading">财务数据加载中...</div>';
    
    let financialData = null;
    let stockName = getStockName(code);
    
    if (AppState.useRealAPI) {
        financialData = await API.getFinancial(code);
    }
    
    if (financialData) {
        renderFinancialData(code, stockName, financialData);
    } else {
        const mockFinancialData = {
            code: code,
            name: stockName,
            revenue: { current: 285.6, lastYear: 256.8, unit: '亿元' },
            profit: { current: 68.5, lastYear: 59.2, unit: '亿元' },
            roe: { current: 22.3, unit: '%' },
            pe: 28.5,
            debtRatio: { current: 35.2, unit: '%' },
            cashFlow: { current: 52.3, unit: '亿元' }
        };
        renderFinancialData(code, stockName, mockFinancialData);
        showAPIStatus('使用模拟财务数据');
    }
}

function renderFinancialData(code, name, data) {
    const finNameEl = document.getElementById('fin-name');
    const finCodeEl = document.getElementById('fin-code');
    const finRevenueEl = document.getElementById('fin-revenue');
    const finProfitEl = document.getElementById('fin-profit');
    const finRoeEl = document.getElementById('fin-roe');
    const finPeEl = document.getElementById('fin-pe');
    const finDebtEl = document.getElementById('fin-debt');
    const finCashEl = document.getElementById('fin-cash');
    const financialResultEl = document.getElementById('financial-result');
    const aiInterpretationEl = document.getElementById('ai-interpretation');
    
    const indicators = data.indicators?.[0] || {};
    const latest = data.latest || {};
    
    const revenue = latest.revenue || data.revenue?.current || 0;
    const profit = latest.net_profit || data.profit?.current || 0;
    const roe = indicators.roe || data.roe?.current || 0;
    const pe = data.pe || 0;
    const debtRatio = indicators.debt_to_assets || data.debtRatio?.current || 0;
    const cashFlow = indicators.cash_flow_ratio || data.cashFlow?.current || 0;
    
    if (finNameEl) finNameEl.textContent = name;
    if (finCodeEl) finCodeEl.textContent = code;
    if (finRevenueEl) finRevenueEl.textContent = `${(revenue / 100000000).toFixed(2)} 亿元`;
    if (finProfitEl) finProfitEl.textContent = `${(profit / 100000000).toFixed(2)} 亿元`;
    if (finRoeEl) finRoeEl.textContent = `${roe.toFixed(2)}%`;
    if (finPeEl) finPeEl.textContent = pe > 0 ? pe.toFixed(1) : '--';
    if (finDebtEl) finDebtEl.textContent = `${debtRatio.toFixed(2)}%`;
    if (finCashEl) finCashEl.textContent = `${(cashFlow / 100000000).toFixed(2)} 亿元`;
    
    const interpretation = generateAIInterpretation({
        name,
        revenue: revenue / 100000000,
        profit: profit / 100000000,
        roe,
        pe,
        debtRatio,
        cashFlow: cashFlow / 100000000
    });
    
    if (aiInterpretationEl) aiInterpretationEl.innerHTML = interpretation;
    if (financialResultEl) financialResultEl.style.display = 'block';
}

function generateAIInterpretation(data) {
    let interpretation = `📊 **${data.name} 财务分析报告**\n\n`;
    
    interpretation += `**营收表现**：${data.revenue.toFixed(2)}亿元`;
    interpretation += data.revenue > 200 ? `，规模较大，业务基础扎实。` : `，业务规模适中。`;
    interpretation += '\n\n';
    
    if (data.roe >= 20) {
        interpretation += `**盈利能力**：ROE达到${data.roe.toFixed(2)}%，远超行业平均水平，股东回报能力卓越，属于优质白马股特征。`;
    } else if (data.roe >= 15) {
        interpretation += `**盈利能力**：ROE为${data.roe.toFixed(2)}%，处于行业中上水平，盈利能力良好。`;
    } else if (data.roe >= 10) {
        interpretation += `**盈利能力**：ROE为${data.roe.toFixed(2)}%，盈利能力一般，需关注盈利质量。`;
    } else {
        interpretation += `**盈利能力**：ROE仅${data.roe.toFixed(2)}%，低于行业平均，盈利能力有待提升。`;
    }
    interpretation += '\n\n';
    
    if (data.debtRatio < 30) {
        interpretation += `**财务结构**：资产负债率仅${data.debtRatio.toFixed(2)}%，财务结构非常稳健，偿债风险极低。`;
    } else if (data.debtRatio < 50) {
        interpretation += `**财务结构**：资产负债率为${data.debtRatio.toFixed(2)}%，处于合理范围，财务风险可控。`;
    } else if (data.debtRatio < 70) {
        interpretation += `**财务结构**：资产负债率为${data.debtRatio.toFixed(2)}%，负债水平适中偏高，需关注偿债压力。`;
    } else {
        interpretation += `**财务结构**：资产负债率高达${data.debtRatio.toFixed(2)}%，负债水平较高，财务风险值得关注。`;
    }
    interpretation += '\n\n';
    
    if (data.pe > 0) {
        if (data.pe < 15) {
            interpretation += `**估值水平**：PE为${data.pe.toFixed(1)}，处于低估区间，具备较好的安全边际。`;
        } else if (data.pe < 30) {
            interpretation += `**估值水平**：PE为${data.pe.toFixed(1)}，估值合理，处于正常区间。`;
        } else if (data.pe < 50) {
            interpretation += `**估值水平**：PE为${data.pe.toFixed(1)}，估值偏高，需关注业绩增长能否匹配。`;
        } else {
            interpretation += `**估值水平**：PE高达${data.pe.toFixed(1)}，估值较高，存在一定泡沫风险。`;
        }
    } else {
        interpretation += `**估值水平**：暂无PE数据，无法进行估值评估。`;
    }
    interpretation += '\n\n';
    
    interpretation += `**现金流**：经营现金流${data.cashFlow.toFixed(2)}亿元`;
    if (data.cashFlow > 50) {
        interpretation += `，现金流充沛，盈利质量高，经营稳健。`;
    } else if (data.cashFlow > 0) {
        interpretation += `，现金流为正，盈利质量尚可。`;
    } else {
        interpretation += `，现金流为负，需关注经营性现金流状况。`;
    }
    interpretation += '\n\n';
    
    interpretation += `**💡 综合投资建议**：`;
    const score = (data.roe >= 15 ? 2 : 0) + (data.debtRatio < 50 ? 1 : 0) + (data.pe > 0 && data.pe < 30 ? 1 : 0) + (data.cashFlow > 0 ? 1 : 0);
    
    if (score >= 4) {
        interpretation += `综合评分优秀，各项指标表现良好，建议**重点关注**，适合中长期投资。`;
    } else if (score >= 3) {
        interpretation += `综合评分良好，大部分指标表现尚可，可**适度配置**。`;
    } else if (score >= 2) {
        interpretation += `综合评分一般，存在一定瑕疵，建议**谨慎观察**。`;
    } else {
        interpretation += `综合评分偏低，多项指标不理想，建议**规避风险**。`;
    }
    
    return interpretation.replace(/\n/g, '<br>');
}

function getStockName(code) {
    const names = {
        '300760': '迈瑞医疗',
        '600660': '福耀玻璃',
        '600600': '青岛啤酒',
        '000999': '华润三九',
        '162412': '医疗基金LOF'
    };
    return names[code] || '目标公司';
}

function switchStrategy(strategy, event) {
    if (event) event.preventDefault();
    
    document.querySelectorAll('.strategy-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(getStrategyName(strategy))) {
            tab.classList.add('active');
        }
    });
    
    const presets = {
        value: { peMax: 20, roeMin: 15, marginMin: 25 },
        balanced: { peMax: 30, roeMin: 12, marginMin: 20 },
        wide: { peMax: 50, roeMin: 10, marginMin: 15 }
    };
    
    const preset = presets[strategy] || presets.value;
    const filterPeMaxEl = document.getElementById('filter-pe-max');
    const filterRoeMinEl = document.getElementById('filter-roe-min');
    const filterMarginMinEl = document.getElementById('filter-margin-min');
    
    if (filterPeMaxEl) filterPeMaxEl.value = preset.peMax;
    if (filterRoeMinEl) filterRoeMinEl.value = preset.roeMin;
    if (filterMarginMinEl) filterMarginMinEl.value = preset.marginMin;
}

function getStrategyName(strategy) {
    const names = {
        value: '严选',
        balanced: '均衡',
        wide: '宽选'
    };
    return names[strategy] || '严选';
}

async function runStockSelection() {
    const peMax = parseFloat(document.getElementById('filter-pe-max')?.value) || 100;
    const roeMin = parseFloat(document.getElementById('filter-roe-min')?.value) || 0;
    const marginMin = parseFloat(document.getElementById('filter-margin-min')?.value) || 0;
    
    const selectionResultsEl = document.getElementById('selection-results');
    const selectionCountEl = document.getElementById('selection-count');
    
    if (selectionResultsEl) {
        selectionResultsEl.innerHTML = '<div class="loading">筛选中...</div>';
    }
    
    let results = null;
    
    if (AppState.useRealAPI) {
        results = await API.stockSelection({
            pe_max: peMax,
            roe_min: roeMin,
            margin_min: marginMin
        });
    }
    
    if (results && results.length > 0) {
        renderSelectionResults(results);
    } else {
        const mockStocks = [
            { code: '300760', name: '迈瑞医疗', pe: 32.5, roe: 22.3, margin: 45.8, price: 285.32 },
            { code: '600660', name: '福耀玻璃', pe: 18.3, roe: 19.2, margin: 35.6, price: 36.18 },
            { code: '000858', name: '五粮液', pe: 25.4, roe: 24.1, margin: 72.3, price: 145.67 },
            { code: '600519', name: '贵州茅台', pe: 28.9, roe: 28.5, margin: 91.2, price: 1680.00 },
            { code: '300750', name: '宁德时代', pe: 45.2, roe: 20.8, margin: 28.5, price: 185.40 },
            { code: '000333', name: '美的集团', pe: 14.5, roe: 21.6, margin: 25.8, price: 65.32 }
        ];
        
        const filtered = mockStocks.filter(stock => {
            if (stock.pe > peMax) return false;
            if (stock.roe < roeMin) return false;
            if (stock.margin < marginMin) return false;
            return true;
        });
        
        renderSelectionResults(filtered);
        showAPIStatus('使用模拟选股数据');
    }
}

function renderSelectionResults(results) {
    const selectionCountEl = document.getElementById('selection-count');
    const selectionResultsEl = document.getElementById('selection-results');
    
    if (selectionCountEl) selectionCountEl.textContent = `找到 ${results.length} 只股票`;
    
    if (!selectionResultsEl) return;
    
    if (results.length === 0) {
        selectionResultsEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">没有找到符合条件的股票</div>';
        return;
    }
    
    let html = '';
    results.forEach(stock => {
        const pe = stock.pe !== undefined ? stock.pe.toFixed(1) : '--';
        const roe = stock.roe !== undefined ? stock.roe.toFixed(1) : '--';
        const margin = stock.margin !== undefined ? stock.margin.toFixed(1) : '--';
        const price = stock.price !== undefined ? stock.price.toFixed(2) : '--';
        
        html += `
            <div class="stock-item" onclick="viewStockDetail('${stock.code}', '${stock.name}')" style="cursor: pointer;">
                <div>
                    <div class="stock-name">${stock.name}</div>
                    <div class="stock-code">${stock.code} | PE: ${pe} | ROE: ${roe}%</div>
                </div>
                <div class="stock-price">
                    <div class="price">¥${price}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">毛利率: ${margin}%</div>
                </div>
            </div>
        `;
    });
    
    selectionResultsEl.innerHTML = html;
}

function refreshData() {
    renderPortfolio();
    updateTime();
    alert('数据已刷新');
}

function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const updateTimeEl = document.getElementById('update-time');
    if (updateTimeEl) updateTimeEl.textContent = `更新于 ${timeStr}`;
}

function loadSettings() {
    const savedToken = localStorage.getItem('stockApiToken');
    if (savedToken) AppState.apiToken = savedToken;
}

function saveSettings() {
    const token = document.getElementById('api-token')?.value;
    if (token) {
        AppState.apiToken = token;
        localStorage.setItem('stockApiToken', token);
    }
    closeSettings();
    alert('配置已保存');
}

function showSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('active');
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('active');
    }
