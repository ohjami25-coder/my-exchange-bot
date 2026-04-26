import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
import time

options = webdriver.ChromeOptions()
options.add_experimental_option("excludeSwitches", ["enable-logging"])
browser = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

url = "https://m.stock.naver.com/marketindex/home/exchangeRate/exchange"
browser.get(url)

try:
    wait = WebDriverWait(browser, 15)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ul[class*='MainList_list']")))

    exchange_data = []

    # 1번째부터 6번째 항목 추출
    for i in range(1, 7):
        try:
            # 각 항목의 li 요소 선택
            li_selector = f"#content > div.MainList_article__uH_0c > ul > li:nth-child({i})"
            li_element = browser.find_element(By.CSS_SELECTOR, li_selector)
            
            # 1. 통화명 (strong 태그)
            name = li_element.find_element(By.CSS_SELECTOR, "strong[class*='name']").text.strip()
            
            # 2. 현재가 (span 태그)
            price_text = li_element.find_element(By.CSS_SELECTOR, "span[class*='price']").text
            price = float(price_text.replace(',', ''))
            
            # 3. 전일비 및 상승/하락 판단 (Fluctuation 영역)
            # ee.png의 구조를 반영하여 FALLING/RISING 클래스를 체크합니다.
            fluct_area = li_element.find_element(By.CSS_SELECTOR, "div[class*='Fluctuation_article']")
            is_falling = "FALLING" in fluct_area.get_attribute("class")
            
            # 전일비 수치 추출
            change_text = fluct_area.find_element(By.CSS_SELECTOR, "span[class*='fluctuation']").text
            change_val = float(change_text.replace(',', ''))
            if is_falling:
                change_val = -change_val # 하락이면 음수로 변환
            
            # 4. 등락률 (두 번째 fluctuation 클래스 span 추출)
            # 보통 전일비 옆에 위치함
            ratio_text = fluct_area.find_elements(By.CSS_SELECTOR, "span[class*='fluctuation']")[1].text.strip()
            
            # 5. 날짜 (ee.png의 MainListItem_time 클래스)
            date_text = li_element.find_element(By.CSS_SELECTOR, "span[class*='time']").text.replace('.', '').strip()

            exchange_data.append({
                '통화명': name,
                '현재가': price,
                '전일비': change_val,
                '등락률': ratio_text,
                '날짜': date_text
            })
                
        except Exception as e:
            print(f"{i}번째 항목 추출 중 오류: {e}")
            continue

    # 데이터프레임 생성
    df = pd.DataFrame(exchange_data)
    
    # 컬럼 순서 고정 및 소수점 설정
    df = df[['통화명', '현재가', '전일비', '등락률', '날짜']]
    pd.options.display.float_format = '{:.2f}'.format
    
    # 결과 출력
    print("-" * 65)
    print(df)
    
    # 엑셀 저장
    file_name = f"naver_exchange_final.xlsx"
    df.to_excel(file_name, index=False)
    print("-" * 65)
    print(f"파일 저장 완료: {file_name}")

except Exception as e:
    print(f"시스템 오류: {e}")

finally:
    time.sleep(2)
    browser.quit()