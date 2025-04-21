const API_URL = "실제 주소";

document.getElementById("submitBtn").addEventListener("click", async () => {
    const input = document.getElementById("inputText").value;
    const resultDiv = document.getElementById("resultText");

    if(!input.trim()) {
        resultDiv.textContent = "입력 문장을 먼저 작성해주세요.";
        return;
    }

    resultDiv.textContent = "교정중....";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text:input })
        });

        const data = await response.json();

        if(data.result) {
            resultDiv.textContent = data.result;
        } else if (data.error) {
            resultDiv.textContent = '오류: ${data.error}';
        } else {
            resultDiv.textContent = "알 수 없는 응답입니다.";
        }
    } catch (error) {
        resultDiv.textContent = "서버 요청 중 오류가 발생했습니다.";
        console.error(error);
    }

})