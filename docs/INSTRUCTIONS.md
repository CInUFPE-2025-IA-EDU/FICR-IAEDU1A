# 📋 Instruções — FICR-IAEDU1A

Este repositório foi preparado para o experimento de **IA assistiva (GitHub Copilot)**
em turmas de HTML & CSS, com squads A–I.

## 1. Estrutura Geral

- `.github/workflows/ci.yml` → Workflow de CI (validação + métricas)
- `scripts/create_issues.py` → Cria issues no GitHub a partir do Excel
- `scripts/analyze_squad.py` → Roda `html-validate` por squad
- `scripts/analyze_metrics.py` → Gera esqueleto de métricas para a tese
- `assignments.xlsx` → Planilha com as 144 issues (1 linha por issue)
- `squads/squad-D/` → Código do projeto ativo

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

## 3. Estrutura dos Squads

O projeto em `squads/squad-D` contém:

- `metadata.json` → membros, grupo experimental (COMIA/SEMIA), datas
- `pages/` com os arquivos `.html`: `home.html`, `sobre.html`, `contato.html`, `projetos.html`,
  `habilidades.html`, `servicos.html`, `depoimentos.html`, `case-de-sucesso.html`
- pasta `styles/` com um `.css` correspondente para cada página

## 4. CI e Métricas

- `ci.yml` roda `html-validate` nas páginas de `squad-D`.
- Gera um JSON com métricas: `metrics-squad-D.json`.
- Gera a base para análise estatística:
  - `research_metrics.json`
  - `research_data_glmm.csv`

## 5. Fluxo para Alunos

1. Clone o repositório e entre na pasta do projeto:

   ```bash
   git clone https://github.com/sua-organizacao/FICR-IAEDU1A.git
   cd FICR-IAEDU1A/squads/squad-D
   ```

2. Implemente páginas em `pages/`, estilos em `styles/`, imagens em `assets/` e scripts em `scripts/`.
3. Faça commits frequentes e mantenha HTML semântico e CSS responsivo.
