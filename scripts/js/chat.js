const chatHistory = [];

function createChatWidget() {
    if (document.querySelector('.chat-widget')) {
        return;
    }

    const widget = document.createElement('aside');
    widget.className = 'chat-widget';
    widget.setAttribute('aria-label', 'Chat com a DevJuniors');
    widget.innerHTML = `
        <button class="chat-launcher" type="button" aria-expanded="false" aria-controls="chat-panel">
            <span aria-hidden="true">✦</span> Fale Conosco
        </button>
        <section class="chat-panel" id="chat-panel" hidden>
            <div class="chat-header">
                <div>
                    <span class="chat-kicker">DEVJUNIORS · SQUAD H</span>
                    <h2>Como podemos ajudar?</h2>
                </div>
                <button class="chat-close" type="button" aria-label="Fechar chat">×</button>
            </div>
            <div class="chat-messages" aria-live="polite">
                <div class="chat-message chat-message-bot">Olá! Eu sou a Ysa, assistente do Squad H. Pergunte sobre nossos serviços, projetos ou equipe.</div>
            </div>
            <form class="chat-form">
                <label class="sr-only" for="chat-input">Digite sua mensagem</label>
                <input id="chat-input" name="message" type="text" placeholder="Digite sua mensagem..." autocomplete="off" required maxlength="800">
                <button type="submit" aria-label="Enviar mensagem">→</button>
            </form>
        </section>
    `;
    document.body.appendChild(widget);

    const launcher = widget.querySelector('.chat-launcher');
    const panel = widget.querySelector('.chat-panel');
    const closeButton = widget.querySelector('.chat-close');
    const form = widget.querySelector('.chat-form');
    const input = widget.querySelector('#chat-input');
    const messages = widget.querySelector('.chat-messages');

    function toggleChat(isOpen) {
        panel.hidden = !isOpen;
        launcher.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            input.focus();
        }
    }

    function addMessage(text, type) {
        const message = document.createElement('div');
        message.className = `chat-message chat-message-${type}`;
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
    }

    document.querySelectorAll('.chat-trigger').forEach((trigger) => {
        trigger.addEventListener('click', () => toggleChat(true));
    });
    launcher.addEventListener('click', () => toggleChat(panel.hidden));
    closeButton.addEventListener('click', () => toggleChat(false));

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const message = input.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatHistory.push({ role: 'user', text: message });
        input.value = '';
        input.disabled = true;
        const loadingMessage = addMessage('Pensando...', 'bot loading');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });
            const responseText = await response.text();
            let data = {};
            if (responseText.trim()) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new Error('O servidor retornou uma resposta inválida.');
                }
            }
            if (!response.ok) throw new Error(data.error || 'Não foi possível responder agora.');
            loadingMessage.textContent = data.reply || 'Não recebi uma resposta do assistente.';
            chatHistory.push({ role: 'model', text: data.reply });
        } catch (error) {
            loadingMessage.textContent = window.location.protocol === 'file:'
                ? 'Abra esta página pelo servidor em http://localhost:3000 para usar a Ysa.'
                : error.message;
        } finally {
            loadingMessage.classList.remove('loading');
            input.disabled = false;
            input.focus();
        }
    });
}

document.addEventListener('DOMContentLoaded', createChatWidget);
