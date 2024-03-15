import os
import datetime
from selenium import webdriver
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from openai import OpenAI
import sys

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
        driver.get(link)
        
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
            podcast_name = description_container.find_element(By.ID, 'header-text').text.split('\n') # [podcast_name, subscriber_count]
            description = description_container.find_element(By.CSS_SELECTOR, '.yt-core-attributed-string.yt-core-attributed-string--white-space-pre-wrap')
            
            links = description.find_elements(By.TAG_NAME, 'a')
            link_hrefs = []
            for link in links:
                # IF the link is really a link and not a anchor tag or something else, then add it to the list.
                if 'http' in link.text.strip():
                    link_hrefs.append(link.text.strip())

            link_hrefs.append(podcast_name)
            return link_hrefs

    except Exception as e:
        print(e)
        return []
    
    return []

# Returns a list of tuples: [(publish date, sponsor name, sponsor link, tags, podcast name, podcast link), ...].
def get_sponsors(sponsorData): # sponsorData: [ yt-link, description_links, date), ...].
    # Send the list of links to openAI GPT API to decide which could be sponsors.
    completion = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": """
            Given the following list of links gathered from YouTube video descriptions, please determine which are likely to be a sponsor, and return them in the form of JSON data. I will be using this in a Node.js application function, so it is crucial that 
            the data is returned in the form of a JSON string, with no other text or characters present. Do not justify your answers, do not include any other information, and do not include any other characters or text. If a link is a sponsor, please include the sponsor name, sponsor link, tags (1-2 short words that commonly describe that subject), and the podcast name. If a link is not a sponsor, please do not include it in the JSON string. If none of 
            the links seem to be sponsors, just return an empty JSON string. Note, a sponsor is a company or individual that has paid to have their product or service mentioned in the podcast or video description -which is not the creators own brand, so be careful if names are too similar. Also note, the last item in the list of possible sponsor links, is the YouTube channel name. Thank you for your help with this, I appreciate it very much."""},
            {"role": "user", "content": sponsorData.__str__()}
        ])
    
    # Extract sponsor data from the completion object 
    sponsors = []
    for choice in completion.choices:
        message = choice.message
        content = message.content
        # Extract sponsor data from the content string and append it to the list
        # Assuming the content string is in a specific format (e.g., JSON)
        sponsors.append(content)

    return sponsors or []

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
    for header in podcast_headers:
        try:
            date = get_date(header['aria-label'])
            date_str = date.isoformat()
            link = 'https://www.youtube.com' + header['href']
            description_links = get_podcast_description_links(link)
            sponsorData.append((link, description_links, date_str))
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
            csv_file.write(f'{sponsor}\n')  

    print("Data has been written to sponsors.csv")
    sys.stdout.flush()
    
if __name__ == '__main__':
    main()  