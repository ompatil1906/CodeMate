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
            body { 
                font-family: Arial, sans-serif; 
                padding: 10px;
                background: var(--vscode-editor-background);
            }
            #chat { 
              margin: 10px 0;
              height: 300px;
              overflow-y: auto;
              border: 1px solid var(--vscode-input-border);
              padding: 10px;
              border-radius: 6px;
            }
            .message { 
                margin: 10px 0;
                padding: 12px;
                border-radius: 6px;
            }
            .user-message { 
                background: var(--vscode-editor-selectionBackground);
                color: var(--vscode-editor-foreground);
            }
            .ai-message { 
                background: var(--vscode-editor-inactiveSelectionBackground);
                color: var(--vscode-editor-foreground);
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
            #input { 
              width: 100%;
              margin: 10px 0;
              padding: 8px;
              border: 1px solid var(--vscode-input-border);
              background: var(--vscode-input-background);
              color: var(--vscode-input-foreground);
              border-radius: 4px;
            }
            button {
              background: var(--vscode-button-background);
              color: var(--vscode-button-foreground);
              border: none;
              padding: 8px 16px;
              cursor: pointer;
              border-radius: 4px;
            }
            .header {
                background: var(--vscode-titleBar-activeBackground);
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>CodeMate AI Assistant</h3>
          </div>
          <div id="chat"></div>
          <textarea id="input" placeholder="Type your coding question here..." rows="3"></textarea>
          <button onclick="sendMessage()">Send</button>

          <script>
            const vscode = acquireVsCodeApi();
            const chatDiv = document.getElementById('chat');
            
            function formatCodeBlocks(text) {
                const codeBlockRegex = /\`\`\`[\s\S]*?\`\`\`/g;
                return text.replace(codeBlockRegex, match => {
                    return '<div class="code-block">' + match + '</div>';
                });
            }
            
            function sendMessage() {
              const input = document.getElementById('input');
              const message = input.value.trim();
              
              if (message) {
                chatDiv.innerHTML += \`<div class="message user-message">You: \${message}</div>\`;
                
                vscode.postMessage({
                  type: 'query',
                  text: message
                });
                
                input.value = '';
                chatDiv.scrollTop = chatDiv.scrollHeight;
              }
            }

            document.getElementById('input').addEventListener('keypress', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            });

            window.addEventListener('message', event => {
              const message = event.data;
              if (message.type === 'response') {
                chatDiv.innerHTML += \`<div class="message ai-message">CodeMate: \${formatCodeBlocks(message.text)}</div>\`;
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
          const apiKey = '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';
      
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                  model: "llama-3.3-70b-versatile",
                  messages: [{
                      role: "user",
                      content: query
                  }],
                  temperature: 0.7,
                  max_tokens: 150
              })
          });

          const data = await response.json();
          return data.choices[0].message.content;
      } catch (error) {
          return `Error: Unable to get AI response. ${(error as Error).message}`;
      }
  }}