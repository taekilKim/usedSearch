// 중고나라(웹) 검색결과 파싱
(function () {
  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseJoongna() {
    const cards = [
      ...document.querySelectorAll('[data-testid="product-card"], a[href*="/product/"]')
    ];

    const items = cards.slice(0, 30).map(card => {
      const title = safeText(card, '.title, [data-testid="title"], .product-title');
      const priceStr = safeText(card, '.price, [data-testid="price"], .product-price');
      const price = parsePriceToNumber(priceStr);
      const href = card.getAttribute('href') || card.querySelector('a')?.getAttribute('href');
      const link = href ? absolutize(href) : location.href;
      return { platform: 'joongna', title, priceStr, price, link };
    }).filter(v => v.title && !Number.isNaN(v.price));

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