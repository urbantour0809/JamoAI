# JamoAI – 딥러닝 기반 한국어 맞춤법 교정기 (ET5 기반)

JamoAI는 ETRI의 ET5 딥러닝 모델을 활용한 실시간 한국어 맞춤법 교정 API입니다.  
FastAPI 프레임워크 위에 구축되었으며, 보안성, 확장성, 실시간성을 고려한 구조를 가지고 있습니다.

---

## 1. 프로젝트 설명

이 프로젝트는 Chrome Extension, 웹 클라이언트 등에서 호출 가능한 맞춤법 교정 API를 제공합니다.  
교정은 `j5ng/et5-typos-corrector` 모델을 기반으로 수행되며, 보안 로그, API 키, Rate Limit, XSS 방지 등의 안전장치도 함께 적용됩니다.

- 실시간 텍스트 교정 기능
- API Key 인증
- 요청 제한(Rate Limiting)
- HTTPS 강제 리디렉션 (운영 환경)
- 보안 로그 마스킹 및 로테이션
- 입력 길이 및 유해문자 검증

---

## 2. 주요 기술 스택

- 언어: Python 3.10+
- 프레임워크: FastAPI
- 모델: j5ng/et5-typos-corrector (ETRI ET5)
- 서버 보안: APIKey, CORS, Trusted Host, HTTPS Redirect, 보안 헤더
- 로깅: RotatingFileHandler, 마스킹 로거
- 요청 제한: slowapi
- 비동기 요청 처리: httpx (Cloudtype 프록시 구성 시)

---

## 3. 설치 및 실행 방법

### 3.1 의존성 설치

```bash
pip install -r requirements.txt
```

### 3.2 환경 변수 설정

`.env` 또는 시스템 환경에 아래 변수를 등록합니다.

```
API_KEY=your_api_key_here
ENV=development  # 또는 production
```

### 3.3 서버 실행

```bash
uvicorn main:app --reload
```

---

## 4. API 사용 예시

### POST `/spellcheck`

요청:

```
POST /spellcheck
X-API-Key: your_api_key_here
Content-Type: application/json

{
  "text": "이거슨 틀린 문장입니당."
}
```

응답:

```json
{
  "request_id": "uuid-값",
  "result": "이것은 틀린 문장입니다.",
  "success": true
}
```

### GET `/health`

서버 헬스 체크용 엔드포인트입니다.

---

## 5. 보안 기능

- API Key 인증 (`X-API-Key` 헤더)
- CORS 제한: 등록된 origin만 허용
- Rate Limiting: 기본 10회/분 제한
- 보안 로그 마스킹: password, token, api_key 등
- Strict 보안 헤더 삽입
- 입력 필터링: 금지 문자가 포함된 요청 거부

---

## 6. 모델 동작 방식

- GPU 사용 가능 시 `cuda`로 작동
- 입력은 1000자 이내 제한
- 최대 출력 길이 및 추론 시간 제한 적용
- timeout context manager로 과부하 방지
- 비동기 FastAPI 요청 처리와 독립적으로 GPU 처리 수행

---

## 7. 폴더 구성

```
.
├── main.py               # FastAPI 서버 및 보안 설정
├── model.py              # 딥러닝 모델 로딩 및 교정 함수
├── ngrok_start.py        # ngrok API 설정
├── requirements.txt      # 의존성 목록
```

---

## 8. 향후 작업 계획

- Chrome Extension 프론트엔드 연결
- 사용자 피드백 기반으로 추천 단어 기능 추가
- Cloudtype 배포 자동화 및 서명 기반 API 보안 강화

---

## 9. 라이센스

MIT License
