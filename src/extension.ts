import * as vscode from "vscode";
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  console.log("✅ CodeMate Extension Activated");
  const provider = new CodeMateViewProvider(context.extensionUri);
  
  const registration = vscode.window.registerWebviewViewProvider("codemateView", provider);
  console.log("📍 WebView Provider Registered");
  
  context.subscriptions.push(registration);
}
  
class CodeMateViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
  
    constructor(private readonly extensionUri: vscode.Uri) {}
  
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
      this._view = webviewView;
      webviewView.webview.options = { enableScripts: true };
  
      // Add message handler
      webviewView.webview.onDidReceiveMessage(async (message) => {
        console.log('Received message from WebView:', message);
        if (message.type === 'message') {
          try {
            const response = await this.getAIResponse(message.text);
            console.log('Sending response back to WebView:', response);
            webviewView.webview.postMessage({
              type: 'response',
              text: response
            });
          } catch (error) {
            console.log('Error in message handling:', error);
            webviewView.webview.postMessage({
              type: 'response',
              text: `Error: ${(error as Error).message}`
            });
          }
        }
      });
  
    webviewView.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeMate Assistant</title>
            <style>
                html, body {
                    height: 100%;
                    margin: 0;
                    padding: 10px;
                    box-sizing: border-box;
                    background: var(--vscode-editor-background);
                }
                body { 
                    display: flex;
                    flex-direction: column;
                    font-family: Arial, sans-serif;
                }
                #chat { 
                    flex: 1;
                    min-height: 200px;
                    border: 1px solid var(--vscode-input-border);
                    margin: 10px 0;
                    padding: 10px;
                    overflow-y: auto;
                    background: var(--vscode-editor-background);
                }
                .input-container {
                    position: sticky;
                    bottom: 0;
                    display: flex;
                    gap: 8px;
                    padding: 10px 0;
                    background: var(--vscode-editor-background);
                }
                #userInput {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border-radius: 4px;
                }
                #sendButton {
                    padding: 8px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .message {
                    margin: 10px 0;
                    padding: 12px;
                    border-radius: 6px;
                    background: var(--vscode-editor-selectionBackground);
                }
                .code-block {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 12px;
                    margin: 8px 0;
                    font-family: monospace;
                    white-space: pre-wrap;
                }
                .header {
                    background: var(--vscode-titleBar-activeBackground);
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 10px;
                }
                .user-message {
                    background: var(--vscode-editor-selectionBackground);
                }
                .ai-message {
                    background: var(--vscode-editor-inactiveSelectionBackground);
                }
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

                function formatCodeBlocks(text) {
                    // Detect code blocks and wrap them
                    const codeBlockRegex = /\`\`\`[\s\S]*?\`\`\`/g;
                    return text.replace(codeBlockRegex, match => {
                        return '<div class="code-block">' + match + '</div>';
                    });
                }

                function addMessage(text, isUser = false) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + (isUser ? 'user-message' : 'ai-message');
                    messageDiv.innerHTML = formatCodeBlocks(text);
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
        </html>
    `;
}



private async getAIResponse(query: string): Promise<string> {
    const apiKey = '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';
    
    try {
      console.log('Sending request to Groq API...');
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "system",
          content: `You are a coding expert. Format your responses with:
            1. A positive opening statement
            2. Clear section headers using markdown (##)
            3. Code blocks with language specification
            4. Step-by-step explanations
            5. Example usage
            6. Expected output
            
            Keep responses structured and avoid paragraph-style text dumps.
            Use bullet points and numbered lists for clarity.`
        },
        {
          role: "user",
          content: query
        }],
        temperature: 0.7,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      let aiResponse = response.data?.choices?.[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response content from API');
      }

      return aiResponse;
    } catch (error) {
      console.log('Full error details:', error);
      if (axios.isAxiosError(error)) {
        return `API Error: ${error.response?.data?.error?.message || error.message}`;
      }
      return 'Failed to get AI response. Please try again.';
    }
}
}
