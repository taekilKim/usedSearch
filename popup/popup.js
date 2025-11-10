const bunjangURL = (q) => `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(q)}`;
const joongnaURL = (q) => `https://web.joongna.com/search?keyword=${encodeURIComponent(q)}`;
const daangnURL = (q) => `https://www.daangn.com/search/${encodeURIComponent(q)}`;

function parsePriceToNumber(text) {
  if (!text) return NaN;
  const num = (text + "").replace(/[^0-9]/g, "").trim();
  return num ? Number(num) : NaN;
}

function openSearchTabs(q) {
  // 이전 검색 결과 캐시 초기화
  chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, () => {
    // 결과 페이지를 먼저 열기
    chrome.tabs.create({ url: chrome.runtime.getURL('results.html'), active: true });

    // 각 플랫폼 검색 페이지를 백그라운드에서 열기
    chrome.tabs.create({ url: bunjangURL(q), active: false });
    chrome.tabs.create({ url: joongnaURL(q), active: false });
    chrome.tabs.create({ url: daangnURL(q), active: false });
  });
}

const platformNames = {
  bunjang: '번개장터',
  joongna: '중고나라',
  daangn: '당근마켓'
};

function summarize(data) {
  const counts = Object.keys(platformNames).map(key => {
    const count = data?.[key]?.length || 0;
    return count > 0 ? `${platformNames[key]} ${count}개` : null;
  }).filter(Boolean);

  return counts.length > 0 ? `수집됨 — ${counts.join(', ')}` : '수집된 데이터 없음';
}

function calculateStats(items) {
  if (!items || items.length === 0) {
    return { min: 0, max: 0, avg: 0, total: 0 };
  }

  const prices = items.map(x => x.price).filter(p => !Number.isNaN(p) && p > 0);
  if (prices.length === 0) {
    return { min: 0, max: 0, avg: 0, total: 0 };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const total = prices.length;

  return { min, max, avg, total };
}

function render(data) {
  const results = document.querySelector('#results');
  const summaryEl = document.querySelector('#summary');

  // 모든 플랫폼의 데이터 수집
  const all = [
    ...(data?.bunjang || []),
    ...(data?.joongna || []),
    ...(data?.daangn || [])
  ].filter(x => !Number.isNaN(x.price));

  all.sort((a, b) => a.price - b.price);

  // 통계 계산
  const stats = calculateStats(all);

  // 통계 정보 표시
  let summaryHTML = summarize(data);
  if (stats.total > 0) {
    summaryHTML += `<br><strong>가격 통계:</strong> 최저 ${stats.min.toLocaleString()}원 | 최고 ${stats.max.toLocaleString()}원 | 평균 ${stats.avg.toLocaleString()}원 (총 ${stats.total}개)`;
  }
  summaryEl.innerHTML = summaryHTML;

  // 결과 표시
  results.innerHTML = all.map(x => `
    <div class="card">
      <div class="platform">${platformNames[x.platform] || x.platform}</div>
      <a href="${x.link}" target="_blank" rel="noopener noreferrer">${x.title}</a>
      <div class="meta"><span class="price">${(x.price || 0).toLocaleString()}원</span></div>
    </div>
  `).join('');
}

// 초기 데이터 요청
function requestAgg() {
  chrome.runtime.sendMessage({ type: 'GET_AGG' }, (res) => {
    render(res?.data || { bunjang: [], joongna: [], daangn: [] });
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