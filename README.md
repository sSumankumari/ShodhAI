# ShodhAI

## Project Structure

```
ShodhAI/
├── modules/
│   └── classifier/              # Text classification module
│       ├── templates/
│       ├── __init__.py
│       ├── config.py
│       ├── routes.py            # API endpoints for classification
│       └── utils.py             # Helper functions for classifier
│
|   ├── ocr_extractor/               # OCR functionality for text extraction
│       ├── python_scripts/
│       ├── static/
│       ├── temp_files/              # Temporary storage for OCR processing
│       ├── templates/
│       ├── uploads/                 # Storage for uploaded documents
│       ├── __init__.py
│       ├── config.py
│       ├── routes.py                # API endpoints for OCR extraction
│       └── utils.py
│
|   ├── plagiarism_checker/          # Module for checking document similarity
│       ├── plag/
│       ├── static/
│       ├── templates/
│       ├── __init__.py
│       ├── processor.py             # Core plagiarism detection logic
│       ├── report_generator.py      # Generates similarity reports
│       ├── routes.py                # API endpoints for plagiarism checking
│       └── utils.py
│
|   ├── rag_pdf_chatbot/             # Retrieval-Augmented Generation PDF chatbot
│       ├── static/
│       ├── templates/
│       ├── __init__.py
│       ├── config.py
│       ├── routes.py                # API endpoints for PDF chatbot
│       └── utils.py
│
|   ├── webURL_analyzer/             # Tool for analyzing web content
│       ├── static/
│       ├── templates/
│       ├── __init__.py
│       ├── config.py
│       ├── routes.py                # API endpoints for URL analysis
│       └── utils.py
│
|   ├── youtube_analyzer/            # YouTube content analysis module
│       ├── static/
│       ├── temp_files/              # Temporary storage for media files
│       ├── templates/
│       ├── transcript_extractor/    # Extracts transcripts from videos
│       ├── transcriptQA/            # Q&A functionality for video transcripts
│       ├── __init__.py
│       ├── config.py
│       ├── routes.py                # API endpoints for YouTube analysis
│       └── utils.py
│
│
├── static/                      # Global static assets
│   ├── script.js                # Main JavaScript file
│   └── styles.css               # Main CSS stylesheet
││
├── templates/                   # HTML templates
│   └── index.html               # Main application template
│
├── venv/                        # Python virtual environment
│
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── app.py                       # Main application entry point
├── README.md                    # Project documentation
└── requirements.txt             # Python dependencies
```
