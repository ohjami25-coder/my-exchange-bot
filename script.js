// 1. 설정 정보 (본인의 정보로 반드시 수정하세요)
const GITHUB_ID = "ohjami25-coder";
const REPO_NAME = "my-exchange-bot";
const FILE_NAME = "exchange.json";

// GitHub Raw URL 생성
const jsonUrl = `https://raw.githubusercontent.com/${GITHUB_ID}/${REPO_NAME}/main/${FILE_NAME}`;

async function fetchExchangeData() {
    const container = document.getElementById('card-container');
    const timeDisplay = document.getElementById('update-time');

    try {
        // 캐시 방지를 위해 URL 뒤에 타임스탬프를 붙여 최신 데이터를 가져옵니다.
        const response = await fetch(`${jsonUrl}?t=${new Date().getTime()}`);

        if (!response.ok) {
            throw new Error('데이터를 불러오는 데 실패했습니다.');
        }

        const data = await response.json();

        // 화면 초기화
        container.innerHTML = '';

        data.forEach(item => {
            const isMinus = item.change < 0;
            const statusClass = isMinus ? 'falling' : 'rising';
            const arrow = isMinus ? '▼' : '▲';

            // 1. 네이버 금융 코드 및 URL 타입 매칭
            let naverCode = "";
            let urlType = "exchange"; // 기본값 (국내 환율)

            if (item.name.includes("USD")) naverCode = "FX_USDKRW";
            else if (item.name.includes("JPY")) naverCode = "FX_JPYKRW";
            else if (item.name.includes("CNY")) naverCode = "FX_CNYKRW";
            else if (item.name.includes("EUR") && item.name.includes("KRW")) naverCode = "FX_EURKRW";

            // --- 해외 환율 (exchangeWorld) 설정 ---
            else if (item.name.includes("GBP/USD")) {
                naverCode = "GBPUSD";
                urlType = "exchangeWorld";
            }
            else if (item.name.includes("EUR/USD")) {
                naverCode = "EURUSD";
                urlType = "exchangeWorld";
            }

            // 카드 요소 생성
            const card = document.createElement('div');
            card.className = `card ${statusClass}`;
            card.style.cursor = "pointer";

            // 2. 조건에 따른 동적 URL 연결
            card.onclick = () => {
                if (naverCode) {
                    const finalUrl = `https://m.stock.naver.com/marketindex/${urlType}/${naverCode}`;
                    window.open(finalUrl, '_blank');
                }
            };

            card.innerHTML = `
            <div class="name">${item.name}</div>
            <div class="price">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
            <div class="change">
                ${arrow} ${Math.abs(item.change).toFixed(2)} (${item.ratio})
            </div>
            <div class="date">${item.date}</div>
        `;

            container.appendChild(card);
        });

        // 마지막 업데이트 시간 표시
        const now = new Date();
        timeDisplay.innerText = `마지막 업데이트: ${now.toLocaleTimeString()}`;

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<div class="loading-msg">데이터 로드 오류: GitHub에 ${FILE_NAME} 파일이 있는지 확인하세요.</div>`;
        timeDisplay.innerText = "업데이트 실패";
    }
}

// 페이지 로드 시 즉시 실행
document.addEventListener('DOMContentLoaded', fetchExchangeData);

// 10분마다 자동으로 화면을 새로고침 (GitHub Actions가 30분마다 돌기 때문)
setInterval(fetchExchangeData, 600000);
