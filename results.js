const platformNames = {
  bunjang: '번개장터',
  joongna: '중고나라',
  daangn: '당근마켓',
  aladin: '알라딘',
  naver: '네이버',
  ebay: '이베이'
};

function summarize(data) {
  const counts = Object.keys(platformNames).map(key => {
    const count = data?.[key]?.length || 0;
    return count > 0 ? `${platformNames[key]} ${count}개` : null;
  }).filter(Boolean);

  return counts.length > 0 ? `${counts.join(', ')}` : '수집된 데이터 없음';
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
  const loadingEl = document.querySelector('#loading');
  const resultsEl = document.querySelector('#results');
  const summaryEl = document.querySelector('#summary');
  const statsEl = document.querySelector('#stats');

  // 로딩 숨기기
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }

  // 모든 플랫폼의 데이터 수집
  const all = [
    ...(data?.bunjang || []),
    ...(data?.joongna || []),
    ...(data?.daangn || []),
    ...(data?.aladin || []),
    ...(data?.naver || []),
    ...(data?.ebay || [])
  ].filter(x => !Number.isNaN(x.price));

  all.sort((a, b) => a.price - b.price);

  // 통계 계산
  const stats = calculateStats(all);

  // 수집 정보 표시
  summaryEl.innerHTML = `<strong>📊 수집 결과:</strong> ${summarize(data)}`;

  // 통계 정보 표시
  if (stats.total > 0) {
    statsEl.innerHTML = `
      <div class="stat-item">
        <div class="stat-label">최저가</div>
        <div class="stat-value">${stats.min.toLocaleString()}원</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">최고가</div>
        <div class="stat-value">${stats.max.toLocaleString()}원</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">평균가</div>
        <div class="stat-value">${stats.avg.toLocaleString()}원</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">총 상품 수</div>
        <div class="stat-value">${stats.total}개</div>
      </div>
    `;
  } else {
    statsEl.innerHTML = '<p style="text-align: center;">수집된 데이터가 없습니다. 검색어를 변경하거나 다시 시도해주세요.</p>';
  }

  // 결과 표시
  resultsEl.innerHTML = all.map(x => `
    <div class="card" onclick="window.open('${x.link}', '_blank')">
      <div class="platform platform-${x.platform}">${platformNames[x.platform] || x.platform}</div>
      <a href="${x.link}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${x.title}</a>
      <div class="meta">
        <span class="price">${(x.price || 0).toLocaleString()}원</span>
      </div>
    </div>
  `).join('');
}

// 초기 데이터 요청
function requestAgg() {
  chrome.runtime.sendMessage({ type: 'GET_AGG' }, (res) => {
    render(res?.data || { bunjang: [], joongna: [], daangn: [], aladin: [], naver: [], ebay: [] });
  });
}

// 실시간 업데이트 구독
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'AGG_UPDATED') {
    render(msg.data);
  }
});

// 페이지 로드 시 데이터 요청
window.addEventListener('DOMContentLoaded', () => {
  requestAgg();

  // 3초 후에도 데이터가 없으면 다시 요청
  setTimeout(requestAgg, 3000);
});
