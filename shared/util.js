// 가격 문자열을 정수(원)로 파싱: "83,000원", "83,000" → 83000
// 소수점이 있는 경우 정수 부분만 추출: "346,123.11" → 346123
function parsePriceToNumber(text) {
  if (!text) return NaN;

  let str = (text + "").trim();

  // 소수점이 있으면 소수점 앞부분만 추출
  if (str.includes('.')) {
    str = str.split('.')[0];
  }

  // 모든 비숫자 문자 제거 (쉼표, 원, $, 공백 등)
  const num = str.replace(/[^0-9]/g, "");

  return num ? Number(num) : NaN;
}

// 안전한 텍스트 추출
function safeText(el, sel) {
  try {
    const t = sel ? el.querySelector(sel)?.textContent : el.textContent;
    return (t || "").trim();
  } catch (_) {
    return "";
  }
}

// 링크 절대경로 보정
function absolutize(href) {
  try { return new URL(href, location.origin).href; } catch (_) { return href; }
}

// 공통 내보내기 (content script 스코프에 바인딩)
window.__UTIL__ = { parsePriceToNumber, safeText, absolutize };