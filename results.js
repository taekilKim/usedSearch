const platformNames = {
  bunjang: '번개장터',
  joongna: '중고나라',
  daangn: '당근마켓',
  aladin: '알라딘'
};

// 페이지네이션 상태
let allItems = [];
let displayedCount = 0;
const INITIAL_DISPLAY = 50;
const LOAD_MORE_COUNT = 30;

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

function renderItems(items, append = false) {
  const resultsEl = document.querySelector('#results');

  const itemsHTML = items.map(x => `
    <div class="card" onclick="window.open('${x.link}', '_blank')">
      <div class="platform platform-${x.platform}">${platformNames[x.platform] || x.platform}</div>
      <a href="${x.link}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${x.title}</a>
      <div class="meta">
        <span class="price">${(x.price || 0).toLocaleString()}원</span>
      </div>
    </div>
  `).join('');

  if (append) {
    resultsEl.insertAdjacentHTML('beforeend', itemsHTML);
  } else {
    resultsEl.innerHTML = itemsHTML;
  }
}

function updateLoadMoreButton() {
  let loadMoreBtn = document.querySelector('#loadMoreBtn');

  if (displayedCount < allItems.length) {
    if (!loadMoreBtn) {
      loadMoreBtn = document.createElement('button');
      loadMoreBtn.id = 'loadMoreBtn';
      loadMoreBtn.className = 'load-more-btn';
      loadMoreBtn.textContent = `더 보기 (${allItems.length - displayedCount}개 남음)`;
      loadMoreBtn.onclick = loadMore;
      document.querySelector('.container').appendChild(loadMoreBtn);
    } else {
      loadMoreBtn.textContent = `더 보기 (${allItems.length - displayedCount}개 남음)`;
      loadMoreBtn.style.display = 'block';
    }
  } else {
    if (loadMoreBtn) {
      loadMoreBtn.style.display = 'none';
    }
  }
}

function loadMore() {
  const nextItems = allItems.slice(displayedCount, displayedCount + LOAD_MORE_COUNT);
  renderItems(nextItems, true);
  displayedCount += nextItems.length;
  updateLoadMoreButton();
}

function render(data) {
  const loadingEl = document.querySelector('#loading');
  const summaryEl = document.querySelector('#summary');
  const statsEl = document.querySelector('#stats');

  // 로딩 숨기기
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }

  // 모든 플랫폼의 데이터 수집
  allItems = [
    ...(data?.bunjang || []),
    ...(data?.joongna || []),
    ...(data?.daangn || []),
    ...(data?.aladin || [])
  ].filter(x => !Number.isNaN(x.price));

  allItems.sort((a, b) => a.price - b.price);

  // 통계 계산
  const stats = calculateStats(allItems);

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

  // 초기 표시 개수만큼만 렌더링
  displayedCount = Math.min(INITIAL_DISPLAY, allItems.length);
  const initialItems = allItems.slice(0, displayedCount);
  renderItems(initialItems, false);

  // 더 보기 버튼 업데이트
  updateLoadMoreButton();
}

// 초기 데이터 요청
function requestAgg() {
  chrome.runtime.sendMessage({ type: 'GET_AGG' }, (res) => {
    render(res?.data || { bunjang: [], joongna: [], daangn: [], aladin: [] });
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
