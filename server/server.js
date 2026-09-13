const path = require("node:path");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:8001";
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

app.use(
  cors({
    origin: frontendOrigin,
  }),
);

app.use(express.json({ limit: "10kb" }));

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

function cleanAnswer(text = "") {
  return String(text)
    .replace(/\*/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const memberResponses = {
  Warlley:
    "Warlley Santos é integrante do Squad C e se interessa por design, automação, tecnologia e desenvolvimento de interfaces. Entre suas áreas de interesse estão arquitetura de soluções, desenvolvimento full stack, HTML, CSS e design de interfaces.\n\nNo portfólio, Warlley contribui especialmente para transformar ideias em experiências visuais mais claras, funcionais e fáceis de usar.",
  Bruno:
    "Bruno Cauã é integrante do Squad C e se interessa por estratégia, negócios e estruturação de sistemas. Suas principais áreas de interesse são arquitetura de back-end, APIs, microsserviços, bancos de dados, HTML, CSS e Java.\n\nSua contribuição está ligada à organização dos processos e à construção das estruturas que dão suporte aos produtos digitais da equipe.",
  Alessandro:
    "Alessandro Gomes é integrante do Squad C e se interessa por desenvolvimento web, tecnologia e organização de produtos digitais. Suas principais áreas de interesse são design de interfaces, desenvolvimento de aplicações, APIs, microsserviços, HTML, CSS e Java.\n\nNos projetos do Squad C, Alessandro contribui para transformar requisitos em soluções funcionais e para organizar a experiência visual, ajudando a conectar tecnologia, produto e usabilidade.",
  Luis: "Luis Gabriel é integrante do Squad C e se interessa por desenvolvimento full stack, segurança e soluções digitais. Entre suas áreas de interesse estão autenticação, segurança de aplicações, criptografia, hashing, HTML, CSS e Python.\n\nSua contribuição está relacionada à criação de estruturas confiáveis e à preocupação com a segurança e o funcionamento das aplicações.",
};

function getMemberResponse(message) {
  const normalizedMessage = normalizeForModeration(message);

  if (normalizedMessage.includes("alessandro")) {
    return memberResponses.Alessandro;
  }

  if (normalizedMessage.includes("warlley")) {
    return memberResponses.Warlley;
  }

  if (normalizedMessage.includes("bruno")) {
    return memberResponses.Bruno;
  }

  if (normalizedMessage.includes("luis") || normalizedMessage.includes("luiz")) {
    return memberResponses.Luis;
  }

  return null;
}

const portfolioContext = `
Você é o assistente virtual do Squad C, uma equipe fictícia de portfólio
digital.

Responda sempre em português do Brasil, com clareza, naturalidade e conteúdo
suficiente para a pergunta. Evite respostas telegráficas. Quando o usuário
perguntar sobre uma pessoa, explique quem ela é no Squad C, sua área de
interesse, suas principais habilidades e como ela pode contribuir para um
projeto. Responda normalmente em 2 ou 3 parágrafos curtos ou em uma lista
organizada, conforme fizer mais sentido. Não use asteriscos para formatar o
texto.

O Squad C trabalha com:
- Consultoria de TI;
- Desenvolvimento de software;
- Design UX/UI;
- Marketing digital;
- Suporte técnico;
- Criação de sites e landing pages;
- Painéis administrativos;
- Microsistemas personalizados.

O portfólio apresenta estudos fictícios de interfaces, projetos digitais e
um estudo de caso da empresa fictícia DeliveryMax.

Os integrantes e seus perfis são:
- Warlley Santos: integrante interessado em design, automação, tecnologia e
  desenvolvimento de interfaces. Suas áreas de interesse incluem arquitetura
  de soluções, desenvolvimento full stack, HTML, CSS e design de interfaces.
- Bruno Cauã: integrante interessado em estratégia, negócios e estruturação de
  sistemas. Suas áreas de interesse incluem arquitetura de back-end, APIs,
  microsserviços, bancos de dados, HTML, CSS e Java.
- Alessandro Gomes: integrante interessado em desenvolvimento web, tecnologia
  e organização de produtos digitais. Suas áreas de interesse incluem design
  de interfaces, desenvolvimento de aplicações, APIs, microsserviços, HTML,
  CSS e Java. Ele contribui para transformar requisitos em soluções funcionais
  e para organizar a experiência visual dos projetos.
- Luis Gabriel: integrante interessado em desenvolvimento full stack,
  segurança e soluções digitais. Suas áreas de interesse incluem autenticação,
  segurança de aplicações, criptografia, hashing, HTML, CSS e Python.

Não invente informações pessoais, preços, clientes reais ou resultados que não
estejam descritos no portfólio.

Se o usuário quiser iniciar um projeto, explique que ele pode acessar a página
de contato.

Se não souber responder, diga que essa informação não está disponível no
portfólio e sugira visitar a página de contato.
`;

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "squad-c-chat",
  });
});

app.post("/api/chat", async (request, response) => {
  const { message } = request.body;

  if (typeof message !== "string" || message.trim().length === 0) {
    return response.status(400).json({
      error: "Envie uma mensagem válida.",
    });
  }

  if (message.length > 1000) {
    return response.status(400).json({
      error: "A mensagem deve ter no máximo 1000 caracteres.",
    });
  }

  if (containsBlockedLanguage(message)) {
    return response.json({
      answer: friendlyModerationMessage,
      moderated: true,
    });
  }

  const memberResponse = getMemberResponse(message);

  if (memberResponse) {
    return response.json({
      answer: memberResponse,
      source: "portfolio",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;

  if (!apiKey || !model) {
    return response.status(500).json({
      error: "O serviço de IA ainda não foi configurado.",
    });
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: portfolioContext,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: message.trim(),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 650,
        },
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Erro retornado pelo Gemini:", data);

      return response.status(502).json({
        error: "Não foi possível obter uma resposta da IA.",
      });
    }

    const answer = cleanAnswer(
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join(""),
    );

    if (!answer) {
      return response.status(502).json({
        error: "A IA não retornou uma resposta válida.",
      });
    }

    return response.json({
      answer,
    });
  } catch (error) {
    console.error("Erro ao consultar o Gemini:", error);

    return response.status(500).json({
      error: "Ocorreu um erro ao consultar o assistente.",
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor do chat executando em http://localhost:${port}`);
});