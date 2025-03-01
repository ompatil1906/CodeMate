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
            :root {
              --primary-color: #007acc;
              --hover-color: #0098ff;
            }
            
            body { 
                font-family: 'Segoe UI', Arial, sans-serif;
                padding: 15px;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            
            .header {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 15px;
                background: var(--vscode-titleBar-activeBackground);
                border-radius: 8px;
                margin-bottom: 20px;
            }
            
            .logo {
                width: 50px;
                height: 50px;
                margin-bottom: 10px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            h3 {
                margin: 0;
                color: var(--vscode-titleBar-activeForeground);
                font-size: 1.2em;
            }
            
            #chat { 
                height: calc(100vh - 250px);
                overflow-y: auto;
                border: 1px solid var(--vscode-input-border);
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
            }
            
            .message { 
                margin: 12px 0;
                padding: 15px;
                border-radius: 8px;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .user-message { 
                background: var(--vscode-editor-selectionBackground);
                margin-left: 20px;
            }
            
            .ai-message { 
                background: var(--vscode-editor-inactiveSelectionBackground);
                margin-right: 20px;
            }
            
            .code-block {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: 6px;
                padding: 15px;
                margin: 10px 0;
                font-family: 'Consolas', monospace;
                white-space: pre-wrap;
                position: relative;
            }
            
            .code-block::before {
                content: 'Code';
                position: absolute;
                top: -10px;
                left: 10px;
                background: var(--vscode-editor-background);
                padding: 0 5px;
                font-size: 0.8em;
                color: var(--vscode-textLink-foreground);
            }
            
            #input { 
                width: 100%;
                padding: 12px;
                border: 2px solid var(--vscode-input-border);
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 6px;
                resize: vertical;
                min-height: 60px;
                transition: border-color 0.3s ease;
            }
            
            #input:focus {
                border-color: var(--primary-color);
                outline: none;
            }
            
            button {
                background: var(--primary-color);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                transition: background-color 0.3s ease;
                margin-top: 10px;
            }
            
            button:hover {
                background: var(--hover-color);
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="https://raw.githubusercontent.com/ompatil1906/CodeMate/main/logo.png" alt="CodeMate" class="logo">
            <h3>CodeMate AI Assistant</h3>
          </div>
          <div id="chat"></div>
          <textarea id="input" placeholder="Ask me anything about coding..." rows="3"></textarea>
          <button onclick="sendMessage()">Send Message</button>

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