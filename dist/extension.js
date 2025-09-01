"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const axios_1 = require("axios");
var MessageType;
(function (MessageType) {
    MessageType["User"] = "userMessage";
    MessageType["AI"] = "aiResponse";
    MessageType["Error"] = "error";
    MessageType["Loading"] = "loading";
})(MessageType || (MessageType = {}));
function activate(context) {
    console.log('✅ CodeMate extension activated');
    const provider = new CodeMateViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(CodeMateViewProvider.viewType, provider));
}
exports.activate = activate;
function deactivate() {
    console.log('❌ CodeMate extension deactivated');
}
exports.deactivate = deactivate;
class CodeMateViewProvider {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.messageHistory = [];
        this.disposables = [];
        this.apiKey = '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';
        this.aiConfig = {
            model: "llama3-70b-8192",
            temperature: 0.7,
            max_tokens: 2000
        };
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getWebviewContent(webviewView.webview);
        this.disposables.push(webviewView.webview.onDidReceiveMessage(message => this.handleWebviewMessage(message, webviewView)));
    }
    getWebviewContent(webview) {
        const nonce = getNonce();
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'styles.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js'));
        const highlightJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'highlight.min.js'));
        const highlightCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'highlight.css'));
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
    handleWebviewMessage(message, webviewView) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (message.type) {
                case MessageType.User:
                    yield this.handleUserMessage(message.content, webviewView);
                    break;
            }
        });
    }
    handleUserMessage(content, webviewView) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                webviewView.webview.postMessage({
                    type: MessageType.Loading,
                    loading: true
                });
                const response = yield this.getAIResponse(content);
                webviewView.webview.postMessage({
                    type: MessageType.AI,
                    content: this.formatResponse(response)
                });
            }
            catch (error) {
                console.error('Error processing AI response:', error);
                webviewView.webview.postMessage({
                    type: MessageType.Error,
                    content: error instanceof Error ? error.message : 'Unknown error occurred'
                });
            }
            finally {
                webviewView.webview.postMessage({
                    type: MessageType.Loading,
                    loading: false
                });
            }
        });
    }
    formatResponse(response) {
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
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    getAIResponse(query) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield axios_1.default.post('https://api.groq.com/openai/v1/chat/completions', Object.assign(Object.assign({}, this.aiConfig), { messages: this.messageHistory }), {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const aiResponse = (_d = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
            if (!aiResponse) {
                throw new Error('No response content from AI');
            }
            this.messageHistory.push({ role: 'assistant', content: aiResponse });
            return aiResponse;
        });
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
CodeMateViewProvider.viewType = 'codemateView';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
