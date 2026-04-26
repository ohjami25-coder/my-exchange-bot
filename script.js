const GITHUB_ID = "ohjami25-coder"; 
const REPO_NAME = "my-exchange-bot"; // 저장소 이름을 정확하게 수정했습니다!

async function updateDashboard() {
    const timestamp = new Date().getTime();
    // 데이터 주소를 저장소 이름에 맞게 동적으로 생성합니다.
    const baseUrl = `https://raw.githubusercontent.com/${GITHUB_ID}/${REPO_NAME}/main/`;
    
    try {
        const [exRes, inRes] = await Promise.all([
            fetch(`${baseUrl}exchange.json?t=${timestamp}`),
            fetch(`${baseUrl}interest.json?t=${timestamp}`)
        ]);

        if (!exRes.ok || !inRes.ok) throw new Error("JSON 파일을 찾을 수 없습니다.");

        const exData = await exRes.json();
        const inData = await inRes.json();

        renderCards(exData, 'exchange-container', 'exchange');
        renderCards(inData, 'interest-container', 'interest');

        if (exData.length > 0) {
            document.getElementById('update-time').innerText = `Last Updated: ${exData[0].date}`;
        }
    } catch (e) {
        console.error("Dashboard Error:", e);
        document.getElementById('update-time').innerText = "데이터 로딩 중 오류가 발생했습니다.";
    }
}

function renderCards(data, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    data.forEach(item => {
        const isUp = !item.ratio.includes('-'); 
        const card = document.createElement('div');
        card.className = 'card';
        const unit = type === 'interest' ? '%' : '';
        card.innerHTML = `
            <div class="card-header"><span class="name">${item.name}</span><span class="ratio ${isUp ? 'up' : 'down'}">${item.ratio}</span></div>
            <div class="price">${parseFloat(item.price).toFixed(2)}<span class="unit">${unit}</span></div>
            <div class="change-info"><span class="arrow ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'}</span><span class="change-val ${isUp ? 'up' : 'down'}">${Math.abs(item.change).toFixed(2)}</span></div>
        `;
        container.appendChild(card);
    });
}
document.addEventListener('DOMContentLoaded', updateDashboard);