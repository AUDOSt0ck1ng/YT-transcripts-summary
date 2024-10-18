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
            resolve(result.api_port || '59999');
          }
        });
      });
    }

// 從本地 API 獲取 RapidAPI 金鑰
async function getRapidAPIKey() {
  try {
    const port = await getApiPort();
    const response = await fetch(`http://localhost:${port}/get-x-rapidapi-key`);
    const data = await response.text();
    return data.replace(/^"|"$/g, '');
  } catch (error) {
    console.error('獲取 RapidAPI 金鑰時出錯');
  }
}

  // 從本地 API 獲取 RapidAPI 主機
  async function getRapidAPIHost() {
    try {
      const port = await getApiPort();
      const response = await fetch(`http://localhost:${port}/get-x-rapidapi-host`);
      const data = await response.text();
      return data.replace(/^"|"$/g, '');
    } catch (error) {
      console.error('獲取 RapidAPI 主機時出錯');
    }
  }

  // 從本地 API 獲取 OpenAI API 金鑰
  async function getOpenAIApiKey() {
    try {
      const port = await getApiPort();
      const response = await fetch(`http://localhost:${port}/get-openai-api-key`);
      const data = await response.text();
      return data.replace(/^"|"$/g, '');
    } catch (error) {
      console.error('獲取 OpenAI API 金鑰時出錯');
    }
  }

  // 獲取LLM_model
  async function getLLMModel() {
    try {
      const port = await getApiPort();
      const response = await fetch(`http://localhost:${port}/get-llm-model`);
      const data = await response.text();
      return data.replace(/^"|"$/g, '');
    } catch (error) {
      console.error('獲取 LLM 模型時出錯');
    }
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

      // 獲取 RapidAPI 主機和金鑰
      const rapidApiHost = await getRapidAPIHost();
      const rapidApiKey = await getRapidAPIKey();
      const openaiApiKey = await getOpenAIApiKey();
      const port = await getApiPort();
  
      console.log('port:', port);
      console.log('RapidAPI Host:', rapidApiHost);
      console.log('RapidAPI Key:', rapidApiKey ? '已獲取' : '未獲取');
      console.log('OpenAI API Key:', openaiApiKey ? '已獲取' : '未獲取');
  
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-host': rapidApiHost,
          'x-rapidapi-key': rapidApiKey
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
          return `[${timeStamp}] ${item.text}`;
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
  async function getSummary() {
    const subtitlesContainer = document.querySelector('.subtitles-container pre');
    const subtitles = subtitlesContainer ? subtitlesContainer.textContent : '';
    
    try {
      const openaiApiKey = await getOpenAIApiKey();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: await getLLMModel(),
          messages: [
            {role: "system", content: "你是一個專業的影片摘要助手。請根據提供的字幕內容，生成一個簡潔的摘要。"},
            {role: "user", content: `請為以下字幕內容生成摘要：\n\n${subtitles}`}
          ]
        })
      });

      const data = await response.json();
      const summary = data.choices[0].message.content;

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

