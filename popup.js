document.addEventListener('DOMContentLoaded', function() {
  const transcriptsButton = document.getElementById('transcriptsButton');
  const summaryButton = document.getElementById('summaryButton');
  const transcriptsDiv = document.getElementById('transcripts');

  const urlParams = new URLSearchParams(window.location.search);
  const urlFromParams = urlParams.get('url');
  const autoTranscripts = urlParams.get('autoTranscripts');

  if (autoTranscripts === 'true' && urlFromParams) {
    getUrlAndTranscripts(urlFromParams);
    transcriptsButton.style.display = 'none';
    summaryButton.style.display = 'block';
  }

  transcriptsButton.addEventListener('click', () => {
    getUrlAndTranscripts();
    summaryButton.style.display = 'block';
  });

  summaryButton.addEventListener('click', () => {
    getSummary();
  });

  function getUrlAndTranscripts(url) {
    if (url) {
      getSubtitles(url);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const videoUrl = tabs[0].url;
        getSubtitles(videoUrl);
      });
    }
  }

    // 從本地儲存獲取 API 端口
    function getApiPort() {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get('api_port', function(result) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result.api_port || '3000');
          }
        });
      });
    }

  async function getSubtitles(videoUrl) {
    transcriptsDiv.style.display = 'block';
    transcriptsDiv.innerText = '正在獲取字幕信息，請稍候...';
    transcriptsButton.style.display = 'none';

    const urlParams = new URLSearchParams(new URL(videoUrl).search);
    const videoId = urlParams.get('v');

    if (!videoId) {
      transcriptsDiv.innerText = '無法獲取影片 ID，請確保您在 YouTube 頁面上。';
      return;
    }

    try {
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'youtube-transcripts.p.rapidapi.com',
          'x-rapidapi-key': '76d2366dadmshc0c498eb5a723abp1d5754jsnd4c1a2ccfb6b'
        }
      };

      const apiUrl = `https://youtube-transcripts.p.rapidapi.com/youtube/transcript?url=${encodeURIComponent(videoUrl)}`;

      const response = await fetch(apiUrl, options);
      const data = await response.json();

      if (data.content && data.content.length > 0) {
        const subtitles = data.content.map(item => {
          const minutes = Math.floor(item.offset / 60);
          const seconds = Math.floor(item.offset % 60);
          const timeStamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          return `[${timeStamp}] ${item.text}`; // 移除超連結，僅顯示字幕文本
          // return `<a href="#" style="color: white; text-decoration: none;" onclick="updateTime('${item.offset}'); return false;">[${timeStamp}] ${item.text}</a>`; // 將時間戳記變成超連結，並在當前視窗中更新時間軸
        }).join('\n');

        const language = data.lang || '未知';
        transcriptsDiv.innerHTML = `
          <div class="summary-content">
            <!--p>影片 URL：${videoUrl}</p-->
            <!--p>影片 ID：${videoId}</p-->
            <!--p>字幕語言：${language}</p-->
            <p>字幕預覽（時間戳記）：</p>
            <div class="subtitles-container">
              <pre>${subtitles}</pre>
            </div>
          </div>
        `;
      } else {
        transcriptsDiv.innerText = '無法獲取影片字幕，請確保視頻有可用的字幕。';
      }
    } catch (error) {
      console.error('獲取字幕時出錯：', error);
      transcriptsDiv.innerText = '獲取字幕時出錯：' + error.message;
    }
  }

  // 新增這個函數來更新原始視窗的時間軸
  function updateTime(offset) {
    if (window.opener) {
      const videoId = new URL(window.opener.location.href).searchParams.get('v');
      const timeLink = `https://www.youtube.com/watch?v=${videoId}&t=${offset}`; // 生成新的時間鏈接
      window.opener.location.href = timeLink; // 更新原始視窗的 URL
    }
  }

  async function getSummary() {
    const subtitlesContainer = document.querySelector('.subtitles-container pre');
    const subtitles = subtitlesContainer ? subtitlesContainer.textContent : '';
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {role: "system", content: "你是一個專業的影片摘要助手。請根據提供的字幕內容，生成一個簡潔的摘要。"},
            {role: "user", content: `請為以下字幕內容生成摘要：\n\n${subtitles}`}
          ]
        })
      });

      const data = await response.json();
      const summary = data.reply;

      transcriptsDiv.innerHTML = `
        <div class="summary-content">
          <h3>影片摘要：</h3>
          <p>${summary}</p>
        </div>
      `;
    } catch (error) {
      transcriptsDiv.innerHTML = `
        <div class="summary-content">
          <p>獲取摘要時出錯：${error.message}</p>
        </div>
      `;
    }
    
    // 隱藏 Summary 按鈕，防止重複點擊
    summaryButton.style.display = 'none';
  }

  const settingsButton = document.getElementById('settingsButton');

  settingsButton.addEventListener('click', () => {
    openSettings();
  });

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }
});
