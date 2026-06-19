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
      const SUPABASE_URL = "https://yzgzzlsifalzjjbraszr.supabase.co";
      const SUPABASE_ANON_KEY =
        "sb_publishable_b1uqhtJYn9bKqVqYYXjcmA_5mhKjQ2B";

      const supa =
        typeof supabase !== "undefined" &&
        SUPABASE_URL.indexOf("YOUR-PROJECT") === -1
          ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
          : null;
