// 알라딘 중고샵 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseAladin() {
    // 알라딘 검색 결과 상품 카드 선택자
    const itemNodes = [
      ...document.querySelectorAll('.ss_book_box, .ss_book_list li, div[itemtype*="Product"]')
    ];

    const items = itemNodes.slice(0, 30).map((node) => {
      const title = safeText(node, '.ss_book_list_title, .bo3, [itemprop="name"], a.bo3');
      const priceStr = safeText(node, '.ss_p2, .ss_p1, [class*="price"], .price_border, [itemprop="price"]');
      const price = parsePriceToNumber(priceStr);
      const href = node.getAttribute('href') || node.querySelector('a')?.getAttribute('href');
      const link = href ? absolutize(href) : location.href;

      return { platform: 'aladin', title, priceStr, price, link };
    }).filter(v => v.title && !Number.isNaN(v.price));

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
