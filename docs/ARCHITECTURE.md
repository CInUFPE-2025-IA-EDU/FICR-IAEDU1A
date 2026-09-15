# Arquitetura do projeto

## Núcleo atual

O projeto ativo é o Squad D. A pasta `squads/squad-D/` é o limite da aplicação e deve concentrar o site enquanto a refatoração estiver em andamento.

```text
FICR-IAEDU1A-git/
├── docs/                    # Documentação e decisões do projeto
├── scripts/                 # Validação e métricas do repositório
├── squads/
│   └── squad-D/             # Aplicação ativa
│       ├── pages/            # Páginas HTML do site
│       ├── assets/           # Imagens e outros recursos estáticos
│       ├── scripts/          # JavaScript específico do site
│       ├── metadata.json    # Contexto e identificação do projeto
│       └── styles/          # Folhas de estilo das páginas
└── README.md
```

## Convenções

- Cada página é um arquivo HTML independente dentro de `squads/squad-D/pages/`.
- Cada folha de estilo fica em `squads/squad-D/styles/` e mantém o mesmo nome da página.
- Cada página deve carregar seu estilo com um caminho relativo, como `../styles/home.css`.
- Imagens e outros recursos estáticos ficam em `squads/squad-D/assets/`.
- JavaScript específico do site fica em `squads/squad-D/scripts/`.
- `metadata.json` permanece junto do código do Squad D para preservar o contexto acadêmico.
- Novos recursos devem respeitar as pastas `assets/` e `scripts/` em vez de serem misturados às páginas.
- Não devem ser recriadas pastas para outros squads.

## Próximos passos de organização

1. Extrair componentes repetidos, como o menu, somente depois de estabilizar a navegação.
2. Adicionar o chat de IA em uma etapa própria, mantendo qualquer chave de API fora dos arquivos públicos.
