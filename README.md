# ShodhAI

shodhai/
├── app.py                             # Main Flask app entry point
├── config.py                          # Configuration (model paths, API keys, constants)
├── requirements.txt                   # Python dependencies
├── README.md                          # Project overview & usage
│
├── templates/                         # HTML templates
│   ├── index.html                     # Homepage (main dashboard)
│   ├── plagiarism.html                # Document Plagiarism UI
│   ├── classifier.html                # Document Classifier UI
│   ├── chatbot_pdf.html               # PDF RAG Chatbot UI
│   ├── ocr.html                       # OCR Extraction UI
│   ├── youtube.html                   # YouTube Transcript Chatbot UI
│
├── static/                            # CSS, JS, and assets
│   ├── styles.css
│   ├── script.js
│   └── assets/                        # Optional: logos, icons, etc.
│
├── uploads/                           # For uploaded PDFs, images, etc.
│   ├── documents/
│   ├── images/
│   └── transcripts/
│
├── models/                            # Pre-trained and fine-tuned AI models
│   ├── all-MiniLM-L6-v2/              # Embeddings model
│   ├── classifier_model/              # Document classification model
│   └── ocr_model/                     # (if any custom OCR models)
│
├── modules/                           # Core feature modules
│   ├── __init__.py
│   ├── plagiarism_checker.py          # Handles document similarity scoring
│   ├── classifier.py                  # Classifies PDFs into legal, healthcare, financial
│   ├── rag_chatbot.py                 # RAG-based chatbot over PDFs
│   ├── ocr_extractor.py               # OCR logic for image text extraction
│   ├── youtube_analyzer.py            # Transcript + QnA logic for YouTube videos
│
├── utils/                             # Helper functions/utilities
│   ├── file_utils.py                  # PDF/image file handling
│   ├── similarity_utils.py            # Cosine, Jaccard, n-gram, LCS, etc.
│   ├── text_utils.py                  # Text preprocessing, chunking
│   └── youtube_utils.py               # Transcript fetcher, video metadata
│
├── logs/                              # Optional: log files for error/debugging
│   └── shodhai.log
│
└── data/                              # Sample or test files (PDFs, images, etc.)
    └── test_docs/
