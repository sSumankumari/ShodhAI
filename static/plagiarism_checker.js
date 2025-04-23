// DOM Elements
const pdfInput = document.getElementById('pdfInput');
const uploadBtn = document.getElementById('uploadBtn');
const scanBtn = document.getElementById('scanBtn');
const uploadContainer = document.getElementById('uploadContainer');
const processingLoader = document.getElementById('processingLoader');
const resultsSection = document.getElementById('resultsSection');
const resultsTable = document.getElementById('resultsTable');
const resultsBody = document.getElementById('resultsBody');
const filesSummary = document.getElementById('filesSummary');
const csvDownloadBtn = document.getElementById('csvDownloadBtn');
const htmlDownloadBtn = document.getElementById('htmlDownloadBtn');
const chatWithPdfBtn = document.getElementById('chatWithPdfBtn');
const fileListContainer = document.getElementById('fileListContainer');
const fileList = document.getElementById('fileList');

// Store analysis results
let analysisResults = [];
let analyzedFileNames = [];
let selectedFiles = [];

// Drag and drop functionality
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadContainer.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadContainer.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadContainer.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    uploadContainer.classList.add('drag-active');
}

function unhighlight() {
    uploadContainer.classList.remove('drag-active');
}

uploadContainer.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    // Filter for PDF files only
    const pdfFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
        alert('Please select PDF files for comparison.');
        return;
    }

    // Store selected files
    selectedFiles = pdfFiles;
    
    // Display selected files
    displaySelectedFiles(pdfFiles);
    
    // Enable scan button if at least 2 PDFs are selected
    scanBtn.disabled = pdfFiles.length < 2;
    scanBtn.classList.toggle('opacity-50', pdfFiles.length < 2);
    scanBtn.classList.toggle('cursor-not-allowed', pdfFiles.length < 2);
}

function displaySelectedFiles(files) {
    if (files.length === 0) {
        fileListContainer.classList.add('hidden');
        return;
    }
    
    fileList.innerHTML = '';
    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="text-xs text-gray-500">${formatFileSize(file.size)}</span>
        `;
        fileList.appendChild(fileItem);
    });
    
    fileListContainer.classList.remove('hidden');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Click the upload button when clicking the upload area
uploadContainer.addEventListener('click', (e) => {
    // Prevent clicking on the file list from triggering file selection
    if (e.target.closest('#fileListContainer')) return;
    // Also prevent triggering when clicking on the scan button
    if (e.target.closest('#scanBtn')) return;
    uploadBtn.click();
});

// Trigger file input when upload button is clicked
uploadBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling to the container
    pdfInput.click();
});

// Handle file selection
pdfInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Handle scan button click
scanBtn.addEventListener('click', async () => {
    if (selectedFiles.length < 2) {
        alert('Please select at least 2 PDF files for comparison.');
        return;
    }

    // Show loading indicator
    uploadContainer.classList.add('hidden');
    processingLoader.classList.remove('hidden');

    // Create FormData and append files
    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('files[]', file);
    });

    // Send files to server for processing
    try {
        const response = await fetch('/api/process', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }

        const data = await response.json();
        displayResults(data.results, data.fileCount, data.fileNames);
    } catch (error) {
        alert('Error processing files: ' + error.message);
        // Reset UI
        processingLoader.classList.add('hidden');
        uploadContainer.classList.remove('hidden');
    }
});

// Display the comparison results in the table
function displayResults(results, fileCount, fileNames) {
    // Store results for later use
    analysisResults = results;
    analyzedFileNames = fileNames;
    
    // Update file summary
    filesSummary.textContent = `Analyzed ${fileCount} PDF files with ${results.length} comparisons`;
    
    // Clear any existing results
    resultsBody.innerHTML = '';
    
    // Add rows to the table
    results.forEach(result => {
        const row = document.createElement('tr');
        
        // Add cells for each column
        row.innerHTML = `
            <td class="border-b">${result["Doc 1"]}</td>
            <td class="border-b">${result["Doc 2"]}</td>
            <td class="border-b">${result["Cosine_TFIDF"]}%</td>
            <td class="border-b">${result["Cosine_Count"]}%</td>
            <td class="border-b">${result["Jaccard"]}%</td>
            <td class="border-b">${result["LCS"]}%</td>
            <td class="border-b">${result["LSH"]}%</td>
            <td class="border-b">${result["NGram"]}%</td>
            <td class="border-b font-medium">${result["Average Similarity (%)"]}</td>
        `;
        
        resultsBody.appendChild(row);
    });
    
    // Hide loader and show results
    processingLoader.classList.add('hidden');
    resultsSection.classList.remove('hidden');
}

// CSV Download
csvDownloadBtn.addEventListener('click', async () => {
    if (!analysisResults || analysisResults.length === 0) return;
    
    try {
        const response = await fetch('/api/download/csv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                results: analysisResults
            })
        });
        
        if (!response.ok) {
            throw new Error('Error generating CSV');
        }
        
        // Trigger download
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'similarity_report.csv';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        alert('Error downloading CSV: ' + error.message);
    }
});

// HTML Report Download
htmlDownloadBtn.addEventListener('click', async () => {
    if (!analysisResults || analysisResults.length === 0) return;
    
    try {
        const response = await fetch('/api/download/html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                results: analysisResults,
                fileNames: analyzedFileNames
            })
        });
        
        if (!response.ok) {
            throw new Error('Error generating HTML report');
        }
        
        // Trigger download
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'similarity_report.html';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        alert('Error downloading HTML report: ' + error.message);
    }
});

// Chat with PDF button (non-functional)
chatWithPdfBtn.addEventListener('click', () => {
    alert('Chat with PDF feature coming soon!');
});