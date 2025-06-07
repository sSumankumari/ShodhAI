// ==========================================
// GLOBAL VARIABLES & STATE MANAGEMENT
// ==========================================
let currentSection = 'home';
let chatHistories = {
    youtube: [],
    weburl: [],
    pdf: []
};
let currentTranscript = '';
let currentWebsiteContent = '';
let currentPDFContent = '';
let isDarkMode = false;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notification.className = `notification ${type}`;
    notificationText.textContent = message;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTimestamp(date) {
    return date.toLocaleString();
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Text copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy text', 'error');
    });
}

// ==========================================
// SECTION NAVIGATION
// ==========================================
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Initialize section-specific functionality
        initializeSection(sectionId);
    }
}

function initializeSection(sectionId) {
    switch (sectionId) {
        case 'plagiarism':
            initPlagiarismChecker();
            break;
        case 'rag-pdf':
            initPDFChatbot();
            break;
        case 'ocr':
            initOCRExtractor();
            break;
        case 'youtube':
            initYouTubeAnalyzer();
            break;
        case 'weburl':
            initWebURLAnalyzer();
            break;
    }
}

// ==========================================
// DOCUMENT SIMILARITY CHECKER
// ==========================================
function initPlagiarismChecker() {
    const uploadArea = document.getElementById('plagiarism-upload');
    const fileInput = document.getElementById('plagiarism-input');
    const fileList = document.getElementById('plagiarism-file-list');
    const selectBtn = document.getElementById('plagiarism-select-btn');
    const scanBtn = document.getElementById('plagiarism-scan-btn');
    const loader = document.getElementById('plagiarism-loader');
    const results = document.getElementById('plagiarism-results');

    let selectedFiles = [];

    // File selection handlers
    selectBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        selectedFiles = Array.from(e.target.files);
        updateFileList();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#cbd5e0';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#cbd5e0';
        selectedFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
        updateFileList();
    });

    function updateFileList() {
        if (selectedFiles.length > 0) {
            fileList.innerHTML = selectedFiles.map(file => 
                `<div class="file-item">${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</div>`
            ).join('');
            fileList.classList.remove('hidden');
            scanBtn.disabled = false;
            scanBtn.classList.remove('btn-secondary');
            scanBtn.classList.add('btn-primary');
        } else {
            fileList.classList.add('hidden');
            scanBtn.disabled = true;
        }
    }

    scanBtn.addEventListener('click', async () => {
        if (selectedFiles.length < 2) {
            showNotification('Please select at least 2 PDF files for comparison', 'warning');
            return;
        }

        loader.classList.remove('hidden');
        
        try {
            // Simulate processing (replace with actual API call)
            await simulateProcessing();
            
            // Generate mock results
            const mockResults = generateMockSimilarityResults(selectedFiles);
            displaySimilarityResults(mockResults);
            
            loader.classList.add('hidden');
            results.classList.remove('hidden');
            
        } catch (error) {
            loader.classList.add('hidden');
            showNotification('Error processing documents', 'error');
        }
    });

    function generateMockSimilarityResults(files) {
        const results = [];
        for (let i = 0; i < files.length; i++) {
            for (let j = i + 1; j < files.length; j++) {
                results.push({
                    doc1: files[i].name,
                    doc2: files[j].name,
                    cosine_tfidf: (Math.random() * 100).toFixed(2),
                    cosine_count: (Math.random() * 100).toFixed(2),
                    jaccard: (Math.random() * 100).toFixed(2),
                    lcs: (Math.random() * 100).toFixed(2),
                    lsh: (Math.random() * 100).toFixed(2),
                    ngram: (Math.random() * 100).toFixed(2),
                    average: (Math.random() * 100).toFixed(2)
                });
            }
        }
        return results;
    }

    function displaySimilarityResults(results) {
        const tableContainer = document.getElementById('plagiarism-table-container');
        const table = `
            <table class="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr>
                        <th class="border-b">Doc 1</th>
                        <th class="border-b">Doc 2</th>
                        <th class="border-b">Cosine_TFIDF (%)</th>
                        <th class="border-b">Cosine_Count (%)</th>
                        <th class="border-b">Jaccard (%)</th>
                        <th class="border-b">LCS (%)</th>
                        <th class="border-b">LSH (%)</th>
                        <th class="border-b">NGram (%)</th>
                        <th class="border-b">Average (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(row => `
                        <tr>
                            <td class="border-b">${row.doc1}</td>
                            <td class="border-b">${row.doc2}</td>
                            <td class="border-b">${row.cosine_tfidf}</td>
                            <td class="border-b">${row.cosine_count}</td>
                            <td class="border-b">${row.jaccard}</td>
                            <td class="border-b">${row.lcs}</td>
                            <td class="border-b">${row.lsh}</td>
                            <td class="border-b">${row.ngram}</td>
                            <td class="border-b">${row.average}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        tableContainer.innerHTML = table;

        // Download handlers
        document.getElementById('plagiarism-download-csv').addEventListener('click', () => {
            const csv = convertToCSV(results);
            downloadFile(csv, 'similarity_results.csv', 'text/csv');
        });

        document.getElementById('plagiarism-download-html').addEventListener('click', () => {
            const html = generateHTMLReport(results);
            downloadFile(html, 'similarity_report.html', 'text/html');
        });
    }

    function convertToCSV(data) {
        const headers = ['Doc 1', 'Doc 2', 'Cosine_TFIDF (%)', 'Cosine_Count (%)', 'Jaccard (%)', 'LCS (%)', 'LSH (%)', 'NGram (%)', 'Average (%)'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                row.doc1, row.doc2, row.cosine_tfidf, row.cosine_count,
                row.jaccard, row.lcs, row.lsh, row.ngram, row.average
            ].join(','))
        ].join('\n');
        return csvContent;
    }

    function generateHTMLReport(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Document Similarity Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>Document Similarity Analysis Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                ${document.getElementById('plagiarism-table-container').innerHTML}
            </body>
            </html>
        `;
    }

    async function simulateProcessing() {
        return new Promise(resolve => setTimeout(resolve, 3000));
    }
}

// ==========================================
// RAG PDF CHATBOT
// ==========================================
function initPDFChatbot() {
    const uploadArea = document.getElementById('pdf-upload');
    const fileInput = document.getElementById('pdf-input');
    const chatMessages = document.getElementById('pdf-chat-messages');
    const chatInput = document.getElementById('pdf-chat-input');
    const sendBtn = document.getElementById('pdf-send-btn');
    const loader = document.getElementById('pdf-loader');
    
    let pdfUploaded = false;
    let currentChatId = generateId();

    // File upload handlers
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await processPDF(file);
        }
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#cbd5e0';
    });

    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#cbd5e0';
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            await processPDF(file);
        }
    });

    async function processPDF(file) {
        loader.classList.remove('hidden');
        
        try {
            // Simulate PDF processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            currentPDFContent = `PDF content from ${file.name} has been processed and is ready for questions.`;
            pdfUploaded = true;
            
            // Update UI
            uploadArea.innerHTML = `
                <i class="fas fa-check-circle" style="color: #10b981; font-size: 48px;"></i>
                <p style="color: #10b981; font-weight: bold;">${file.name} uploaded successfully!</p>
                <p>You can now ask questions about this document.</p>
            `;
            
            addMessage('bot', `Great! I've processed "${file.name}". You can now ask me questions about this document.`);
            
            loader.classList.add('hidden');
            
        } catch (error) {
            loader.classList.add('hidden');
            showNotification('Error processing PDF', 'error');
        }
    }

    // Chat functionality
    sendBtn.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        if (!pdfUploaded) {
            showNotification('Please upload a PDF first', 'warning');
            return;
        }

        addMessage('user', message);
        chatInput.value = '';

        // Simulate AI response
        setTimeout(() => {
            const response = generatePDFResponse(message);
            addMessage('bot', response);
        }, 1000);

        // Save to history
        if (!chatHistories.pdf[currentChatId]) {
            chatHistories.pdf[currentChatId] = [];
        }
        chatHistories.pdf[currentChatId].push({ user: message, bot: generatePDFResponse(message) });
    }

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function generatePDFResponse(question) {
        const responses = [
            `Based on the PDF content, I can tell you that ${question.toLowerCase()} relates to several key points in the document.`,
            `According to the document, the information about "${question}" can be found in multiple sections.`,
            `The PDF discusses this topic extensively. Here's what I found relevant to your question about ${question.toLowerCase()}.`,
            `Great question! The document provides detailed insights about this. Let me explain what I found.`,
            `I've analyzed the PDF content and found relevant information about your query regarding ${question.toLowerCase()}.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// ==========================================
// OCR TEXT EXTRACTOR
// ==========================================
function initOCRExtractor() {
    const uploadArea = document.getElementById('ocr-upload-area');
    const fileInput = document.getElementById('ocr-input');
    const preview = document.getElementById('ocr-preview');
    const loader = document.getElementById('ocr-loader');
    const output = document.getElementById('ocr-output');
    const copyBtn = document.getElementById('ocr-copy-btn');
    const downloadBtn = document.getElementById('ocr-download-btn');
    const formatSelect = document.getElementById('ocr-format');

    let extractedText = '';

    // File upload handlers
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            processImage(file);
        }
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#cbd5e0';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#cbd5e0';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processImage(file);
        }
    });

    async function processImage(file) {
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        loader.classList.remove('hidden');
        
        try {
            // Simulate OCR processing
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Generate mock extracted text
            extractedText = `This is sample extracted text from the uploaded image.
            
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

Key points extracted:
- Point 1: Sample text recognition
- Point 2: High accuracy OCR
- Point 3: Multiple format support

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
            
            output.textContent = extractedText;
            loader.classList.add('hidden');
            
            showNotification('Text extracted successfully!', 'success');
            
        } catch (error) {
            loader.classList.add('hidden');
            showNotification('Error extracting text', 'error');
        }
    }

    // Copy functionality
    copyBtn.addEventListener('click', () => {
        if (extractedText) {
            copyToClipboard(extractedText);
        } else {
            showNotification('No text to copy', 'warning');
        }
    });

    // Download functionality
    downloadBtn.addEventListener('click', () => {
        if (!extractedText) {
            showNotification('No text to download', 'warning');
            return;
        }

        const format = formatSelect.value;
        let filename, content, mimeType;

        switch (format) {
            case 'txt':
                filename = 'extracted_text.txt';
                content = extractedText;
                mimeType = 'text/plain';
                break;
            case 'pdf':
                filename = 'extracted_text.pdf';
                content = generatePDF(extractedText);
                mimeType = 'application/pdf';
                break;
            case 'docx':
                filename = 'extracted_text.docx';
                content = generateDocx(extractedText);
                mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
        }

        downloadFile(content, filename, mimeType);
    });

    function generatePDF(text) {
        // Simplified PDF generation (in real implementation, use a PDF library)
        return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length ${text.length + 50}
>>
stream
BT
/F1 12 Tf
50 750 Td
(${text.replace(/\n/g, ') Tj T* (')}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000212 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${300 + text.length}
%%EOF`;
    }

    function generateDocx(text) {
        // Simplified DOCX generation (in real implementation, use a DOCX library)
        return text; // Placeholder
    }
}

// ==========================================
// YOUTUBE TRANSCRIPT ANALYZER
// ==========================================
function initYouTubeAnalyzer() {
    const chatMessages = document.getElementById('youtube-chat-messages');
    const chatInput = document.getElementById('youtube-input');
    const sendBtn = document.getElementById('youtube-send-btn');
    const historyList = document.getElementById('youtube-history');
    const newChatBtn = document.getElementById('youtube-new-chat');
    const showTranscriptBtn = document.getElementById('youtube-show-transcript');
    const transcriptModal = document.getElementById('youtube-transcript-modal');
    const transcriptContent = document.getElementById('youtube-transcript-content');
    const chatTitle = document.getElementById('youtube-chat-title');

    let currentChatId = generateId();
    let currentVideoTitle = 'New Chat';

    // Chat functionality
    sendBtn.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    newChatBtn.addEventListener('click', () => {
        currentChatId = generateId();
        currentVideoTitle = 'New Chat';
        chatTitle.textContent = currentVideoTitle;
        chatMessages.innerHTML = `
            <div class="message bot">
                <p>Hi! Send me a YouTube URL to extract transcripts and start asking questions!</p>
            </div>
        `;
        currentTranscript = '';
        updateHistory();
    });

    showTranscriptBtn.addEventListener('click', () => {
        if (currentTranscript) {
            transcriptContent.innerHTML = `<pre>${currentTranscript}</pre>`;
            transcriptModal.classList.remove('hidden');
        } else {
            showNotification('No transcript available. Please send a YouTube URL first.', 'warning');
        }
    });

    // Modal close functionality
    transcriptModal.querySelector('.modal-close').addEventListener('click', () => {
        transcriptModal.classList.add('hidden');
    });

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        chatInput.value = '';

        // Check if it's a YouTube URL
        if (isYouTubeURL(message)) {
            await processYouTubeURL(message);
        } else {
            // Generate response based on transcript
            setTimeout(() => {
                const response = generateYouTubeResponse(message);
                addMessage('bot', response);
                saveToHistory(message, response);
            }, 1000);
        }
    }

    function isYouTubeURL(url) {
        return url.includes('youtube.com/watch') || url.includes('youtu.be/');
    }

    async function processYouTubeURL(url) {
        addMessage('bot', 'Processing YouTube video... Please wait.');
        
        try {
            // Simulate API call to extract transcript
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Mock video data
            const videoId = extractVideoId(url);
            currentVideoTitle = `Video ${videoId}`;
            chatTitle.textContent = currentVideoTitle;
            
            currentTranscript = `[00:00] Welcome to this video about artificial intelligence and machine learning.
[00:15] Today we'll explore how AI is transforming various industries.
[00:30] Machine learning algorithms are becoming increasingly sophisticated.
[00:45] Deep learning neural networks can process complex patterns.
[01:00] Natural language processing enables computers to understand human language.
[01:15] Computer vision allows machines to interpret visual information.
[01:30] These technologies are revolutionizing healthcare, finance, and education.
[01:45] The future of AI holds tremendous potential for innovation.
[02:00] Thank you for watching this introduction to AI and ML.`;
            
            addMessage('bot', `Great! I've extracted the transcript from "${currentVideoTitle}". You can now ask me questions about the video content. Click "Show Transcript" to view the full transcript.`);
            
            saveToHistory(url, 'Transcript extracted successfully');
            updateHistory();
            
        } catch (error) {
            addMessage('bot', 'Sorry, I encountered an error processing this YouTube URL. Please try again.');
        }
    }

    function extractVideoId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : 'unknown';
    }

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function generateYouTubeResponse(question) {
        if (!currentTranscript) {
            return "Please send a YouTube URL first to extract the transcript, then I can answer questions about the video content.";
        }

        const responses = [
            `Based on the video transcript, I can see that ${question.toLowerCase()} is discussed around the middle section of the video.`,
            `According to the video content, this topic relates to the main themes covered in the presentation.`,
            `The video mentions several key points about this. Let me highlight the relevant parts from the transcript.`,
            `Great question! From what I can see in the transcript, the video covers this topic in detail.`,
            `I found relevant information in the video transcript that addresses your question about ${question.toLowerCase()}.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    function saveToHistory(userMessage, botResponse) {
        if (!chatHistories.youtube[currentChatId]) {
            chatHistories.youtube[currentChatId] = {
                title: currentVideoTitle,
                messages: []
            };
        }
        chatHistories.youtube[currentChatId].messages.push({
            user: userMessage,
            bot: botResponse,
            timestamp: new Date()
        });
    }

    function updateHistory() {
        const historyHTML = Object.entries(chatHistories.youtube)
            .map(([id, chat]) => `
                <div class="history-item" onclick="loadChat('youtube', '${id}')">
                    <h4>${chat.title}</h4>
                    <p>${chat.messages.length} messages</p>
                    <small>${formatTimestamp(new Date())}</small>
                </div>
            `).join('');
        historyList.innerHTML = historyHTML;
    }
}

// ==========================================
// WEBSITE URL ANALYZER
// ==========================================
function initWebURLAnalyzer() {
    const chatMessages = document.getElementById('weburl-chat-messages');
    const chatInput = document.getElementById('weburl-input');
    const sendBtn = document.getElementById('weburl-send-btn');
    const historyList = document.getElementById('weburl-history');
    const newChatBtn = document.getElementById('weburl-new-chat');
    const showContentBtn = document.getElementById('weburl-show-content');
    const themeToggleBtn = document.getElementById('weburl-theme-toggle');
    const contentModal = document.getElementById('weburl-content-modal');
    const contentDisplay = document.getElementById('weburl-content-display');
    const downloadContentBtn = document.getElementById('weburl-download-content');

    let currentChatId = generateId();
    let currentWebsiteTitle = 'New Chat';

    // Chat functionality
    sendBtn.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    newChatBtn.addEventListener('click', () => {
        currentChatId = generateId();
        currentWebsiteTitle = 'New Chat';
        chatMessages.innerHTML = `
            <div class="message bot">
                <p>Please enter any website link for asking questions related to it.</p>
            </div>
        `;
        currentWebsiteContent = '';
        updateHistory();
    });

    showContentBtn.addEventListener('click', () => {
        if (currentWebsiteContent) {
            contentDisplay.innerHTML = `<pre style="white-space: pre-wrap;">${currentWebsiteContent}</pre>`;
            contentModal.classList.remove('hidden');
        } else {
            showNotification('No website content available. Please analyze a URL first.', 'warning');
        }
    });

    themeToggleBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeToggleBtn.innerHTML = isDarkMode 
            ? '<i class="fas fa-sun"></i> Light Mode'
            : '<i class="fas fa-moon"></i> Dark Mode';
    });

    downloadContentBtn.addEventListener('click', () => {
        if (currentWebsiteContent) {
            downloadFile(currentWebsiteContent, 'website_content.txt', 'text/plain');
        } else {
            showNotification('No content to download', 'warning');
        }
    });

    // Modal close functionality
    contentModal.querySelector('.modal-close').addEventListener('click', () => {
        contentModal.classList.add('hidden');
    });

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        chatInput.value = '';

        // Check if it's a URL
        if (isValidURL(message)) {
            await processWebsiteURL(message);
        } else {
            // Generate response based on website content
            setTimeout(() => {
                const response = generateWebsiteResponse(message);
                addMessage('bot', response);
                saveToHistory(message, response);
            }, 1000);
        }
    }

    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    async function processWebsiteURL(url) {
        addMessage('bot', 'Analyzing website content... Please wait.');
        
        try {
            // Simulate API call to extract website content
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Mock website content
            currentWebsiteTitle = getDomainFromURL(url);
            
            currentWebsiteContent = `Website: ${url}

Title: Sample Website Analysis
Meta Description: This is a sample website description for demonstration purposes.

Content Summary:
This website contains information about various topics including technology, business, and innovation. The main sections cover:

1. Introduction to the topic
2. Key concepts and definitions  
3. Practical applications and examples
4. Implementation strategies
5. Future trends and developments

Key Topics Identified:
- Digital transformation
- Artificial intelligence
- Machine learning applications
- Data analytics
- Business process optimization

Technical Details:
- Website uses modern web technologies
- Responsive design implementation
- SEO optimized content structure
- Fast loading performance
- Mobile-friendly interface

Content Analysis:
The website provides comprehensive coverage of its main topics with well-structured information hierarchy. The content appears to be regularly updated and maintains high quality standards for readability and user engagement.

Sentiment Analysis: Positive
Reading Level: Professional/Academic
Word Count: Approximately 2,500 words
Last Updated: Recently

This analysis was generated using AI-powered content extraction and natural language processing techniques.`;
            
            addMessage('bot', `I've successfully analyzed the website "${currentWebsiteTitle}". The content has been extracted and processed. You can now ask me questions about this website, or click "Website Content" to view the full extracted content.`);
            
            saveToHistory(url, 'Website content analyzed successfully');
            updateHistory();
            
        } catch (error) {
            addMessage('bot', 'Sorry, I encountered an error analyzing this website. Please check the URL and try again.');
        }
    }

    function getDomainFromURL(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch (error) {
            return 'Website';
        }
    }

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function generateWebsiteResponse(question) {
        if (!currentWebsiteContent) {
            return "Please send a website URL first to analyze the content, then I can answer questions about it.";
        }

        const responses = [
            `Based on the website analysis, I found that ${question.toLowerCase()} is covered in the main content sections.`,
            `According to the extracted website content, this topic relates to several key points discussed on the page.`,
            `The website provides detailed information about this. Let me reference the relevant sections from the content.`,
            `Great question! From the website analysis, I can see this topic is addressed in multiple areas.`,
            `I found relevant information in the website content that addresses your question about ${question.toLowerCase()}.`,
            `The website's content suggests that this topic is important and covers various aspects of ${question.toLowerCase()}.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    function saveToHistory(userMessage, botResponse) {
        if (!chatHistories.weburl[currentChatId]) {
            chatHistories.weburl[currentChatId] = {
                title: currentWebsiteTitle,
                messages: []
            };
        }
        chatHistories.weburl[currentChatId].messages.push({
            user: userMessage,
            bot: botResponse,
            timestamp: new Date()
        });
    }

    function updateHistory() {
        const historyHTML = Object.entries(chatHistories.weburl)
            .map(([id, chat]) => `
                <div class="history-item" onclick="loadChat('weburl', '${id}')">
                    <h4>${chat.title}</h4>
                    <p>${chat.messages.length} messages</p>
                    <small>${formatTimestamp(new Date())}</small>
                </div>
            `).join('');
        historyList.innerHTML = historyHTML;
    }
}

// ==========================================
// CHAT HISTORY MANAGEMENT
// ==========================================
function loadChat(platform, chatId) {
    const chat = chatHistories[platform][chatId];
    if (!chat) return;

    // Clear current messages
    const messagesContainer = document.getElementById(`${platform}-chat-messages`);
    messagesContainer.innerHTML = '';

    // Load chat messages
    chat.messages.forEach(msg => {
        const userDiv = document.createElement('div');
        userDiv.className = 'message user';
        userDiv.innerHTML = `<p>${msg.user}</p>`;
        messagesContainer.appendChild(userDiv);

        const botDiv = document.createElement('div');
        botDiv.className = 'message bot';
        botDiv.innerHTML = `<p>${msg.bot}</p>`;
        messagesContainer.appendChild(botDiv);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Update current chat info
    if (platform === 'youtube') {
        currentSection = 'youtube';
        document.getElementById('youtube-chat-title').textContent = chat.title;
    } else if (platform === 'weburl') {
        currentSection = 'weburl';
        currentWebsiteTitle = chat.title;
    }
}

// ==========================================
// THEME MANAGEMENT
// ==========================================
function initThemeToggle() {
    const themeToggle = document.getElementById('weburl-theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    const themeButton = document.getElementById('weburl-theme-toggle');
    if (themeButton) {
        themeButton.innerHTML = isDarkMode 
            ? '<i class="fas fa-sun"></i> Light Mode'
            : '<i class="fas fa-moon"></i> Dark Mode';
    }
    
    // Save theme preference
    localStorage.setItem('darkMode', isDarkMode.toString());
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        const themeButton = document.getElementById('weburl-theme-toggle');
        if (themeButton) {
            themeButton.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        }
    }
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function initModals() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    // Close modals with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
}

// ==========================================
// SEARCH AND FILTER FUNCTIONALITY
// ==========================================
function initSearchFilters() {
    // Add search functionality to history lists
    const historyContainers = ['youtube-history', 'weburl-history'];
    
    historyContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            // Add search input
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search chats...';
            searchInput.className = 'search-input';
            searchInput.addEventListener('input', (e) => filterHistory(containerId, e.target.value));
            
            const sidebar = container.parentElement;
            sidebar.insertBefore(searchInput, container);
        }
    });
}

function filterHistory(containerId, searchTerm) {
    const container = document.getElementById(containerId);
    const historyItems = container.querySelectorAll('.history-item');
    
    historyItems.forEach(item => {
        const title = item.querySelector('h4').textContent.toLowerCase();
        const isVisible = title.includes(searchTerm.toLowerCase());
        item.style.display = isVisible ? 'block' : 'none';
    });
}

// ==========================================
// EXPORT AND IMPORT FUNCTIONALITY
// ==========================================
function exportChatHistory(platform) {
    const history = chatHistories[platform];
    const exportData = {
        platform: platform,
        exportDate: new Date().toISOString(),
        chats: history
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    downloadFile(dataStr, `${platform}_chat_history.json`, 'application/json');
}

function importChatHistory(file, platform) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importData = JSON.parse(e.target.result);
            if (importData.platform === platform) {
                chatHistories[platform] = { ...chatHistories[platform], ...importData.chats };
                showNotification('Chat history imported successfully!', 'success');
                
                // Refresh history display
                if (platform === 'youtube') {
                    initYouTubeAnalyzer();
                } else if (platform === 'weburl') {
                    initWebURLAnalyzer();
                }
            } else {
                showNotification('Invalid file format for this platform', 'error');
            }
        } catch (error) {
            showNotification('Error importing chat history', 'error');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const activeSearchInput = document.querySelector('.search-input:not([style*="display: none"])');
            if (activeSearchInput) {
                activeSearchInput.focus();
            }
        }
        
        // Ctrl/Cmd + Enter to send message in chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeInput = document.querySelector('input[type="text"]:focus');
            if (activeInput) {
                const sendButton = activeInput.parentElement.querySelector('button');
                if (sendButton) {
                    sendButton.click();
                }
            }
        }
        
        // Ctrl/Cmd + N for new chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const newChatBtn = document.querySelector(`#${currentSection}-new-chat`);
            if (newChatBtn) {
                newChatBtn.click();
            }
        }
    });
}

// ==========================================
// PERFORMANCE OPTIMIZATION
// ==========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==========================================
// ERROR HANDLING AND LOGGING
// ==========================================
function handleError(error, context = 'Unknown') {
    console.error(`Error in ${context}:`, error);
    showNotification(`An error occurred in ${context}. Please try again.`, 'error');
}

function logActivity(action, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        section: currentSection,
        details: details
    };
    console.log('Activity Log:', logEntry);
}

// ==========================================
// INITIALIZATION AND CLEANUP
// ==========================================
function initializeApp() {
    // Initialize all components
    initModals();
    initThemeToggle();
    initSearchFilters();
    initKeyboardShortcuts();
    loadThemePreference();
    
    // Set initial section
    showSection('home');
    
    // Log app initialization
    logActivity('App Initialized');
    
    console.log('ShodhAI Platform loaded successfully!');
}

function cleanupResources() {
    // Clear any intervals or timeouts
    const timers = window.timers || [];
    timers.forEach(timer => clearTimeout(timer));
    
    // Remove event listeners if needed
    window.removeEventListener('beforeunload', cleanupResources);
}

// ==========================================
// EVENT LISTENERS FOR INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('beforeunload', cleanupResources);

// ==========================================
// UTILITY FUNCTIONS FOR ENHANCED FEATURES
// ==========================================
function validateFileSize(file, maxSizeMB = 10) {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    if (file.size > maxSize) {
        showNotification(`File size exceeds ${maxSizeMB}MB limit`, 'error');
        return false;
    }
    return true;
}

function validateFileType(file, allowedTypes) {
    if (!allowedTypes.includes(file.type)) {
        showNotification('Invalid file type', 'error');
        return false;
    }
    return true;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function createProgressBar(containerId) {
    const container = document.getElementById(containerId);
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `
        <div class="progress-fill" style="width: 0%"></div>
        <span class="progress-text">0%</span>
    `;
    container.appendChild(progressBar);
    return progressBar;
}

function updateProgressBar(progressBar, percentage) {
    const fill = progressBar.querySelector('.progress-fill');
    const text = progressBar.querySelector('.progress-text');
    fill.style.width = percentage + '%';
    text.textContent = Math.round(percentage) + '%';
}

// ==========================================
// ADVANCED CHAT FEATURES
// ==========================================
function addMessageWithTyping(sender, text, containerId) {
    const container = document.getElementById(containerId);
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'bot') {
        // Add typing indicator first
        messageDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        
        // Replace with actual message after delay
        setTimeout(() => {
            messageDiv.innerHTML = `<p>${text}</p>`;
        }, 1500);
    } else {
        messageDiv.innerHTML = `<p>${text}</p>`;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
}

function addSuggestedQuestions(questions, containerId) {
    const container = document.getElementById(containerId);
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'suggested-questions';
    suggestionsDiv.innerHTML = `
        <p>Suggested questions:</p>
        ${questions.map(q => `<button class="suggestion-btn" onclick="askSuggestedQuestion('${q}', '${containerId}')">${q}</button>`).join('')}
    `;
    container.appendChild(suggestionsDiv);
    container.scrollTop = container.scrollHeight;
}

function askSuggestedQuestion(question, containerId) {
    const platform = containerId.split('-')[0];
    const input = document.getElementById(`${platform}-input`);
    input.value = question;
    
    // Trigger send
    const sendBtn = document.getElementById(`${platform}-send-btn`);
    sendBtn.click();
    
    // Remove suggestions
    const suggestions = document.querySelector('.suggested-questions');
    if (suggestions) {
        suggestions.remove();
    }
}

// Export functions for use in HTML
window.showSection = showSection;
window.loadChat = loadChat;
window.askSuggestedQuestion = askSuggestedQuestion;