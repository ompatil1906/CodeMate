import * as vscode from "vscode";
import axios from "axios";
import * as marked from "marked";

export function activate(context: vscode.ExtensionContext) {
    console.log("✅ CodeMate Extension Activated");
    const provider = new CodeMateViewProvider(context.extensionUri);
    const registration = vscode.window.registerWebviewViewProvider("codemateView", provider);
    context.subscriptions.push(registration);
}

export function deactivate(): void {
    console.log("❌ CodeMate Extension Deactivated");
}

class CodeMateViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    // For demonstration purposes the API key is hardcoded.
    // Consider using secure storage or configuration for production.
    private readonly apiKey: string = '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';

    constructor(private readonly extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };

        webviewView.webview.html = this.getHtmlContent();

        webviewView.webview.onDidReceiveMessage(async (message: any) => {
            if (message.type === 'message') {
                try {
                    const response = await this.getAIResponse(message.text);
                    webviewView.webview.postMessage({
                        type: 'response',
                        text: response
                    });
                } catch (error) {
                    webviewView.webview.postMessage({
                        type: 'response',
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`
                    });
                }
            }
        });
    }

    private getHtmlContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeMate Assistant</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.0.3/marked.min.js"></script>
    <style>
        :root {
            --chat-radius: 8px;
            --animation-speed: 0.3s;
        }
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: var(--vscode-editor-background);
        }
        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-input-border);
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: var(--chat-radius);
            animation: slideIn var(--animation-speed) ease-out;
        }
        .user-message {
            align-self: flex-end;
            background: var(--vscode-button-hoverBackground, #0E7ACC);
            color: var(--vscode-button-foreground);
            border-bottom-right-radius: 0;
            padding: 6px 10px;
            font-size: 12px;
            line-height: 1.3;
            max-width: 60%;
            margin: 4px 0;
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
        }
        .ai-message {
            align-self: flex-start;
            background: var(--vscode-editor-inactiveSelectionBackground);
            color: var(--vscode-editor-foreground);
            border: 1px solid var(--vscode-input-border);
            border-bottom-left-radius: 0;
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .input-container {
            display: flex;
            gap: 8px;
            padding: 8px;
            background: var(--vscode-input-background);
            border-radius: var(--chat-radius);
        }
        #userInput {
            flex: 1;
            border: none;
            background: transparent;
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 14px;
            padding: 8px;
        }
        #userInput:focus {
            outline: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>CodeMate AI Assistant</h2>
    </div>
    <div id="chat"></div>
    <div class="input-container">
        <input type="text" id="userInput" placeholder="Ask me anything...">
        <button id="sendButton">Send</button>
    </div>
    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            const chatDiv = document.getElementById('chat');
            const userInput = document.getElementById('userInput');
            const sendButton = document.getElementById('sendButton');

            function formatMessage(text) {
                return marked.parse(text);
            }

            function addMessage(text, isUser) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ' + (isUser ? 'user-message' : 'ai-message');
                messageDiv.innerHTML = formatMessage(text);
                chatDiv.appendChild(messageDiv);
                chatDiv.scrollTop = chatDiv.scrollHeight;
            }

            sendButton.addEventListener('click', () => {
                const message = userInput.value.trim();
                if (message) {
                    addMessage(message, true);
                    userInput.value = '';
                    vscode.postMessage({ type: 'message', text: message });
                }
            });

            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendButton.click();
                }
            });

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.type === 'response') {
                    addMessage(message.text, false);
                }
            });
        })();
    </script>
</body>
</html>`;
    }

    private async getAIResponse(query: string): Promise<string> {
        try {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.3-70b-versatile",
                messages: [{
                    role: "system",
                    content: `You are CodeMate, an expert AI coding assistant built by Om Patil, specializing in software development, debugging, and best practices. Your goal is to provide clear, structured, and actionable coding assistance.

Key Guidelines:
- Always break down complex topics into easy-to-understand explanations.
- Use proper markdown formatting with ## for main sections and ### for subsections.
- Include code snippets in appropriate language-specific blocks.
- Follow clean code principles, add comments for clarity, and showcase real-world applications.
- If an error is detected, explain the issue, provide a corrected version, and suggest improvements.
- Avoid giving code if the user asks general (non-coding) questions.

Response Structure:
- Brief, positive introduction
- Concept explanation (if needed)
- Well-formatted code examples with comments
- Practical use cases & expected output
- Best practices or next steps
Expertise Areas:
- Software Development (Python, JavaScript, etc.)
- Debugging & Testing
- Performance Optimization
- Design Patterns & Best Practices
- Modern Development Tools
Stay concise, professional, and developer-friendly!`
                }, {
                    role: "user",
                    content: query
                }],
                temperature: 0.7,
                max_tokens: 1500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data?.choices?.[0]?.message?.content || 'No response content';
        } catch (error) {
            console.error('AI Response Error:', error);
            return 'Failed to get AI response. Please try again.';
        }
    }
}
