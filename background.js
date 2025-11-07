// 크로스-탭에서 오는 스크랩 결과를 모아 저장하고, 팝업에 브로드캐스트

// 메모리 캐시 + 영구 저장
const KEY = 'aggResults';
let cache = { bunjang: [], joongna: [] };

async function load() {
  const s = await chrome.storage.local.get([KEY]);
  cache = s[KEY] || cache;
}

async function save() {
  await chrome.storage.local.set({ [KEY]: cache });
}

chrome.runtime.onInstalled.addListener(load);
chrome.runtime.onStartup.addListener(load);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'SCRAPE_RESULT' && msg.platform && Array.isArray(msg.items)) {
    cache[msg.platform] = msg.items;
    save();

    // 팝업에 최신 데이터 브로드캐스트
    chrome.runtime.sendMessage({ type: 'AGG_UPDATED', data: cache });
  }
});

// 팝업이 현재 결과를 요청할 때
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'GET_AGG') {
    sendResponse({ data: cache });
  }
});