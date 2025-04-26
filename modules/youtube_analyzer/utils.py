import os
from .transcript_extractor.extract_transcript import get_transcript, get_transcript_with_timestamps
from .transcriptQA.groqllm import ask_groq
from groq import Groq
from .config import TRANSCRIPT_FILE, TIMESTAMP_FILE, GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def load_transcript():
    try:
        if os.path.exists(TIMESTAMP_FILE):
            with open(TIMESTAMP_FILE, "r", encoding="utf-8") as file:
                content = file.read()
                if content:
                    return content

        if os.path.exists(TRANSCRIPT_FILE):
            with open(TRANSCRIPT_FILE, "r", encoding="utf-8") as file:
                content = file.read()
                if content:
                    return content

        return None
    except Exception as e:
        print(f"[load_transcript ERROR]: {e}")
        return None


def save_transcript_to_file(content, file_path):
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)
        return True
    except Exception as e:
        print(f"[save_transcript_to_file ERROR]: {e}")
        return False


def handle_transcript_extraction(youtube_url):
    try:
        result = get_transcript(youtube_url)
        if not result['success']:
            return result

        save_success = save_transcript_to_file(result['transcript'], TRANSCRIPT_FILE)
        if not save_success:
            return {'success': False, 'error': 'Failed to save transcript'}

        # Try timestamps
        timestamp_result = get_transcript_with_timestamps(youtube_url)
        if timestamp_result['success']:
            save_transcript_to_file(timestamp_result['transcript'], TIMESTAMP_FILE)
            return {'success': True, 'transcript': timestamp_result['transcript']}
        else:
            return {'success': True, 'transcript': result['transcript']}

    except Exception as e:
        return {'success': False, 'error': str(e)}


def handle_question(question, transcript_text=None):
    try:
        if not transcript_text:
            transcript_text = load_transcript()
        if not transcript_text:
            return {'success': False, 'error': 'No transcript found. Please extract the transcript first.'}

        answer = ask_groq(question, client=client, transcript_text=transcript_text)
        return {'success': True, 'answer': answer}
    except Exception as e:
        return {'success': False, 'error': str(e)}
