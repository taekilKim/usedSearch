// 이베이 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseEbay() {
    // 더 포괄적인 셀렉터 사용
    const itemNodes = [
      ...document.querySelectorAll('.s-item, li[data-view], div.srp-results .s-item, li[class*="item"], div[class*="item"]')
    ].filter(node => {
      return node.querySelector('a');
    });

    const items = itemNodes.slice(0, 30).map((node) => {
      const titleSelectors = '.s-item__title, h3.s-item__title, [role="heading"], h3, div[class*="title"], span[class*="title"]';
      const priceSelectors = '.s-item__price, span[class*="price"], span[class*="Price"], div[class*="price"]';

      const title = safeText(node, titleSelectors);
      const priceStr = safeText(node, priceSelectors);
      const price = parsePriceToNumber(priceStr);

      const href = node.getAttribute('href') || node.querySelector('a')?.getAttribute('href');
      const link = href ? absolutize(href) : '';

      return { platform: 'ebay', title, priceStr, price, link };
    }).filter(v => v.title && v.link && !Number.isNaN(v.price) && v.price > 0).slice(0, 15);

    console.log('[이베이] 수집된 아이템:', items.length);
    return items;
  }

  function send() {
    try {
      const payload = { type: 'SCRAPE_RESULT', platform: 'ebay', items: parseEbay() };
      chrome.runtime.sendMessage(payload);
    } catch (e) {
      // 무시
    }
  }

  window.addEventListener('load', () => {
    setTimeout(send, 600);
    setTimeout(send, 1800);
  });

  let t;
  document.addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(send, 600);
  }, { passive: true });
})();
