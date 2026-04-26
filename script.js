const GITHUB_ID = "ohjami25-coder"; 
const REPO_NAME = "my-exchange-bot"; 

async function updateDashboard() {
    const timestamp = new Date().getTime();
    const baseUrl = `https://raw.githubusercontent.com/${GITHUB_ID}/${REPO_NAME}/main/`;
    
    try {
        const [exRes, inRes] = await Promise.all([
            fetch(`${baseUrl}exchange.json?t=${timestamp}`),
            fetch(`${baseUrl}interest.json?t=${timestamp}`)
        ]);

        const exData = await exRes.json();
        const inData = await inRes.json();

        renderCards(exData, 'exchange-container', 'exchange');
        renderCards(inData, 'interest-container', 'interest');

        // 시간 포맷 수정 (현재 로컬 시간 기준 시:분 표시)
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        document.getElementById('update-time').innerText = `Last Updated: ${exData[0].date} ${timeString}`;

    } catch (e) {
        document.getElementById('update-time').innerText = "데이터 로딩 중...";
    }
}

function renderCards(data, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    
    data.forEach(item => {
        const isUp = !item.ratio.includes('-'); 
        const card = document.createElement('div');
        // 상방/하방에 따라 클래스 추가 (테두리 색상용)
        card.className = `card ${isUp ? 'up' : 'down'}`;
        
        const unit = type === 'interest' ? '%' : '';
        
        card.innerHTML = `
            <div class="card-header">${item.name}</div>
            <div class="price">${parseFloat(item.price).toFixed(2)}${unit}</div>
            <div class="change-info">
                <span class="arrow ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'}</span>
                <span class="change-val ${isUp ? 'up' : 'down'}">${Math.abs(item.change).toFixed(2)}</span>
                <span class="ratio ${isUp ? 'up' : 'down'}">(${item.ratio})</span>
            </div>
        `;
        container.appendChild(card);
    });
}
document.addEventListener('DOMContentLoaded', updateDashboard);