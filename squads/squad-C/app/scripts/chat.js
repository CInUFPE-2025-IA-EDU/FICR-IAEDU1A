const launcher = document.querySelector(".chat-launcher");
const panel = document.querySelector("#chat-panel");
const closeButton = document.querySelector(".chat-close");
const chatForm = document.querySelector(".chat-form");
const chatInput = document.querySelector("#chat-input");
const messages = document.querySelector(".chat-messages");
const suggestionButtons = document.querySelectorAll("[data-message]");

const chatApiUrl = "http://localhost:3000/api/chat";

function toggleChat(isOpen) {
  panel.hidden = !isOpen;
  launcher.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    chatInput.focus();
  }
}

function addMessage(text, type) {
  const message = document.createElement("div");

  message.className = `chat-message chat-message-${type}`;
  message.textContent = text;

  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;

  return message;
}

function setLoading(isLoading) {
  chatInput.disabled = isLoading;
  chatForm.querySelector("button[type='submit']").disabled = isLoading;

  if (isLoading) {
    return addMessage("Estou pensando...", "assistant loading-message");
  }

  return null;
}

async function sendMessage(message) {
  const cleanMessage = message.trim();

  if (!cleanMessage || chatInput.disabled) {
    return;
  }

  addMessage(cleanMessage, "user");
  chatInput.value = "";

  const loadingMessage = setLoading(true);

  try {
    const response = await fetch(chatApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: cleanMessage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível enviar a mensagem.");
    }

    addMessage(data.answer, "assistant");
  } catch (error) {
    addMessage(
      error.message ||
        "Não consegui falar com o servidor. Tente novamente em instantes.",
      "assistant",
    );
  } finally {
    loadingMessage?.remove();
    setLoading(false);
    chatInput.focus();
  }
}

launcher.addEventListener("click", () => {
  toggleChat(panel.hidden);
});

closeButton.addEventListener("click", () => {
  toggleChat(false);
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(chatInput.value);
});

suggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.dataset.message);
  });
});