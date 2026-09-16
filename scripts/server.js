const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT_DIR = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const PORT = Number(process.env.PORT || 3000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const SYSTEM_PROMPT = `Você é o assistente de suporte oficial do site do 'Squad D'.
Suas respostas devem ser curtas, objetivas, amigáveis e em português do Brasil.

Informações do Squad D:
- Equipe: Débora (Frontend), Maria Clara (Backend), Geysiane (Mobile) e Luiza (UX/UI Design).
- Serviços: Desenvolvimento de sites/web apps, desenvolvimento de aplicativos mobile e design de interfaces (UX/UI).
- Missão: Entregar soluções completas de software com foco em usabilidade e performance.

Regras:
1. Responda APENAS dúvidas relacionadas aos serviços, membros e contatos do Squad D.
2. Se a pergunta for fora do contexto do Squad D, responda educadamente que você só pode ajudar com assuntos da equipe.`;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
        reject(new Error('Request too large'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(JSON.parse(body || '{}')));
    request.on('error', reject);
  });
}

async function handleChat(request, response) {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiApiKey) {
    sendJson(response, 503, { error: 'Configure GEMINI_API_KEY no arquivo .env e reinicie o servidor.' });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body.history) ? body.history : [];
    if (!message) {
      sendJson(response, 400, { error: 'A mensagem e obrigatoria.' });
      return;
    }

    const contents = history
      .filter((item) => item && (item.role === 'user' || item.role === 'model'))
      .map((item) => ({
        role: item.role,
        text: typeof item.text === 'string' ? item.text : item.parts?.[0]?.text,
      }))
      .filter((item) => typeof item.text === 'string' && item.text.trim())
      .slice(-20)
      .map((item) => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 4000) }],
      }));

    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500,
        },
      }),
    };
    let geminiResponse;
    let data;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        requestOptions,
      );
      data = await geminiResponse.json();
      const isTemporaryError = geminiResponse.status === 429 || geminiResponse.status >= 500;
      if (!isTemporaryError || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', data.error?.message || geminiResponse.status);
      const errorMessage = data.error?.message || 'Nao foi possivel consultar o Gemini.';
      sendJson(response, 502, { error: `Gemini: ${errorMessage}` });
      return;
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      sendJson(response, 502, { error: 'O Gemini nao retornou uma resposta.' });
      return;
    }

    sendJson(response, 200, { reply });
  } catch (error) {
    console.error('Chatbot error:', error.message);
    sendJson(response, 502, { error: 'Nao foi possivel consultar o Gemini.' });
  }
}

function serveStatic(request, response) {
  const requestPath = decodeURIComponent(request.url.split('?')[0]);
  const relativePath = requestPath === '/' ? '/squads/squad-D/pages/home.html' : requestPath;
  const filePath = path.resolve(ROOT_DIR, `.${relativePath}`);

  if (!filePath.startsWith(ROOT_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const extension = path.extname(filePath);
  response.writeHead(200, { 'Content-Type': MIME_TYPES[extension] || 'text/plain; charset=utf-8' });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  if (request.method === 'OPTIONS' && request.url === '/api/chat') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    response.end();
    return;
  }

  if (request.method === 'POST' && request.url === '/api/chat') {
    handleChat(request, response);
    return;
  }

  if (request.method === 'GET') {
    serveStatic(request, response);
    return;
  }

  sendJson(response, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`Squad D running at http://localhost:${PORT}`);
});
