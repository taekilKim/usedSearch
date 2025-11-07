// 번개장터 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseBunjang() {
    // 모바일(권장) 셀렉터 우선, 데스크톱 대체 셀렉터도 보조로 시도
    // 실제 클래스명은 수시로 바뀔 수 있어, 의미 기반으로 넓게 탐색
    const itemNodes = [
      ...document.querySelectorAll('[data-testid="product-card"], a[href*="/products/"]')
    ];

    const items = itemNodes.slice(0, 30).map((node) => {
      // 카드 루트 기준으로 제목/가격 찾기
      const title = safeText(node, '[data-testid="product-title"], .title, .name, .sc-hLBbgP, .sc-gKclnd');
      const priceStr = safeText(node, '[data-testid="product-price"], .price, .sc-dKREkW, .amount');
      const price = parsePriceToNumber(priceStr);
      const href = node.getAttribute('href') || node.querySelector('a')?.getAttribute('href');
      const link = href ? absolutize(href) : location.href;

      return { platform: 'bunjang', title, priceStr, price, link };
    }).filter(v => v.title && !Number.isNaN(v.price));

    return items;
  }

  function send() {
    try {
      const payload = { type: 'SCRAPE_RESULT', platform: 'bunjang', items: parseBunjang() };
      chrome.runtime.sendMessage(payload);
    } catch (e) {
      // 무시
    }
  }

  // 최초 1회 + 동적 로딩 대비해 약간 지연 후 재시도
  window.addEventListener('load', () => {
    setTimeout(send, 600);
    setTimeout(send, 1800);
  });

  // 사용자가 스크롤할 때도 갱신
  let t;
  document.addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(send, 600);
  }, { passive: true });
})();