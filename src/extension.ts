import * as vscode from "vscode";
import axios from 'axios';
import * as marked from 'marked';

export function activate(context: vscode.ExtensionContext) {
    console.log("✅ CodeMate Extension Activated");
    const provider = new CodeMateViewProvider(context.extensionUri);
    const registration = vscode.window.registerWebviewViewProvider("codemateView", provider);
    context.subscriptions.push(registration);
}

class CodeMateViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private readonly apiKey: string = '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';

    constructor(private readonly extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
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
                    padding: 6px 10px; /* Reduced padding */
                    font-size: 12px; /* Smaller font size */
                    line-height: 1.3; /* Tighter line height */
                    max-width: 60%; /* Reduced width */
                    margin: 4px 0; /* Smaller vertical margins */
                    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
                }

                .message {
                    gap: 8px; /* Reduced gap between messages */
                    margin: 6px 0; /* Smaller margin between messages */
                }

                /* Ensure code blocks inside user messages stay compact */
                .user-message pre,
                .user-message code {
                    margin: 4px 0;
                    padding: 4px 6px;
                    font-size: 11px;
                }

                .user-message code {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 4px;
                    border-radius: 3px;
                }

                .user-message:hover {
                    background: var(--vscode-button-secondaryHoverBackground, #1177BB);
                    transition: background 0.2s ease;
                }
                  .ai-message {
                      align-self: flex-start;
                      background: var(--vscode-editor-inactiveSelectionBackground);
                      color: var(--vscode-editor-foreground);
                      border: 1px solid var(--vscode-input-border);
                      border-bottom-left-radius: 0;
                  }
                .code-block {
                    position: relative;
                    margin: 1em 0;
                    border-radius: 6px;
                    overflow: hidden;
                }

                .code-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: var(--vscode-editor-background);
                    border-bottom: 1px solid var(--vscode-input-border);
                }

                .code-lang {
                    font-size: 12px;
                    color: var(--vscode-textPreformat-foreground);
                }

                .copy-button {
                    padding: 4px 8px;
                    font-size: 12px;
                    color: var(--vscode-button-foreground);
                    background: var(--vscode-button-background);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }

                .copy-button:hover {
                    opacity: 0.9;
                }

                .copy-feedback {
                    position: absolute;
                    right: 8px;
                    top: 8px;
                    padding: 4px 8px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .copy-feedback.show {
                    opacity: 1;
                }

                .code-content {
                    padding: 12px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: 13px;
                    line-height: 1.5;
                    overflow-x: auto;
                }
                .input-area {
                    padding: 16px;
                    background: var(--vscode-editor-background);
                    border-top: 1px solid var(--vscode-input-border);
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

                @keyframes slideIn {
                    from { 
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
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
            <script>
                function copyCode(button) {
                    const codeBlock = button.closest('.code-block');
                    const codeContent = codeBlock.querySelector('code').textContent;
                    
                    navigator.clipboard.writeText(codeContent).then(() => {
                        const originalText = button.textContent;
                        button.textContent = 'Copied!';
                        button.classList.add('copied');
                        
                        setTimeout(() => {
                            button.textContent = originalText;
                            button.classList.remove('copied');
                        }, 1500);
                    });
                }
            </script>
            <style>
                .copy-button {
                    padding: 4px 8px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                }

                .copy-button.copied {
                    background: var(--vscode-successBackground);
                }

                .copy-button:hover {
                    opacity: 0.9;
                }
            </style>
        </body>
        </html>`;
    }

    private async getAIResponse(query: string): Promise<string> {
        try {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.3-70b-versatile",
                messages: [{
                    role: "system",
                    content: "You are a coding expert. Format your responses with:\n1. A positive opening statement\n2. Clear section headers using markdown (##)\n3. Code blocks with language specification\n4. Step-by-step explanations\n5. Example usage\n6. Expected output"
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
