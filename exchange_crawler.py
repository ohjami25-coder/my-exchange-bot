import os
import requests
import json
import base64
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
import time

############################################################################
# 이 코드는 GitHub Actions(서버) 환경에서 실행될 것을 고려하여, 
# 화면이 없는 상태(headless)로 브라우저를 띄우고, 
# 크롤링한 데이터를 exchange.json 파일로 만들어 본인의 
# GitHub 저장소에 자동으로 업데이트(Push)하는 기능을 모두 포함하고 있습니다.
############################################################################

# --- 설정 정보 (본인의 정보로 수정) ---
# GitHub Actions 실행 시 환경 변수에서 토큰을 가져옵니다.
GITHUB_TOKEN = os.environ.get('GH_TOKEN') 
REPO_NAME = "ohjami25-coder/my-exchange-bot" # 예: "hong-gildong/my-exchange-bot"
FILE_PATH = "exchange.json"

def get_exchange_data():
    """네이버에서 환율 데이터를 크롤링하여 리스트로 반환"""
    options = Options()
    options.add_argument('--headless') # 서버 실행을 위해 필수
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    # 드라이버 설정
    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=options)
    
    url = "https://m.stock.naver.com/marketindex/home/exchangeRate/exchange"
    browser.get(url)
    
    exchange_data = []
    try:
        wait = WebDriverWait(browser, 15)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ul[class*='MainList_list']")))

        # 1~6번째 항목 추출 (미국, 유럽, 일본, 중국, 유로/달러, 파운드/달러)
        for i in range(1, 7):
            try:
                li_selector = f"#content > div.MainList_article__uH_0c > ul > li:nth-child({i})"
                li = browser.find_element(By.CSS_SELECTOR, li_selector)
                
                name = li.find_element(By.CSS_SELECTOR, "strong[class*='name']").text.strip()
                price = float(li.find_element(By.CSS_SELECTOR, "span[class*='price']").text.replace(',', ''))
                
                fluct_area = li.find_element(By.CSS_SELECTOR, "div[class*='Fluctuation_article']")
                is_falling = "FALLING" in fluct_area.get_attribute("class")
                
                change_val = float(fluct_area.find_element(By.CSS_SELECTOR, "span[class*='fluctuation']").text.replace(',', ''))
                if is_falling: change_val = -change_val
                
                ratio = fluct_area.find_elements(By.CSS_SELECTOR, "span[class*='fluctuation']")[1].text.strip()
                date = li.find_element(By.CSS_SELECTOR, "span[class*='time']").text.replace('.', '').strip()

                exchange_data.append({
                    'name': name, 'price': price, 'change': change_val, 'ratio': ratio, 'date': date
                })
            except: continue
    finally:
        browser.quit()
    return exchange_data

def upload_to_github(data):
    """추출한 데이터를 JSON으로 변환하여 GitHub에 업로드"""
    if not GITHUB_TOKEN:
        print("에러: GH_TOKEN이 설정되지 않았습니다. 로컬 테스트 중이라면 JSON 파일만 생성합니다.")
        with open(FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return

    url = f"https://api.github.com/repos/{REPO_NAME}/contents/{FILE_PATH}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # 1. 기존 파일의 SHA 값 확인
    res = requests.get(url, headers=headers)
    sha = res.json().get('sha') if res.status_code == 200 else None

    # 2. JSON 내용 인코딩
    content = json.dumps(data, indent=4, ensure_ascii=False)
    encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')

    # 3. GitHub API를 통해 파일 업데이트
    payload = {
        "message": f"Update exchange rate: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "content": encoded_content,
        "sha": sha
    }

    response = requests.put(url, headers=headers, json=payload)
    if response.status_code in [200, 201]:
        print(f"[{datetime.now()}] GitHub 업로드 완료!")
    else:
        print(f"업로드 실패: {response.json()}")

if __name__ == "__main__":
    print("환율 크롤링 시작...")
    data_list = get_exchange_data()
    if data_list:
        upload_to_github(data_list)
    else:
        print("데이터를 가져오지 못했습니다.")
