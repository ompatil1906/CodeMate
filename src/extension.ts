import * as vscode from 'vscode';
import axios from 'axios';

interface AIMessage {
    role: string;
    content: string;
}

enum MessageType {
    User = 'userMessage',
    AI = 'aiResponse',
    Error = 'error',
    Loading = 'loading'
}

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ CodeMate extension activated');
    const provider = new CodeMateViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CodeMateViewProvider.viewType, provider)
    );
}

export function deactivate() {
    console.log('❌ CodeMate extension deactivated');
}

class CodeMateViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codemateView';
    private _view?: vscode.WebviewView;
    private messageHistory: AIMessage[] = [];
    private disposables: vscode.Disposable[] = [];
    
    private readonly apiKey = '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';
    private readonly aiConfig = {
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: 2000
    };

    constructor(private readonly extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getWebviewContent(webviewView.webview);

        this.disposables.push(
            webviewView.webview.onDidReceiveMessage(
                message => this.handleWebviewMessage(message, webviewView))
        );
    }

    private getWebviewContent(webview: vscode.Webview): string {
        const nonce = getNonce();
        const stylesUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'styles.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js')
        );
        const highlightJsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'highlight.min.js')
        );
        const highlightCssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'highlight.css')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none';
                  style-src ${webview.cspSource} 'unsafe-inline';
                  script-src 'nonce-${nonce}' ${webview.cspSource} 'unsafe-inline';
                  font-src ${webview.cspSource};
                  img-src ${webview.cspSource} https:;">
    <title>CodeMate AI Assistant</title>
    <link href="${stylesUri}" rel="stylesheet">
    <link href="${highlightCssUri}" rel="stylesheet">
</head>
<body>
    <div class="chat-container">
        <div class="header">
            <h2>CodeMate AI Assistant</h2>
        </div>
        <div class="chat-messages" id="chat"></div>
        <div class="input-container">
            <input type="text" id="userInput" placeholder="Ask me anything about coding...">
            <button id="sendButton">Send</button>
        </div>
    </div>
    <script nonce="${nonce}" src="${highlightJsUri}"></script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private async handleWebviewMessage(message: any, webviewView: vscode.WebviewView) {
        switch (message.type) {
            case MessageType.User:
                await this.handleUserMessage(message.content, webviewView);
                break;
        }
    }

    private async handleUserMessage(content: string, webviewView: vscode.WebviewView) {
        try {
            webviewView.webview.postMessage({
                type: MessageType.Loading,
                loading: true
            });

            const response = await this.getAIResponse(content);
            
            webviewView.webview.postMessage({
                type: MessageType.AI,
                content: this.formatResponse(response)
            });
        } catch (error) {
            console.error('Error processing AI response:', error);
            webviewView.webview.postMessage({
                type: MessageType.Error,
                content: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        } finally {
            webviewView.webview.postMessage({
                type: MessageType.Loading,
                loading: false
            });
        }
    }

    private formatResponse(response: string): string {
        // First normalize line endings
        response = response.replace(/\r\n/g, '\n');
        
        // Process markdown formatting
        let formatted = response
            // Headers
            .replace(/^# (.*)(\n|$)/gm, (match, p1) => {
                return !match.startsWith('```') ? `<h1>${p1}</h1>` : match;
            })
            .replace(/^## (.*)(\n|$)/gm, (match, p1) => {
                return !match.startsWith('```') ? `<h2>${p1}</h2>` : match;
            })
            .replace(/^### (.*)(\n|$)/gm, (match, p1) => {
                return !match.startsWith('```') ? `<h3>${p1}</h3>` : match;
            })
            
            // Code blocks with copy functionality
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                lang = lang || '';
                const randomId = Math.random().toString(36).substring(2, 9);
                return `<div class="code-block" data-code-id="${randomId}">
                          <pre><code class="language-${lang}">${this.escapeHtml(code.trim())}</code></pre>
                          <div class="copy-notification" id="notification-${randomId}"></div>
                        </div>`;
            })
            
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            
            // Lists
            .replace(/^(\s*)- (.*$)/gm, '<li>$2</li>')
            .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
            
            // Text formatting
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // Paragraphs
            .replace(/([^\n]+\n+)/g, '<p>$1</p>');
            
        return formatted;
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    private async getAIResponse(query: string): Promise<string> {
        if (this.messageHistory.length === 0) {
            this.messageHistory.push({
                role: "system",
                content: `You are CodeMate, an expert AI coding assistant.Developed By Om Patil. Strictly format responses using:

# Main Title (H1)
## Section Heading (H2)
### Subsection (H3)

For code blocks:
\`\`\`language
// Code here
\`\`\`

For lists:
- Bullet points
- With clear spacing

For emphasis:
**Bold** for important terms
*Italic* for subtle emphasis

Always:
1. Use clear section headers
2. Separate concepts with blank lines
3. Format code with proper syntax highlighting
4. Use consistent spacing throughout
5. Keep paragraphs concise (2-3 sentences max)
6. Do not divide code into multiple parts give one code.
7. use comment instead of headers.

Example of GOOD formatting:
\`\`\`python
def hello_world():
    print("Hello, World!")

hello_world()
\`\`\`

Example of BAD formatting:
\`\`\`python
# <h1> tag inside code (WRONG)
# Header inside code (WRONG)
# This is bad practice
def hello_world():
\`\`\`
... (code continues in another block)`
            });
        }

        this.messageHistory.push({ role: 'user', content: query });

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                ...this.aiConfig,
                messages: this.messageHistory
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data?.choices?.[0]?.message?.content;
        if (!aiResponse) {
            throw new Error('No response content from AI');
        }

        this.messageHistory.push({ role: 'assistant', content: aiResponse });
        return aiResponse;
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}