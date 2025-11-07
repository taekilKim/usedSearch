// 네이버 중고장터 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseNaver() {
    // 더 포괄적인 셀렉터 사용
    const itemNodes = [
      ...document.querySelectorAll('.product_list_item, .product_item, [data-nclick*="product"], div[class*="product"], div[class*="Product"], li[class*="product"], div[class*="item"]')
    ].filter(node => {
      return node.querySelector('a');
    });

    const items = itemNodes.slice(0, 50).map((node) => {
      const titleSelectors = '.product_title, .basicList_title, [class*="title"], [class*="Title"], div[class*="title"], span[class*="title"], a[class*="title"]';
      const priceSelectors = '.price, .price_num, [class*="price"], [class*="Price"], .num, em, strong[class*="price"], span[class*="price"]';

      const title = safeText(node, titleSelectors);
      const priceStr = safeText(node, priceSelectors);
      const price = parsePriceToNumber(priceStr);

      const href = node.getAttribute('href') || node.querySelector('a')?.getAttribute('href');
      const link = href ? absolutize(href) : '';

      return { platform: 'naver', title, priceStr, price, link };
    }).filter(v => v.title && v.link && !Number.isNaN(v.price) && v.price > 0);

    console.log('[네이버] 수집된 아이템:', items.length);
    return items;
  }

  function send() {
    try {
      const payload = { type: 'SCRAPE_RESULT', platform: 'naver', items: parseNaver() };
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
