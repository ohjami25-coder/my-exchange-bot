from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import json
import os
from datetime import datetime

def fetch_interest_rates():
    # 1. 셀레늄 브라우저 설정 (Headless 모드: 화면 없이 실행)
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    # 분석하신 네이버 채권/금리 페이지 URL
    url = "https://m.stock.naver.com/marketindex/home/bondAndInterest/bond/USA"
    
    results = []

    try:
        # print(f"[{datetime.now().strftime('%H:%M:%S')}] 크롤링 시작: {url}")
        driver.get(url)
        
        # 2. 데이터가 포함된 리스트 아이템이 나타날 때까지 대기 (최대 15초)
        wait = WebDriverWait(driver, 15)
        # 이미지 금리1에서 확인한 li 태그 구조 (클래스명에 MainListItem_article 포함)
        items = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'li[class*="MainListItem_article"]')))

        for item in items:
            try:
                # [이름 추출] 미국 국채 10년 등
                name = item.find_element(By.CSS_SELECTOR, 'strong[class*="MainListItem_name"]').text.strip()
                
                # [가격 추출] 금리 수치
                price_text = item.find_element(By.CSS_SELECTOR, 'span[class*="MainListItem_price"]').text.strip()
                
                # [등락 추출] Fluctuation 클래스 내의 수치들
                fluctuations = item.find_elements(By.CSS_SELECTOR, 'span[class*="Fluctuation_fluctuation"]')
                change_text = fluctuations[0].text.strip() if len(fluctuations) > 0 else "0"
                ratio_text = fluctuations[1].text.strip() if len(fluctuations) > 1 else "0%"

                # [상승/하락 판별] 부모 div에 'FALLING' 클래스가 있으면 마이너스 처리
                is_falling = "FALLING" in item.find_element(By.CSS_SELECTOR, 'div[class*="Fluctuation_article"]').get_attribute('class')
                
                # 데이터 정제 (소수점 2자리)
                price_val = float(price_text.replace(",", ""))
                change_val = float(change_text.replace(",", "")) * (-1 if is_falling else 1)

                results.append({
                    "name": name,
                    "price": round(price_val, 3),
                    "change": round(change_val, 3),
                    "ratio": ratio_text,
                    "date": datetime.now().strftime("%Y%m%d %H:%M")
                })
                # print(f"성공: {name} ({price_val}%)")
                
            except Exception as e:
                # 개별 항목 오류 시 건너뛰고 다음 항목 진행
                continue

        # 3. 절대 경로를 이용한 파일 저장 (exchangeRate 폴더 내부 고정)
        # 현재 실행 중인 interest_crawler.py 파일의 폴더 경로 획득
        current_dir = os.path.dirname(os.path.abspath(__file__))
        save_path = os.path.join(current_dir, 'interest.json')

        with open(save_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=4)
        
        # print("-" * 30)
        # print(f"[최종 완료] {len(results)}개의 금리 데이터를 저장했습니다.")
        # print(f"[저장 경로] {save_path}")

    except Exception as e:
        print(f"!!! 크롤링 실패: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    fetch_interest_rates()