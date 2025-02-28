const vscode = require('vscode');
const groqService = require('./groqService');


function activate(context) {
    // Register original command
    let disposable = vscode.commands.registerCommand('codemate.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'codemateChat',
            'CodeMate Assistant',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'images')]
            }
        );

        const logoPath = vscode.Uri.joinPath(context.extensionUri, 'images', 'logo.png');
        const logoUri = panel.webview.asWebviewUri(logoPath);

        panel.webview.html = getWebviewContent(logoUri);
    });

    context.subscriptions.push(disposable);

    // Register chat view provider
    const provider = new ChatViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('codemate.chatView', provider)
    );
}

class ChatViewProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = getChatViewContent(webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'images', 'logo.png')));

        webviewView.webview.onDidReceiveMessage(async message => {
            if (message.type === 'message') {
                try {
                    // Show user message in chat
                    webviewView.webview.postMessage({ 
                        type: 'status', 
                        content: 'Processing your request...' 
                    });
                    
                    // Get response from Groq
                    const response = await groqService.generateResponse(message.content);
                    
                    // Send response back to webview
                    webviewView.webview.postMessage({ 
                        type: 'response', 
                        content: response 
                    });
                    
                    // Log success
                    console.log('Message processed successfully');
                    
                } catch (error) {
                    console.log('Error details:', error);
                    webviewView.webview.postMessage({ 
                        type: 'response', 
                        content: 'I encountered an issue processing your request. Please try again.' 
                    });
                }
            }
        });
    }
}


function getChatViewContent(logoUri) {
    return `<!DOCTYPE html>
    <html>
        <head>
            <style>
                body { 
                    padding: 10px;
                }
                .logo {
                    width: 64px;
                    height: auto;
                    margin-bottom: 20px;
                }
                #chat-container {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 100px);
                }
                #messages {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 10px;
                    border: 1px solid var(--vscode-input-border);
                    padding: 10px;
                }
                #input-container {
                    display: flex;
                    gap: 8px;
                    padding: 10px 0;
                }
                #message-input {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                }
                button {
                    padding: 8px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <img src="${logoUri}" alt="CodeMate " class="logo">
            <div id="chat-container">
                <div id="messages"></div>
                <div id="input-container">
                    <input type="text" id="message-input" placeholder="Ask CodeMate...">
                    <button id="send-button">Send</button>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const messageInput = document.getElementById('message-input');
                const sendButton = document.getElementById('send-button');
                const messagesDiv = document.getElementById('messages');

                function addMessage(content, isUser = true) {
                    const messageDiv = document.createElement('div');
                    messageDiv.style.marginBottom = '10px';
                    messageDiv.style.padding = '8px';
                    messageDiv.style.borderRadius = '4px';
                    messageDiv.style.background = isUser ? 'var(--vscode-editor-inactiveSelectionBackground)' : 'var(--vscode-editor-selectionBackground)';
                    messageDiv.textContent = content;
                    messagesDiv.appendChild(messageDiv);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }

                sendButton.addEventListener('click', () => {
                    const message = messageInput.value.trim();
                    if (message) {
                        addMessage(message, true);
                        vscode.postMessage({ type: 'message', content: message });
                        messageInput.value = '';
                    }
                });

                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        sendButton.click();
                        e.preventDefault();
                    }
                });
            </script>
        </body>
    </html>`;
}

function getWebviewContent(logoUri) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CodeMate</title>
        <style>
            .logo-container {
                text-align: center;
                margin: 20px 0;
            }
            .logo {
                width: 128px;
                height: auto;
                display: inline-block;
            }
        </style>
    </head>
    <body>
        <div class="logo-container">
            <img src="${logoUri}" alt="CodeMate Logo" class="logo">
        </div>
        <h1>Welcome to CodeMate</h1>
        <p>Start chatting with your coding assistant here.</p>
    </body>
    </html>`;
}

function deactivate() {
    // Release WebView resources
    if (panel) {
        panel.dispose();
    }
    
    // Clear any active Groq service connections
    if (groqService) {
        groqService = null;
    }
    
    // Dispose of all registered commands and providers
    context.subscriptions.forEach(sub => sub.dispose());
}


module.exports = {
    activate,
    deactivate
};
