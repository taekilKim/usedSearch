// 중고나라(웹) 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseJoongna() {
    // 더 포괄적인 셀렉터 사용
    const cards = [
      ...document.querySelectorAll('a[href*="/product/"], div[class*="product"], div[class*="Product"], li[class*="item"], article')
    ].filter(node => {
      return node.tagName === 'A' || node.querySelector('a[href*="/product/"]');
    });

    const items = cards.slice(0, 50).map(card => {
      const titleSelectors = '.title, [data-testid="title"], .product-title, h3, h4, div[class*="title"], div[class*="Title"], span[class*="title"], p[class*="title"]';
      const priceSelectors = '.price, [data-testid="price"], .product-price, span[class*="price"], div[class*="price"], span[class*="Price"], div[class*="Price"]';

      const title = safeText(card, titleSelectors);
      const priceStr = safeText(card, priceSelectors);
      const price = parsePriceToNumber(priceStr);

      const href = card.getAttribute('href') || card.querySelector('a[href*="/product/"]')?.getAttribute('href');
      const link = href ? absolutize(href) : '';

      return { platform: 'joongna', title, priceStr, price, link };
    }).filter(v => v.title && v.link && !Number.isNaN(v.price) && v.price > 0).slice(0, 30);

    console.log('[중고나라] 수집된 아이템:', items.length);
    return items;
  }

  function send() {
    try {
      const payload = { type: 'SCRAPE_RESULT', platform: 'joongna', items: parseJoongna() };
      chrome.runtime.sendMessage(payload);
    } catch (e) {}
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