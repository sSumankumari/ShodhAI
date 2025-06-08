// ==========================================
// GLOBAL VARIABLES & STATE MANAGEMENT
// ==========================================
let currentSection = 'home';
let chatHistories = {
    youtube: {},
    weburl: {},
    pdf: {}
};
let currentTranscript = '';
let currentWebsiteContent = '';
let currentPDFContent = '';
let isDarkMode = false;
let currentYouTubeURL = '';
let currentWebURL = '';
let currentPDFFile = null;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (notification && notificationText) {
        notification.className = `notification ${type}`;
        notificationText.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
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

function showLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) loader.classList.remove('hidden');
}

function hideLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) loader.classList.add('hidden');
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

    if (!uploadArea || !fileInput || !selectBtn || !scanBtn) return;

    let selectedFiles = [];

    // File selection handlers
    selectBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        selectedFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
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
        if (fileList && selectedFiles.length > 0) {
            fileList.innerHTML = selectedFiles.map(file => 
                `<div class="file-item">${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</div>`
            ).join('');
            fileList.classList.remove('hidden');
            scanBtn.disabled = false;
            scanBtn.classList.remove('btn-secondary');
            scanBtn.classList.add('btn-primary');
        } else if (fileList) {
            fileList.classList.add('hidden');
            scanBtn.disabled = true;
        }
    }

    scanBtn.addEventListener('click', async () => {
        if (selectedFiles.length < 2) {
            showNotification('Please select at least 2 PDF files for comparison', 'warning');
            return;
        }

        showLoader('plagiarism-loader');
        
        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files[]', file);
            });

            // ---- Updated: Use new API endpoint and JSON ----
            const response = await fetch('/api/plagiarism', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }

            // Show results in table
            const tableContainer = document.getElementById('plagiarism-table-container');
            if (tableContainer) {
                tableContainer.innerHTML = plagiarismResultsToHTMLTable(data.results, data.file_names);
            }
            results.classList.remove('hidden');
            showNotification('Similarity analysis completed!', 'success');
            setupPlagiarismDownloadHandlers(data.results, data.file_names);
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error processing documents: ' + error.message, 'error');
        } finally {
            hideLoader('plagiarism-loader');
        }
    });

    function plagiarismResultsToHTMLTable(results, fileNames) {
        // Assume results is a 2D array or similar structure
        let html = '<table><thead><tr><th></th>';
        fileNames.forEach(name => html += `<th>${name}</th>`);
        html += '</tr></thead><tbody>';
        results.forEach((row, i) => {
            html += `<tr><th>${fileNames[i]}</th>`;
            row.forEach(cell => html += `<td>${cell}</td>`);
            html += '</tr>';
        });
        html += '</tbody></table>';
        return html;
    }

    function setupPlagiarismDownloadHandlers(results, fileNames) {
        const csvBtn = document.getElementById('plagiarism-download-csv');
        const htmlBtn = document.getElementById('plagiarism-download-html');
        // Build CSV/HTML from results
        if (csvBtn) {
            csvBtn.onclick = () => {
                let csv = [',' + fileNames.join(',')];
                results.forEach((row, i) => {
                    csv.push([fileNames[i], ...row].join(','));
                });
                downloadFile(csv.join('\n'), 'similarity_results.csv', 'text/csv');
            };
        }
        if (htmlBtn) {
            htmlBtn.onclick = () => {
                let html = plagiarismResultsToHTMLTable(results, fileNames);
                let report = `
                <!DOCTYPE html>
                <html>
                <head><title>Document Similarity Report</title></head>
                <body>
                  <h1>Document Similarity Analysis Report</h1>
                  <p>Generated on: ${new Date().toLocaleString()}</p>
                  ${html}
                </body>
                </html>`;
                downloadFile(report, 'similarity_report.html', 'text/html');
            };
        }
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
    
    if (!uploadArea || !fileInput || !chatMessages || !chatInput || !sendBtn) return;

    let pdfUploaded = false;
    let tempPdfRef = null;
    let currentChatId = generateId();

    // File upload handlers
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            await processPDF(file);
        } else {
            showNotification('Please select a PDF file', 'error');
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
        } else {
            showNotification('Please drop a PDF file', 'error');
        }
    });

    async function processPDF(file) {
        showLoader('pdf-loader');
        currentPDFFile = file;
        try {
            const formData = new FormData();
            formData.append('pdf', file);
            const resp = await fetch('/api/rag_pdf/upload', {
                method: 'POST',
                body: formData
            });
            const data = await resp.json();
            if (data.success) {
                tempPdfRef = data.temp_pdf;
                uploadArea.innerHTML = `
                <i class="fas fa-check-circle" style="color: #10b981; font-size: 48px;"></i>
                <p style="color: #10b981; font-weight: bold;">${file.name} uploaded successfully!</p>
                <p>You can now ask questions about this document.</p>
                `;
                pdfUploaded = true;
                addMessage('bot', `Great! I've loaded "${file.name}". You can now ask me questions about this document.`);
            } else {
                throw new Error(data.error || 'Could not process PDF');
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
            showNotification('Error processing PDF: ' + error.message, 'error');
        } finally {
            hideLoader('pdf-loader');
        }
    }

    // Chat functionality
    sendBtn.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        if (!pdfUploaded || !tempPdfRef) {
            showNotification('Please upload a PDF first', 'warning');
            return;
        }

        addMessage('user', message);
        chatInput.value = '';

        // Add typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const formData = new FormData();
            formData.append('temp_pdf', tempPdfRef);
            formData.append('question', message);

            const resp = await fetch('/api/rag_pdf/ask', {
                method: 'POST',
                body: formData
            });
            const data = await resp.json();
            typingDiv.remove();
            if (data.success) {
                addMessage('bot', data.answer);
                saveToHistory('pdf', currentChatId, message, data.answer);
            } else {
                addMessage('bot', data.error || 'I apologize, but I encountered an error processing your question. Please try again.');
            }
        } catch (error) {
            typingDiv.remove();
            console.error('Error:', error);
            addMessage('bot', 'I apologize, but I encountered an error processing your question. Please try again.');
        }
    }

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
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

    if (!uploadArea || !fileInput || !output) return;

    let extractedText = '';

    // File upload handlers
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            processImage(file);
        } else {
            showNotification('Please select an image file', 'error');
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
        } else {
            showNotification('Please drop an image file', 'error');
        }
    });

    async function processImage(file) {
        // Show preview
        if (preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }

        showLoader('ocr-loader');
        
        try {
            const formData = new FormData();
            formData.append('image', file);

            // ---- Updated: Use new API endpoint and JSON ----
            const resp = await fetch('/api/ocr', {
                method: 'POST',
                body: formData
            });
            const data = await resp.json();

            if (data.success) {
                extractedText = data.extracted_text;
                output.textContent = extractedText;
                showNotification('Text extracted successfully!', 'success');
            } else {
                throw new Error(data.error || 'No text could be extracted from the image');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error extracting text: ' + error.message, 'error');
        } finally {
            hideLoader('ocr-loader');
        }
    }

    // Copy functionality
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (extractedText) {
                copyToClipboard(extractedText);
            } else {
                showNotification('No text to copy', 'warning');
            }
        });
    }

    // Download functionality
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            if (!extractedText) {
                showNotification('No text to download', 'warning');
                return;
            }
            const format = formatSelect ? formatSelect.value : 'txt';
            // Download using API (so PDF/DOCX generated server-side)
            try {
                const resp = await fetch('/api/ocr/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: extractedText, format })
                });
                if (!resp.ok) throw new Error('Download failed');
                const blob = await resp.blob();
                let filename = 'extracted_text.' + format;
                downloadFile(await blob.arrayBuffer(), filename, blob.type);
            } catch (err) {
                showNotification('Download failed: ' + err.message, 'error');
            }
        });
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

    if (!chatMessages || !chatInput || !sendBtn) return;

    let currentChatId = generateId();
    let currentVideoTitle = 'New Chat';

    // Chat functionality
    sendBtn.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            currentChatId = generateId();
            currentVideoTitle = 'New Chat';
            if (chatTitle) chatTitle.textContent = currentVideoTitle;
            chatMessages.innerHTML = `
                <div class="message bot">
                    <p>Hi! Send me a YouTube URL to extract transcripts and start asking questions!</p>
                </div>
            `;
            currentTranscript = '';
            currentYouTubeURL = '';
            updateHistory('youtube');
        });
    }

    if (showTranscriptBtn && transcriptModal) {
        showTranscriptBtn.addEventListener('click', () => {
            if (currentTranscript) {
                if (transcriptContent) {
                    transcriptContent.innerHTML = `<pre style="white-space: pre-wrap;">${currentTranscript}</pre>`;
                }
                transcriptModal.classList.remove('hidden');
            } else {
                showNotification('No transcript available. Please send a YouTube URL first.', 'warning');
            }
        });

        // Modal close functionality
        const closeBtn = transcriptModal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                transcriptModal.classList.add('hidden');
            });
        }
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        chatInput.value = '';

        // Check if it's a YouTube URL
        if (isYouTubeURL(message)) {
            await processYouTubeURL(message);
        } else {
            // Ask question about transcript
            await askQuestionAboutTranscript(message);
        }
    }

    function isYouTubeURL(url) {
        return url.includes('youtube.com/watch') || url.includes('youtu.be/');
    }

    async function processYouTubeURL(url) {
        addMessage('bot', 'Processing YouTube video... Please wait.');
        currentYouTubeURL = url;
        try {
            const resp = await fetch('/api/youtube/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await resp.json();
            if (data.success) {
                currentTranscript = data.transcript;
                const videoId = extractVideoId(url);
                currentVideoTitle = `YouTube Video ${videoId}`;
                if (chatTitle) chatTitle.textContent = currentVideoTitle;
                addMessage('bot', `Great! I've extracted the transcript from the YouTube video. You can now ask me questions about the video content. Click "Show Transcript" to view the full transcript.`);
                saveToHistory('youtube', currentChatId, url, 'Transcript extracted successfully');
                updateHistory('youtube');
            } else {
                throw new Error(data.error || 'Could not extract transcript from this video');
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('bot', 'Sorry, I encountered an error processing this YouTube URL: ' + error.message);
        }
    }

    async function askQuestionAboutTranscript(question) {
        if (!currentTranscript) {
            addMessage('bot', "Please send a YouTube URL first to extract the transcript, then I can answer questions about the video content.");
            return;
        }
        // Add typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const resp = await fetch('/api/youtube/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            const data = await resp.json();
            typingDiv.remove();
            if (data.success) {
                addMessage('bot', data.answer);
                saveToHistory('youtube', currentChatId, question, data.answer);
            } else {
                addMessage('bot', data.error || 'I apologize, but I encountered an error processing your question. Please try again.');
            }
        } catch (error) {
            typingDiv.remove();
            console.error('Error:', error);
            addMessage('bot', 'I apologize, but I encountered an error processing your question. Please try again.');
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

    if (!chatMessages || !chatInput || !sendBtn) return;

    let currentChatId = generateId();
    let currentWebsiteTitle = 'New Chat';

    // Chat functionality
    sendBtn.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            currentChatId = generateId();
            currentWebsiteTitle = 'New Chat';
            chatMessages.innerHTML = `
                <div class="message bot">
                    <p>Please enter any website link for asking questions related to it.</p>
                </div>
            `;
            currentWebsiteContent = '';
            currentWebURL = '';
            updateHistory('weburl');
        });
    }

    if (showContentBtn && contentModal) {
        showContentBtn.addEventListener('click', () => {
            if (currentWebsiteContent) {
                if (contentDisplay) {
                    contentDisplay.innerHTML = `<pre style="white-space: pre-wrap;">${currentWebsiteContent}</pre>`;
                }
                contentModal.classList.remove('hidden');
            } else {
                showNotification('No website content available. Please analyze a URL first.', 'warning');
            }
        });

        // Modal close functionality
        const closeBtn = contentModal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                contentModal.classList.add('hidden');
            });
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            document.body.classList.toggle('dark-mode', isDarkMode);
            themeToggleBtn.innerHTML = isDarkMode 
                ? '<i class="fas fa-sun"></i> Light Mode'
                : '<i class="fas fa-moon"></i> Dark Mode';
        });
    }

    if (downloadContentBtn) {
        downloadContentBtn.addEventListener('click', () => {
            if (currentWebsiteContent) {
                downloadFile(currentWebsiteContent, 'website_content.txt', 'text/plain');
            } else {
                showNotification('No content to download', 'warning');
            }
        });
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        chatInput.value = '';

        // Check if it's a URL
        if (isValidURL(message)) {
            await processWebsiteURL(message);
        } else {
            // Ask question about website content
            await askQuestionAboutWebsite(message);
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
        currentWebURL = url;
        try {
            const response = await fetch('/api/web_analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await response.json();
            if (data.success) {
                currentWebsiteContent = data.result.content || '';
                currentWebsiteTitle = getDomainFromURL(url);
                addMessage('bot', `I've successfully analyzed the website "${currentWebsiteTitle}". The content has been extracted and processed. You can now ask me questions about this website, or click "Website Content" to view the full extracted content.`);
                saveToHistory('weburl', currentChatId, url, 'Website content analyzed successfully');
                updateHistory('weburl');
            } else {
                throw new Error(data.error || 'Could not analyze website content');
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('bot', 'Sorry, I encountered an error analyzing this website: ' + error.message);
        }
    }

    async function askQuestionAboutWebsite(question) {
        if (!currentWebsiteContent || !currentWebURL) {
            addMessage('bot', "Please send a website URL first to analyze the content, then I can answer questions about it.");
            return;
        }

        // Add typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch('/api/web_analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: currentWebURL, question })
            });
            const data = await response.json();
            typingDiv.remove();
            if (data.success) {
                addMessage('bot', data.result.answer || JSON.stringify(data.result));
                saveToHistory('weburl', currentChatId, question, data.result.answer || JSON.stringify(data.result));
            } else {
                addMessage('bot', data.error || 'I apologize, but I encountered an error processing your question. Please try again.');
            }
        } catch (error) {
            typingDiv.remove();
            console.error('Error:', error);
            addMessage('bot', 'I apologize, but I encountered an error processing your question. Please try again.');
        }
    }

    function getDomainFromURL(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch {
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
}

// ==========================================
// CHAT HISTORY MANAGEMENT
// ==========================================
function saveToHistory(section, chatId, userMessage, botResponse) {
    if (!chatHistories[section]) {
        chatHistories[section] = {};
    }
    
    if (!chatHistories[section][chatId]) {
        chatHistories[section][chatId] = {
            id: chatId,
            title: generateChatTitle(userMessage),
            messages: [],
            timestamp: new Date()
        };
    }
    
    chatHistories[section][chatId].messages.push({
        user: userMessage,
        bot: botResponse,
        timestamp: new Date()
    });
}

function generateChatTitle(message) {
    if (message.length > 50) {
        return message.substring(0, 50) + '...';
    }
    return message;
}

function updateHistory(section) {
    const historyList = document.getElementById(`${section}-history`);
    if (!historyList || !chatHistories[section]) return;

    const chats = Object.values(chatHistories[section]);
    if (chats.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No chat history</div>';
        return;
    }

    historyList.innerHTML = chats
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(chat => `
            <div class="history-item" onclick="loadChat('${section}', '${chat.id}')">
                <div class="history-title">${chat.title}</div>
                <div class="history-timestamp">${formatTimestamp(new Date(chat.timestamp))}</div>
            </div>
        `)
        .join('');
}

function loadChat(section, chatId) {
    const chat = chatHistories[section]?.[chatId];
    if (!chat) return;

    const chatMessages = document.getElementById(`${section}-chat-messages`);
    if (!chatMessages) return;

    // Clear current messages
    chatMessages.innerHTML = '';

    // Load chat messages
    chat.messages.forEach(msg => {
        addMessageToChat(section, 'user', msg.user);
        addMessageToChat(section, 'bot', msg.bot);
    });

    // Update current chat context
    switch (section) {
        case 'youtube':
            currentYouTubeURL = chat.messages[0]?.user || '';
            break;
        case 'weburl':
            currentWebURL = chat.messages[0]?.user || '';
            break;
        case 'pdf':
            // PDF context would need to be handled differently
            break;
    }
}

function addMessageToChat(section, sender, text) {
    const chatMessages = document.getElementById(`${section}-chat-messages`);
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize with home section
    showSection('home');
    
    // Setup navigation
    setupNavigation();
    
    // Setup theme toggle
    setupThemeToggle();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Initialize sections that need setup
    initializeAllSections();
});

function setupNavigation() {
    // Navigation menu handlers
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            link.closest('.nav-item')?.classList.add('active');
        });
    });
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            document.body.classList.toggle('dark-mode', isDarkMode);
            
            // Update all theme toggle buttons
            document.querySelectorAll('[id*="theme-toggle"]').forEach(btn => {
                btn.innerHTML = isDarkMode 
                    ? '<i class="fas fa-sun"></i> Light Mode'
                    : '<i class="fas fa-moon"></i> Dark Mode';
            });
            
            // Save theme preference
            try {
                localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            } catch (e) {
                // localStorage not available
            }
        });
        
        // Load saved theme
        try {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                isDarkMode = true;
                document.body.classList.add('dark-mode');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            }
        } catch (e) {
            // localStorage not available
        }
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to send message in active chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeSection = document.querySelector('.section.active');
            if (activeSection) {
                const sendBtn = activeSection.querySelector('[id*="send-btn"]');
                if (sendBtn && !sendBtn.disabled) {
                    sendBtn.click();
                }
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
}

function initializeAllSections() {
    // Initialize all sections that might need setup
    ['plagiarism', 'rag-pdf', 'ocr', 'youtube', 'weburl'].forEach(section => {
        const sectionElement = document.getElementById(section);
        if (sectionElement) {
            initializeSection(section);
        }
    });
}

// ==========================================
// EXPORT/IMPORT FUNCTIONALITY
// ==========================================
function exportChatHistory(section) {
    const history = chatHistories[section];
    if (!history || Object.keys(history).length === 0) {
        showNotification('No chat history to export', 'warning');
        return;
    }
    
    const data = {
        section: section,
        exported_at: new Date().toISOString(),
        chats: history
    };
    
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${section}_chat_history.json`, 'application/json');
}

function importChatHistory(section, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.section === section && data.chats) {
                chatHistories[section] = { ...chatHistories[section], ...data.chats };
                updateHistory(section);
                showNotification('Chat history imported successfully!', 'success');
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            showNotification('Error importing chat history: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================
function searchChatHistory(section, query) {
    const historyList = document.getElementById(`${section}-history`);
    if (!historyList || !chatHistories[section]) return;

    const chats = Object.values(chatHistories[section]);
    const filteredChats = chats.filter(chat => {
        const titleMatch = chat.title.toLowerCase().includes(query.toLowerCase());
        const messageMatch = chat.messages.some(msg => 
            msg.user.toLowerCase().includes(query.toLowerCase()) ||
            msg.bot.toLowerCase().includes(query.toLowerCase())
        );
        return titleMatch || messageMatch;
    });

    if (filteredChats.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No matching chats found</div>';
        return;
    }

    historyList.innerHTML = filteredChats
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(chat => `
            <div class="history-item" onclick="loadChat('${section}', '${chat.id}')">
                <div class="history-title">${chat.title}</div>
                <div class="history-timestamp">${formatTimestamp(new Date(chat.timestamp))}</div>
            </div>
        `)
        .join('');
}

// ==========================================
// ERROR HANDLING & RECOVERY
// ==========================================
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred. Please refresh the page if issues persist.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('A network error occurred. Please check your connection and try again.', 'error');
});

// ==========================================
// UTILITY FUNCTIONS FOR FILE HANDLING
// ==========================================
function validateFile(file, allowedTypes, maxSize = 10 * 1024 * 1024) { // 10MB default
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
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

// ==========================================
// PROGRESSIVE WEB APP FUNCTIONALITY
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// ==========================================
// ACCESSIBILITY FEATURES
// ==========================================
function setupAccessibility() {
    // Focus management for modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                trapFocus(modal, e);
            }
        });
    });
    
    // Announce important messages to screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
    
    window.announceToScreenReader = (message) => {
        announcer.textContent = message;
        setTimeout(() => announcer.textContent = '', 1000);
    };
}

function trapFocus(element, event) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
    }
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', setupAccessibility);