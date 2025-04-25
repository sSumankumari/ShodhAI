from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
# from format import format_transcript
# from id_extraction import extract_video_id
# from format_timestamps import format_transcript_with_timestamps

# Format transcript
def format_transcript(transcript_segments):
    if not transcript_segments:
        return ""

    full_text = ""
    for segment in transcript_segments:
        text = segment.get('text', '')
        # Add a space between segments if needed
        if full_text and not full_text.endswith((' ', '\n')):
            full_text += " "
        full_text += text

    return full_text


def format_transcript_with_timestamps(transcript_segments):
    if not transcript_segments:
        return ""

    formatted_text = ""
    for segment in transcript_segments:
        start_time = segment.get('start', 0)
        text = segment.get('text', '')

        # Convert seconds to MM:SS format
        minutes = int(start_time // 60)
        seconds = int(start_time % 60)
        timestamp = f"[{minutes:02d}:{seconds:02d}] "

        formatted_text += f"{timestamp}{text}\n"

    return formatted_text


# Video ID extraction
from urllib.parse import urlparse, parse_qs
import re


def extract_video_id(url):
    # Handle different URL formats
    if 'youtu.be' in url:
        return url.split('/')[-1].split('?')[0]

    if 'youtube.com/watch' in url:
        parsed_url = urlparse(url)
        return parse_qs(parsed_url.query).get('v', [None])[0]

    # Handle YouTube shorts
    if 'youtube.com/shorts/' in url:
        return url.split('/')[-1].split('?')[0]

    # Try to find a video ID pattern directly
    match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url)
    if match:
        return match.group(1)

    return None


def get_transcript(video_url, language=None):

    video_id = extract_video_id(video_url)
    
    if not video_id:
        return {
            'success': False,
            'transcript': None,
            'error': 'Could not extract video ID from URL'
        }
    
    # Try to get transcript with YouTube Transcript API
    try:
        if language:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = transcript_list.find_transcript([language]).fetch()
        else:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Format the transcript
        formatted_transcript = format_transcript(transcript)
        return {
            'success': True,
            'transcript': formatted_transcript,
            'error': None
        }
    
    except (TranscriptsDisabled, NoTranscriptFound) as e:
        error_msg = f"Transcript not available: {str(e)}"
        print(error_msg)
        return {
            'success': False,
            'transcript': None,
            'error': error_msg
        }
    
    except Exception as e:
        error_msg = f"Error retrieving transcript: {str(e)}"
        print(error_msg)
        return {
            'success': False,
            'transcript': None,
            'error': error_msg
        }

def get_transcript_with_timestamps(video_url, language=None):

    video_id = extract_video_id(video_url)
    
    if not video_id:
        return {
            'success': False,
            'transcript': None,
            'error': 'Could not extract video ID from URL'
        }
    
    try:
        if language:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = transcript_list.find_transcript([language]).fetch()
        else:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Format the transcript with timestamps
        formatted_transcript = format_transcript_with_timestamps(transcript)
        return {
            'success': True,
            'transcript': formatted_transcript,
            'error': None
        }
    
    except Exception as e:
        error_msg = f"Error retrieving transcript: {str(e)}"
        print(error_msg)
        return {
            'success': False,
            'transcript': None,
            'error': error_msg
        }


# Save transcript file
def save_transcript_to_file(transcript, output_path):
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(transcript)
        return True
    except Exception as e:
        print(f"Error saving transcript: {e}")
        return False