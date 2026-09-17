const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    value = value.replace(/^["']|["']$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

function getGeminiModel() {
  const configured = String(process.env.GEMINI_MODEL || '').trim().replace(/^models\//, '');
  const deprecated = new Set(['gemini-2.5-flash']);

  if (!configured || deprecated.has(configured)) {
    return DEFAULT_GEMINI_MODEL;
  }

  return configured;
}

function loadSiteContext() {
  const filePath = path.join(ROOT, 'data', 'site-context.json');
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

const SITE_CONTEXT = loadSiteContext();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 30000) {
        reject(new Error('Requisição muito grande.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('JSON inválido.'));
      }
    });

    req.on('error', reject);
  });
}

function buildSiteKnowledge(pageKey) {
  if (!SITE_CONTEXT) return '';

  const project = SITE_CONTEXT.project || {};
  const pages = SITE_CONTEXT.pages || {};
  const portfolio = Array.isArray(SITE_CONTEXT.portfolio) ? SITE_CONTEXT.portfolio : [];
  const currentPage = pageKey && pages[pageKey] ? pages[pageKey] : null;

  const pageLines = Object.entries(pages)
    .map(([key, value]) => `- ${value.title} (${key}): ${value.summary}`)
    .join('\n');

  const portfolioLines = portfolio
    .map((item) => `- ${item.name} [${item.status}]: ${item.summary}. Tecnologias: ${(item.technologies || []).join(', ')}. Resultados: ${(item.results || []).join(', ')}.`)
    .join('\n');

  return [
    `Projeto: ${project.name || 'Equipe de Desenvolvedoras'}.`,
    project.description ? `Descrição: ${project.description}` : '',
    Array.isArray(project.members) ? `Integrantes: ${project.members.join(', ')}.` : '',
    Array.isArray(project.areas) ? `Temas principais: ${project.areas.join(', ')}.` : '',
    currentPage ? `Página atual: ${currentPage.title}. ${currentPage.summary}` : '',
    pageLines ? `Páginas do site:\n${pageLines}` : '',
    portfolioLines ? `Projetos do portfólio:\n${portfolioLines}` : ''
  ].filter(Boolean).join('\n\n');
}

function buildChatInput(message, history, page) {
  const pageKey = page && typeof page.key === 'string' ? page.key : '';
  const pageTitle = page && typeof page.title === 'string' ? page.title : '';

  const recentHistory = history
    .slice(-8)
    .filter((item) => item && ['user', 'model'].includes(item.role) && typeof item.text === 'string')
    .map((item) => `${item.role === 'user' ? 'Usuário' : 'Assistente'}: ${item.text.slice(0, 1000)}`)
    .join('\n');

  const context = buildSiteKnowledge(pageKey);

  return [
    'Você é a assistente virtual do projeto Equipe de Desenvolvedoras.',
    'Responda em português do Brasil, de forma objetiva, cordial e útil.',
    'Use apenas o contexto do projeto fornecido. Quando a pergunta for sobre páginas, serviços, habilidades ou projetos, explique com base no portfólio. Se algo não estiver claro no contexto, diga que aquela informação não está detalhada no site.',
    pageTitle ? `Tela aberta pelo visitante: ${pageTitle}.` : '',
    context,
    recentHistory ? `Histórico recente:\n${recentHistory}` : '',
    `Pergunta do visitante: ${String(message || '').slice(0, 1500)}`
  ].filter(Boolean).join('\n\n');
}

function extractInteractionText(data) {
  if (!data || !Array.isArray(data.steps)) return '';

  const outputSteps = data.steps.filter((step) => step && step.type === 'model_output');
  const lastOutput = outputSteps[outputSteps.length - 1];
  if (!lastOutput || !Array.isArray(lastOutput.content)) return '';

  return lastOutput.content
    .filter((item) => item && item.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('')
    .trim();
}

async function handleChat(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = getGeminiModel();

  if (!apiKey || apiKey === 'COLE_SUA_CHAVE_AQUI') {
    return sendJson(res, 503, {
      error: 'A chave do Gemini ainda não foi configurada no arquivo .env.'
    });
  }

  try {
    const body = await readJsonBody(req);
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body.history) ? body.history : [];
    const page = body.page && typeof body.page === 'object' ? body.page : {};

    if (!message) {
      return sendJson(res, 400, { error: 'Digite uma mensagem para o chatbot.' });
    }

    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        model,
        input: buildChatInput(message, history, page),
        store: false
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const detail = data?.error?.message || 'Falha ao consultar a API do Gemini.';
      return sendJson(res, geminiResponse.status, { error: detail });
    }

    const reply = extractInteractionText(data);

    if (!reply) {
      return sendJson(res, 502, { error: 'O Gemini não retornou uma resposta de texto.' });
    }

    return sendJson(res, 200, { reply });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Erro interno no servidor.' });
  }
}

function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
  } catch {
    res.writeHead(400);
    return res.end('Requisição inválida.');
  }

  if (pathname === '/') pathname = '/home.html';

  const requested = path.normalize(pathname).replace(/^([/\\])+/, '');
  const filePath = path.resolve(ROOT, requested);

  if (!filePath.startsWith(path.resolve(ROOT) + path.sep) && filePath !== path.resolve(ROOT)) {
    res.writeHead(403);
    return res.end('Acesso negado.');
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Página não encontrada.');
    }

    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'COLE_SUA_CHAVE_AQUI'),
      model: getGeminiModel(),
      api: 'Interactions API'
    });
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    return handleChat(req, res);
  }

  if (req.method === 'GET') {
    return serveStatic(req, res);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Método não permitido.');
});

server.listen(PORT, () => {
  console.log(`Equipe de Desenvolvedoras rodando em http://localhost:${PORT}`);
  console.log(`Gemini: ${process.env.GEMINI_API_KEY ? 'chave encontrada' : 'configure GEMINI_API_KEY no arquivo .env'}`);
  console.log(`Modelo: ${getGeminiModel()} | API: Interactions`);
});
