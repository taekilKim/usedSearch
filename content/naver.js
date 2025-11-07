// 네이버 중고장터 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseNaver() {
    // 네이버 쇼핑 중고 상품 선택자
    const itemNodes = [
      ...document.querySelectorAll('.product_list_item, .product_item, [data-nclick*="product"], div[class*="product"]')
    ];

    const items = itemNodes.slice(0, 30).map((node) => {
      const title = safeText(node, '.product_title, .basicList_title, [class*="title"]');
      const priceStr = safeText(node, '.price, .price_num, [class*="price"], .num');
      const price = parsePriceToNumber(priceStr);
      const href = node.getAttribute('href') || node.querySelector('a')?.getAttribute('href');
      const link = href ? absolutize(href) : location.href;

      return { platform: 'naver', title, priceStr, price, link };
    }).filter(v => v.title && !Number.isNaN(v.price));

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
