import * as vscode from "vscode";

export class CodeMateSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codemateView";
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'query':
          const response = await this.getAIResponse(message.text);
          // Send response back to webview
          this._view?.webview.postMessage({
            type: 'response',
            text: response
          });
          break;
      }
    });

    webviewView.webview.html = this.getHtmlForWebview();
  }

  private getHtmlForWebview(): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 10px; }
            #chat { 
              margin: 10px 0;
              height: 300px;
              overflow-y: auto;
              border: 1px solid #ccc;
              padding: 10px;
            }
            .message { margin: 10px 0; }
            .user-message { color: #007acc; }
            .ai-message { color: #4CAF50; }
            #input { 
              width: 100%;
              margin: 10px 0;
              padding: 8px;
            }
            button {
              background: #007acc;
              color: white;
              border: none;
              padding: 8px 16px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h3>CodeMate AI Assistant</h3>
          <div id="chat"></div>
          <textarea id="input" placeholder="Type your question here..." rows="3"></textarea>
          <button onclick="sendMessage()">Send</button>

          <script>
            const vscode = acquireVsCodeApi();
            const chatDiv = document.getElementById('chat');
            
            function sendMessage() {
              const input = document.getElementById('input');
              const message = input.value.trim();
              
              if (message) {
                // Display user message
                chatDiv.innerHTML += \`<div class="message user-message">You: \${message}</div>\`;
                
                // Send to extension
                vscode.postMessage({
                  type: 'query',
                  text: message
                });
                
                input.value = '';
                chatDiv.scrollTop = chatDiv.scrollHeight;
              }
            }

            // Handle Enter key
            document.getElementById('input').addEventListener('keypress', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            });

            // Handle responses from extension
            window.addEventListener('message', event => {
              const message = event.data;
              if (message.type === 'response') {
                chatDiv.innerHTML += \`<div class="message ai-message">CodeMate: \${message.text}</div>\`;
                chatDiv.scrollTop = chatDiv.scrollHeight;
              }
            });
          </script>
        </body>
      </html>
    `;
  }
  private async getAIResponse(query: string): Promise<string> {
    try {
        // Add your AI API configuration
        const apiKey = await vscode.workspace.getConfiguration().get('codemate.apiKey');
        
        const response = await fetch('YOUR_AI_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: query,
                max_tokens: 150
            })
        });

        const data = await response.json();
        return data.choices[0].text;
    } catch (error) {
        return `Error: Unable to get AI response. ${(error as Error).message}`;
    }
}
}
