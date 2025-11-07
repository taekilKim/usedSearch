// 이베이 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseEbay() {
    // 이베이 검색 결과 아이템 선택자
    const itemNodes = [
      ...document.querySelectorAll('.s-item, li[data-view], div.srp-results .s-item')
    ];

    const items = itemNodes.slice(0, 30).map((node) => {
      const title = safeText(node, '.s-item__title, h3.s-item__title, [role="heading"]');
      const priceStr = safeText(node, '.s-item__price, span[class*="price"]');
      const price = parsePriceToNumber(priceStr);
      const href = node.getAttribute('href') || node.querySelector('a')?.getAttribute('href');
      const link = href ? absolutize(href) : location.href;

      return { platform: 'ebay', title, priceStr, price, link };
    }).filter(v => v.title && !Number.isNaN(v.price));

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
