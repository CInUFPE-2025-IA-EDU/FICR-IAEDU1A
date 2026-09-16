(() => {
  function initChatbot() {
    // Evita duplicar o chatbot se a página recarregar
    if (document.querySelector('.chatbot')) return;

    const state = {
      open: false,
      position: { right: 24, bottom: 24 },
      drag: null,
      history: [],
    };

    const root = document.createElement('section');
    root.className = 'chatbot';
    root.innerHTML = `
      <button class="chatbot-launcher" type="button" aria-expanded="false" aria-controls="chatbot-panel" title="Abrir chat de suporte">
        <span aria-hidden="true">?</span>
        <span class="visually-hidden">Abrir chat de suporte</span>
      </button>
      <div class="chatbot-panel" id="chatbot-panel" role="dialog" aria-labelledby="chatbot-title" hidden>
        <header class="chatbot-panel-header" data-chatbot-drag-handle>
          <div>
            <p class="chatbot-eyebrow">SUPORTE SQUAD D</p>
            <h2 id="chatbot-title">Como podemos ajudar?</h2>
          </div>
          <button class="chatbot-close" type="button" aria-label="Fechar chat">&times;</button>
        </header>
        <div class="chatbot-messages" aria-live="polite" aria-label="Histórico do chat">
          <p class="chatbot-message chatbot-message--assistant">Olá! Posso ajudar com dúvidas sobre nossos serviços, equipe, projetos e contato do Squad D.</p>
        </div>
        <form class="chatbot-form">
          <label class="visually-hidden" for="chatbot-input">Digite sua pergunta</label>
          <input id="chatbot-input" type="text" autocomplete="off" placeholder="Digite sua pergunta..." required>
          <button type="submit" aria-label="Enviar pergunta">Enviar</button>
        </form>
        <p class="chatbot-status" role="status"></p>
      </div>
    `;
    document.body.appendChild(root);

    const launcher = root.querySelector('.chatbot-launcher');
    const panel = root.querySelector('.chatbot-panel');
    const closeButton = root.querySelector('.chatbot-close');
    const dragHandle = root.querySelector('[data-chatbot-drag-handle]');
    const form = root.querySelector('.chatbot-form');
    const input = root.querySelector('#chatbot-input');
    const messages = root.querySelector('.chatbot-messages');
    const status = root.querySelector('.chatbot-status');
    const submitButton = form.querySelector('button');

    function applyPosition() {
      root.style.right = `${state.position.right}px`;
      root.style.bottom = `${state.position.bottom}px`;
    }

    function clampPosition() {
      const margin = 12;
      const maxRight = Math.max(margin, window.innerWidth - root.offsetWidth - margin);
      const maxBottom = Math.max(margin, window.innerHeight - root.offsetHeight - margin);
      state.position.right = Math.min(Math.max(margin, state.position.right), maxRight);
      state.position.bottom = Math.min(Math.max(margin, state.position.bottom), maxBottom);
      applyPosition();
    }

    function setOpen(open) {
      state.open = open;
      panel.hidden = !open;
      launcher.setAttribute('aria-expanded', String(open));
      launcher.classList.toggle('is-hidden', open);
      if (open) {
        input.focus();
      } else {
        launcher.focus();
      }
      clampPosition();
    }

    function addMessage(text, type) {
      const message = document.createElement('p');
      message.className = `chatbot-message chatbot-message--${type}`;
      message.textContent = text;
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
    }

    function addHistoryMessage(role, text) {
      const geminiRole = role === 'user' ? 'user' : 'model';
      state.history.push({
        role: geminiRole,
        parts: [{ text }]
      });
      state.history = state.history.slice(-10);
    }

    async function askGemini() {
      const apiUrl = window.location.port === '3000'
        ? '/api/chat'
        : 'http://localhost:3000/api/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: state.history[state.history.length - 1]?.parts?.[0]?.text || '',
          history: state.history
        }),
      });

      if (!response.ok) {
        let errorMessage = `Erro API: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (error) {
          // Mantém a mensagem de status quando o backend não retorna JSON.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.reply || typeof data.reply !== 'string') {
        throw new Error('Resposta inválida do servidor.');
      }

      return data.reply;
    }

    function startDrag(event) {
      if (event.target.closest('button')) return;
      state.drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        right: state.position.right,
        bottom: state.position.bottom,
      };
      dragHandle.setPointerCapture(event.pointerId);
      root.classList.add('is-dragging');
    }

    function moveDrag(event) {
      if (!state.drag || event.pointerId !== state.drag.pointerId) return;
      state.position.right = state.drag.right - (event.clientX - state.drag.startX);
      state.position.bottom = state.drag.bottom - (event.clientY - state.drag.startY);
      clampPosition();
    }

    function stopDrag(event) {
      if (!state.drag || event.pointerId !== state.drag.pointerId) return;
      state.drag = null;
      root.classList.remove('is-dragging');
      if (dragHandle.hasPointerCapture(event.pointerId)) {
        dragHandle.releasePointerCapture(event.pointerId);
      }
    }

    launcher.addEventListener('click', () => setOpen(true));
    closeButton.addEventListener('click', () => setOpen(false));
    dragHandle.addEventListener('pointerdown', startDrag);
    dragHandle.addEventListener('pointermove', moveDrag);
    dragHandle.addEventListener('pointerup', stopDrag);
    dragHandle.addEventListener('pointercancel', stopDrag);
    window.addEventListener('resize', clampPosition);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message) return;

      addMessage(message, 'user');
      addHistoryMessage('user', message);

      input.value = '';
      input.disabled = true;
      submitButton.disabled = true;
      status.textContent = 'Consultando o Gemini...';

      try {
        const reply = await askGemini();
        addMessage(reply, 'assistant');
        addHistoryMessage('assistant', reply);
        status.textContent = '';
      } catch (error) {
        console.error(error);
        addMessage('Desculpe, não consegui me conectar à IA.', 'assistant');
        status.textContent = error.message || 'Erro de conexão.';
      } finally {
        input.disabled = false;
        submitButton.disabled = false;
        input.focus();
      }
    });

    applyPosition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();