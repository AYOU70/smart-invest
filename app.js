const pages={
    portfolio:document.getElementById('portfolioPage'),
    market:document.getElementById('marketPage'),
    financial:document.getElementById('financialPage'),
    selection:document.getElementById('selectionPage'),
    detail:document.getElementById('detailPage')
};
const tabs={
    portfolio:document.getElementById('tab-portfolio'),
    market:document.getElementById('tab-market'),
    financial:document.getElementById('tab-financial'),
    selection:document.getElementById('tab-selection')
};

function switchTab(tabName){
    Object.values(pages).forEach(p=>p.classList.remove('active'));
    Object.values(tabs).forEach(t=>t.classList.remove('active'));
    if(tabName==='market'){
        pages.market.classList.add('active');
        tabs.market.classList.add('active');
        loadMarketIndex();
    }else if(tabName==='detail'){
        pages.detail.classList.add('active');
    }else{
        pages[tabName].classList.add('active');
        tabs[tabName].classList.add('active');
    }
}

Object.keys(tabs).forEach(k=>{
    tabs[k].addEventListener('click',()=>switchTab(k));
});

const TOKEN_KEY="TUSHARE_TOKEN";
let token=localStorage.getItem(TOKEN_KEY)||"";

const settingsModal=document.getElementById('settingsModal');
const closeSettings=document.getElementById('closeSettings');
const saveTokenBtn=document.getElementById('saveToken');
const tokenInput=document.getElementById('tushareToken');

document.querySelector('.btn-refresh')?.addEventListener('click',()=>{
    settingsModal.style.display="flex";
    tokenInput.value=token;
});
closeSettings.addEventListener('click',()=>settingsModal.style.display="none");
saveTokenBtn.addEventListener('click',()=>{
    let v=tokenInput.value.trim();
    if(!v)return alert("请输入密钥");
    localStorage.setItem(TOKEN_KEY,v);token=v;
    alert("保存成功");settingsModal.style.display="none";
    filterStocks();
});

async function loadMarketIndex(){
    if(!token)return alert("先填Tushare Token");
    const list=[
        {c:"000001.SH",n:"上证指数"},
        {c:"399001.SZ",n:"深证成指"},
        {c:"399006.SZ",n:"创业板指"},
        {c:"000688.SH",n:"科创50"}
    ];
    const box=document.getElementById('marketList');
    box.innerHTML='<p style="color:#a0a0a0;text-align:center;">加载中...</p>';
    try{
        let html="";
        for(let i of list){
            let res=await fetch("https://api.tushare.pro",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({api_name:"index_daily",token:token,params:{ts_code:i.c}})
            });
            let j=await res.json();
            let d=j.data?.items?.[0];if(!d)continue;
            let p=d[6]||0;
            let cl=p>=0?"up":"down";
            html+=`<div class="market-card"><div class="market-name">${i.n}</div><div class="market-price">${d[4]}</div><div class="market-change ${cl}">${p>=0?"+":""}${p}%</div></div>`;
        }
        box.innerHTML=html||'<p style="color:#a0a0a0;text-align:center;">暂无数据</p>';
    }catch(e){
        box.innerHTML='<p style="color:#e94560;text-align:center;">加载失败</p>';
    }
}

async function filterStocks(){
    if(!token)return alert("先填密钥");
    let maxPe=+document.getElementById('maxPe').value||999;
    let minRoe=+document.getElementById('minRoe').value||0;
    let minGross=+document.getElementById('minGross').value||0;
    let industry=document.getElementById('industry').value;
    let resBox=document.getElementById('stockResult');
    resBox.innerHTML='<p style="color:#a0a0a0;text-align:center;">筛选中...</p>';
    let mock=[
        {code:"600660.SH",name:"福耀玻璃",pe:18.3,roe:19.2,gross:35.6,price:36.18,ind:"消费"},
        {code:"000858.SZ",name:"五粮液",pe:25.4,roe:24.1,gross:72.3,price:145.67,ind:"消费"},
        {code:"600519.SH",name:"贵州茅台",pe:28.9,roe:28.5,gross:91.2,price:1680,ind:"消费"},
        {code:"000333.SZ",name:"美的集团",pe:14.5,roe:21.6,gross:25.8,price:65.32,ind:"家电"}
    ];
    let f=mock.filter(x=>x.pe<=maxPe&&x.roe>=minRoe&&x.gross>=minGross&&(industry==="all"||x.ind===industry));
    if(!f.length){resBox.innerHTML='<p style="color:#a0a0a0;text-align:center;">无符合标的</p>';return;}
    let html="";
    f.forEach(x=>{
        html+=`<div class="stock-item" onclick="goStockDetail('${x.code}','${x.name}')"><div class="stock-info"><h4>${x.name}</h4><p>${x.code.split('.')[0]} | PE:${x.pe} | ROE:${x.roe}%</p></div><div class="stock-price">¥${x.price}</div></div>`;
    });
    resBox.innerHTML=html;
}

async function goStockDetail(code,name){
    switchTab('detail');
    let box=document.getElementById('detailContent');
    box.innerHTML='<p style="color:#a0a0a0;text-align:center;">加载中...</p>';
    if(!token){alert("先填密钥");return;}
    try{
        let dayRes=await fetch("https://api.tushare.pro",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({api_name:"daily",token:token,params:{ts_code:code}})
        });
        let dayJ=await dayRes.json();
        let day=dayJ.data?.items?.[0]||[];

        let finaRes=await fetch("https://api.tushare.pro",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({api_name:"fina_indicator",token:token,params:{ts_code:code}})
        });
        let finaJ=await finaRes.json();
        let f=finaJ.data?.items?.[0]||[];

        let pct=day[5]||0;
        let cl=pct>=0?"up":"down";
        box.innerHTML=`
        <h2>${name} ${code}</h2>
        <div class="detail-price ${cl}">${day[2]||"--"}</div>
        <div class="detail-change ${cl}">${pct>=0?"+":""}${pct}%</div>
        <div class="detail-info">
            <div class="detail-info-item"><span>ROE</span><span>${f[1]||"--"}%</span></div>
            <div class="detail-info-item"><span>毛利率</span><span>${f[2]||"--"}%</span></div>
            <div class="detail-info-item"><span>净利率</span><span>${f[3]||"--"}%</span></div>
            <div class="detail-info-item"><span>PE</span><span>${f[4]||"--"}</span></div>
            <div class="detail-info-item"><span>PB</span><span>${f[5]||"--"}</span></div>
        </div>
        <div class="detail-info" style="margin-top:16px;">
            <h3>财报点评</h3>
            <div style="margin-top:10px;">
                ${(f[1]||0)>=15?"✅ROE优秀":"⚠️ROE一般"}<br><br>
                ${(f[2]||0)>=30?"✅高毛利有护城河":"⚠️毛利普通"}<br><br>
                ${(f[4]||99)<30?"✅估值合理":"⚠️估值偏高"}
            </div>
        </div>
        `;
    }catch(e){
        box.innerHTML='<p style="color:#e94560;text-align:center;">详情加载失败</p>';
    }
}

function backToSelect(){switchTab('selection');}
document.getElementById('filterBtn').addEventListener('click',filterStocks);
filterStocks();
