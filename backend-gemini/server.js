import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Carrega .env local ou do diretório pai
dotenv.config();
if (!process.env.GEMINI_API_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ AVISO: GEMINI_API_KEY não foi encontrada no .env!');
}

const ai = new GoogleGenAI({ apiKey });

// System prompt com toda a base de conhecimento sobre a Squad C
const SQUAD_C_SYSTEM_PROMPT = `
Você é o C-Bot, assistente virtual inteligente oficial da Squad C, grupo de desenvolvimento e design da FICR (Faculdade Imaculada Conceição do Recife).
Seu objetivo é atender visitantes, potenciais clientes e parceiros com respostas claras, educadas, coerentes e entusiasmadas em Português do Brasil.

INFORMAÇÕES SOBRE O SQUAD C:
- Quem somos: Equipe multidisciplinar de alunos de Análise e Desenvolvimento de Sistemas (ADS) da FICR focada em engenharia de software de alta performance e design de interfaces (UI/UX).
- Integrantes:
  1. Warlley Santos: 18 anos, ADS e Técnico em Mecatrônica, Aprendiz de Assistente Administrativo no Grupo GPS. Especialista em Frontend, Arquitetura de Soluções Críticas, HTML5/CSS3 Semântico e Linguagem C. Responsável conceitual pela interface da Uber no portfólio.
  2. Bruno Cauã: 21 anos, ADS e Técnico em Administração, Operador Comercial na Freitas. Especialista em Backend, Java, APIs REST, Microsserviços e Banco de Dados. Responsável pela lógica de status de pedidos em tempo real no estilo iFood.
  3. Alessandro Gomes: 19 anos, ADS, atua no pós-vendas da concessionária Jeep. Especialista em UI/UX, Design de Interfaces e Prototipagem Mobile. Responsável pela vitrine e catálogo de produtos no estilo Mercado Livre.
  4. Luís Gabriel: 21 anos, ADS (ex-Engenharia Civil), Gerente de Estoque na C Tintas Automotiva. Especialista em Backend, Segurança, Autenticação, Criptografia e Python. Responsável pela infraestrutura de login e segurança no estilo Facebook.

- Serviços que oferecemos:
  1. Redesign de Interface UI/UX: Reformulação visual e funcional para apps de delivery, e-commerces e portais.
  2. Construção de Sites do Zero: Landing pages de alta conversão e sites completos 100% responsivos.
  3. Painéis Administrativos Sob Medida: Dashboards no estilo iFood para gestão de pedidos, estoques, entregadores e restaurantes.
  4. Microsistemas Específicos: Checkout rápido em 3 passos, rastreamento de entregas, módulos de anúncio e autenticação segura.
  5. Consultoria de TI, otimização de performance e suporte contínuo.

- Case de Sucesso DeliveryMax:
  A DeliveryMax tinha um app com checkout de 6 etapas e alto abandono. O Squad C redesenhou a plataforma:
  - Redução de -42% na taxa de abandono no checkout;
  - Aumento de +27% no volume de pedidos;
  - Redução do tempo médio de busca de 38s para 19s;
  - Nota do app subiu de 4.1 para 4.8 estrelas nas lojas;
  - Depoimento do CEO Marcos Avelar destacando o impacto nos negócios.

- Canais de Contato Oficiais:
  - E-mail: squadc123@gmail.com
  - WhatsApp: (81) 91234-5678
  - Instituição: FICR - Recife/PE

DIRETRIZES DE RESPOSTA:
- Responda de forma concisa, objetiva e acolhedora.
- Use negrito ou listas com tópicos para facilitar a leitura.
- Se o usuário perguntar sobre preços ou orçamento, explique que os orçamentos são personalizados conforme o projeto e convide a enviar uma mensagem na página de contato ou pelo WhatsApp oficial.
- Se perguntarem sobre algum membro ou serviço específico, forneça os detalhes exatos da Squad C.
- Mantenha sempre a coerência com a identidade da Squad C.
`;

// Rota de checagem de saúde
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Squad C Gemini AI Backend',
    model: 'gemini-3.5-flash-lite',
    hasApiKey: !!apiKey
  });
});

// Rota principal do Chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem inválida ou vazia.' });
    }

    // Monta contexto para o modelo
    const prompt = `${SQUAD_C_SYSTEM_PROMPT}

Usuário: ${message}
C-Bot:`;

    // Chamada à API oficial do Gemini usando o modelo mais rápido e atual
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt
    });

    const replyText = response.text || 'Desculpe, não consegui processar sua resposta no momento.';

    return res.json({
      response: replyText,
      source: 'gemini'
    });
  } catch (error) {
    console.error('Erro na chamada Gemini:', error.message);
    return res.status(500).json({
      error: 'Erro ao se comunicar com a inteligência artificial do Gemini.',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Gemini da Squad C rodando na porta ${PORT}`);
  console.log(`📡 Endpoint de chat: http://localhost:${PORT}/api/chat`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});
