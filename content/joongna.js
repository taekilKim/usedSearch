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
      const items = parseJoongna();
      const payload = { type: 'SCRAPE_RESULT', platform: 'joongna', items };
      chrome.runtime.sendMessage(payload, () => {
        console.log('[중고나라] 메시지 전송 완료:', items.length, '개');
      });
    } catch (e) {
      console.error('[중고나라] 오류:', e);
    }
  }

  // 즉시 실행 + 지연 실행 (SPA 대응)
  setTimeout(send, 500);
  setTimeout(send, 1500);
  setTimeout(send, 3000);

  // load 이벤트 처리 (아직 로드 안된 경우)
  if (document.readyState === 'complete') {
    setTimeout(send, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(send, 1000);
      setTimeout(send, 2000);
    });
  }

  // 사용자가 스크롤할 때도 갱신
  let t;
  document.addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(send, 800);
  }, { passive: true });
})();