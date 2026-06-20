# Manual de Manutenção — Meu Mês

Este documento explica onde mexer para alterar cada parte importante do aplicativo.

## Visão geral da estrutura

```text
meu-mes-comentado/
├── index.html
├── css/
│   ├── 01-base.css
│   ├── 02-components.css
│   ├── 03-layout.css
│   ├── 04-pages.css
│   ├── 05-responsive.css
│   ├── 06-auth-onboarding.css
│   └── 07-extras.css
└── js/
    ├── 01-store.js
    ├── 02-calc.js
    ├── 03-medals.js
    ├── 04-supabase-config.js
    ├── 05-cloud-sync.js
    ├── 06-login.js
    ├── 07-onboarding.js
    ├── 08-farol-helpers.js
    ├── 09-screens.js
    ├── 10-modals.js
    ├── 11-app-controller.js
    └── 12-init.js
```

## Regra principal

A ordem dos arquivos no `index.html` importa. Não troque a ordem dos scripts sem revisar dependências:

1. `Store` precisa carregar antes dos cálculos e telas.
2. `Calc` precisa carregar antes de `Screens`, `FarolHelpers` e `App`.
3. `Screens` e `Modals` precisam existir antes do `App`.
4. `12-init.js` deve ficar por último.

## Onde alterar cada coisa

### Cores, fonte, espaçamentos e identidade visual

Arquivo: `css/01-base.css`

Procure por `:root`. Ali ficam as variáveis principais:

- `--navy`: azul principal.
- `--teal`: verde/teal de destaque.
- `--bg`: fundo geral.
- `--surface`: fundo dos cards.
- `--red`, `--amber`, `--green`: cores de alerta.
- `--r`, `--r-lg`, `--r-xl`: arredondamento.
- `--sh`, `--sh-md`, `--sh-lg`: sombras.

Para mudar a identidade visual, comece por esse arquivo.

### Botões, cards, inputs, badges e modais

Arquivo: `css/02-components.css`

Altere aqui quando quiser mudar:

- Aparência dos botões `.btn`, `.btn-primary`, `.btn-gold`, `.btn-ghost`.
- Cards `.card`, `.metric-card`, `.card-soft`.
- Campos de formulário `.form-input`, `.form-select`, `.form-textarea`.
- Modal, overlay, toast e alertas.

### Menu lateral, header mobile e navegação inferior

Arquivo: `css/03-layout.css`

Altere aqui quando quiser mudar:

- Sidebar desktop.
- Nome/logo no menu lateral.
- Header do celular.
- Bottom nav mobile.
- Largura da sidebar.
- Espaçamento geral da área principal.

### Estilo de telas específicas

Arquivo: `css/04-pages.css`

Altere aqui quando quiser mudar visual específico de:

- Dashboard.
- Meu Mês.
- Análise.
- Objetivos.
- Parcelas.
- Evolução.
- Princípios.

### Responsividade

Arquivo: `css/05-responsive.css`

Altere aqui se algo estiver ruim em:

- Celular.
- Tablet.
- Telas pequenas.
- Quebra de grids.
- Tamanho de cards e botões no mobile.

### Login e onboarding

Arquivo: `css/06-auth-onboarding.css`

Altere aqui o visual de:

- Tela de login.
- Formulário de cadastro.
- Onboarding inicial.
- Cards e etapas iniciais.

### Estados vazios e extras

Arquivo: `css/07-extras.css`

Altere aqui:

- Empty states.
- Cards de passo.
- Guia introdutório.
- Pequenos ajustes complementares.

## Arquivos JavaScript

### Dados locais e estrutura base

Arquivo: `js/01-store.js`

Use quando precisar alterar:

- Estrutura inicial dos dados.
- Categorias padrão.
- Nome da chave usada no `localStorage`.
- Funções de salvar, carregar e atualizar dados locais.

Ponto importante: se mudar o formato dos dados, revise também `Calc`, `Screens` e `App`.

### Cálculos financeiros

Arquivo: `js/02-calc.js`

Use quando precisar alterar:

- Fórmulas de renda.
- Cálculo de gastos.
- Cálculo de saldo/disponível.
- Diagnóstico do mês.
- Regras de blocos.
- Formatação de moeda.
- Ciclo financeiro atual.

Este é o arquivo mais importante para regra de negócio.

### Medalhas e conquistas

Arquivo: `js/03-medals.js`

Use quando quiser mudar:

- Quais medalhas existem.
- Critérios para desbloquear conquistas.
- Textos e ícones das medalhas.

### Supabase

Arquivo: `js/04-supabase-config.js`

Use quando precisar trocar:

- URL do Supabase.
- Chave pública anon.

Importante: nunca coloque chave secreta/service role no front-end.

### Sincronização em nuvem

Arquivo: `js/05-cloud-sync.js`

Use quando precisar alterar:

- Login remoto.
- Cadastro remoto.
- Sessão do usuário.
- Sincronização dos dados.
- Salvamento e carregamento no Supabase.

### Login

Arquivo: `js/06-login.js`

Use quando quiser alterar:

- Comportamento da tela de login.
- Validação de formulário.
- Fluxo de entrada/cadastro.
- Mensagens de erro de autenticação.

### Onboarding

Arquivo: `js/07-onboarding.js`

Use quando quiser alterar:

- Etapas iniciais.
- Campos perguntados ao usuário.
- Dados criados no primeiro acesso.

### Helpers/contexto inteligente

Arquivo: `js/08-farol-helpers.js`

Use quando quiser alterar:

- Mensagens inteligentes.
- Alertas contextuais.
- Sugestões do sistema.
- Helpers de segurança de HTML.
- Resumos do mês.

### Telas principais

Arquivo: `js/09-screens.js`

Cada tela é uma função:

- `Screens.dashboard`: página inicial.
- `Screens.meumes`: controle do mês.
- `Screens.analise`: análise financeira.
- `Screens.objetivos`: objetivos/metas.
- `Screens.parcelas`: parcelas.
- `Screens.evolucao`: histórico.
- `Screens.principios`: princípios e orientação.

Altere aqui quando quiser mudar textos, blocos visuais ou layout HTML de uma tela.

### Modais

Arquivo: `js/10-modals.js`

Use quando quiser alterar os formulários abertos por botões:

- Modal de entrada.
- Modal de gasto.
- Modal de objetivo.
- Modal de parcela.
- Modal de configuração.
- Outros painéis auxiliares.

### Controlador principal

Arquivo: `js/11-app-controller.js`

Use quando quiser alterar ações:

- Navegação entre telas.
- Salvamento de formulário.
- Exclusão de gasto/objetivo/parcela.
- Abertura e fechamento de modal.
- Toasts.
- Monitor de inatividade.
- Inicialização de eventos.

Este arquivo conecta tudo.

### Inicialização

Arquivo: `js/12-init.js`

Deixe por último no HTML. Ele dispara a inicialização do app.

## Alterações comuns

### Quero mudar o nome do app

1. Edite o `<title>` em `index.html`.
2. Procure textos de marca no `index.html`.
3. Procure textos repetidos em `js/09-screens.js`.
4. Se houver logo textual na sidebar, edite o bloco correspondente no `index.html`.

### Quero mudar as cores

1. Abra `css/01-base.css`.
2. Edite as variáveis dentro de `:root`.
3. Teste Dashboard, modais, login e mobile.

### Quero adicionar uma nova tela

1. Crie uma função em `js/09-screens.js`, por exemplo `Screens.novaTela = function () { ... }`.
2. Adicione item de menu no `index.html` chamando `App.go('novaTela')`.
3. Se necessário, adicione CSS em `css/04-pages.css`.
4. Teste desktop e mobile.

### Quero adicionar um novo campo em gasto

1. Altere o formulário em `js/10-modals.js`.
2. Altere a função de salvar em `js/11-app-controller.js`.
3. Ajuste exibição em `js/09-screens.js`.
4. Se o campo afetar cálculos, ajuste `js/02-calc.js`.

### Quero alterar regras de cálculo

1. Comece em `js/02-calc.js`.
2. Procure a função relacionada ao cálculo.
3. Depois revise `js/09-screens.js`, porque a tela pode exibir o resultado.
4. Revise `js/08-farol-helpers.js`, porque alertas e mensagens podem depender do cálculo.

### Quero mudar textos da interface

- Textos fixos de telas: `js/09-screens.js`.
- Textos de modais: `js/10-modals.js`.
- Textos inteligentes/alertas: `js/08-farol-helpers.js`.
- Textos do login: `js/06-login.js`.
- Textos do onboarding: `js/07-onboarding.js`.

### Quero mexer no banco/Supabase

1. Configure credenciais em `js/04-supabase-config.js`.
2. Ajuste leitura/gravação em `js/05-cloud-sync.js`.
3. Não coloque chaves secretas no front-end.

## Cuidados antes de publicar

- Teste no navegador pelo `index.html`.
- Abra o console do navegador para verificar erros.
- Teste login, cadastro, salvar gasto, salvar entrada, objetivos e parcelas.
- Teste no celular ou em modo responsivo.
- Faça backup antes de mudanças grandes.
- Evite mudar a ordem dos scripts.
