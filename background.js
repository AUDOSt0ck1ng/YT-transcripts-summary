chrome.runtime.onInstalled.addListener(() => {
  // 初始化配置
  chrome.storage.local.set({
    api_port: '3000'

  }, function() {
    console.log('API 配置已初始化');
  });

  // 創建上下文菜單
  chrome.contextMenus.create({
    id: "ytSummary",
    title: "YT Summary",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ytSummary") {
    if (tab && tab.url) {
      openPopup(tab.url);
    } else {
      console.error("未能獲取 URL");
      openPopup();
    }
  }
});

function openPopup(url = '') {
  chrome.windows.create({
    url: chrome.runtime.getURL(`popup.html?url=${encodeURIComponent(url)}&autoTranscripts=true`),
    type: "popup",
    width: 400,
    height: 300
  });
}
