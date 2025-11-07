// 당근마켓 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseDaangn() {
    // 더 포괄적인 셀렉터 사용
    const itemNodes = [
      ...document.querySelectorAll('article, a[href*="/articles/"], a[href*="/article/"], div[class*="article"], li[class*="card"]')
    ].filter(node => {
      return node.tagName === 'A' || node.querySelector('a[href*="/article"]');
    });

    const items = itemNodes.slice(0, 30).map((node) => {
      const titleSelectors = 'h2, h3, .article-title, [class*="title"], [class*="Title"], span[class*="title"], div[class*="title"]';
      const priceSelectors = '[class*="price"], [class*="Price"], .article-price, .price-text, span[class*="price"], div[class*="price"]';

      const title = safeText(node, titleSelectors);
      const priceStr = safeText(node, priceSelectors);
      const price = parsePriceToNumber(priceStr);

      const href = node.getAttribute('href') || node.querySelector('a[href*="/article"]')?.getAttribute('href');
      const link = href ? absolutize(href) : '';

      return { platform: 'daangn', title, priceStr, price, link };
    }).filter(v => v.title && v.link && !Number.isNaN(v.price) && v.price > 0).slice(0, 15);

    console.log('[당근마켓] 수집된 아이템:', items.length);
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
