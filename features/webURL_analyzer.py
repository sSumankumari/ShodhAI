import os
import requests
from bs4 import BeautifulSoup
import json

try:
    import groq
except ImportError:
    groq = None  # If groq is not installed, Q&A won't work

def extract_website_content(url):
    """Extract and clean text content from a website URL."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                          'AppleWebKit/537.36 (KHTML, like Gecko) '
                          'Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
        text = soup.get_text(separator='\n')
        # Remove blank lines and strip
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        text = '\n'.join(lines)
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract content: {str(e)}")

def chunk_text(text, max_length=1500):
    """Chunk content to fit context window for LLMs."""
    words = text.split()
    return [' '.join(words[i:i+max_length]) for i in range(0, len(words), max_length)]

def answer_question_groq(question, content, groq_api_key, model="gemma2-9b-it"):
    """Ask a question about content using the Groq LLM API."""
    if not groq:
        return "Groq library not installed. Q&A unavailable."
    if not groq_api_key:
        return "Groq API key is not configured."

    client = groq.Groq(api_key=groq_api_key)
    # Choose the most relevant chunk naively; for production, use embedding similarity
    chunks = chunk_text(content)
    # Simple: use the largest chunk (or the first chunk) for now
    context = chunks[0] if chunks else ""
    prompt = (
        f"Based on the following website content:\n\n"
        f"{context}\n\n"
        f"Please answer the following question:\n{question}\n\n"
        f"If the answer is not found in the content, say: \"I couldn't find information about that in the website content.\""
    )
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system",
                 "content": "You are a helpful assistant that answers questions based on website content."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error from Groq API: {str(e)}"

def analyze(url, question=None, groq_api_key=None, model="gemma2-9b-it"):
    """
    Main entry point: extract content and optionally answer a question.
    Returns: dict with keys 'url', 'summary', and optionally 'answer'.
    """
    try:
        content = extract_website_content(url)
        summary = content[:1000] + ("..." if len(content) > 1000 else "")
        result = {"url": url, "summary": summary}
        if question and groq_api_key:
            answer = answer_question_groq(question, content, groq_api_key, model=model)
            result['answer'] = answer
        return result
    except Exception as e:
        return {"error": str(e)}