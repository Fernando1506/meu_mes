/*
  ═══════════════════════════════════════════════════════
  05-CLOUD-SYNC.JS
  ═══════════════════════════════════════════════════════
  Sincronização com nuvem: login, sessão, leitura/gravação remota e resolução de dados do usuário.

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
      // CLOUD SYNC — Supabase (auth + dados isolados por usuário)
      // ═══════════════════════════════════════════════════════
      /* CloudSync: isola toda a comunicação com Supabase e sessão do usuário. */
      const CloudSync = {
        status: "disconnected",
        session: null,
        _syncing: false,
        _cloudPushTimer: null,
        _workspaceId: null,
        ADMIN_EMAIL: "reis150619@gmail.com",

        isConfigured() {
          return !!supa;
        },
        isAdmin() {
          return this.session?.user?.email === this.ADMIN_EMAIL;
        },

        async getSession() {
          if (!supa) return null;
          const { data } = await supa.auth.getSession();
          this.session = data?.session || null;
          return this.session;
        },

        // ── Carrega workspace ─────────────────────────────────────────
        async _loadWorkspace(uid) {
          const email = this.session?.user?.email || "";

          // Verifica convite pendente
          if (email) {
            const { data: pending } = await supa
              .from("workspace_members")
              .select("id,workspace_id")
              .eq("invited_email", email)
              .eq("status", "pending")
              .maybeSingle();
            if (pending) {
              await supa
                .from("workspace_members")
                .update({
                  user_id: uid,
                  status: "active",
                  accepted_at: new Date().toISOString(),
                })
                .eq("id", pending.id);
              this._workspaceId = pending.workspace_id;
              Store.data.workspaceId = this._workspaceId;
              return this._workspaceId;
            }
          }

          // Membro ativo de outro workspace
          const { data: mem } = await supa
            .from("workspace_members")
            .select("workspace_id")
            .eq("user_id", uid)
            .eq("status", "active")
            .maybeSingle();
          if (mem) {
            this._workspaceId = mem.workspace_id;
            Store.data.workspaceId = this._workspaceId;
            return this._workspaceId;
          }

          // Owner de workspace
          let { data: ws } = await supa
            .from("workspaces")
            .select("id")
            .eq("owner_id", uid)
            .maybeSingle();
          if (!ws) {
            const { data: novo } = await supa
              .from("workspaces")
              .insert({ owner_id: uid, nome: "Meu Orçamento" })
              .select("id")
              .single();
            ws = novo;
          }
          this._workspaceId = ws?.id || null;
          Store.data.workspaceId = this._workspaceId;
          return this._workspaceId;
        },

        // ── Categoria de separação ────────────────────────────────────
        _categoriaSep(nome) {
          const n = (nome || "").toLowerCase().trim();
          if (["dízimo", "dizimo"].includes(n)) return "devolucao";
          if (["oferta", "ajuda familiar", "doação", "doacao"].includes(n))
            return "oferta";
          const mem = Store.get("categorias_separacao") || {};
          return mem[n] || "futuro";
        },

        // ── PUSH — salva nas novas tabelas relacionais ────────────────
        async push() {
          if (!supa) return { ok: false, msg: "Sem conexão" };
          if (!this.session) {
            const s = await this.getSession();
            if (!s) return { ok: false, msg: "Não autenticado" };
          }
          try {
            this.status = "syncing";
            this.updateUI();
            const uid = this.session.user.id;
            const wsId = this._workspaceId || Store.data.workspaceId;

            // Salva categorias de separação na tabela dedicada
            const catSep = Store.data.categorias_separacao || {};
            for (const [nome, categoria] of Object.entries(catSep)) {
              await supa.from("categorias_separacao").upsert(
                {
                  workspace_id: wsId,
                  nome: nome.toLowerCase().trim(),
                  categoria,
                },
                { onConflict: "workspace_id,nome" },
              );
            }

            // Salva recebimentos cadastrados.
            // Observação: requer a tabela public.recebimentos.
            // Se a tabela ainda não existir no Supabase, a sincronização continua
            // sem quebrar o restante do app, mas os recebimentos não persistirão.
            try {
              await supa.from("recebimentos").delete().eq("workspace_id", wsId);
              const recebimentos = (Store.data.recebimentos || []).filter(
                (r) => r && r.nome,
              );
              if (recebimentos.length) {
                await supa.from("recebimentos").insert(
                  recebimentos.map((r) => ({
                    workspace_id: wsId,
                    nome: r.nome || "Recebimento",
                    tipo: r.tipo || "fixo",
                    dia: r.tipo === "extra" ? null : parseInt(r.dia, 10) || 1,
                    valor_estimado: parseFloat(r.valor) || 0,
                  })),
                );
              }
            } catch (e) {
              console.warn(
                "[push recebimentos] tabela public.recebimentos ausente ou sem permissão:",
                e.message,
              );
            }

            // Salva ciclos
            const ciclos = Store.data.ciclos || {};
            for (const mes of Object.keys(ciclos)) {
              const ciclo = ciclos[mes];

              // Upsert ciclo
              const { data: cicloRow } = await supa
                .from("ciclos")
                .upsert(
                  { workspace_id: wsId, mes, decisao: ciclo.decisao || "" },
                  { onConflict: "workspace_id,mes" },
                )
                .select("id")
                .single();
              const cicloId = cicloRow.id;

              // Entradas + separações
              const fontes =
                Array.isArray(ciclo.fontes) && ciclo.fontes.length
                  ? ciclo.fontes
                  : ciclo.renda
                    ? [
                        {
                          origem: ciclo.fonteRenda || "Entrada",
                          valor: ciclo.renda,
                          data: ciclo.dataRenda || mes + "-01",
                          separacoes: [],
                        },
                      ]
                    : [];

              for (const fonte of fontes) {
                // Busca ou cria entrada
                let { data: entRow } = await supa
                  .from("entradas")
                  .select("id")
                  .eq("workspace_id", wsId)
                  .eq("ciclo_id", cicloId)
                  .eq("origem", fonte.origem || "Entrada")
                  .eq("data", fonte.data || mes + "-01")
                  .maybeSingle();
                if (entRow) {
                  await supa
                    .from("entradas")
                    .update({ valor: parseFloat(fonte.valor) || 0 })
                    .eq("id", entRow.id);
                  await supa
                    .from("separacoes")
                    .delete()
                    .eq("entrada_id", entRow.id);
                } else {
                  const { data: nova } = await supa
                    .from("entradas")
                    .insert({
                      workspace_id: wsId,
                      ciclo_id: cicloId,
                      origem: fonte.origem || "Entrada",
                      valor: parseFloat(fonte.valor) || 0,
                      data: fonte.data || mes + "-01",
                    })
                    .select("id")
                    .single();
                  entRow = nova;
                }
                // Separações
                const seps = (fonte.separacoes || []).filter(
                  (s) => s && s.nome && parseFloat(s.valor) > 0,
                );
                if (seps.length) {
                  await supa.from("separacoes").insert(
                    seps.map((s) => ({
                      workspace_id: wsId,
                      entrada_id: entRow.id,
                      nome: s.nome,
                      categoria: s.categoria || this._categoriaSep(s.nome),
                      tipo: s.tipo || "valor",
                      valor: parseFloat(s.valor) || 0,
                    })),
                  );
                }
              }

              // Gastos
              await supa
                .from("gastos")
                .delete()
                .eq("ciclo_id", cicloId)
                .eq("workspace_id", wsId);
              const gastos = (ciclo.gastos || []).filter(
                (g) => g && g.valor > 0,
              );
              if (gastos.length) {
                await supa.from("gastos").insert(
                  gastos.map((g) => {
                    // Serializa campos de recorrência/parcela em extra_json para preservação no pull
                    const extraFields = {};
                    if (g.templateId) extraFields.templateId = g.templateId;
                    if (g.recorrencia) extraFields.recorrencia = g.recorrencia;
                    if (g.startKey) extraFields.startKey = g.startKey;
                    if (g.endKey) extraFields.endKey = g.endKey;
                    if (g.parcelaNum !== undefined) extraFields.parcelaNum = g.parcelaNum;
                    if (g.totalParcelas !== undefined) extraFields.totalParcelas = g.totalParcelas;
                    if (g.repeatMonths !== undefined) extraFields.repeatMonths = g.repeatMonths;
                    if (g.subcategoria) extraFields.subcategoria = g.subcategoria;
                    return {
                      workspace_id: wsId,
                      ciclo_id: cicloId,
                      descricao: g.desc || g.descricao || "Gasto",
                      valor: parseFloat(g.valor) || 0,
                      data: g.data || mes + "-01",
                      categoria: g.categoria || "V",
                      tipo:
                        g.categoria === "E"
                          ? "essencial"
                          : g.categoria === "P"
                            ? "compromisso"
                            : "variavel",
                      pago: g.pago || false,
                      ...(Object.keys(extraFields).length ? { extra_json: JSON.stringify(extraFields) } : {}),
                    };
                  }),
                );
              }

              // Separações avulsas
              await supa
                .from("separacoes_mes")
                .delete()
                .eq("ciclo_id", cicloId)
                .eq("workspace_id", wsId);
              const sepAvulsas = (ciclo.separacoes || []).filter(
                (s) => s && s.valor > 0,
              );
              if (sepAvulsas.length) {
                const mem = Store.data.categorias_separacao || {};
                await supa.from("separacoes_mes").insert(
                  sepAvulsas.map((s) => ({
                    workspace_id: wsId,
                    ciclo_id: cicloId,
                    nome: s.nome || "Separação",
                    categoria:
                      s.categoria ||
                      mem[(s.nome || "").toLowerCase().trim()] ||
                      this._categoriaSep(s.nome || ""),
                    valor: parseFloat(s.valor) || 0,
                    data: s.data || mes + "-01",
                  })),
                );
              }
            }

            // Gastos fixos
            // Serializa o objeto completo como JSON na coluna descricao para
            // preservar startKey, endKey, recorrencia, diaVencimento, etc.
            // O pull detecta pelo prefixo "__gf__" e parseia de volta.
            await supa.from("gastos_fixos").delete().eq("workspace_id", wsId);
            const fixos = (Store.data.gastosFixos || []).filter(
              (g) => g && g.valor > 0,
            );
            if (fixos.length) {
              await supa.from("gastos_fixos").insert(
                fixos.map((g) => ({
                  workspace_id: wsId,
                  descricao: "__gf__" + JSON.stringify(g),
                  valor: parseFloat(g.valor) || 0,
                  categoria: g.categoria || "E",
                  tipo: "essencial",
                  ativo: true,
                })),
              );
            }

            // Parcelas e Objetivos: sincronizados individualmente (insert/update/delete
            // pontual) nas próprias funções de criar/editar/excluir, para preservar
            // o id do banco. NÃO fazer delete-all+reinsert aqui, ou os ids se perdem
            // e o pull() seguinte volta com registros "novos" sem vínculo com a UI.

            // Cartões — só sincroniza se já fizemos pull() nesta sessão.
            // Sem _pulled, Store.data.cartoes pode estar vazio (localStorage
            // limpo ou sessão nova) e o delete-all apagaria os cartões do banco.
            if (Store.data._pulled) {
              await supa.from("cartoes").delete().eq("workspace_id", wsId);
              const cards = (Store.data.cartoes || []).filter(
                (c) => c && c.nome,
              );
              if (cards.length) {
                await supa.from("cartoes").insert(
                  cards.map((c) => ({
                    workspace_id: wsId,
                    nome: c.nome,
                    bandeira: c.bandeira || "",
                    limite: parseFloat(c.limite) || 0,
                    fatura_atual: parseFloat(c.faturaAtual) || 0,
                    dia_fechamento:
                      parseInt(c.diaFechamento || c.fechamento || c.dia_fechamento || 1, 10) || 1,
                    dia_vencimento:
                      parseInt(c.diaVencimento || c.vencimento || c.dia_vencimento || 10, 10) || 10,
                    fatura_vencimento_data:
                      (c.faturaVencimento && c.faturaVencimento.data) || null,
                    fatura_vencimento_valor:
                      (c.faturaVencimento &&
                        parseFloat(c.faturaVencimento.valor)) ||
                      0,
                  })),
                );
              }
            } // end if (_pulled)

            this.status = "connected";
            this.updateUI();
            return { ok: true };
          } catch (e) {
            console.error("[push]", e);
            this.status = "error";
            this.updateUI();
            return { ok: false, msg: e.message };
          }
        },

        // ── PULL — lê das novas tabelas ───────────────────────────────
        async pull() {
          if (!supa || !this.session)
            return { ok: false, msg: "Não autenticado" };
          try {
            this.status = "syncing";
            this.updateUI();
            const uid = this.session.user.id;

            // Limpa estado local
            Store.data.ciclos = {};

            // Workspace
            const wsId = await this._loadWorkspace(uid);

            // Profile
            const { data: prof } = await supa
              .from("profiles")
              .select("id,nome,email,is_admin,plano,status,trial_expires_at")
              .eq("id", uid)
              .maybeSingle();
            if (prof) {
              Store.data.is_admin = prof.is_admin || false;
              Store.data.user = Store.data.user || {
                nome: prof.nome || "",
                email: prof.email || "",
              };
              // Trial
              const isPaidActive =
                prof.plano === "ativo" || prof.status === "ativo";
              if (isPaidActive) {
                // Usuário pago/ativo: não exibe nada de trial
                Store.data.trialDaysLeft = null;
                Store.data.trialExpired = false;
              } else {
                const exp = prof.trial_expires_at
                  ? new Date(prof.trial_expires_at)
                  : null;
                const dias = exp
                  ? Math.max(
                      0,
                      Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24)),
                    )
                  : 0;
                Store.data.trialDaysLeft = dias;
                Store.data.trialExpired = exp && exp < new Date();
              }
            }

            // Categorias de separação da tabela dedicada
            const { data: catSepRows } = await supa
              .from("categorias_separacao")
              .select("nome,categoria")
              .eq("workspace_id", wsId);
            const catMap = {};
            ["dízimo", "dizimo"].forEach((n) => (catMap[n] = "devolucao"));
            ["oferta", "ajuda familiar", "doação", "doacao"].forEach(
              (n) => (catMap[n] = "oferta"),
            );
            (catSepRows || []).forEach((c) => {
              catMap[c.nome] = c.categoria;
            });
            Store.data.categorias_separacao = catMap;

            // Recebimentos cadastrados.
            // Esses dados alimentam o cadastro de entradas/rendas.
            try {
              const { data: recebRows, error: recebErr } = await supa
                .from("recebimentos")
                .select("*")
                .eq("workspace_id", wsId)
                .order("dia", { ascending: true });
              if (recebErr) throw recebErr;
              Store.data.recebimentos = (recebRows || []).map((r) => ({
                id: r.id,
                nome: r.nome || "Recebimento",
                tipo: r.tipo || "fixo",
                dia:
                  r.tipo === "extra"
                    ? null
                    : parseInt(r.dia, 10) || null,
                valor: parseFloat(r.valor_estimado) || 0,
              }));
            } catch (e) {
              console.warn(
                "[pull recebimentos] tabela public.recebimentos ausente ou sem permissão:",
                e.message,
              );
              Store.data.recebimentos = Store.data.recebimentos || [];
            }

            // Ciclos
            const { data: ciclos } = await supa
              .from("ciclos")
              .select("id,mes,decisao")
              .eq("workspace_id", wsId);
            if (ciclos && ciclos.length) {
              const cicloIds = ciclos.map((c) => c.id);

              const [{ data: entradas }, { data: gastos }, { data: sepMes }] =
                await Promise.all([
                  supa.from("entradas").select("*").in("ciclo_id", cicloIds),
                  supa.from("gastos").select("*").in("ciclo_id", cicloIds),
                  supa
                    .from("separacoes_mes")
                    .select("*")
                    .in("ciclo_id", cicloIds),
                ]);

              const entradaIds = (entradas || []).map((e) => e.id);
              let sepsData = [];
              if (entradaIds.length) {
                const { data: seps } = await supa
                  .from("separacoes")
                  .select("*")
                  .in("entrada_id", entradaIds);
                sepsData = seps || [];
              }

              ciclos.forEach((ciclo) => {
                const mesEntradas = (entradas || []).filter(
                  (e) => e.ciclo_id === ciclo.id,
                );
                const mesGastos = (gastos || []).filter(
                  (g) => g.ciclo_id === ciclo.id,
                );
                const mesSepMes = (sepMes || []).filter(
                  (s) => s.ciclo_id === ciclo.id,
                );

                const fontes = mesEntradas.map((e) => ({
                  origem: e.origem,
                  valor: parseFloat(e.valor) || 0,
                  data: e.data,
                  separacoes: sepsData
                    .filter((s) => s.entrada_id === e.id)
                    .map((s) => ({
                      nome: s.nome,
                      categoria: s.categoria,
                      tipo: s.tipo,
                      valor: parseFloat(s.valor) || 0,
                    })),
                }));

                Store.data.ciclos[ciclo.mes] = {
                  fontes,
                  decisao: ciclo.decisao || "",
                  renda: fontes.reduce((s, f) => s + (f.valor || 0), 0),
                  gastos: mesGastos.map((g) => {
                    // Tenta recuperar campos extras serializados em extra_json
                    let extra = {};
                    if (g.extra_json) {
                      try { extra = JSON.parse(g.extra_json); } catch(e) {}
                    }
                    return {
                      id: g.id,
                      desc: g.descricao,
                      descricao: g.descricao,
                      valor: parseFloat(g.valor) || 0,
                      data: g.data,
                      categoria: g.categoria ||
                        (g.tipo === "essencial" ? "E" :
                         g.tipo === "compromisso" ? "P" : "V"),
                      pago: g.pago || false,
                      ...extra,
                    };
                  }),
                  separacoes: mesSepMes.map((s) => ({
                    id: s.id,
                    nome: s.nome,
                    categoria: s.categoria,
                    valor: parseFloat(s.valor) || 0,
                    data: s.data,
                  })),
                };
              });
            }

            // Gastos fixos
            // Se descricao começa com "__gf__", o objeto completo está serializado ali.
            // Caso contrário, é um registro legado — mantemos compatibilidade.
            const { data: fixos } = await supa
              .from("gastos_fixos")
              .select("*")
              .eq("workspace_id", wsId)
              .eq("ativo", true);
            Store.data.gastosFixos = (fixos || []).map((g) => {
              if (g.descricao && g.descricao.startsWith("__gf__")) {
                try {
                  return JSON.parse(g.descricao.slice(6));
                } catch (e) { /* fallthrough */ }
              }
              // Legado: apenas campos básicos disponíveis
              return {
                id: g.id,
                desc: g.descricao,
                descricao: g.descricao,
                valor: parseFloat(g.valor) || 0,
                categoria: g.categoria || "E",
              };
            });

            // Objetivos
            const { data: objs } = await supa
              .from("objetivos")
              .select("*")
              .eq("workspace_id", wsId)
              .order("ordem", { ascending: true });
            Store.data.objetivos = (objs || []).map((o) => ({
              id: o.id,
              nome: o.nome,
              valor: parseFloat(o.valor_meta) || 0,
              valorPago: parseFloat(o.valor_atual) || 0,
              prazo: o.prazo,
              prioridade: o.prioridade || "media",
              concluido: o.concluido || false,
              ordem: o.ordem || 0,
            }));

            // Parcelas
            const { data: parc } = await supa
              .from("parcelas")
              .select("*")
              .eq("workspace_id", wsId);
            Store.data.parcelas = (parc || []).map((p) => ({
              id: p.id,
              nome: p.nome || p.descricao,
              subcategoria: p.subcategoria || "",
              diaVencimento: p.dia_vencimento || 1,
              valor: parseFloat(p.valor_parcela) || 0,
              dataInicio:
                p.data_inicio || (p.mes_inicio ? `${p.mes_inicio}-01` : ""),
              dataFim: p.data_fim || "",
              origem: p.origem || (p.cartao_id ? "cartao" : "separado"),
              cartaoId: p.cartao_id || "",
              skipMonths: Array.isArray(p.skip_months) ? p.skip_months : [],
              quitada: p.quitada || false,
            }));

            // Cartões
            const { data: cards } = await supa
              .from("cartoes")
              .select("*")
              .eq("workspace_id", wsId);
            Store.data.cartoes = (cards || []).map((c) => {
              const diaFechamento = parseInt(c.dia_fechamento, 10) || 1;
              const diaVencimento = parseInt(c.dia_vencimento, 10) || 10;

              // O banco atual guarda o padrão mensal por DIA.
              // Para preencher <input type="date"> no formulário, reconstruímos
              // uma data do mês atual usando o dia salvo no banco.
              const dataPadraoPorDia = (dia) => {
                const base = new Date();
                const ultimoDia = new Date(
                  base.getFullYear(),
                  base.getMonth() + 1,
                  0,
                ).getDate();
                const d = Math.min(Math.max(parseInt(dia, 10) || 1, 1), ultimoDia);
                return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              };

              return {
                id: c.id,
                nome: c.nome,
                bandeira: c.bandeira || "",
                limite: parseFloat(c.limite) || 0,
                faturaAtual: parseFloat(c.fatura_atual) || 0,

                // Campos novos usados pelo formulário e cálculos atuais.
                diaFechamento,
                diaVencimento,
                dataFechamento: dataPadraoPorDia(diaFechamento),
                dataVencimento: dataPadraoPorDia(diaVencimento),

                // Campos antigos mantidos por compatibilidade.
                fechamento: diaFechamento,
                vencimento: diaVencimento,

                faturaVencimento:
                  c.fatura_vencimento_data &&
                  (parseFloat(c.fatura_vencimento_valor) || 0) > 0
                    ? {
                        data: c.fatura_vencimento_data,
                        valor: parseFloat(c.fatura_vencimento_valor),
                      }
                    : null,
              };
            });

            this.status = "connected";
            Store.data._pulled = true; // marca que os dados vieram do banco nesta sessão
            this.updateUI();
            return { ok: true };
          } catch (e) {
            console.error("[pull]", e);
            this.status = "error";
            this.updateUI();
            return { ok: false, msg: e.message };
          }
        },

        scheduleSync() {
          if (this._syncing) return;
          clearTimeout(this._cloudPushTimer);
          this._cloudPushTimer = setTimeout(() => this.push(), 2000);
        },

        async signOut() {
          if (supa) await supa.auth.signOut();
          this.session = null;
          this.status = "disconnected";
          this._workspaceId = null;
        },

        updateUI() {
          const isAdmin = this.isAdmin();
          const syncEl = document.getElementById("sidebar-sync-area");
          if (syncEl) syncEl.style.display = isAdmin ? "" : "none";
          const adminEl = document.getElementById("sidebar-admin-area");
          if (adminEl) adminEl.style.display = isAdmin ? "" : "none";

          const dot = document.getElementById("sidebar-cloud-dot");
          const lbl = document.getElementById("sidebar-cloud-label");
          const statusMap = {
            disconnected: { color: "var(--grey-l)", label: "Não sincronizado" },
            connecting: { color: "var(--amber)", label: "Conectando…" },
            connected: { color: "var(--green)", label: "Sincronizado" },
            syncing: { color: "var(--teal)", label: "Sincronizando…" },
            error: { color: "var(--red)", label: "Erro de sincronização" },
          };
          const m = statusMap[this.status] || statusMap.disconnected;
          if (dot) dot.style.background = m.color;
          if (lbl) lbl.textContent = m.label;
          const badge = document.getElementById("cloud-status-badge");
          if (badge) badge.textContent = m.label;
        },
      };
      window.CloudSync = CloudSync;
