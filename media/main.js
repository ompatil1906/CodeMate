(function() {
    const vscode = acquireVsCodeApi();
    const chatDiv = document.getElementById('chat');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

    function addMessage(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        // Process markdown and code blocks
        const processedContent = content
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                return `<pre><code class="language-${lang || ''}">${escapeHtml(code)}</code></pre>`;
            })
            .replace(/`([^`]+)`/g, '<code>$1</code>');
        
        messageDiv.innerHTML = processedContent;
        chatDiv.appendChild(messageDiv);
        
        // Apply syntax highlighting
        document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
            addCopyButton(block.parentElement);
        });
        
        scrollToBottom();
    }

    function addCopyButton(preElement) {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = 'Copy';
        button.onclick = () => {
            const code = preElement.querySelector('code').textContent;
            navigator.clipboard.writeText(code)
                .then(() => {
                    button.textContent = 'Copied!';
                    setTimeout(() => button.textContent = 'Copy', 2000);
                });
        };
        preElement.style.position = 'relative';
        button.style.position = 'absolute';
        button.style.top = '8px';
        button.style.right = '8px';
        preElement.appendChild(button);
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function scrollToBottom() {
        chatDiv.scrollTop = chatDiv.scrollHeight;
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';
            vscode.postMessage({ 
                type: 'userMessage', 
                content: message 
            });
        }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'aiResponse':
                addMessage(message.content, false);
                break;
            case 'error':
                addMessage(`Error: ${message.content}`, false);
                break;
            case 'loading':
                // Handle loading state if needed
                break;
        }
    });
})();