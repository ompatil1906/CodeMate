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
                }
                #sendButton {
                    padding: 8px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                .message {
                    margin: 5px 0;
                    padding: 8px;
                    border-radius: 4px;
                    background: var(--vscode-editor-selectionBackground);
                }
            </style>
        </head>
        <body>
            <h2>CodeMate AI Assistant</h2>
            <div id="chat"></div>
            <div class="input-container">
                <input type="text" id="userInput" placeholder="Ask me anything...">
                <button id="sendButton">Send</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const chatDiv = document.getElementById('chat');
                const userInput = document.getElementById('userInput');
                const sendButton = document.getElementById('sendButton');

                function addMessage(text) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message';
                    messageDiv.textContent = text;
                    chatDiv.appendChild(messageDiv);
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                }

                sendButton.addEventListener('click', () => {
                    const message = userInput.value.trim();
                    if (message) {
                        addMessage('You: ' + message);
                        userInput.value = '';
                        vscode.postMessage({ type: 'message', text: message });
                    }
                });

                userInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        sendButton.click();
                    }
                });
            </script>
            <script>
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
      const response = await axios.post('https://api.groq.com/openai/v1', {
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: query
        }],
        temperature: 0.7,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response received:', response.data);

      const aiResponse = response.data?.choices?.[0]?.message?.content;
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
  }}
  

