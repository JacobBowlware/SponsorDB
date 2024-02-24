import os
import datetime
from selenium import webdriver
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from openai import OpenAI

openai_api_key = os.environ.get('openai_api_key')
client = OpenAI(api_key=openai_api_key)
driver = webdriver.Chrome()
driver.get('https://www.youtube.com/results?search_query=finance+podcast')
content = driver.page_source.encode('utf-8').strip()
soup = BeautifulSoup(content, 'lxml')

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

            # Last item in link_hrefs needs to be the name of the podcast
            podcast_name = description.find_element(By.ID, 'video-title').text
            link_hrefs.append(podcast_name)
            return link_hrefs


    except Exception as e:
        return []
    
    return ''

# Returns a list of tuples: [(publish date, sponsor name, sponsor link, tags, podcast name, podcast link), ...].
def get_sponsors(sponsorData): # sponsorData: [ yt-link, description_links, date), ...].
    # Send the list of links to openAI GPT API to decide which could be sponsors.
    completion = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": """Based on the given data, gathered from YouTube podcasts, in 
             the form of [yt-link, description_links, date) -note, the last item in description_links 
             is the podcast name- I would like to know which of the given links are sponsoring the podcast. 
             A list, in the form of a tuple, of the sponsors will be returned. The tuple will contain the 
             following: (publish date, sponsor name, sponsor link, tags, podcast name, podcast link). Sponsor 
             names should be the name of the company, or the person, who is sponsoring the podcast. Tags should 
             be a list of keywords that describe the podcast, ie. finance, health, etc. If there are no sponsors, return an empty list. If there are sponsors, only return the sponsors -no filler text."""},
            {"role": "user", "content": sponsorData.__str__()}
        ])
    
    print("CHOICES: ", completion.choices)
    print("MESSAGE 0: ", completion.choices[0].message)
    
    return completion.choices or []

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
    podcast_headers = soup.findAll('a', id='video-title')
    sponsorData = []

    # Get the date, link, and description links for each podcast.
    # for header in podcast_headers:
    for i in range(3):
        print(i)
        header = podcast_headers[i]
        try:
            date = get_date(header['aria-label'])
            date_str = date.isoformat()
            link = header['href']
            description_links = get_podcast_description_links(link)
            sponsorData.append((f'https://www.youtube.com{link}', description_links, date_str))
        except Exception as e:
            print(e)
            continue   

    # Close the browser.
    driver.quit()

    # Write the sponsors to a csv file.
    with open('sponsors.csv', 'w') as csv_file:
        csv_file.write('Publish Date, Sponsor Name, Sponsor Link, Tags, Podcast Name, Podcast Link\n')
        sponsors = get_sponsors(sponsorData)      
        for sponsor in sponsors:
            print("Individual Sponsor: ", sponsor)
            csv_file.write(f'{sponsor}\n')   

if __name__ == '__main__':
    main()