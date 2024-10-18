document.addEventListener('DOMContentLoaded', function() {
  const apiPortInput = document.getElementById('apiPort');
  const saveButton = document.getElementById('saveSettings');

  // 載入當前設置
  chrome.storage.local.get('api_port', function(result) {
    apiPortInput.value = result.api_port || '59999';
  });

  // 保存設置
  saveButton.addEventListener('click', function() {
    const newPort = apiPortInput.value;
    chrome.storage.local.set({ api_port: newPort }, function() {
      alert('設置已保存');
    window.close();
    });
  });
});

