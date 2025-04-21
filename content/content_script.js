// content_script.js

// 검사 상태 확인
chrome.storage.local.get(['correctionEnabled'], ({ correctionEnabled }) => {
    if (!correctionEnabled) return;
  
    const inputs = document.querySelectorAll('textarea, input[type="text"]');
    inputs.forEach((input) => {
      setupJamoAI(input);
    });
  });
  
  // 추천 문장을 저장하고, 추천 UI 중복 생성을 방지하기 위한 맵
  const suggestionMap = new Map();
  const debounceTimers = new Map();
  
  /**
   * 입력 필드에 맞춤법 검사 기능을 설정합니다.
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   */
  function setupJamoAI(input) {
    // 중복 삽입 방지
    if (input.dataset.jamoaiAttached === 'true') return;
    input.dataset.jamoaiAttached = 'true';
  
    // 부모 요소에 position: relative를 설정하기 위한 wrapper 생성
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
  
    // 아이콘 삽입
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('assets/icon/icon_16x16.png');
    icon.className = 'jamoai-icon';
    icon.style.position = 'absolute';
    icon.style.right = '6px';
    icon.style.bottom = '6px';
    icon.style.width = '20px';
    icon.style.height = '20px';
    icon.style.opacity = '0.8';
    icon.style.zIndex = 1000;
    wrapper.appendChild(icon);
  
    // 입력 이벤트 감지 (디바운스)
    input.addEventListener('input', () => {
      clearTimeout(debounceTimers.get(input));
  
      const timer = setTimeout(() => {
        requestCorrection(input);
      }, 1000);
  
      debounceTimers.set(input, timer);
    });
  
    // Ctrl + Enter 입력 시 교정 적용
    input.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        const suggestion = suggestionMap.get(input);
        if (suggestion) {
          replaceAndPreserveCursor(input, suggestion);
          removeSuggestionBox();
        }
      }
    });
  }
  
  /**
   * API 요청을 통해 교정 문장을 가져옵니다.
   * @param {HTMLElement} input
   */
  async function requestCorrection(input) {
    const text = input.value;
    if (!text.trim()) return;
  
    try {
      const response = await fetch('https://<YOUR_PROXY_DOMAIN>/spellcheck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'X-API-Key': 'YOUR_API_KEY'  // 필요 시 주석 해제
        },
        body: JSON.stringify({ text })
      });
  
      const data = await response.json();
  
      if (data.result && data.result !== text) {
        suggestionMap.set(input, data.result);
        showSuggestionBox(input, data.result);
      } else {
        removeSuggestionBox();
      }
    } catch (err) {
      console.error('JamoAI 오류:', err);
      removeSuggestionBox();
    }
  }
  
  /**
   * 교정 문장을 입력창 위에 표시합니다.
   * @param {HTMLElement} input
   * @param {string} suggestion
   */
  function showSuggestionBox(input, suggestion) {
    removeSuggestionBox();
  
    const box = document.createElement('div');
    box.id = 'jamoai-suggestion';
    box.className = 'jamoai-suggestion-box';
    box.textContent = suggestion;
  
    const rect = input.getBoundingClientRect();
    box.style.position = 'absolute';
    box.style.top = `${rect.top - 32 + window.scrollY}px`;
    box.style.left = `${rect.left + window.scrollX}px`;
    box.style.background = '#00bcd4';
    box.style.color = '#fff';
    box.style.padding = '6px 12px';
    box.style.borderRadius = '8px';
    box.style.fontSize = '13px';
    box.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    box.style.zIndex = 10000;
    box.style.maxWidth = '400px';
    box.style.whiteSpace = 'pre-wrap';
    box.style.animation = 'fadeIn 0.3s ease';
  
    document.body.appendChild(box);
  }
  
  /**
   * 추천 문장을 제거합니다.
   */
  function removeSuggestionBox() {
    const existing = document.getElementById('jamoai-suggestion');
    if (existing) existing.remove();
  }
  
  /**
   * 텍스트를 교정 문장으로 바꾸되, 커서 위치를 복원합니다.
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @param {string} newText
   */
  function replaceAndPreserveCursor(input, newText) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
  
    input.value = newText;
  
    // 커서 위치 보정 (길이 초과 방지)
    const safePos = Math.min(start, newText.length);
    input.setSelectionRange(safePos, safePos);
  }
  