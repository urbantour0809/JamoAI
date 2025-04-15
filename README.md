<p align="center">
  <img src="./JamoAI.png" width="180" alt="JamoAI Logo" />
</p>

# 🧠 JamoAI – Korean Spell & Grammar Assistant

**JamoAI**는 한국어 사용자들을 위한 맞춤법 및 문법 교정기입니다.  
딥러닝 기반 KoBART 모델을 활용하여, 틀린 문장을 실시간으로 자연스럽게 교정하고 추천까지 제공합니다.

---

## 🚀 주요 기능

- ✅ **한국어 문장 실시간 맞춤법 검사**
- ✅ **자음·모음 기반 문법 오류 인식**
- ✅ **AI 기반 문장 교정 (KoBART 기반)**
- ✅ **오타 추천 및 자동완성 기능 (추가 예정)**

---

## 📦 기술 스택

- **FastAPI** – 서버/API
- **KoBART** – 딥러닝 기반 교정 모델
- **Cloudtype** – GPU 서버 배포
- **Chrome Extension** – 실시간 웹 텍스트 검사

---

## 🧪 예시

```bash
POST /spellcheck
Body: { "text": "이거슨 틀린 문장입니당." }

Response:
{ "result": "이것은 틀린 문장입니다." }
```

---

## ☁️ 배포

Cloudtype에서 GPU 서버를 설정하여 FastAPI 서버를 실행합니다.  
`.cloudtype/app.yaml` 설정을 참조하세요.

---

## 👏 만든 이유

한국어 맞춤법 교정기는 많지만, **딥러닝 기반으로 고도화된 실시간 교정**은 많지 않습니다.  
JamoAI는 한글의 자모 특성과 문맥을 반영하여, 보다 자연스럽고 유용한 교정 경험을 제공하는 것을 목표로 합니다.

---
