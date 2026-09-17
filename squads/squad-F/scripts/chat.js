import { GoogleGenAI } from '@google/genai';

// Instancie o cliente usando a chave do ambiente
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function iniciarChat() {
  // Inicializa uma sessão de conversa com histórico automático
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'Você é um assistente virtual prestativo e objetivo.',
    },
  });

  // Envio de mensagens
  let resposta = await chat.sendMessage({ message: 'Olá! Como você pode me ajudar?' });
  console.log('Gemini:', resposta.text);

  // Segunda mensagem (o modelo mantém o contexto da anterior)
  resposta = await chat.sendMessage({ message: 'Qual foi a primeira coisa que te perguntei?' });
  console.log('Gemini:', resposta.text);
}

iniciarChat();

