from selenium import webdriver
from bs4 import BeautifulSoup
import datetime
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os


openai_api_key = os.environ.get('openai_api_key')
driver = webdriver.Chrome()
driver.get('https://www.youtube.com/results?search_query=finance+podcast')
content = driver.page_source.encode('utf-8').strip()
soup = BeautifulSoup(content, 'lxml')

import secrets
import base64

def generate_private_key():
    # Generate 32 random bytes
    random_bytes = secrets.token_bytes(32)
    
    # Encode the random bytes using Base64
    private_key = base64.urlsafe_b64encode(random_bytes).decode('utf-8')
    print(private_key)
    
    return private_key


# Returns a string representing the entire podcast description (From YouTube).
def get_podcast_description_links(link):
    try:
        # Get podcast page content.
        driver.get(f'https://www.youtube.com{link}')
        
        # Open the description.
        expand_button = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'expand'))
        )
        expand_button.click()

        description_container = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "description-inline-expander")))

        # Scroll to the description, and get the text.
        if (description_container):
            driver.execute_script("arguments[0].scrollIntoView();", description_container)
            description = description_container.find_element(By.CSS_SELECTOR, '.yt-core-attributed-string.yt-core-attributed-string--white-space-pre-wrap')
            
            links = description.find_elements(By.TAG_NAME, 'a')
            link_hrefs = []
            for link in links:
                # IF the link is really a link and not a anchor tag or something else, then add it to the list.
                if 'http' in link.text.strip():
                    link_hrefs.append(link.text.strip())

            return link_hrefs


    except Exception as e:
        print("ERROR OCCURED WHEN GETTING DESCRIPTION: ", e)
    
    return ''

# Returns a list of sponsors gathered from the podcast description.
def get_sponsors(links: [str]):
    sponsors = []

    # Send the list of links to openAI GPT API to decide which could be sponsors.
    # If the link is a sponsor, have the AI assign a tag to its genre (i.e. "technology," "finance," "sports," etc.)
    # Make sure the data is returned in a list of tuples, with the link and its genre, like such:
    # [('https://www.sponsor1.com', 'finance'), ('https://www.sponsor2.com', 'technology'), ...]
    # Then we return this list.

    print(openai_api_key)
    
    return sponsors

# Returns a datetime.date object, representing the date the podcast was posted.
def get_date(podcast_label: str):
    start_index = podcast_label.find('views') + 6
    end_index = podcast_label.find('ago') + 3 

    verbal_date = podcast_label[start_index:end_index].strip().split(' ') # Format --> ['1', 'day', 'ago'] or # ['streamed', '1', 'day', 'ago'].
    today = datetime.date.today()
    
    if verbal_date[0] == 'streamed': pass
    elif verbal_date[1] == 'day' or verbal_date[1] == 'days':
        return today - datetime.timedelta(days=int(verbal_date[0]))
    elif verbal_date[1] == 'week' or verbal_date[1] == 'weeks':
        return today - datetime.timedelta(weeks=int(verbal_date[0]))
    elif verbal_date[1] == 'month' or verbal_date[1] == 'months':
        return today - datetime.timedelta(days=int(verbal_date[0]) * 30)
    elif verbal_date[1] == 'year' or verbal_date[1] == 'years':
        return today - datetime.timedelta(days=int(verbal_date[0]) * 365)
    else:
        return today

def main():
    generate_private_key();
    return
    podcast_headers = soup.findAll('a', id='video-title')
    with open('sponsors.csv', 'w') as csv_file:
        csv_file.write('Sponsors, Podcast Link, Date Posted\n')
        for header in podcast_headers:
            try:
                date = get_date(header['aria-label'])
                link = header['href']
                description_links = get_podcast_description_links(link)
                sponsors = get_sponsors(description_links)

                if (len(description_links) > 0):
                    sponsors = get_sponsors(description_links)
                    csv_file.write(f'Podcast Links: {description_links}, Sponsors: {sponsors}, Link: https://www.youtube.com{link}, Date: {date}\n')
                    if (len(sponsors) > 0):
                        print("We have a sponsor! \n Exiting program...")
            except Exception as e:
                print(e)
                continue             

if __name__ == '__main__':
    main()