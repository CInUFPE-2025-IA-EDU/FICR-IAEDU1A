const launcher = document.querySelector(".chat-launcher");
const panel = document.querySelector("#chat-panel");
const closeButton = document.querySelector(".chat-close");
const chatForm = document.querySelector(".chat-form");
const chatInput = document.querySelector("#chat-input");
const messages = document.querySelector(".chat-messages");
const suggestionButtons = document.querySelectorAll("[data-message]");
const friendlyModerationMessage =
  "Opa! Sou um chat amigável. Caso queira fazer perguntas sobre o Squad C, estou aqui!";
const blockedTerms = [
  "porra",
  "caralho",
  "merda",
  "buceta",
  "puta",
  "putaria",
  "viado",
  "vadia",
  "foder",
  "fodase",
  "foda-se",
];
let lastMentionedMember = null;

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

function normalizeForModeration(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsBlockedLanguage(text) {
  const normalizedText = normalizeForModeration(text);

  return blockedTerms.some((term) => {
    const normalizedTerm = normalizeForModeration(term);
    return normalizedText.split(" ").includes(normalizedTerm);
  });
}

function detectMentionedMember(text) {
  const normalizedText = normalizeForModeration(text);

  if (normalizedText.includes("alessandro")) {
    return "Alessandro";
  }

  if (normalizedText.includes("warlley")) {
    return "Warlley";
  }

  if (normalizedText.includes("bruno")) {
    return "Bruno";
  }

  if (
    normalizedText.includes("luis") ||
    normalizedText.includes("luiz")
  ) {
    return "Luis";
  }

  return null;
}

function cleanAnswer(text = "") {
  return String(text)
    .replace(/\*/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

  lastMentionedMember = detectMentionedMember(cleanMessage) || lastMentionedMember;

  if (containsBlockedLanguage(cleanMessage)) {
    addMessage(friendlyModerationMessage, "assistant");
    return;
  }

  const loadingMessage = setLoading(true);

  try {
    const response = await fetch(chatApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: cleanMessage,
        contextMember: lastMentionedMember,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível enviar a mensagem.");
    }

    addMessage(cleanAnswer(data.answer), "assistant");
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