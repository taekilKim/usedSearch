// 가격 문자열을 정수(원)로 파싱: "83,000원", "83,000" → 83000
function parsePriceToNumber(text) {
  if (!text) return NaN;
  const num = (text + "")
    .replace(/[^0-9]/g, "")
    .trim();
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