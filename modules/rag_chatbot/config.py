import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "YOUR API HERE")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
