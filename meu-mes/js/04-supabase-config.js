/*
  ═══════════════════════════════════════════════════════
  04-SUPABASE-CONFIG.JS
  ═══════════════════════════════════════════════════════
  Configuração do Supabase. É aqui que entram URL e chave pública do projeto.

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
      // LOGIN
      // ═══════════════════════════════════════════════════════

      // ═══════════════════════════════════════════════════════
      // SUPABASE — Configuração do projeto
      // ═══════════════════════════════════════════════════════
      // Substitua pelos dados do SEU projeto Supabase
      // (Project Settings → API → Project URL / anon public key)
      // Estas chaves são PÚBLICAS por natureza — a proteção real
      // dos dados vem das políticas de Row Level Security (RLS)
      // configuradas no banco, não do segredo desta chave.
      // AJUSTE AQUI: URL do projeto Supabase.
      const SUPABASE_URL = "https://yzgzzlsifalzjjbraszr.supabase.co";
      // AJUSTE AQUI: chave pública anon do Supabase.
      const SUPABASE_ANON_KEY =
        "sb_publishable_b1uqhtJYn9bKqVqYYXjcmA_5mhKjQ2B";

      const supa =
        typeof supabase !== "undefined" &&
        SUPABASE_URL.indexOf("YOUR-PROJECT") === -1
          ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
          : null;
