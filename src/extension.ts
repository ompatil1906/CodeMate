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
    private readonly apiKey = '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';
  
    constructor(private readonly extensionUri: vscode.Uri) {}
  
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };   
  
        webviewView.webview.onDidReceiveMessage(async (message) => {
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
                        text: `Error: ${(error as Error).message}`
                    });
                }
            }
        });

        webviewView.webview.html = this.getWebviewContent();
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CodeMate Assistant</title>
                <style>
                    /* Your existing styles */
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>CodeMate AI Assistant</h2>
                </div>
                <div id="chat"></div>
                <div class="input-container">
                    <input type="text" id="userInput" placeholder="Ask me anything about coding...">
                    <button id="sendButton">Send</button>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const chatDiv = document.getElementById('chat');
                    const userInput = document.getElementById('userInput');
                    const sendButton = document.getElementById('sendButton');

                    function formatMessage(text) {
                        return text.replace(/\`\`\`(\\w+)?\\n([\\s\\S]*?)\`\`\`/g, (match, lang, code) => {
                            const langClass = lang ? \`language-\${lang}\` : '';
                            return \`<div class="code-block"><pre><code class="\${langClass}">\${code.trim()}</code></pre></div>\`;
                        });
                    }

                    function addMessage(text, isUser = false) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message ' + (isUser ? 'user-message' : 'ai-message');
                        messageDiv.innerHTML = formatMessage(text);
                        chatDiv.appendChild(messageDiv);
                        chatDiv.scrollTop = chatDiv.scrollHeight;
                    }

                    sendButton.addEventListener('click', () => {
                        const message = userInput.value.trim();
                        if (message) {
                            addMessage('You: ' + message, true);
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
                            addMessage('CodeMate: ' + message.text);
                        }
                    });
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
                    content: "You are a coding expert. Format your responses with:\n1. A positive opening statement\n2. Clear section headers using markdown (##)\n3. Code blocks with language specification\n4. Step-by-step explanations\n5. Example usage\n6. Expected output"
                },
                {
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
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                return `API Error: ${error.response?.data?.error?.message || error.message}`;
            }
            return 'Failed to get AI response. Please try again.';
        }
    }
}
