import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Paths
BASE_PATH = os.path.abspath(os.path.join(os.getcwd(), "temp_files"))
TRANSCRIPT_FILE = os.path.join(BASE_PATH, "transcript.txt")
TIMESTAMP_FILE = os.path.join(BASE_PATH, "transcripts_with_timestamps.txt")

# Ensure the base directory exists
os.makedirs(BASE_PATH, exist_ok=True)
