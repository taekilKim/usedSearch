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

    const items = itemNodes.slice(0, 50).map((node) => {
      const titleSelectors = 'h2, h3, .article-title, [class*="title"], [class*="Title"], span[class*="title"], div[class*="title"]';
      const priceSelectors = '[class*="price"], [class*="Price"], .article-price, .price-text, span[class*="price"], div[class*="price"]';

      const title = safeText(node, titleSelectors);
      const priceStr = safeText(node, priceSelectors);
      const price = parsePriceToNumber(priceStr);

      const href = node.getAttribute('href') || node.querySelector('a[href*="/article"]')?.getAttribute('href');
      const link = href ? absolutize(href) : '';

      return { platform: 'daangn', title, priceStr, price, link };
    }).filter(v => v.title && v.link && !Number.isNaN(v.price) && v.price > 0).slice(0, 30);

    console.log('[당근마켓] 수집된 아이템:', items.length);
    return items;
  }

  function send() {
    try {
      const items = parseDaangn();
      const payload = { type: 'SCRAPE_RESULT', platform: 'daangn', items };
      chrome.runtime.sendMessage(payload, () => {
        console.log('[당근마켓] 메시지 전송 완료:', items.length, '개');
      });
    } catch (e) {
      console.error('[당근마켓] 오류:', e);
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
