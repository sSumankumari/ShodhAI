from groq import Groq
from dotenv import load_dotenv
import os
# from spacings import add_space_after_punctuation

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)



def clean_text(corrected_text):
    """
    Uses Groq's API to clean and format text by removing unnecessary content.

    Parameters:
        input_text (str): The raw text input to be cleaned.

    Returns:
        str: The cleaned and formatted text.
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant. Text will be provided to you, "
                        "you need to remove the unnecessary content out of it which "
                        "doesn't make sense and keep the actual text out of it. "
                        "Just give the formatted text with perfect format. Nothing else."
                        "Add punctuations wherever necessary"
                    ),
                },
                {
                    "role": "user",
                    "content": corrected_text,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_completion_tokens=1024,
            top_p=1,
            stop=None,
            stream=False,
        )
        
        groqtext = chat_completion.choices[0].message.content
        return groqtext
    
    except Exception as e:
        return f"Error: {str(e)}"

# Example usage:
# cleaned_text = clean_text("hi helo whatsapp")
# print(cleaned_text)


# print(chat_completion.choices[0].message.content)  
