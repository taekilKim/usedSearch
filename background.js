// 크로스-탭에서 오는 스크랩 결과를 모아 저장하고, 팝업에 브로드캐스트

// 허용된 플랫폼 목록
const ALLOWED_PLATFORMS = ['bunjang', 'joongna', 'daangn'];

// 메모리 캐시 + 영구 저장
const KEY = 'aggResults';
let cache = { bunjang: [], joongna: [], daangn: [] };

async function load() {
  const s = await chrome.storage.local.get([KEY]);
  cache = s[KEY] || cache;
}

async function save() {
  await chrome.storage.local.set({ [KEY]: cache });
}

chrome.runtime.onInstalled.addListener(async () => {
  // 이전 버전의 데이터 구조를 정리
  const oldData = await chrome.storage.local.get([KEY]);
  if (oldData[KEY]) {
    const cleaned = {
      bunjang: oldData[KEY].bunjang || [],
      joongna: oldData[KEY].joongna || [],
      daangn: oldData[KEY].daangn || []
    };
    cache = cleaned;
    await save();
  } else {
    await load();
  }
});
chrome.runtime.onStartup.addListener(load);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'SCRAPE_RESULT' && msg.platform && Array.isArray(msg.items)) {
    // 허용된 플랫폼인지 확인
    if (!ALLOWED_PLATFORMS.includes(msg.platform)) {
      console.log(`Ignored data from unauthorized platform: ${msg.platform}`);
      return;
    }

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
  } else if (msg?.type === 'CLEAR_CACHE') {
    // 캐시 완전 초기화
    cache = { bunjang: [], joongna: [], daangn: [] };
    save();
    sendResponse({ success: true });
  }
});