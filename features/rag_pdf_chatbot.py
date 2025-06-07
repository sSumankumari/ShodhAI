import openai
import PyPDF2
import numpy as np

# Configure your Groq API key
GROQ_API_KEY = "YOUR_GROQ_API_KEY_HERE"
openai.api_key = GROQ_API_KEY
openai.api_base = "https://api.groq.com/openai/v1"  # Set to Groq endpoint

def extract_pdf_text(pdf_file):
    """Extracts all text from a PDF file-like object."""
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to extract PDF: {e}")

def chunk_text(text, max_len=1500):
    """Chunks text into pieces of max_len words for context windowing."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), max_len):
        chunk = " ".join(words[i:i + max_len])
        chunks.append(chunk)
    return chunks

def build_context(chunks, question, max_chunks=3):
    """Naive retrieval: Select the most relevant chunks for the question."""
    # For production, use embedding search; here, use longest overlap as simple retrieval
    ranked = sorted(chunks, key=lambda c: sum(1 for w in question.split() if w in c), reverse=True)
    return "\n\n".join(ranked[:max_chunks])

def answer_from_pdf(pdf_file, question, temperature=0.0):
    """
    Answers a question based on the PDF content using Groq API.
    Args:
        pdf_file: File-like object for the PDF.
        question: User's question as a string.
        temperature: LLM temperature (float).
    Returns:
        str: Answer from the LLM.
    """
    try:
        # Extract and chunk PDF text
        pdf_text = extract_pdf_text(pdf_file)
        if not pdf_text.strip():
            return "The PDF appears to have no extractable text."
        chunks = chunk_text(pdf_text)
        context = build_context(chunks, question)
        prompt = (
            f"Use the following PDF content to answer the user's question.\n\n"
            f"PDF Content:\n{context}\n\n"
            f"Question: {question}\n"
            f"Answer:"
        )
        # Call Groq/OpenAI LLM API
        response = openai.ChatCompletion.create(
            model="mixtral-8x7b-32768",  # Use your preferred Groq-supported model
            messages=[{"role": "system", "content": "You are a helpful AI assistant."},
                      {"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=512,
        )
        answer = response['choices'][0]['message']['content']
        return answer.strip()
    except Exception as e:
        return f"Error generating answer: {str(e)}"