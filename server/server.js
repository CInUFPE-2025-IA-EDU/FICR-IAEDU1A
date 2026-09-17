import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa o SDK do Gemini com a chave segura
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Validação básica do payload de entrada
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A mensagem é obrigatória e deve ser texto.' });
    }

    // Inicia o chat com suporte ao histórico
    const chat = model.startChat({
      history: history || [], // Formato esperador pelo SDK: [{ role: 'user'|'model', parts: [{ text: '' }] }]
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return res.status(200).json({ response: responseText });
  } catch (error) {
    console.error('Erro na integração com LLM:', error);
    return res.status(500).json({ 
      error: 'Falha ao processar a resposta da IA.', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

