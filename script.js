/**
 * Global Market Dashboard - Script
 * 모든 요청 사항 반영 완료 (네이버 링크, 카드 내 날짜 배치, 시간 포맷팅)
 */

const GITHUB_ID = "ohjami25-coder"; 
const REPO_NAME = "my-exchange-bot"; 

// 5, 8. 네이버 금융 링크 매핑 (종목명 기준 상세 페이지 연결)
const NAVER_LINKS = {
    "미국 USD": "https://m.stock.naver.com/marketindex/exchange/FX_USDKRW",
    "유럽 EUR": "https://m.stock.naver.com/marketindex/exchange/FX_EURKRW",
    "일본 JPY": "https://m.stock.naver.com/marketindex/exchange/FX_JPYKRW",
    "중국 CNY": "https://m.stock.naver.com/marketindex/exchange/FX_CNYKRW",

    "유로/달러": "https://m.stock.naver.com/marketindex/exchangeWorld/EURUSD",
    "영국 파운드/달러": "https://m.stock.naver.com/marketindex/exchangeWorld/GBPUSD",

    "미국 국채 10년": "https://m.stock.naver.com/marketindex/bond/US10YT=RR",
    "한국 국채 10년": "https://m.stock.naver.com/marketindex/bond/KR10YT=RR",
    "일본 국채 10년": "https://m.stock.naver.com/marketindex/bond/JP10YT=RR",
    "독일 국채 10년": "https://m.stock.naver.com/marketindex/bond/DE10YT=RR"
};

async function updateDashboard() {
    const timestamp = new Date().getTime();
    // GitHub Raw 서버에서 최신 JSON 데이터를 가져옵니다.
    const baseUrl = `https://raw.githubusercontent.com/${GITHUB_ID}/${REPO_NAME}/main/`;
    
    try {
        const [exRes, inRes] = await Promise.all([
            fetch(`${baseUrl}exchange.json?t=${timestamp}`),
            fetch(`${baseUrl}interest.json?t=${timestamp}`)
        ]);

        if (!exRes.ok || !inRes.ok) throw new Error("데이터 파일을 찾을 수 없습니다.");

        const exData = await exRes.json();
        const inData = await inRes.json();

        // 카드 렌더링 실행
        renderCards(exData, 'exchange-container', 'exchange');
        renderCards(inData, 'interest-container', 'interest');

        // 2. 헤더의 업데이트 시간 표시 (데이터 날짜 + 현재 시스템 시:분)
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        document.getElementById('update-time').innerText = `Last Updated: ${timeStr}`;
        // document.getElementById('update-time').innerText = `Last Updated: ${exData[0].date} ${timeStr}`;

    } catch (e) {
        console.error("Dashboard Error:", e);
        document.getElementById('update-time').innerText = "데이터 로딩 중 오류가 발생했습니다.";
    }
}

/**
 * 데이터를 받아 카드 HTML을 생성하고 컨테이너에 삽입합니다.
 */
function renderCards(data, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    
    data.forEach(item => {
        // 상승/하락 여부 판단 (ratio에 '-'가 포함되어 있으면 하락)
        const isUp = !item.ratio.includes('-'); 
        const link = NAVER_LINKS[item.name] || "#"; // 매핑된 링크가 없으면 기본값 #
        
        // 5, 8. 카드를 클릭하면 네이버 금융으로 이동하도록 <a> 태그 생성
        const card = document.createElement('a'); 
        card.href = link;
        card.target = "_blank"; // 새 탭에서 열기
        card.className = `card ${isUp ? 'up' : 'down'}`;
        
        const unit = type === 'interest' ? '%' : ''; // 금리일 경우 % 단위 표시
        
        // 4, 7. 날짜 데이터(item.date)를 카드 맨 하단(card-date 클래스)에 배치
        card.innerHTML = `
            <div class="card-header">${item.name}</div>
            <div class="price">${parseFloat(item.price).toFixed(2)}<span class="unit">${unit}</span></div>
            <div class="change-info">
                <span class="arrow ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'}</span>
                <span class="change-val ${isUp ? 'up' : 'down'}">${Math.abs(item.change).toFixed(2)}</span>
                <span class="ratio ${isUp ? 'up' : 'down'}">(${item.ratio})</span>
            </div>
            <div class="card-date">Data Date: ${item.date}</div>
        `;
        
        container.appendChild(card);
    });
}

// 페이지 로드 시 대시보드 업데이트 실행
document.addEventListener('DOMContentLoaded', updateDashboard);