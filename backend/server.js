const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

app.post("/chat", async (req, res) => {
    try {
        const { mensagem } = req.body;

        if (!mensagem || mensagem.trim() === "") {
            return res.status(400).json({
                erro: "Digite uma mensagem.",
            });
        }

        const interaction = await ai.interactions.create({
            model: "gemini-3.6-flash",
            input: mensagem,
        });

        res.json({
            resposta: interaction.output_text,
        });
    } catch (error) {
        console.error("Erro ao consultar a IA:", error);

        res.status(500).json({
            erro: "Não foi possível obter uma resposta da IA.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor da IA rodando em http://localhost:${PORT}`);
});