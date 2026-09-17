const path = require("node:path");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:8001";
const friendlyModerationMessage =
  "Opa! Sou um chat amigável. Caso queira fazer perguntas sobre o Squad C, estou aqui!";
const outOfContextMessage =
  "Posso ajudar com informações sobre o Squad C, nossos integrantes, serviços, projetos e formas de contato. Tente fazer uma pergunta relacionada ao portfólio.";
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

app.use(cors());

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

function isPortfolioQuestion(text) {
  const normalizedText = normalizeForModeration(text);
  const portfolioTerms = [
    "squad",
    "portfolio",
    "projeto",
    "servico",
    "equipe",
    "integrante",
    "habilidade",
    "contato",
    "email",
    "site",
    "aplicacao",
    "sistema",
    "interface",
    "design",
    "tecnologia",
    "desenvolvimento",
    "deliverymax",
    "contratar",
    "orcamento",
    "preco",
    "trabalha",
    "fazem",
    "oferecem",
    "ajuda",
    "conhecer",
  ];
  const greetings = ["ola", "oi", "bom dia", "boa tarde", "boa noite"];

  return (
    portfolioTerms.some((term) => normalizedText.includes(term)) ||
    greetings.some(
      (greeting) =>
        normalizedText === greeting || normalizedText.startsWith(`${greeting} `),
    )
  );
}

function isGreeting(text) {
  const normalizedText = normalizeForModeration(text);
  const greetings = ["ola", "oi", "bom dia", "boa tarde", "boa noite"];

  return greetings.some(
    (greeting) =>
      normalizedText === greeting || normalizedText.startsWith(`${greeting} `),
  );
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

const portfolioResponses = {
  team: "O Squad C é formado por Warlley Santos, Bruno Cauã, Alessandro Gomes e Luis Gabriel. A equipe reúne interesses complementares em design de interfaces, desenvolvimento web, estratégia, produto, back-end e segurança de aplicações.\n\nWarlley contribui principalmente com design e experiências digitais. Bruno se interessa por estratégia, negócios e estruturas de back-end. Alessandro atua em desenvolvimento web, tecnologia e organização de produtos digitais. Luis se dedica a desenvolvimento full stack e segurança. Juntos, eles trabalham na criação de soluções digitais funcionais e fáceis de usar.",
  projects: "O portfólio apresenta estudos de interface e conceitos de produtos digitais desenvolvidos pelo Squad C. Entre eles estão um estudo de mobilidade urbana, uma interface para delivery, uma experiência de comércio digital e um conceito de rede social.\n\nTambém há um estudo de caso fictício da DeliveryMax, uma plataforma regional de delivery. Nesse case, a equipe propõe melhorias na navegação, na organização visual e no processo de checkout. Para conhecer os detalhes, acesse a página Projetos ou a página Case de Sucesso.",
  services: "O Squad C oferece consultoria de TI, desenvolvimento de software, design UX/UI, marketing digital e suporte técnico. A equipe também trabalha com criação de sites e landing pages, painéis administrativos e microsistemas personalizados.\n\nEsses serviços podem ser aplicados em projetos como plataformas de delivery, lojas digitais, interfaces responsivas, sistemas de acompanhamento e experiências digitais sob medida. Para conversar sobre uma ideia, acesse a página de Contato.",
};

const contactResponses = {
  Warlley:
    "Você pode encontrar o contato de Warlley Santos na página Contato do portfólio. O e-mail informado é warlleysquadc@gmail.com e o telefone é (81) 91234-5678.",
  Bruno:
    "Você pode encontrar o contato de Bruno Cauã na página Contato do portfólio. O e-mail informado é brunosquadc@gmail.com e o telefone é (81) 97856-3409.",
  Alessandro:
    "Você pode encontrar o contato de Alessandro Gomes na página Contato do portfólio. O e-mail informado é alessandrosquadc@gmail.com e o telefone é (81) 91245-4567.",
  Luis:
    "Você pode encontrar o contato de Luis Gabriel na página Contato do portfólio. O e-mail informado é luissquadc@gmail.com e o telefone é (81) 96688-0055.",
  Squad:
    "Você pode entrar em contato com o Squad C pela página Contato do portfólio. O e-mail geral informado é squadc123@gmail.com.",
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

function getContactResponse(message, contextMember) {
  const normalizedMessage = normalizeForModeration(message);
  const asksForContact =
    normalizedMessage.includes("contato") ||
    normalizedMessage.includes("email") ||
    normalizedMessage.includes("telefone") ||
    normalizedMessage.includes("falar com");

  if (!asksForContact) {
    return null;
  }

  if (normalizedMessage.includes("alessandro")) {
    return contactResponses.Alessandro;
  }

  if (normalizedMessage.includes("warlley")) {
    return contactResponses.Warlley;
  }

  if (normalizedMessage.includes("bruno")) {
    return contactResponses.Bruno;
  }

  if (
    normalizedMessage.includes("luis") ||
    normalizedMessage.includes("luiz")
  ) {
    return contactResponses.Luis;
  }

  if (contextMember && contactResponses[contextMember]) {
    return contactResponses[contextMember];
  }

  return contactResponses.Squad;
}

function getPortfolioResponse(message) {
  const normalizedMessage = normalizeForModeration(message);

  if (
    normalizedMessage.includes("quem faz parte") ||
    normalizedMessage.includes("quem sao") ||
    normalizedMessage.includes("equipe") ||
    normalizedMessage.includes("integrantes")
  ) {
    return portfolioResponses.team;
  }

  if (
    normalizedMessage.includes("quais projetos") ||
    normalizedMessage.includes("projetos voces") ||
    normalizedMessage.includes("projetos desenvolvidos") ||
    normalizedMessage.includes("o que voces desenvolveram")
  ) {
    return portfolioResponses.projects;
  }

  if (
    normalizedMessage.includes("quais servicos") ||
    normalizedMessage.includes("servicos voces") ||
    normalizedMessage.includes("o que voces oferecem") ||
    normalizedMessage.includes("quais servicos voces oferecem")
  ) {
    return portfolioResponses.services;
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
  const { message, contextMember } = request.body;

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

  const contactResponse = getContactResponse(message, contextMember);

  if (contactResponse) {
    return response.json({
      answer: contactResponse,
      source: "portfolio",
    });
  }

  const memberResponse = getMemberResponse(message);

  if (memberResponse) {
    return response.json({
      answer: memberResponse,
      source: "portfolio",
    });
  }

  const portfolioResponse = getPortfolioResponse(message);

  if (portfolioResponse) {
    return response.json({
      answer: portfolioResponse,
      source: "portfolio",
    });
  }

  if (isGreeting(message)) {
    return response.json({
      answer:
        "Olá! Sou o assistente virtual do Squad C. Posso apresentar nossa equipe, serviços, projetos ou indicar como entrar em contato.",
      source: "portfolio",
    });
  }

  if (!isPortfolioQuestion(message)) {
    return response.json({
      answer: outOfContextMessage,
      source: "scope",
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