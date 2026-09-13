# FICR-IAEDU1A

Projeto desenvolvido para a disciplina de Informática na Educação, com foco
em HTML, CSS, JavaScript e uso de inteligência artificial.

## Estrutura

- `squads/squad-C/app/index.html`: página inicial.
- `squads/squad-C/app/pages/`: páginas internas.
- `squads/squad-C/app/styles/`: arquivos CSS.
- `squads/squad-C/app/scripts/`: arquivos JavaScript do frontend.
- `squads/squad-C/app/assets/images/`: imagens utilizadas no site.
- `server/`: backend do assistente virtual.
- `scripts/`: scripts de análise e métricas.
- `docs/`: instruções complementares do projeto.

## Páginas

O site contém as seguintes páginas:

- Página inicial
- Sobre a equipe
- Projetos
- Serviços
- Habilidades
- Depoimentos
- Estudo de caso
- Contato

## Execução local

### Frontend

Abra um terminal na raiz do projeto e execute:

```powershell
cd squads/squad-C/app
python -m http.server 8001
```

O site estará disponível em `http://localhost:8001/`.

### Backend

Em outro terminal, instale as dependências:

```powershell
cd server
npm install
```

Crie o arquivo `server/.env` com base em `server/.env.example`:

```env
GEMINI_API_KEY=sua_chave_do_gemini
GEMINI_MODEL=gemini-3.6-flash
PORT=3000
FRONTEND_ORIGIN=http://localhost:8001
```

Inicie o servidor:

```powershell
npm start
```

O backend ficará disponível em `http://localhost:3000`. Para verificar se ele
está funcionando, acesse `http://localhost:3000/api/health`.

O arquivo `server/.env` contém uma chave privada e não deve ser enviado para o
GitHub. Esse arquivo já está incluído no `.gitignore`.

## Assistente virtual

O assistente foi desenvolvido para responder perguntas sobre o próprio
portfólio. Ele pode explicar:

- os integrantes e suas habilidades;
- os serviços oferecidos;
- os projetos apresentados;
- o estudo de caso DeliveryMax;
- as formas de contato com a equipe.

Perguntas fora desse assunto são redirecionadas para o conteúdo do site.
Mensagens ofensivas recebem uma resposta de moderação e não são enviadas ao
provedor de IA.

As respostas sobre os integrantes são definidas no backend. As demais perguntas
relacionadas ao portfólio são enviadas ao Gemini pelo servidor, sem expor a
chave no navegador.

## Verificação antes da apresentação

1. Confirme se `http://localhost:3000/api/health` retorna `status: ok`.
2. Abra o site em `http://localhost:8001/`.
3. Teste uma pergunta sobre os serviços.
4. Teste uma pergunta sobre um integrante.
5. Teste uma mensagem ofensiva.
6. Teste uma pergunta fora do assunto do portfólio.
7. Verifique se `server/.env` não aparece no `git status`.

Os nomes, contatos, depoimentos, resultados e a empresa DeliveryMax são
fictícios e foram utilizados apenas para fins acadêmicos.
