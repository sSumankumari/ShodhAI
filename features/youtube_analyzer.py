# Transcript + QnA logic for YouTube videos

from flask import Flask, request, jsonify, render_template, send_from_directory
from transcript_extractor.extract_transcript import get_transcript, get_transcript_with_timestamps
from dotenv import load_dotenv
from transcriptQA.groqllm import ask_groq
from groq import Groq
import os

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static')

# Initialize API client
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

# Define temp directory for transcript files
base_path = os.path.abspath(os.path.join(os.getcwd(), "temp_files"))
transcript_file = os.path.join(base_path, "transcript.txt")
timestamp_file = os.path.join(base_path, "transcripts_with_timestamps.txt")

# Ensure temp_files directory exists
# os.makedirs(base_path, exist_ok=True)

print(f"📁 Base path: {base_path}")
print("Transcript File Exists:", os.path.exists(transcript_file))
print("Timestamp File Exists:", os.path.exists(timestamp_file))


def load_transcript():
    """Load existing transcript if available."""
    print(f"🔍 Checking for transcript file at: {transcript_file}")
    print(f"🔍 Checking for timestamp file at: {timestamp_file}")

    try:
        if os.path.exists(timestamp_file):
            with open(timestamp_file, "r", encoding="utf-8") as file:
                content = file.read()
                print(f"📂 Loaded timestamp transcript: {content[:200] if content else 'Empty file'}")
                if content:
                    return content

        if os.path.exists(transcript_file):
            with open(transcript_file, "r", encoding="utf-8") as file:
                content = file.read()
                print(f"📂 Loaded transcript: {content[:200] if content else 'Empty file'}")
                if content:
                    return content

        print("⚠️ No transcript file found or files are empty!")
        return None
    except Exception as e:
        print(f"⚠️ Error loading transcript: {e}")
        return None


def save_transcript_to_file(content, file_path):
    """Save transcript text to a file and confirm success."""
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)
        print(f"✅ Transcript saved successfully: {file_path}")
        return True
    except Exception as e:
        print(f"❌ Error saving transcript: {e}")
        return False


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/extract-transcript', methods=['POST'])
def extract_transcript():
    data = request.json
    youtube_url = data.get('url')

    if not youtube_url:
        return jsonify({'success': False, 'error': 'No YouTube URL provided'})

    # Extract new transcript
    try:
        result = get_transcript(youtube_url)
        if not result['success']:
            return jsonify({'success': False, 'error': result['error']})

        # Save base transcript
        save_success = save_transcript_to_file(result['transcript'], transcript_file)
        if not save_success:
            return jsonify({'success': False, 'error': 'Failed to save transcript'})

        # Try extracting transcript with timestamps
        timestamp_result = get_transcript_with_timestamps(youtube_url)
        if timestamp_result['success']:
            save_transcript_to_file(timestamp_result['transcript'], timestamp_file)
            transcript_text = timestamp_result['transcript']
        else:
            transcript_text = result['transcript']

        return jsonify({'success': True, 'transcript': transcript_text})

    except Exception as e:
        return jsonify({'success': False, 'error': f"An error occurred: {str(e)}"})


@app.route('/api/ask-question', methods=['POST'])
def ask_question():
    data = request.json
    question = data.get('question')

    if not question:
        return jsonify({'suc  cess': False, 'error': 'No question provided'})

    # Load transcript dynamically from file OR from request
    transcript_text = data.get('transcript')

    # If transcript wasn't sent in request, try to load it from file
    if not transcript_text:
        transcript_text = load_transcript()

    if not transcript_text:
        return jsonify({'success': False, 'error': 'No transcript found. Please extract the transcript first.'})

    try:
        answer = ask_groq(question, client=client, transcript_text=transcript_text)
        return jsonify({'success': True, 'answer': answer})
    except Exception as e:
        return jsonify({'success': False, 'error': f"An error occurred: {str(e)}"})


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)


# if __name__ == '__main__':
#     app.run(debug=True)

if __name__ == '__main__':
    import os

    port = int(os.environ.get('PORT', 5000))  # Use the PORT env from Render
    app.run(host='0.0.0.0', port=port, debug=True)
