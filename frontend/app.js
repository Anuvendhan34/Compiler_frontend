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
        fontSize: 14,
        minimap: { enabled: false },
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        fontFamily: 'SF Mono, Monaco, Inconsolata, Roboto Mono, Consolas, monospace',
        lineHeight: 20,
        letterSpacing: 0.5,
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
function addMessage(content, type, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message';
    
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${type}`;
    avatar.textContent = type === 'user' ? 'U' : 'AI';
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${type}`;
    
    // Simple markdown-like formatting for AI responses
    if (type === 'assistant') {
        // Convert code blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        // Convert inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Convert line breaks
        content = content.replace(/\n/g, '<br>');
        bubble.innerHTML = content;
    } else {
        bubble.textContent = content;
    }
    
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(bubble);
    messageDiv.appendChild(messageContainer);
    
    const aiMessages = document.getElementById('aiMessages');
    aiMessages.appendChild(messageDiv);
    
    // Smooth scroll to bottom
    setTimeout(() => {
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 100);
    
    return messageDiv;
}

async function sendAiMessage() {
    const message = aiInput.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    aiInput.value = '';
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message';
    
    const typingContainer = document.createElement('div');
    typingContainer.className = 'message-container assistant';
    
    const typingAvatar = document.createElement('div');
    typingAvatar.className = 'message-avatar assistant';
    typingAvatar.textContent = 'AI';
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <span>Thinking</span>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    typingContainer.appendChild(typingAvatar);
    typingContainer.appendChild(typingIndicator);
    typingDiv.appendChild(typingContainer);
    
    const aiMessages = document.getElementById('aiMessages');
    aiMessages.appendChild(typingDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
    
    // Disable send button
    sendAiBtn.disabled = true;
    
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
        aiMessages.removeChild(typingDiv);
        
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
        aiMessages.removeChild(typingDiv);
        addMessage(`Network error: ${error.message}`, 'assistant');
        
        // Ensure input bar is visible and focused even on error
        aiInput.style.display = 'block';
        sendAiBtn.style.display = 'block';
        aiInput.focus();
    }
    
    // Re-enable send button
    sendAiBtn.disabled = false;
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

// Enhanced theme management with persistent state
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme === 'dark');
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches);
        }
    });
}

function setTheme(dark) {
    const root = document.documentElement;
    
    if (dark) {
        root.classList.add('dark');
        themeIcon.src = 'assets/light.png';
        themeIcon.alt = 'Switch to light mode';
        if (editor) monaco.editor.setTheme('vs-dark');
    } else {
        root.classList.remove('dark');
        themeIcon.src = 'assets/dark.png';
        themeIcon.alt = 'Switch to dark mode';
        if (editor) monaco.editor.setTheme('vs');
    }
    
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    
    // Add smooth transition effect
    root.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
        root.style.transition = '';
    }, 300);
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(!isDark);
    
    // Add click animation
    themeToggle.style.transform = 'scale(0.95)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 150);
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
    
    // Initialize theme
    initializeTheme();
    
    // Auto-resize textarea
    const aiInput = document.getElementById('aiInput');
    aiInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 128) + 'px';
    });
    
    // Add welcome message with delay for smooth animation
    setTimeout(() => {
        addMessage('Hello! I\'m your AI coding assistant. I can help you with your code, explain concepts, debug issues, and suggest improvements. What would you like to work on?', 'assistant', true);
    }, 500);
    
    // Add smooth scroll behavior to all scrollable elements
    document.querySelectorAll('.ai-messages, #output, #input').forEach(element => {
        element.style.scrollBehavior = 'smooth';
    });
});

// --- Fullscreen toggle functionality ---
const fullscreenToggle = document.getElementById('fullscreenToggle');
const fullscreenIcon = document.getElementById('fullscreenIcon');

fullscreenToggle.addEventListener('click', () => {
    // Add click animation
    fullscreenToggle.style.transform = 'scale(0.95)';
    setTimeout(() => {
        fullscreenToggle.style.transform = '';
    }, 150);
    
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
    // Add transition effect
    fullscreenIcon.style.transition = 'all 0.3s ease';
    
    if (document.fullscreenElement) {
        fullscreenIcon.src = 'assets/minimize.png';
        fullscreenIcon.alt = 'Exit fullscreen';
    } else {
        fullscreenIcon.src = 'assets/maximize.png';
        fullscreenIcon.alt = 'Enter fullscreen';
    }
});

// Enhanced message animation and auto-scroll
function addMessage(content, type, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message';
    
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${type}`;
    avatar.textContent = type === 'user' ? 'U' : 'AI';
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${type}`;
    
    // Enhanced markdown-like formatting for AI responses
    if (type === 'assistant') {
        // Convert code blocks with syntax highlighting
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
        // Convert inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Convert line breaks
        content = content.replace(/\n/g, '<br>');
        // Convert bold text
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert italic text
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        bubble.innerHTML = content;
    } else {
        bubble.textContent = content;
    }
    
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(bubble);
    messageDiv.appendChild(messageContainer);
    
    const aiMessages = document.getElementById('aiMessages');
    aiMessages.appendChild(messageDiv);
    
    // Enhanced smooth scroll with animation delay
    if (animate) {
        setTimeout(() => {
            aiMessages.scrollTo({
                top: aiMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }
    
    return messageDiv;
}

// Enhanced run button with loading animation
runBtn.addEventListener('click', async function () {
    // Add loading state
    runBtn.classList.add('loading');
    runBtn.innerHTML = '<span class="pulse">⏳</span> Running...';
    
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
        runBtn.classList.remove('loading');
        runBtn.innerHTML = '▶ Run';
        
        if (data.error) {
            showError(data.error || 'Error occurred.');
        } else {
            showOutput(data.output || '');
        }
    } catch (err) {
        spinner.classList.add('hidden');
        runBtn.classList.remove('loading');
        runBtn.innerHTML = '▶ Run';
        showError('Network or server error.');
    }
});

// Enhanced AI message sending with better UX
async function sendAiMessage() {
    const message = aiInput.value.trim();
    if (!message) return;
    
    // Add user message with animation
    addMessage(message, 'user', true);
    aiInput.value = '';
    aiInput.style.height = 'auto';
    
    // Show enhanced typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message';
    
    const typingContainer = document.createElement('div');
    typingContainer.className = 'message-container assistant';
    
    const typingAvatar = document.createElement('div');
    typingAvatar.className = 'message-avatar assistant';
    typingAvatar.textContent = 'AI';
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <span>AI is thinking</span>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    typingContainer.appendChild(typingAvatar);
    typingContainer.appendChild(typingIndicator);
    typingDiv.appendChild(typingContainer);
    
    const aiMessages = document.getElementById('aiMessages');
    aiMessages.appendChild(typingDiv);
    
    // Smooth scroll to typing indicator
    setTimeout(() => {
        aiMessages.scrollTo({
            top: aiMessages.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
    
    // Disable send button with visual feedback
    sendAiBtn.disabled = true;
    sendAiBtn.style.opacity = '0.5';
    sendAiBtn.innerHTML = '⏳';
    
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
        
        // Remove typing indicator with fade out
        typingDiv.style.opacity = '0';
        typingDiv.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (typingDiv.parentNode) {
                aiMessages.removeChild(typingDiv);
            }
        }, 300);
        
        // Add response message
        setTimeout(() => {
            if (data.error) {
                addMessage(`Error: ${data.error}`, 'assistant', true);
            } else {
                addMessage(data.message, 'assistant', true);
            }
        }, 300);
        
    } catch (error) {
        // Remove typing indicator
        if (typingDiv.parentNode) {
            aiMessages.removeChild(typingDiv);
        }
        addMessage(`Network error: ${error.message}`, 'assistant', true);
    }
    
    // Re-enable send button
    sendAiBtn.disabled = false;
    sendAiBtn.style.opacity = '';
    sendAiBtn.innerHTML = '➤';
    
    // Focus back to input
    setTimeout(() => {
        aiInput.focus();
    }, 100);
}

// Remove the duplicate addMessage function and sendAiMessage function
// Keep only the enhanced versions above
