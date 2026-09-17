let interactionId = null;

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const chatContainer = document.querySelector(".chat-container");
const chatToggle = document.getElementById("chat-toggle");

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const mensagem = chatInput.value.trim();

    if (!mensagem) {
        return;
    }

    adicionarMensagem(mensagem, "usuario");

    chatInput.value = "";

    const carregando = adicionarMensagem("Pensando...", "ia");

    try {
        const resposta = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mensagem: mensagem,
                previousInteractionId: interactionId
            })
        });

        const dados = await resposta.json();

        carregando.remove();

        if (!resposta.ok) {
            adicionarMensagem(
                dados.erro || "Não foi possível obter uma resposta.",
                "ia"
            );
            return;
        }

        interactionId = dados.interactionId;

        adicionarMensagem(dados.resposta, "ia");

    } catch (error) {
        carregando.remove();

        adicionarMensagem(
            "Erro ao conectar com a IA. Verifique se o servidor está rodando.",
            "ia"
        );

        console.error("Erro:", error);
    }
});

function adicionarMensagem(texto, tipo) {
    const mensagem = document.createElement("div");

    mensagem.classList.add("chat-mensagem", tipo);
    mensagem.textContent = texto;

    chatMessages.appendChild(mensagem);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    return mensagem;
}

chatToggle.addEventListener("click", () => {
    chatContainer.classList.toggle("aberto");

    if (chatContainer.classList.contains("aberto")) {
        chatInput.focus();
    }
});