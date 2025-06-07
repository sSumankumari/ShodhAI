import os
from transcript_extractor.extract_transcript import get_transcript, get_transcript_with_timestamps
from transcriptQA.groqllm import ask_groq


def extract_and_save_transcript(youtube_url, base_path="temp_files"):
    """
    Extracts transcript and transcript with timestamps for a YouTube URL,
    saves them to files, and returns the best-available transcript.
    """
    if not youtube_url:
        return {'success': False, 'error': 'No YouTube URL provided'}

    os.makedirs(base_path, exist_ok=True)
    transcript_file = os.path.join(base_path, "transcript.txt")
    timestamp_file = os.path.join(base_path, "transcripts_with_timestamps.txt")
    try:
        # Extract normal transcript
        result = get_transcript(youtube_url)
        if not result['success']:
            return {'success': False, 'error': result['error']}
        transcript = result['transcript']
        with open(transcript_file, "w", encoding="utf-8") as f:
            f.write(transcript)
        # Try to extract timestamped transcript
        timestamp_result = get_transcript_with_timestamps(youtube_url)
        if timestamp_result['success']:
            transcript_ts = timestamp_result['transcript']
            with open(timestamp_file, "w", encoding="utf-8") as f:
                f.write(transcript_ts)
            return {'success': True, 'transcript': transcript_ts}
        else:
            return {'success': True, 'transcript': transcript}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def load_transcript(base_path="temp_files"):
    """
    Load the latest transcript (prefer timestamped) from disk if available.
    """
    transcript_file = os.path.join(base_path, "transcript.txt")
    timestamp_file = os.path.join(base_path, "transcripts_with_timestamps.txt")
    try:
        if os.path.exists(timestamp_file):
            with open(timestamp_file, "r", encoding="utf-8") as f:
                content = f.read()
                if content.strip():
                    return content
        if os.path.exists(transcript_file):
            with open(transcript_file, "r", encoding="utf-8") as f:
                content = f.read()
                if content.strip():
                    return content
        return None
    except Exception:
        return None


def ask_question_over_transcript(question, transcript_text=None, base_path="temp_files", client=None):
    """
    Answers a question based on the provided or saved transcript using Groq/OpenAI-compatible API.
    """
    if not question:
        return {'success': False, 'error': 'No question provided'}
    if not transcript_text:
        transcript_text = load_transcript(base_path)
    if not transcript_text:
        return {'success': False, 'error': 'No transcript found.'}
    try:
        answer = ask_groq(question, client=client, transcript_text=transcript_text)
        return {'success': True, 'answer': answer}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def summarize_transcript(transcript_text, client=None):
    """
    Summarizes the transcript using Groq/OpenAI-compatible API.
    """
    if not transcript_text:
        return {'success': False, 'error': 'No transcript text provided'}
    try:
        summary_prompt = (
            "Please provide a concise summary of the following YouTube video transcript:\n\n"
            f"{transcript_text}\n\nSummary:"
        )
        answer = ask_groq(summary_prompt, client=client, transcript_text=transcript_text)
        return {'success': True, 'summary': answer}
    except Exception as e:
        return {'success': False, 'error': str(e)}