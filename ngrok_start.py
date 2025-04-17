#ngrok_start

from pyngrok import ngrok
import uvicorn
from main import app

PORT = 8000

# ngrok 터널 열기
public_url = ngrok.connect(PORT)
print(f"Public URL : {public_url}/docs")

# FastAPI 서버 실행
if __name__ == "__main__" :
    public_url = ngrok.connect(PORT)
    print(f"Public URL: {public_url}/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=PORT)