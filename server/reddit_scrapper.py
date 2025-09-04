import requests,time,csv,re,os,json
import numpy as np
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.options import Options
import random
from pathlib import Path
import logging
  
logger = logging.getLogger("reddit_scraper")
logger.setLevel(logging.INFO)

options=Options()
options.add_argument("--headless")

political_queries = [
    "india politics",
    "india protest",
    "india government fail",
    "india corruption",
    "india democracy threat",
    "india dictatorship",
    "india religious violence",
    "india communal riots",
    "india anti muslim",
    "india anti sikh",
    "india caste violence",
    "india hate speech",
    "india freedom struggle",
    "india human rights violation",
    "india farmers protest",
    "india caa protest",
    "india nrc protest",
    "india modi resign",
    "india bjp fail",
    "india rss agenda",
    "india fake news",
    "india propaganda",
    "india media blackout",
    "boycott india",
    "boycott indian products",
    "boycott bollywood",
    "kashmir freedom",
    "kashmir human rights",
    "kashmir india occupation",
    "kashmir protest",
    "khalistan movement",
    "punjab separatism",
    "anti national india",
    "down with india",
    "stop india aggression",
    "india pakistan conflict",
    "china india border",
    "india brutality",
    "india minority oppression"
]
# PROGRESS_FILE = "ciis_progress.json"

def scrape_reddit_to_csv(output_csv_path:str, queries=political_queries, limit:int= 500):
    count=0
    Path(output_csv_path).parent.mkdir(parents=True, exist_ok= True)
    logger.info("Running scraper and saving csv to %s",output_csv_path)
    browser=webdriver.Firefox(options=options)
    wait= WebDriverWait(browser,10)
    with open(output_csv_path,"w",newline='',encoding="utf-8") as f:
        writer= csv.writer(f)
        writer.writerow(["Title","Reference","Score","Comments","Time","Author","Subreddit","Description","Url"])
        for query in queries:
            browser.get("https://old.reddit.com/search")
    
            search= wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR,"input[placeholder='search']")))
            search.clear()
            search.send_keys(query)
            search.submit()
            for page in range(2):
                wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR,"span.nextprev")))
                posts= browser.find_elements(By.CLASS_NAME,"search-result-link")
                for post in posts:
                    try:
                        link=post.find_element(By.CSS_SELECTOR,"a.thumbnail").get_attribute("href")
                    except:
                        link=np.nan
                    try:
                        header= post.find_element(By.CSS_SELECTOR,"header.search-result-header")
                    except:
                        header=np.nan
                    try:
                        search_title= header.find_element(By.CSS_SELECTOR,"a.search-title").text.strip()
                    except:
                        search_title=np.nan
                    try:
                        reference= header.find_element(By.CSS_SELECTOR,"span span").text.strip()
                    except:
                        reference=np.nan
                    try:
                        search_result_meta= post.find_element(By.CSS_SELECTOR,"div.search-result-meta")
                    except:
                        search_result_meta=np.nan
                    try:
                        search_score= search_result_meta.find_element(By.CSS_SELECTOR,"span.search-score").text.strip()
                    except:
                        search_score=np.nan
                    try:
                        comments= search_result_meta.find_element(By.CSS_SELECTOR,"a.search-comments").text.strip()
                    except:
                        comments=np.nan
                    try:
                        post_time= search_result_meta.find_element(By.CSS_SELECTOR,"span.search-time time").text.strip()
                    except:
                        post_time=np.nan
                    try:
                        author= search_result_meta.find_element(By.CSS_SELECTOR,"span.search-author a.author").text.strip()
                    except:
                        author=np.nan
                    try:
                        subreddit= search_result_meta.find_element(By.CSS_SELECTOR,"a.search-subreddit-link").text.strip()
                    except:
                        subreddit=np.nan
                    try:
                        desc= post.find_element(By.CSS_SELECTOR,".md p").text.strip()
                    except:
                        desc=np.nan
                    # place_name= query.split()[0]
                    keywords=query.lower().split()
                    if any(kw in search_title.lower() or kw in str(desc).lower() for kw in keywords):
                        writer.writerow([search_title,reference,search_score,comments,post_time,author,subreddit,desc,link])
                        count+=1
                next_buttons= browser.find_elements(By.CSS_SELECTOR,"span.nextprev a")
                if next_buttons:
                    next_buttons[-1].click()
                else:
                    break
            time.sleep(random.uniform(1, 2.5))
    time.sleep(2)
    browser.quit()
    logger.info("Scrapper: wrote %d rows to %s",count,output_csv_path)

  


