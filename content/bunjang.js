// 번개장터 검색결과 파싱
(function () {
  console.log('[번개장터] 스크립트 시작');
  console.log('[번개장터] UTIL 객체:', window.__UTIL__);

  const { parsePriceToNumber, safeText, absolutize } = window.__UTIL__ || {};

  function parseBunjang() {
    console.log('[번개장터] parseBunjang 실행, URL:', location.href);

    // 실제 페이지 구조 디버깅
    const allLinks = document.querySelectorAll('a');
    // 실제 상품 링크만 찾기 (숫자 ID가 있는 것)
    const productLinks = Array.from(allLinks).filter(a =>
      a.href.includes('/products/') && /\/products\/\d+/.test(a.href)
    );
    console.log('[번개장터] 전체 링크 개수:', allLinks.length);
    console.log('[번개장터] 실제 상품 링크 개수:', productLinks.length);

    if (productLinks.length > 0) {
      console.log('[번개장터] 첫 번째 상품 링크 샘플:', productLinks[0].outerHTML.substring(0, 300));
      console.log('[번개장터] 첫 번째 상품 href:', productLinks[0].href);
    }

    // 실제 상품 링크만 사용
    const itemNodes = productLinks;

    console.log('[번개장터] 발견된 아이템 노드:', itemNodes.length);

    const items = itemNodes.slice(0, 50).map((node, idx) => {
      // node는 <a> 태그 자체
      const link = absolutize(node.href);

      // 모든 텍스트를 가져와서 분석 (공백 제거하지 않고)
      const allText = (node.textContent || '').trim();

      if (idx === 0) {
        console.log('[번개장터] 첫 번째 아이템 전체 텍스트:', allText);
        console.log('[번개장터] 텍스트 타입:', typeof allText);
        console.log('[번개장터] 텍스트 길이:', allText.length);
      }

      // 가격 패턴 찾기 (쉼표로 구분된 숫자: 1,000 ~ 999,999,999)
      const priceMatch = allText.match(/(\d{1,3}(?:,\d{3})+)/);

      if (idx === 0) {
        console.log('[번개장터] 정규식 매칭 결과:', priceMatch);
      }

      const priceStr = priceMatch ? priceMatch[1] : '';
      const price = parsePriceToNumber(priceStr);

      // 제목: 가격 앞부분 (최대 100자, 앞뒤 공백 제거)
      let title = '';
      if (priceMatch && priceMatch.index > 0) {
        title = allText.substring(0, priceMatch.index).trim().substring(0, 100);
      }

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