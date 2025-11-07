// 번개장터 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseBunjang() {
    // 더 포괄적인 셀렉터 사용
    const itemNodes = [
      ...document.querySelectorAll('a[href*="/products/"], div[class*="product"], div[class*="Product"], li[class*="product"]')
    ].filter(node => {
      // 중복 제거: href가 있는 것만 또는 자식에 링크가 있는 것만
      return node.tagName === 'A' || node.querySelector('a[href*="/products/"]');
    });

    const items = itemNodes.slice(0, 50).map((node) => {
      // 다양한 셀렉터 시도
      const titleSelectors = '[data-testid="product-title"], .title, .name, h3, h4, div[class*="title"], div[class*="Title"], span[class*="title"]';
      const priceSelectors = '[data-testid="product-price"], .price, span[class*="price"], div[class*="price"], span[class*="Price"], div[class*="Price"]';

      const title = safeText(node, titleSelectors);
      const priceStr = safeText(node, priceSelectors);
      const price = parsePriceToNumber(priceStr);

      const href = node.getAttribute('href') || node.querySelector('a[href*="/products/"]')?.getAttribute('href');
      const link = href ? absolutize(href) : '';

      return { platform: 'bunjang', title, priceStr, price, link };
    }).filter(v => v.title && v.link && !Number.isNaN(v.price) && v.price > 0);

    console.log('[번개장터] 수집된 아이템:', items.length);
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