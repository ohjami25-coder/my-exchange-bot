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
        // 캐시 방지를 위해 타임스탬프를 붙여 데이터를 가져옵니다.
        const response = await fetch(`${jsonUrl}?t=${new Date().getTime()}`);

        if (!response.ok) {
            throw new Error('데이터를 불러오는 데 실패했습니다.');
        }

        const data = await response.json();

        // 화면 초기화
        container.innerHTML = '';

        data.forEach(item => {
            // [에러 해결 포인트] 변수 선언 위치 확인
            const isMinus = item.change < 0;
            const statusClass = isMinus ? 'falling' : 'rising';
            const arrow = isMinus ? '▼' : '▲';
            const name = item.name;

            let naverCode = "";
            let urlType = "exchange"; // 기본값: 국내 환율(marketindex/exchange)

            // [로직 개선] 구체적인 해외 환율부터 먼저 체크 (순서가 중요!)
            if (name.includes("GBP") || name.includes("파운드")) {
                naverCode = "GBPUSD";
                urlType = "exchangeWorld";
            } 
            else if (name.includes("EUR/USD") || (name.includes("유로") && name.includes("달러"))) {
                naverCode = "EURUSD";
                urlType = "exchangeWorld";
            }
            // 그 다음 국내 환율 체크
            else if (name.includes("JPY") || name.includes("엔")) {
                naverCode = "FX_JPYKRW";
            } 
            else if (name.includes("CNY") || name.includes("위안")) {
                naverCode = "FX_CNYKRW";
            } 
            else if (name.includes("EUR") || name.includes("유로")) {
                // 위에서 유로/달러를 먼저 걸러냈으므로 여기는 유로/원
                naverCode = "FX_EURKRW";
            } 
            else if (name.includes("USD") || name.includes("달러")) {
                // 위에서 다른 달러 조합을 다 걸러냈으므로 여기는 달러/원
                naverCode = "FX_USDKRW";
            }

            // 카드 요소 생성
            const card = document.createElement('div');
            card.className = `card ${statusClass}`;
            card.style.cursor = "pointer";

            // 클릭 시 네이버 금융 새 창 열기
            card.onclick = () => {
                if (naverCode) {
                    const finalUrl = `https://m.stock.naver.com/marketindex/${urlType}/${naverCode}`;
                    window.open(finalUrl, '_blank');
                } else {
                    console.log("매칭되는 네이버 코드가 없음:", name);
                }
            };

            // 카드 내부 HTML 구성
            card.innerHTML = `
                <div class="name">${name}</div>
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
        container.innerHTML = `<div class="loading-msg">데이터 로드 오류: ${error.message}</div>`;
        timeDisplay.innerText = "업데이트 실패";
    }
}

// 페이지 로드 시 즉시 실행
document.addEventListener('DOMContentLoaded', fetchExchangeData);

// 10분마다 화면 자동 갱신
setInterval(fetchExchangeData, 600000);
