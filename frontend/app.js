// --- Default code snippets for each language ---
const DEFAULT_SNIPPETS = {
    python: `print(input())`,
    c: `#include <stdio.h>\nint main() {\n    char s[100];\n    fgets(s, 100, stdin);\n    printf("%s", s);\n    return 0;\n}`,
    cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    cout << s << endl;\n    return 0;\n}`,
    java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println(s);\n    }\n}`,
    r: `cat(readLines('stdin'), sep='\n')`,
};

// --- Monaco Editor setup ---
let editor;
require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: DEFAULT_SNIPPETS['python'],
        language: 'python',
        theme: document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
        automaticLayout: true,
        fontSize: 16,
        minimap: { enabled: false },
    });
});

// --- Language selector: update editor language and snippet ---
const languageSelector = document.getElementById('language');
languageSelector.addEventListener('change', function () {
    const lang = languageSelector.value;
    if (editor) {
        monaco.editor.setModelLanguage(editor.getModel(), lang === 'cpp' ? 'cpp' : lang);
        editor.setValue(DEFAULT_SNIPPETS[lang] || '');
    }
});

// --- Draggable Resizer ---
const resizer = document.getElementById('resizer');
const leftPane = document.querySelector('.left-pane');
const rightPane = document.querySelector('.right-pane');

let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        if (editor) {
            editor.layout();
        }
    });
});

function handleMouseMove(e) {
    if (!isResizing) return;
    const container = resizer.parentElement;
    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = e.clientX - containerRect.left;
    const newRightWidth = containerRect.width - newLeftWidth;

    if (newLeftWidth > 200 && newRightWidth > 200) { // min-width
        leftPane.style.flex = `0 0 ${newLeftWidth}px`;
        rightPane.style.flex = `1 1 ${newRightWidth}px`;
    }
}

// --- AI Assistant Panel ---
const copilotBtn = document.getElementById('copilotBtn');
const aiPanel = document.getElementById('aiPanel');
const closeAiPanel = document.getElementById('closeAiPanel');
const aiInput = document.getElementById('aiInput');
const sendAiBtn = document.getElementById('sendAiBtn');
const aiMessages = document.getElementById('aiMessages');
const mainContent = document.getElementById('mainContent');

let isAiPanelOpen = false;
let aiPanelWidth = 400;
let isResizingAiPanel = false;

// Toggle AI panel
function toggleAiPanel() {
    isAiPanelOpen = !isAiPanelOpen;
    aiPanel.classList.toggle('open', isAiPanelOpen);
    
    if (isAiPanelOpen) {
        mainContent.style.marginRight = `${aiPanelWidth}px`;
        aiInput.focus();
    } else {
        mainContent.style.marginRight = '0';
    }
    
    if (editor) {
        editor.layout();
    }
}

copilotBtn.addEventListener('click', toggleAiPanel);
closeAiPanel.addEventListener('click', toggleAiPanel);

// AI Panel Resizer
const aiPanelResizer = document.createElement('div');
aiPanelResizer.className = 'ai-panel-resizer';
aiPanel.appendChild(aiPanelResizer);

aiPanelResizer.addEventListener('mousedown', (e) => {
    isResizingAiPanel = true;
    document.addEventListener('mousemove', handleAiPanelResize);
    document.addEventListener('mouseup', stopAiPanelResize);
    e.preventDefault();
});

function handleAiPanelResize(e) {
    if (!isResizingAiPanel) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 300;
    const maxWidth = window.innerWidth * 0.7;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
        aiPanelWidth = newWidth;
        aiPanel.style.width = `${newWidth}px`;
        mainContent.style.marginRight = `${newWidth}px`;
        
        if (editor) {
            editor.layout();
        }
    }
}

function stopAiPanelResize() {
    isResizingAiPanel = false;
    document.removeEventListener('mousemove', handleAiPanelResize);
    document.removeEventListener('mouseup', stopAiPanelResize);
}

// AI Chat functionality
function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${type}`;
    
    // Simple markdown-like formatting for AI responses
    if (type === 'assistant') {
        // Convert code blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        // Convert inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Convert line breaks
        content = content.replace(/\n/g, '<br>');
        messageDiv.innerHTML = content;
    } else {
        messageDiv.textContent = content;
    }
    
    const chatContainer = document.getElementById('copilot-chat');
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendAiMessage() {
    const message = aiInput.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    aiInput.value = '';
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-message assistant';
    loadingDiv.textContent = 'Thinking...';
    const chatContainer = document.getElementById('copilot-chat');
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    try {
        // Get current code and language
        const code = editor ? editor.getValue() : '';
        const language = languageSelector.value;
        
        const response = await fetch('http://127.0.0.1:8000/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message, 
                code, 
                language 
            })
        });
        
        const data = await response.json();
        
        // Remove loading message
        chatContainer.removeChild(loadingDiv);
        
        if (data.error) {
            addMessage(`Error: ${data.error}`, 'assistant');
        } else {
            addMessage(data.message, 'assistant');
        }
        
        // Ensure input bar is visible and focused
        aiInput.style.display = 'block';
        sendAiBtn.style.display = 'block';
        aiInput.focus();
    } catch (error) {
        // Remove loading message
        chatContainer.removeChild(loadingDiv);
        addMessage(`Network error: ${error.message}`, 'assistant');
        
        // Ensure input bar is visible and focused even on error
        aiInput.style.display = 'block';
        sendAiBtn.style.display = 'block';
        aiInput.focus();
    }
}

sendAiBtn.addEventListener('click', sendAiMessage);
aiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAiMessage();
    }
});

// Close panel with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isAiPanelOpen) {
        toggleAiPanel();
    }
});

// --- Run button logic placeholder ---
const runBtn = document.getElementById('runBtn');
const outputEl = document.getElementById('output');
const spinner = document.getElementById('spinner');
runBtn.addEventListener('click', async function () {
    outputEl.textContent = '';
    outputEl.classList.remove('text-red-400', 'text-green-400');
    spinner.classList.remove('hidden');
    const code = editor ? editor.getValue() : '';
    const language = languageSelector.value;
    const input = document.getElementById('input').value;
    try {
        const res = await fetch('http://127.0.0.1:8000/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language, input })
        });
        const data = await res.json();
        spinner.classList.add('hidden');
        if (data.error) {
            showError(data.error || 'Error occurred.');
        } else {
            showOutput(data.output || '');
        }
    } catch (err) {
        spinner.classList.add('hidden');
        showError('Network or server error.');
    }
});

// --- Clear output button ---
document.getElementById('clearBtn').addEventListener('click', function () {
    outputEl.textContent = '';
    outputEl.classList.remove('text-red-400', 'text-green-400');
});

// --- Dark/Light mode toggle ---
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
function setTheme(dark) {
    if (dark) {
        document.documentElement.classList.add('dark');
        themeIcon.src = 'assets/light.png';
        if (editor) monaco.editor.setTheme('vs-dark');
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.src = 'assets/dark.png';
        if (editor) monaco.editor.setTheme('vs');
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
}
// Initial theme
setTheme(localStorage.getItem('theme') === 'dark');
themeToggle.addEventListener('click', () => {
    setTheme(!document.documentElement.classList.contains('dark'));
});

// --- Responsive adjustments (Tailwind handles most) ---
// --- Error highlighting utility ---
function showError(msg) {
    outputEl.textContent = msg;
    outputEl.classList.remove('text-green-400');
    outputEl.classList.add('text-red-400');
}
function showOutput(msg) {
    outputEl.textContent = msg;
    outputEl.classList.remove('text-red-400');
    outputEl.classList.add('text-green-400');
}

// Initialize AI panel on load
document.addEventListener('DOMContentLoaded', () => {
    aiPanel.style.width = `${aiPanelWidth}px`;
});

// --- Fullscreen toggle functionality ---
const fullscreenToggle = document.getElementById('fullscreenToggle');
const fullscreenIcon = document.getElementById('fullscreenIcon');

fullscreenToggle.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        // Enter fullscreen
        document.documentElement.requestFullscreen().then(() => {
            fullscreenIcon.src = 'assets/minimize.png';
            fullscreenIcon.alt = 'Exit fullscreen';
        }).catch(err => {
            console.error('Error entering fullscreen:', err);
        });
    } else {
        // Exit fullscreen
        document.exitFullscreen().then(() => {
            fullscreenIcon.src = 'assets/maximize.png';
            fullscreenIcon.alt = 'Enter fullscreen';
        }).catch(err => {
            console.error('Error exiting fullscreen:', err);
        });
    }
});

// Update icon when fullscreen changes (e.g., via F11 or Escape)
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenIcon.src = 'assets/minimize.png';
        fullscreenIcon.alt = 'Exit fullscreen';
    } else {
        fullscreenIcon.src = 'assets/maximize.png';
        fullscreenIcon.alt = 'Enter fullscreen';
    }
});
