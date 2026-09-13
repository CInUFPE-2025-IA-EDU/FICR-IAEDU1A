# 📋 Instruções — FICR-IAEDU1A

Este repositório foi preparado para o experimento de **IA assistiva (GitHub Copilot)**
em turmas de HTML & CSS, com o squad C.

## 1. Estrutura Geral

- `.github/workflows/ci.yml` → Workflow de CI (validação + métricas)
- `scripts/create_issues.py` → Cria issues no GitHub a partir do Excel
- `scripts/analyze_squad.py` → Roda `html-validate` por squad
- `scripts/analyze_metrics.py` → Gera esqueleto de métricas para a tese
- `assignments.xlsx` → Planilha com as 144 issues (1 linha por issue)
- `squads/squad-C/` → Código da aplicação em desenvolvimento

## 2. Criação das Issues

1. Garanta que `assignments.xlsx` está na raiz do repositório.
2. Crie um token GitHub com permissão `repo`.
3. Exporte o token no terminal:

   ```bash
   export GITHUB_TOKEN="seu_token_aqui"
   ```

4. Ajuste, se necessário, em `scripts/create_issues.py`:
   - `REPO_OWNER = "sua-organizacao"`
   - `REPO_NAME = "FICR-IAEDU1A"`

5. Execute:

   ```bash
   python scripts/create_issues.py
   ```

6. Verifique as issues em:
   `https://github.com/sua-organizacao/FICR-IAEDU1A/issues`

## 3. Estrutura da Aplicação

A pasta `squads/squad-C` contém:

- `metadata.json` → membros, grupo experimental (COMIA/SEMIA), datas
- arquivos `.html` base: `home.html`, `sobre.html`, `contato.html`, `projetos.html`,
  `habilidades.html`, `servicos.html`, `depoimentos.html`, `case-de-sucesso.html`
- pasta `styles/` com um `.css` correspondente para cada página

## 4. CI e Métricas

- `ci.yml` roda `html-validate` nos `.html` do squad C.
- Gera um JSON com métricas: `metrics-squad-C.json`.
- Gera a base para análise estatística:
  - `research_metrics.json`
  - `research_data_glmm.csv`

## 5. Fluxo para Alunos

1. Use as issues atribuídas ao squad C.
2. Filtre suas issues por `assignee:SEU_CODIGO` no GitHub.
3. Clone o repo e vá para sua pasta:

   ```bash
   git clone https://github.com/CInUFPE-2025-IA-EDU/FICR-IAEDU1A.git
   cd FICR-IAEDU1A/squads/squad-C
   ```

4. Implemente apenas arquivos do squad C.
5. Faça commits frequentes e mantenha HTML semântico e CSS responsivo.
