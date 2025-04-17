from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch
import logging
from contextlib import contextmanager
import signal
import time

# 타임아웃 컨텍ㄱ스트 매니저
class TimeoutException(Exception):
    pass

@contextmanager
def timeout(seconds):
    def timeout_handler(signum, frame):
        raise TimeoutException("Processing timed out")
    
    original_handler = signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(seconds)

    try:
        yield
    finally:
        signal.signal(signal.SIGALRM,original_handler)

# GPU 사용 가능 여부 확인
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class ModelManager:
    _instance = None
    _tokenizer = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
        return cls._instance

    def load_model(self):
        """모델과 토크나이저를 안전하게 로딩합니다."""
        if self._tokenizer is None or self._model is None:
            try:
                self._tokenizer = T5Tokenizer.from_pretrained("j5ng/et5-typos-corrector")
                self._model = T5ForConditionalGeneration.from_pretrained("j5ng/et5-typos-corrector").to(device)
                self._model.eval() # 추론 모드 설정
            except Exception as e:
                logging.error(f"Model loading Failed: {str(e)}")
                raise
        

    # 모델 및 토크나이저 로딩
    def correct_text(self, text: str, max_length: int = 128, timeout_seconds: int = 10) -> str:
        """
        텍스트 교정 수행
        
        Args:
            text: 교정할 텍스트
            max_length: 최대 처리 길이
            timeout_seconds: 처리 제한 시간
            
        Returns:
            교정된 텍스트
            
        Raises:
            ValueError: 입력 검증 실패시
            TimeoutException: 처리 시간 초과시
        """

        # 입력 검증
        if not text or len(text) > max_length:
            raise ValueError(f"Text must be between 1 and {max_length} characters")

        try :

            # 모델 로드
            self.load_model()

            # 입력 전처리 
            inputs = self._tokenizer(
                text, 
                return_tensors="pt", 
                padding=True, 
                truncation=True, 
                max_length = max_length
                ).to(device)
            
            # 타임아웃 설정으로 추론 실행
            with timeout(timeout_seconds):
                with torch.no_grad():
                    output = self._model.generate(
                        inputs.inputs_ids,
                        max_length=max_length,
                        do_sample=False,
                        num_beams=1
                    )

            # 결과 디코딩 및 검증
            result = self._tokenizer.decode(output[0], skip_special_tokens=True)

            if len(result) > max_length * 2:
                raise ValueError("Output text too long")

            return result
        
        except TimeoutException:
            logging.error(f"Processing timed out for input: {text[:50]}...")
            raise
        except Exception as e :
            logging.error(f"Error processing text: {str(e)}")
            raise

# 싱글톤 인스턴스 생성
model_manager = ModelManager()

# 외부 호출용 함수
def correct_text(text: str) -> str:
    return model_manager.correct_text(text)

#테스트
if __name__ == "__main__":
    try:
        sample = "이거슨 틀린 문장입니당."
        print("입력:", sample)
        print("교정:", correct_text(sample))
    except Exception as e:
        print(f"Error: {str(e)}")