(() => {
  const STORAGE_KEY = 'squad-d-chat-state';
  const LEGACY_HISTORY_KEY = 'squad-d-chat-history';
  const GREETING = 'Como posso te ajudar?';
  const DEFAULT_POSITION = { right: 24, bottom: 24 };

  function initChatbot() {
    // Evita duplicar o chatbot se a página recarregar
    if (document.querySelector('.chatbot')) return;

    const state = {
      ...loadState(),
      // A posição é temporária: cada carregamento começa no canto inferior.
      position: { ...DEFAULT_POSITION },
      drag: null,
      suppressLauncherClick: false,
      requestId: 0,
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
          <div class="chatbot-panel-actions">
            <button class="chatbot-reset" type="button" aria-label="Reiniciar chat" title="Reiniciar chat">
              <span aria-hidden="true">&#8635;</span>
            </button>
            <button class="chatbot-close" type="button" aria-label="Fechar chat">&times;</button>
          </div>
        </header>
        <div class="chatbot-messages" aria-live="polite" aria-label="Histórico do chat"></div>
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
    const resetButton = root.querySelector('.chatbot-reset');
    const dragHandle = root.querySelector('[data-chatbot-drag-handle]');
    const form = root.querySelector('.chatbot-form');
    const input = root.querySelector('#chatbot-input');
    const messages = root.querySelector('.chatbot-messages');
    const status = root.querySelector('.chatbot-status');
    const submitButton = form.querySelector('button');

    function loadMessages() {
      messages.innerHTML = '';
      if (state.history.length === 0) {
        addMessage(GREETING, 'assistant');
        return;
      }

      state.history.forEach((item) => {
        const text = item.parts?.[0]?.text;
        if (typeof text === 'string' && text.trim()) {
          addMessage(text, item.role === 'user' ? 'user' : 'assistant');
        }
      });
    }

    function resetChat() {
      state.requestId += 1;
      state.history = [];
      saveState(state);
      loadMessages();
      status.textContent = 'Conversa reiniciada.';
      input.focus();
    }

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
      saveState(state);
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
      saveState(state);
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
      saveState(state);
      if (dragHandle.hasPointerCapture(event.pointerId)) {
        dragHandle.releasePointerCapture(event.pointerId);
      }
    }

    launcher.addEventListener('click', () => setOpen(true));
    closeButton.addEventListener('click', () => setOpen(false));
    resetButton.addEventListener('click', resetChat);
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
      const requestId = ++state.requestId;

      try {
        const reply = await askGemini();
        if (requestId !== state.requestId) return;
        addMessage(reply, 'assistant');
        addHistoryMessage('assistant', reply);
        status.textContent = '';
      } catch (error) {
        if (requestId !== state.requestId) return;
        console.error(error);
        addMessage('Desculpe, não consegui me conectar à IA.', 'assistant');
        status.textContent = error.message || 'Erro de conexão.';
      } finally {
        input.disabled = false;
        submitButton.disabled = false;
        input.focus();
      }
    });

    loadMessages();
    setOpen(state.open);
    applyPosition();
  }

  function loadState() {
    const defaultState = {
      open: false,
      position: { right: 24, bottom: 24 },
      history: [],
    };

    try {
      const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (savedState && typeof savedState === 'object') {
        return {
          open: savedState.open === true,
          position: {
            right: Number.isFinite(savedState.position?.right) ? savedState.position.right : defaultState.position.right,
            bottom: Number.isFinite(savedState.position?.bottom) ? savedState.position.bottom : defaultState.position.bottom,
          },
          history: loadHistory(savedState.history),
        };
      }

      return {
        ...defaultState,
        history: loadHistory(),
      };
    } catch (error) {
      return defaultState;
    }
  }

  function loadHistory(history) {
    try {
      const savedHistory = history || JSON.parse(localStorage.getItem(LEGACY_HISTORY_KEY) || '[]');
      if (!Array.isArray(savedHistory)) return [];
      return savedHistory
        .filter((item) => item && (item.role === 'user' || item.role === 'model'))
        .slice(-10);
    } catch (error) {
      return [];
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        open: state.open,
        position: state.position,
        history: state.history,
      }));
    } catch (error) {
      // O chat continua funcionando mesmo sem armazenamento local disponível.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();