// 번개장터 검색결과 파싱
(function () {
  console.log('[번개장터] 스크립트 시작');
  console.log('[번개장터] UTIL 객체:', window.__UTIL__);

  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseBunjang() {
    console.log('[번개장터] parseBunjang 실행, URL:', location.href);

    // 실제 페이지 구조 디버깅
    const allLinks = document.querySelectorAll('a');
    const productLinks = Array.from(allLinks).filter(a => a.href.includes('/products/'));
    console.log('[번개장터] 전체 링크 개수:', allLinks.length);
    console.log('[번개장터] /products/ 링크 개수:', productLinks.length);

    if (productLinks.length > 0) {
      console.log('[번개장터] 첫 번째 상품 링크 샘플:', productLinks[0].outerHTML.substring(0, 200));
    }

    // 더 포괄적인 셀렉터 사용
    const itemNodes = [
      ...document.querySelectorAll('a[href*="/products/"], div[class*="product"], div[class*="Product"], li[class*="product"]')
    ].filter(node => {
      // 중복 제거: href가 있는 것만 또는 자식에 링크가 있는 것만
      return node.tagName === 'A' || node.querySelector('a[href*="/products/"]');
    });

    console.log('[번개장터] 발견된 아이템 노드:', itemNodes.length);

    const items = itemNodes.slice(0, 50).map((node, idx) => {
      // 다양한 셀렉터 시도
      const titleSelectors = '[data-testid="product-title"], .title, .name, h3, h4, div[class*="title"], div[class*="Title"], span[class*="title"]';
      const priceSelectors = '[data-testid="product-price"], .price, span[class*="price"], div[class*="price"], span[class*="Price"], div[class*="Price"]';

      const title = safeText(node, titleSelectors);
      const priceStr = safeText(node, priceSelectors);
      const price = parsePriceToNumber(priceStr);

      const href = node.getAttribute('href') || node.querySelector('a[href*="/products/"]')?.getAttribute('href');
      const link = href ? absolutize(href) : '';

      if (idx === 0) {
        console.log('[번개장터] 첫 번째 아이템 파싱 결과:', { title, priceStr, price, link });
      }

      return { platform: 'bunjang', title, priceStr, price, link };
    }).filter(v => v.title && v.link && !Number.isNaN(v.price) && v.price > 0).slice(0, 30);

    console.log('[번개장터] 수집된 아이템:', items.length);
    if (items.length > 0) {
      console.log('[번개장터] 첫 번째 수집 아이템:', items[0]);
    }
    return items;
  }

  function send() {
    try {
      const items = parseBunjang();
      const payload = { type: 'SCRAPE_RESULT', platform: 'bunjang', items };
      chrome.runtime.sendMessage(payload, () => {
        console.log('[번개장터] 메시지 전송 완료:', items.length, '개');
      });
    } catch (e) {
      console.error('[번개장터] 오류:', e);
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