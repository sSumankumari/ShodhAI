import os
import json
import requests
from bs4 import BeautifulSoup
from config import CONTENT_FILE, CONTENT_DIR, HISTORY_FILE

def extract_content(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')

    for script in soup(["script", "style"]):
        script.extract()

    text = '\n'.join(
        chunk.strip() for line in soup.get_text().splitlines()
        for chunk in line.split("  ") if chunk.strip()
    )

    os.makedirs(CONTENT_DIR, exist_ok=True)
    with open(CONTENT_FILE, 'w', encoding='utf-8') as f:
        f.write(text)

    return {"url": url, "content": text[:500] + "..."}


def ask_groq(question, content, client):
    prompt = f"""
    Based on the following website content:

    {content}

    Please answer the following question:
    {question}

    If the answer is not found in the content, please say "I couldn't find information about that in the website content."
    """

    response = client.chat.completions.create(
        model="gemma2-9b-it",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that answers questions based on website content."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500
    )
    return response.choices[0].message.content
