/*
  ═══════════════════════════════════════════════════════
  12-INIT.JS
  ═══════════════════════════════════════════════════════
  Ponto de entrada do app: inicialização após carregar a página.

  PADRÃO DO PROJETO:
  - Os dados principais ficam em Store.data.
  - Calc concentra regras de negócio e cálculos.
  - Screens monta HTML das telas.
  - Modals monta HTML dos formulários.
  - App coordena navegação, eventos e ações do usuário.

  DICA:
  Procure por 'AJUSTE AQUI' para encontrar pontos comuns de alteração.
*/

// ═══════════════════════════════════════════════════════
      // INIT
      // ═══════════════════════════════════════════════════════
      // Inicializa eventos, estado e renderização inicial do aplicativo.
      document.addEventListener("DOMContentLoaded", () => App.init());
