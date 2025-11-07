// 당근마켓 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseDaangn() {
    // 당근마켓 검색 결과 카드 선택자
    const itemNodes = [
      ...document.querySelectorAll('article, [data-article-id], a[href*="/articles/"]')
    ];

    const items = itemNodes.slice(0, 30).map((node) => {
      // 당근마켓의 경우 제목과 가격 찾기
      const title = safeText(node, 'h2, .article-title, [class*="title"], [class*="Title"]');
      const priceStr = safeText(node, '[class*="price"], [class*="Price"], .article-price, .price-text');
      const price = parsePriceToNumber(priceStr);
      const href = node.getAttribute('href') || node.querySelector('a')?.getAttribute('href');
      const link = href ? absolutize(href) : location.href;

      return { platform: 'daangn', title, priceStr, price, link };
    }).filter(v => v.title && !Number.isNaN(v.price));

    return items;
  }

  function send() {
    try {
      const payload = { type: 'SCRAPE_RESULT', platform: 'daangn', items: parseDaangn() };
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
