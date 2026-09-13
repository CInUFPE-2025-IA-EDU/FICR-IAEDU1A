# 🎓 FICR-IAEDU1A — IA Assistiva no Ensino de Programação

Aplicação web do squad C para a disciplina de **Informática na Educação / HTML & CSS**,
usada no experimento com **GitHub Copilot** (COMIA x SEMIA).

## 📁 Estrutura do projeto

- `squads/squad-C/` → aplicação escolhida para desenvolvimento.
- `squads/squad-C/app/index.html` → entrada principal da aplicação.
- `squads/squad-C/app/pages/` → páginas internas da aplicação.
- `squads/squad-C/app/styles/` → folhas de estilo de cada página.
- `squads/squad-C/app/assets/images/` → imagens e recursos visuais.
- `scripts/` → ferramentas de análise e métricas.
- `docs/` → instruções do projeto.



## 🗓️ Sprints (por páginas)

- **Sprint 1:** Home, Sobre  
- **Sprint 2:** Contato, Projetos  
- **Sprint 3:** Habilidades, Serviços  
- **Sprint 4:** Depoimentos, Case de Sucesso  

Detalhes de uso e automação estão em `docs/INSTRUCTIONS.md`.

## 🚀 Como executar localmente

### Frontend

O frontend é uma aplicação HTML, CSS e JavaScript estática. Na raiz do projeto:

```powershell
cd squads/squad-C/app
python -m http.server 8001
```

Acesse `http://localhost:8001/`.

### Backend do assistente

Em outro terminal, instale as dependências e configure o ambiente:

```powershell
cd server
npm install
```

Crie `server/.env` a partir de `server/.env.example`:

```env
GEMINI_API_KEY=sua_chave_do_gemini
GEMINI_MODEL=gemini-3.6-flash
PORT=3000
FRONTEND_ORIGIN=http://localhost:8001
```

Inicie o backend:

```powershell
npm start
```

O endpoint de verificação fica disponível em
`http://localhost:3000/api/health`.

O arquivo `server/.env` contém uma credencial privada e não deve ser enviado
ao GitHub. Ele já está protegido pelo `.gitignore`.

## 💬 Assistente virtual

O chat foi criado para auxiliar a navegação do portfólio. Ele responde sobre:

- integrantes e habilidades do Squad C;
- serviços e projetos apresentados;
- estudo de caso DeliveryMax;
- contato e início de um novo projeto.

Mensagens ofensivas são bloqueadas. Perguntas fora desse escopo recebem uma
orientação para voltar ao conteúdo do portfólio. Respostas sobre integrantes
usam dados definidos no projeto; as demais perguntas são encaminhadas ao
Gemini pelo backend.

## 🧪 Checklist de apresentação

Antes de demonstrar o projeto, confirme:

1. `http://localhost:3000/api/health` retorna `status: ok`.
2. O frontend abre em `http://localhost:8001/`.
3. O chat responde sobre serviços e integrantes.
4. Uma mensagem ofensiva recebe a resposta amigável.
5. Uma pergunta fora do contexto é redirecionada ao portfólio.
6. `server/.env` não aparece no `git status`.

Os nomes, depoimentos, contatos, resultados e a empresa DeliveryMax são dados
fictícios para fins acadêmicos e demonstrativos.
