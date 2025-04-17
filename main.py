# main.py

from fastapi import FastAPI, Request, HTTPException, Security, JSONResponse
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from pydantic import BaseModel, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from model import correct_text
import logging
import logging.handlers
import traceback
import os
import uuid
import re
from typing import Optional, List

# 보안 로깅 설정
class SensitiveFormatter(logging.Formatter):
    def format(self, record):
        message = super().format(record)
        patterns = [
            (r'password=.*?[,\s]', 'password=*****'),
            (r'token=.*?[,\s]', 'token=*****'),
            (r'api_key=.*?[,\s]', 'api_key=*****'),
        ]
        for pattern, mask in patterns:
            message = re.sub(pattern, mask, message)

        return message
    
def setup_secure_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    handler = logging.handlers.RotatingFileHandler(
        'app.log',
        maxBytes=10000000,
        backupCount=5
    )
    handler.setFormatter(SensitiveFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    logger.addHandler(handler)

setup_secure_logging()

# API 키 설정
api_key_header = APIKeyHeader(name="X-API-Key")
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise RuntimeError("API_KEY environment variable is not set")

# Rate Limiter 설정
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)
 
# 프론트엔드 CORS 허용 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://YOUR_EXTENSION_ID",
        "http://your-domain.com"       
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET"],  # GET 메소드 추가 (health 엔드포인트용)
    allow_headers=["Content-Type", "X-API-Key"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=[
    "your-domain.com",
    "localhost",  # 오타 수정: lovalhost -> localhost
    "127.0.0.1"
])

if os.getenv("ENV") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# 요청 모델 정의
class TextRequest(BaseModel):
    text: str
    
    @field_validator('text')
    @classmethod
    def validate_text_length_and_chars(cls, v):
        if len(v) < 1 or len(v) > 1000:
            raise ValueError('Text must be between 1 and 1000 characters')
        forbidden_chars = ['<', '>', ';', '$', '{', '}', '(', ')', '&', '|']
        if any(char in v for char in forbidden_chars):
            raise ValueError('Invalid characters detected')
        return v

# API 키 검증
async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    if api_key != API_KEY:
        logging.warning(f"Invalid API key attempt detected")
        raise HTTPException(
            status_code=403,
            detail="Invalid API key"
        )
    return api_key

# 보안 헤더 미들웨어
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# POST / spellcheck API 엔드포인트
@app.post("/spellcheck")
@limiter.limit("10/minute")
async def spellcheck(
    req: TextRequest,
    request: Request,
    api_key: str = Security(verify_api_key)
):
    request_id = str(uuid.uuid4())
    client_ip = request.client.host

    try:
        logging.info(f"Request ID: {request_id} - Processing request from {client_ip}")

        corrected = correct_text(req.text)

        logging.info(f"Request ID: {request_id} - Successfully processed")
        return {
            "request_id": request_id,
            "result": corrected,
            "success": True
        }
    
    except Exception as e:
        logging.error(f"Request ID: {request_id} - Error processing request: {str(e)}")
        logging.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "request_id": request_id,
                "success": False,
                "error": "Internal server error"
            }
        )
     
# 상태 확인 엔드포인트
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 시작 이벤트
@app.on_event("startup")
async def startup_event():
    logging.info("Starting application with secure configurations")
    # 환경 변수 검증
    required_vars = ['API_KEY', 'ENV']
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {missing}")