//1. 검사 기능 활성화 여부 확인
chrome.storage.local.get(['correctionEnabled'], ({correctionEnabled}) => {
    if(!correctionEnabled) return; // OFF 상태면 아무것도 하지 않음

    // 2. 웹페이지에서 모든 입력 필드 탐색
    const inputs = document.querySelectorAll('textarea, input[type="text"]');

    inputs.forEach(input => {
        setupJamoAIForInput(input); // 각각의 입력 필드에 맞춤법 검사기 설정
    });
});

// 전역 상태 저장용
let currentSuggestions = new Map() // 입력 요서별 추천 결과 저장
let debounceTimers = new Map() // 입력 요소별 debounce 타이머

// 입력 필드에 맞춤법 검사 기능을 추가합니다.

function setupJamoAIForInput(input) {
    // 1. JamoAi 아이콘 생성 및 삽입
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('icon/icon_16x16.png');
    icon.className = 'jamoai-icon';
    icon.style.position = 'absolute';
    icon.style.width = '16px';
    icon.style.height = '16px';
    icon.style.right = '6px';
    icon.style.bottom = '6px';
    icon.style.zIndex = 1000;

    // 부모 요소를 relative로 설정해야 position absolute가 적용됨
    const wrapper = document.createElement('div');
    wrapper.style.position= 'relative';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    wrapper.appendChild(icon);

    // 2. 입력 이벤트 감자 (debounce 적용)
    input.addEventListener('input', () => {
        clearTimeout(debounceTimers.get(input));

        const timer = setTimeout(() => {
            handleCorrection(input);
        }, 1000); // 1초간 입력이 멈추면 API 호출

        debounceTimers.set(input, timer);

    });

    // 3. Ctrl+Enter 로 교정 적용
    input.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            const suggestion = currentSuggestions.get(input);
            if(suggestion) {
                input.value = suggestion;
                removeSuggestionBox();
            }
        }
    });
}

// 입력된 텍스트를 API로 전송하고 교정 문장을 표시합니다.

async function handleCorrection(inputElement) {
    const originalText = inputElement.value;
    if (!originalText.trim()) return;
  
    try {
      const response = await fetch("https://<YOUR_PROXY_DOMAIN>/spellcheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "YOUR_API_KEY" // 필요하다면 설정
        },
        body: JSON.stringify({ text: originalText })

      });

      const data = await response.json();

      if (data.result && data.result !== originalText) {
        currentSuggestions.set(inputElement, data.result);
        showSuggestionBox(inputElement, data.result);
      }else {
        removeSuggestionBox(); // 차이가 없으면 추천창 제거
      }

    } catch (err) {
        console.error("JamoAI 오류: ", err);
        removeSuggestionBox();
    }
}

// 추천 문장을 입력창 위에 띄웁니다.

function showSuggestionBox(inputElement, text){
    removeSuggestionBox(); // 이전 추천창 제거

    const box = document.createElement('div');
    box.className = 'jamoai-suggestion-box';
    box.textContent = text;

    const rect = inputElement.getBoundingClientRect();

    box.style.position = 'absolute';
    box.style.top = `${rect.top - 30 + window.scrollY}px`;
    box.style.left = `${rect.left + window.scrollX}px`;
    box.style.background = '#00bcd4';
    box.style.color = '#fff';
    box.style.padding = '6px 12px';
    box.style.borderRadius = '12px';
    box.style.fontSize = '12px';
    box.style.zIndex = 9999;
    box.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';

    box.id = 'jamoai-suggestion';
    document.body.appendChild(box);
}

// 추천 박스를 제거합니다.

function removeSuggestionBox(){
    const existing = document.getElementById('jamoai-suggestion');
    if (existing) existing.remove();
}