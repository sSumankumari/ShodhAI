// Section Navigation
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Theme Toggle (Light/Dark Mode)
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const icon = document.querySelector('#theme-toggle i');
  const span = document.querySelector('#theme-toggle span');
  if (document.body.classList.contains('dark-mode')) {
    icon.classList.replace('fa-moon', 'fa-sun');
    span.textContent = 'Light Mode';
  } else {
    icon.classList.replace('fa-sun', 'fa-moon');
    span.textContent = 'Dark Mode';
  }
});

// Utility: Enable custom upload buttons + show file list
function setupFileUpload(inputId, selectBtnId, scanBtnId, listContainerId) {
  const input = document.getElementById(inputId);
  const selectBtn = document.getElementById(selectBtnId);
  const scanBtn = document.getElementById(scanBtnId);
  const fileListDiv = document.getElementById(listContainerId);

  selectBtn.addEventListener('click', () => input.click());

  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    fileListDiv.innerHTML = '';
    if (files.length > 0) {
      fileListDiv.classList.remove('hidden');
      files.forEach(f => {
        const p = document.createElement('p');
        p.textContent = f.name;
        fileListDiv.appendChild(p);
      });
      scanBtn.disabled = false;
    }
  });
}

// Initialize file upload areas
setupFileUpload('plagiarism-input', 'plagiarism-select-btn', 'plagiarism-scan-btn', 'plagiarism-file-list');
setupFileUpload('pdf-input', 'pdf-upload', 'pdf-send-btn', 'plagiarism-file-list');  // reuse list ID temporarily

// AJAX form handling (optional advanced setup):
// You could add fetch() here to send files/inputs to Flask endpoints if desired.


// On page load – ensure "home" is active
document.addEventListener('DOMContentLoaded', () => {
  showSection('home');
});
