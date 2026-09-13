const launcher = document.querySelector(".chat-launcher");
const panel = document.querySelector("#chat-panel");
const closeButton = document.querySelector(".chat-close");
const chatForm = document.querySelector(".chat-form");
const chatInput = document.querySelector("#chat-input");
const messages = document.querySelector(".chat-messages");
const suggestionButtons = document.querySelectorAll("[data-message]");

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
}

function getDemoResponse(message) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("serviço")) {
    return "O Squad C trabalha com consultoria de TI, desenvolvimento de software, design UX/UI, marketing digital e suporte técnico.";
  }

  if (normalizedMessage.includes("projeto")) {
    return "Você pode conhecer nossos estudos de interface e cases na página de projetos.";
  }

  if (
    normalizedMessage.includes("equipe") ||
    normalizedMessage.includes("integrante")
  ) {
    return "Nossa equipe reúne pessoas interessadas em design, desenvolvimento, produto, dados e segurança.";
  }

  return "Essa é uma resposta demonstrativa. Em breve, poderei responder com IA e ajudar você a encontrar a melhor informação no portfólio.";
}

function sendMessage(message) {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return;
  }

  addMessage(cleanMessage, "user");
  chatInput.value = "";

  window.setTimeout(() => {
    addMessage(getDemoResponse(cleanMessage), "assistant");
  }, 500);
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