const bunjangURL = (q) => `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(q)}`;
const joongnaURL = (q) => `https://web.joongna.com/search?keyword=${encodeURIComponent(q)}`;

function parsePriceToNumber(text) {
  if (!text) return NaN;
  const num = (text + "").replace(/[^0-9]/g, "").trim();
  return num ? Number(num) : NaN;
}

function openSearchTabs(q) {
  chrome.tabs.create({ url: bunjangURL(q), active: false });
  chrome.tabs.create({ url: joongnaURL(q), active: false });
}

function summarize(data) {
  const b = data?.bunjang?.length || 0;
  const j = data?.joongna?.length || 0;
  return `수집됨 — 번개장터 ${b}개, 중고나라 ${j}개`;
}

function render(data) {
  const results = document.querySelector('#results');
  const all = [
    ...(data?.bunjang || []),
    ...(data?.joongna || [])
  ].filter(x => !Number.isNaN(x.price));

  all.sort((a,b) => a.price - b.price);

  results.innerHTML = all.map(x => `
    <div class="card">
      <div class="platform">${x.platform === 'bunjang' ? '번개장터' : '중고나라'}</div>
      <a href="${x.link}" target="_blank" rel="noopener noreferrer">${x.title}</a>
      <div class="meta"><span class="price">${(x.price || 0).toLocaleString()}원</span> <span>${x.priceStr || ''}</span></div>
    </div>
  `).join('');

  document.querySelector('#summary').textContent = summarize(data);
}

// 초기 데이터 요청
function requestAgg() {
  chrome.runtime.sendMessage({ type: 'GET_AGG' }, (res) => {
    render(res?.data || { bunjang: [], joongna: [] });
  });
}

// 실시간 업데이트 구독
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'AGG_UPDATED') {
    render(msg.data);
  }
});

// 폼 핸들러
const form = document.querySelector('#searchForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = document.querySelector('#q').value.trim();
  if (!q) return;
  openSearchTabs(q);
  // 약간의 지연 후 수집 데이터 렌더 (탭 로딩 시간 고려)
  setTimeout(requestAgg, 1800);
});

// 팝업 열릴 때 최신 데이터 표시
requestAgg();