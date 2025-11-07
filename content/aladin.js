// 알라딘 중고샵 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseAladin() {
    // 더 포괄적인 셀렉터 사용
    const itemNodes = [
      ...document.querySelectorAll('.ss_book_box, .ss_book_list li, div[itemtype*="Product"], li[class*="Search"], div[class*="item"], .search_list li, table tr')
    ].filter(node => {
      // 상품 링크가 있거나 상품 정보가 있는 요소만
      return node.querySelector('a[href*="ItemId"], a[href*="product"], a.bo3');
    });

    const items = itemNodes.slice(0, 30).map((node) => {
      const titleSelectors = '.ss_book_list_title, .bo3, [itemprop="name"], a.bo3, a[href*="ItemId"], b, strong, h3';
      const priceSelectors = '.ss_p2, .ss_p1, [class*="price"], .price_border, [itemprop="price"], span[class*="price"], b, strong';

      const title = safeText(node, titleSelectors);
      const priceStr = safeText(node, priceSelectors);
      const price = parsePriceToNumber(priceStr);

      const href = node.querySelector('a[href*="ItemId"], a[href*="product"], a.bo3')?.getAttribute('href');
      const link = href ? absolutize(href) : '';

      return { platform: 'aladin', title, priceStr, price, link };
    }).filter(v => v.title && v.link && !Number.isNaN(v.price) && v.price > 0).slice(0, 15);

    console.log('[알라딘] 수집된 아이템:', items.length);
    return items;
  }

  function send() {
    try {
      const payload = { type: 'SCRAPE_RESULT', platform: 'aladin', items: parseAladin() };
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
