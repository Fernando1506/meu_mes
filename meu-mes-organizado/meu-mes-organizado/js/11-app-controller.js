// ═══════════════════════════════════════════════════════
      // APP CONTROLLER
      // ═══════════════════════════════════════════════════════
      const App = {
        currentScreen: "dashboard",
        _activityTimer: null,
        INATIVIDADE_MS: 30 * 60 * 1000, // 30 minutos

        // Inicia monitoramento de inatividade
        startActivityMonitor() {
          const reset = () => this._resetActivityTimer();
          ["click", "keydown", "touchstart", "scroll", "mousemove"].forEach(
            (e) => document.addEventListener(e, reset, { passive: true }),
          );
          this._resetActivityTimer();
        },

        _resetActivityTimer() {
          clearTimeout(this._activityTimer);
          this._activityTimer = setTimeout(
            () => this._autoLogout(),
            this.INATIVIDADE_MS,
          );
        },

        async _autoLogout() {
          // Só desloga se estiver autenticado
          if (!CloudSync.session) return;
          await CloudSync.signOut();
          document.getElementById("app-layout").classList.add("hidden");
          const sc = document.getElementById("screen-content");
          if (sc) sc.innerHTML = "";
          Store.data = {
            user: null,
            recebimentos: [],
            objetivos: [],
            parcelas: [],
            ciclos: {},
            compromisso: "",
            categorias: [
              {
                id: "E",
                nome: "Essencial",
                cor: "var(--cat-e)",
                bg: "var(--cat-e-t)",
              },
              {
                id: "P",
                nome: "Compromissos",
                cor: "var(--cat-p)",
                bg: "var(--cat-p-t)",
              },
              {
                id: "V",
                nome: "Variável",
                cor: "var(--cat-v)",
                bg: "var(--cat-v-t)",
              },
            ],
          };
          try {
            localStorage.removeItem("farol_v3");
          } catch (e) {}
          // Mostra aviso antes do login
          Login.show();
          setTimeout(() => {
            const msg = document.createElement("div");
            msg.style.cssText =
              "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;z-index:9999;text-align:center;";
            msg.textContent =
              "Sessão encerrada por inatividade. Faça login novamente.";
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 4000);
          }, 300);
        },
        selectedCat: "",
        activeCycleKey: null,

        getActiveCycleKey() {
          return this.activeCycleKey || Calc.cicloAtual();
        },

        salvarEntradaPrevista(modo) {
          const key = document.getElementById("m-eprev-key")?.value;
          const idx = parseInt(
            document.getElementById("m-eprev-idx")?.value ?? "-1",
            10,
          );
          const novoValor = parseFloat(
            document.getElementById("m-eprev-valor")?.value || 0,
          );
          const novaData = document.getElementById("m-eprev-data")?.value || "";
          if (!key || idx < 0 || !novoValor)
            return this.toast("Preencha o valor.");

          const ciclos = Store.get("ciclos") || {};

          if (modo === "somente") {
            // Altera só o índice idx no mês key
            if (!ciclos[key]?.fontes?.[idx])
              return this.toast("Entrada não encontrada.");
            ciclos[key].fontes[idx].valor = novoValor;
            if (novaData) ciclos[key].fontes[idx].data = novaData;
            ciclos[key].renda = Calc.rendaNoMes(ciclos[key]);
            Store.set("ciclos", ciclos);
            this.closeModal();
            this.toast("Entrada atualizada para este mês.");
            this.go(this.currentScreen);
            return;
          }

          // modo === "seguintes": altera key e todos os meses futuros que
          // têm uma entrada com a mesma origem no mesmo índice
          const origem = ciclos[key]?.fontes?.[idx]?.origem || "";
          const [yearK, monthK] = key.split("-").map(Number);

          // Itera pelos próximos 24 meses a partir do mês alvo
          for (let i = 0; i <= 24; i++) {
            const d = new Date(yearK, monthK + i, 1);
            const k = `${d.getFullYear()}-${d.getMonth()}`;
            if (!ciclos[k]?.fontes) continue;
            // Encontra entrada com mesma origem (ou mesmo índice se origem igual)
            const fi = ciclos[k].fontes.findIndex((f, fi) =>
              fi === idx ? true : (f.origem || "") === origem,
            );
            if (fi < 0) continue;
            ciclos[k].fontes[fi].valor = novoValor;
            if (novaData) {
              // Mantém o mês/ano do ciclo, só altera o dia
              const partes = (ciclos[k].fontes[fi].data || novaData).split("-");
              const novaPartes = novaData.split("-");
              ciclos[k].fontes[fi].data =
                `${partes[0]}-${partes[1]}-${novaPartes[2]}`;
            }
            ciclos[k].renda = Calc.rendaNoMes(ciclos[k]);
          }

          Store.set("ciclos", ciclos);
          this.closeModal();
          this.toast("Entrada atualizada neste e nos próximos meses.");
          this.go(this.currentScreen);
        },

        getSeparacaoSuggestions() {
          const saved = Store.get("separacaoSugestoes");
          if (Array.isArray(saved) && saved.length) return saved;
          const base = [
            "Dízimo",
            "Oferta",
            "Reserva de emergência",
            "Investimento",
            "Ajuda familiar",
          ];
          Store.set("separacaoSugestoes", base);
          return base;
        },

        saveSeparacaoSuggestions(nomes) {
          const merged = Array.from(
            new Set([
              ...this.getSeparacaoSuggestions(),
              ...(nomes || []).filter(Boolean),
            ]),
          );
          Store.set("separacaoSugestoes", merged);
        },

        TRIAL_DAYS: 30,

        // Retorna {expired:bool, daysLeft:number} com base na data de criação da conta
        getTrialInfo(session) {
          const createdAt = session?.user?.created_at;
          if (!createdAt) return { expired: false, daysLeft: this.TRIAL_DAYS };
          const created = new Date(createdAt);
          const now = new Date();
          const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
          const daysLeft = this.TRIAL_DAYS - diffDays;
          return { expired: daysLeft <= 0, daysLeft: Math.max(0, daysLeft) };
        },

        showTrialExpired() {
          document.getElementById("app-layout")?.classList.add("hidden");
          document.getElementById("login-screen")?.classList.add("hidden");
          let el = document.getElementById("trial-expired-screen");
          if (!el) {
            el = document.createElement("div");
            el.id = "trial-expired-screen";
            el.style.cssText =
              "position:fixed;inset:0;z-index:3000;background:var(--navy);display:flex;align-items:center;justify-content:center;padding:24px;";
            document.body.appendChild(el);
          }
          el.innerHTML = `
          <div style="max-width:420px;width:100%;background:#fff;border-radius:var(--r-xl);padding:36px 28px;text-align:center;box-shadow:var(--sh-xl);">
            <div style="width:52px;height:52px;border-radius:14px;background:var(--teal-lt);border:1px solid rgba(13,143,110,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0D8F6E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div style="font-size:20px;font-weight:700;color:var(--navy);margin-bottom:8px;">Seu período de teste terminou</div>
            <p style="font-size:14px;color:var(--grey);line-height:1.7;margin-bottom:22px;">Seus dados continuam salvos e seguros. Assine para continuar usando o Meu Mês e acessar tudo de onde você parou.</p>
            <a href="#" class="btn btn-gold btn-full btn-lg" style="border-radius:12px;text-decoration:none;display:flex;">Assinar agora</a>
            <button class="btn btn-ghost btn-full mt-12" style="border-radius:12px;" onclick="App.confirmLogout()">Sair</button>
          </div>`;
          el.classList.remove("hidden");
        },

        async init() {
          this._initPlanoContas();

          if (CloudSync.isConfigured()) {
            // Listener de sessão
            supa.auth.onAuthStateChange((event, session) => {
              CloudSync.session = session || null;
              if (session) {
                if (CloudSync.status === "disconnected") {
                  CloudSync.status = "connected";
                  CloudSync.updateUI();
                }
              } else {
                CloudSync.status = "disconnected";
                CloudSync.updateUI();
              }
            });

            const session = await CloudSync.getSession();
            if (session) {
              CloudSync.session = session;
              CloudSync.status = "connected";
              CloudSync._syncing = true;
              await CloudSync.pull();
              CloudSync._syncing = false;

              // Verifica trial expirado
              if (Store.data.trialExpired) {
                this.showTrialExpired();
                return;
              }

              // Garante user no Store
              const user = Store.get("user");
              if (!user) {
                const nome =
                  session.user?.user_metadata?.nome ||
                  session.user?.email?.split("@")[0] ||
                  "Usuário";
                Store.set("user", {
                  nome,
                  email: session.user.email,
                  criadoEm: new Date().toISOString(),
                });
              }

              if (Store.get("onboardingDone")) {
                this.startApp();
              } else {
                Ob.start();
              }
              return;
            }
            Login.show();
            return;
          }

          if (CloudSync.status === "connected") {
            try {
              await CloudSync.pull(); // Carrega dados do banco
              console.log("✅ Dados sincronizados do banco");
            } catch (err) {
              console.warn("Erro ao sincronizar:", err);
            }
          }

          // ✅ ADICIONAR ISTO AQUI:

          if (CloudSync.status === "connected") {
            try {
              await CloudSync.pull(); // Carrega dados do banco
              console.log("✅ Dados sincronizados do banco");
            } catch (err) {
              console.warn("Erro ao sincronizar:", err);
            }
          }

          // Fallback: Supabase não configurado — modo local (sem login)
          const user = Store.get("user");
          if (!user) {
            Store.set("user", {
              nome: "Usuário",
              criadoEm: new Date().toISOString(),
            });
          }
          if (Store.get("onboardingDone")) {
            this.startApp();
          } else {
            Ob.start();
          }
        },

        _initPlanoContas() {
          const plano = Store.get("planoContas") || {};
          const defaults = {
            E: [
              "Moradia",
              "Aluguel",
              "Condomínio",
              "Água",
              "Luz",
              "Gás",
              "Internet",
              "Telefone",
              "Alimentação",
              "Mercado",
              "Farmácia",
              "Saúde",
              "Plano de saúde",
              "Transporte",
              "Combustível",
              "Escola",
              "Faculdade",
            ],
            P: [
              "Cartão de crédito",
              "Financiamento",
              "Empréstimo",
              "Carnê",
              "Seguro",
              "Consórcio",
              "Mensalidade",
              "Prestação",
            ],
            V: [
              "Lazer",
              "Restaurante",
              "Delivery",
              "Vestuário",
              "Beleza",
              "Assinatura",
              "Academia",
              "Viagem",
              "Presentes",
              "Eletrônicos",
              "Compras diversas",
            ],
            F: [
              "Reserva de emergência",
              "Poupança",
              "Investimento",
              "CDB",
              "Tesouro Direto",
              "Objetivo pessoal",
              "Aposentadoria",
            ],
          };
          let changed = false;
          Object.entries(defaults).forEach(([cat, subs]) => {
            if (!plano[cat] || plano[cat].length === 0) {
              plano[cat] = subs;
              changed = true;
            }
          });
          if (changed) Store.set("planoContas", plano);
        },

        startApp() {
          const user = Store.get("user");
          document.getElementById("app-layout").classList.remove("hidden");
          this.startActivityMonitor();
          this.startPeriodicSync();
          // Pull periódico a cada 5 minutos
          if (!this._periodicPull) {
            this._periodicPull = setInterval(
              async () => {
                if (CloudSync.status === "connected") {
                  await CloudSync.pull();
                  const el = document.getElementById("screen-content");
                  if (el && Screens[this.currentScreen])
                    el.innerHTML = Screens[this.currentScreen]();
                }
              },
              5 * 60 * 1000,
            );
          }
          const nameEl = document.getElementById("sidebar-user-name");
          const userEl = document.getElementById("sidebar-user");
          if (nameEl && user) {
            nameEl.textContent = user.nome;
            userEl.classList.remove("hidden");
          }
          this.activeCycleKey = Calc.cicloAtual();

          const daysLeft = Store.get("trialDaysLeft");
          const badge = document.getElementById("sidebar-trial-badge");
          if (badge && typeof daysLeft === "number") {
            badge.classList.remove("hidden");
            if (daysLeft <= 5) {
              badge.textContent =
                daysLeft <= 0
                  ? "Período de teste encerrado"
                  : `Teste gratuito: ${daysLeft} dia(s) restante(s)`;
              badge.style.color = "var(--amber)";
              badge.style.background = "var(--amb-t)";
              badge.style.borderColor = "rgba(168,94,16,.2)";
            } else {
              badge.textContent = `Teste gratuito: ${daysLeft} dias restantes`;
            }
          }

          this.go("dashboard");
          window.addEventListener(
            "resize",
            () => {
              if (window.innerWidth > 1024) this.closeSidebar();
            },
            { passive: true },
          );
        },

        go(screen) {
          this.currentScreen = screen;
          const el = document.getElementById("screen-content");
          if (Screens[screen]) el.innerHTML = Screens[screen]();
          document
            .querySelectorAll(".nav-item")
            .forEach((n) =>
              n.classList.toggle("active", n.dataset.screen === screen),
            );
          document
            .querySelectorAll(".bottom-nav-item")
            .forEach((n) =>
              n.classList.toggle("active", n.dataset.bn === screen),
            );
          const titles = {
            dashboard: "MEU MÊS",
            meumes: "Meu Mês",
            analise: "Análise",
            evolucao: "Evolução",
            objetivos: "Objetivos",
            parcelas: "Parcelas",
            recebimentos: "Recebimentos",
            principios: "Princípios",
            conquistas: "Conquistas",
            decisao: "Decisão",
            introducao: "Visão do produto",
            planoContas: "Plano de Contas",
            cartoes: "Cartões",
            nuvem: "Sincronização na Nuvem",
            meumesSimples: "Meu Mês",
            suporte: "Suporte",
            admin: "Painel Admin",
            "minha-conta": "Minha Conta",
          };
          const mTitle = document.getElementById("mobile-title");
          if (mTitle) mTitle.textContent = titles[screen] || "MEU MÊS";
          el.scrollTop = 0;
          window.scrollTo(0, 0);
          if (screen === "nuvem") setTimeout(() => App.loadMembers(), 200);
          if (screen === "admin") setTimeout(() => App.loadAdmin(), 200);
          if (screen === "minha-conta" && Store.get("is_admin"))
            setTimeout(() => App.loadMembers(), 200);
          this.closeSidebar();
        },

        shiftMonth(dir) {
          const cur = this.getActiveCycleKey();
          const [y, m] = cur.split("-").map(Number);
          const d = new Date(y, m, 1);
          d.setMonth(d.getMonth() + dir);
          const newKey = `${d.getFullYear()}-${d.getMonth()}`;
          this.activeCycleKey = newKey;
          this.go("meumes");
        },

        openModal(type, arg) {
          if (!Modals[type]) return;
          // Pull silencioso antes de editar — garante dados mais recentes (evita conflito simultâneo)
          if (
            ["renda", "gasto", "separar"].includes(type) &&
            window.CloudSync &&
            CloudSync.status === "connected"
          ) {
            CloudSync.pull().finally(() => {
              this._renderModal(type, arg);
            });
          } else {
            this._renderModal(type, arg);
          }
        },

        _renderModal(type, arg) {
          if (!Modals[type]) return;
          const overlay = document.createElement("div");
          overlay.className = "overlay";
          overlay.id = "modal-overlay";
          overlay.onclick = (e) => {
            if (e.target === overlay) this.closeModal();
          };
          const sheet = document.createElement("div");
          sheet.className = "sheet";
          sheet.innerHTML = Modals[type](arg);
          overlay.appendChild(sheet);
          document.getElementById("overlay-container").appendChild(overlay);
          if (type === "renda") {
            setTimeout(() => {
              App.updateRendaSeparationSummary();
            }, 0);
          }
          setTimeout(() => {
            const inp = sheet.querySelector("input");
            if (inp) inp.focus();
          }, 100);
        },

        closeModal() {
          const o = document.getElementById("modal-overlay");
          if (o) o.remove();
        },

        toast(msg, dur = 2500) {
          const t = document.createElement("div");
          t.className = "toast";
          t.textContent = msg;
          document.body.appendChild(t);
          setTimeout(() => t.remove(), dur);
        },

        selectCat(id) {
          this.selectedCat = id;
          document.getElementById("m-cat").value = id;
          document.querySelectorAll(".tipo-btn").forEach((b) => {
            const active = b.dataset.cat === id;
            b.classList.toggle("active", active);
            const letter = b.querySelector(".tipo-letter");
            const cat = Store.get("categorias").find(
              (c) => c.id === b.dataset.cat,
            );
            if (letter)
              letter.style.color = active ? "#fff" : cat?.cor || "#333";
          });
        },

        refreshSubcats(catId) {
          const subcats = (Store.get("planoContas") || {})[catId] || [];
          const sel = document.getElementById("m-subcat");
          if (!sel) return;
          sel.innerHTML =
            subcats.map((i) => `<option value="${i}">${i}</option>`).join("") ||
            '<option value="">—</option>';
        },

        // ─── Tipos de Separação (Plano de Contas) ──────────────
        addSepTipoUI() {
          document.getElementById("sep-tipo-form")?.classList.remove("hidden");
          document.getElementById("sep-tipo-input")?.focus();
        },
        cancelSepTipoUI() {
          document.getElementById("sep-tipo-form")?.classList.add("hidden");
          const inp = document.getElementById("sep-tipo-input");
          if (inp) inp.value = "";
        },
        saveSepTipo() {
          const inp = document.getElementById("sep-tipo-input");
          const nome = (inp?.value || "").trim();
          if (!nome) {
            this.toast("Digite o nome");
            return;
          }
          const tipos = Store.get("separacaoSugestoes") || [];
          if (!tipos.includes(nome)) tipos.push(nome);
          Store.set("separacaoSugestoes", tipos);
          this.toast("Tipo de separação salvo!");
          this.go("planoContas");
        },
        deleteSepTipo(idx) {
          const tipos = Store.get("separacaoSugestoes") || [];
          const nome = FarolHelpers.escapeHtml(tipos[idx] || "este tipo");
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-confirm";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(400px,92vw);";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir tipo de separação</div><div class="modal-subtitle">Deseja excluir <strong>${nome}</strong>?</div></div><button class="modal-close" onclick="this.closest('.overlay').remove()">×</button></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button><button class="btn btn-danger" onclick="App.confirmDeleteSepTipo(${idx})">Excluir</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },
        confirmDeleteSepTipo(idx) {
          document.getElementById("modal-overlay-confirm")?.remove();
          const tipos = Store.get("separacaoSugestoes") || [];
          tipos.splice(idx, 1);
          Store.set("separacaoSugestoes", tipos);
          this.toast("Excluído.");
          this.go("planoContas");
        },

        toggleRecType(v) {
          document
            .getElementById("m-r-grid-fixo")
            ?.classList.toggle("hidden", v === "extra");
        },
        toggleRecorrenciaFields(v) {
          document
            .getElementById("m-repeticao-meses-wrap")
            ?.classList.toggle("hidden", v !== "mensal");
          document
            .getElementById("m-parcelas-wrap")
            ?.classList.toggle("hidden", v !== "parcelado_fixo");
        },
        toggleRendaOrigem(v) {
          const inp = document.getElementById("m-renda-origem-custom");
          if (inp) inp.classList.toggle("hidden", v !== "_novo_");
        },

        addSubcatUI(catId) {
          document
            .getElementById(`subcat-form-${catId}`)
            ?.classList.remove("hidden");
          document.getElementById(`subcat-input-${catId}`)?.focus();
        },
        cancelSubcatUI(catId) {
          document
            .getElementById(`subcat-form-${catId}`)
            ?.classList.add("hidden");
          const inp = document.getElementById(`subcat-input-${catId}`);
          if (inp) inp.value = "";
        },
        saveSubcat(catId) {
          const inp = document.getElementById(`subcat-input-${catId}`);
          const nome = (inp?.value || "").trim();
          if (!nome) {
            this.toast("Digite o nome");
            return;
          }
          const plano = Store.get("planoContas") || {};
          plano[catId] = plano[catId] || [];
          if (!plano[catId].includes(nome)) plano[catId].push(nome);
          Store.set("planoContas", plano);
          this.toast("Subcategoria salva!");
          this.go("planoContas");
        },
        deleteSubcat(catId, idx) {
          const plano = Store.get("planoContas") || {};
          const nome = FarolHelpers.escapeHtml(
            (plano[catId] || [])[idx] || "esta subcategoria",
          );
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-confirm";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(400px,92vw);";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir subcategoria</div><div class="modal-subtitle">Deseja excluir <strong>${nome}</strong>?</div></div><button class="modal-close" onclick="this.closest('.overlay').remove()">×</button></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button><button class="btn btn-danger" onclick="App.confirmDeleteSubcat('${catId}',${idx})">Excluir</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },
        confirmDeleteSubcat(catId, idx) {
          document.getElementById("modal-overlay-confirm")?.remove();
          const plano = Store.get("planoContas") || {};
          if (plano[catId]) plano[catId].splice(idx, 1);
          Store.set("planoContas", plano);
          this.toast("Excluída.");
          this.go("planoContas");
        },

        saveGasto() {
          const desc = document.getElementById("m-desc")?.value?.trim();
          const valor = parseFloat(
            document.getElementById("m-valor")?.value || 0,
          );
          const cat = document.getElementById("m-cat")?.value || "V";
          const data = document.getElementById("m-data")?.value;
          const recorrencia =
            document.getElementById("m-repete")?.value || "avulso";
          const repeatMonths = Math.max(
            parseInt(
              document.getElementById("m-repetir-meses")?.value || "1",
              10,
            ),
            1,
          );
          const numParcelas = Math.max(
            parseInt(
              document.getElementById("m-num-parcelas")?.value || "2",
              10,
            ),
            2,
          );
          if (!desc) {
            this.toast("Digite a descrição");
            return;
          }
          if (!valor || valor <= 0) {
            this.toast("Digite o valor");
            return;
          }
          const key = this.getActiveCycleKey();
          const ciclos = Store.get("ciclos") || {};
          if (!ciclos[key])
            ciclos[key] = { renda: 0, gastos: [], decisao: "", fontes: [] };
          let templateId = "";
          let startKey = key;
          let endKey = key;
          if (recorrencia === "mensal") {
            templateId = "fx_" + Date.now();
            endKey = FarolHelpers.shiftMonthKey(startKey, repeatMonths - 1);
            const fixos = Store.get("gastosFixos") || [];
            const diaVencimento = parseInt(
              (data || "").split("-")[2] || new Date().getDate(),
              10,
            );
            fixos.push({
              id: templateId,
              descricao: desc,
              valor,
              categoria: cat,
              diaVencimento,
              recorrencia: "mensal",
              repeatMonths,
              startKey,
              endKey,
              skipMonths: [],
            });
            Store.set("gastosFixos", fixos);
          }
          if (recorrencia === "parcelado_fixo") {
            templateId = "pfx_" + Date.now();
            endKey = FarolHelpers.shiftMonthKey(startKey, numParcelas - 1);
            const fixos = Store.get("gastosFixos") || [];
            const diaVencimento = parseInt(
              (data || "").split("-")[2] || new Date().getDate(),
              10,
            );
            fixos.push({
              id: templateId,
              descricao: desc,
              valor,
              categoria: cat,
              diaVencimento,
              recorrencia: "parcelado_fixo",
              totalParcelas: numParcelas,
              startKey,
              endKey,
              skipMonths: [],
            });
            Store.set("gastosFixos", fixos);
          }
          const defaultDate =
            data ||
            `${key.split("-")[0]}-${String(parseInt(key.split("-")[1]) + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
          const parcelaAtual = recorrencia === "parcelado_fixo" ? 1 : undefined;
          ciclos[key].gastos.push({
            descricao: desc,
            valor,
            categoria: cat,
            data: defaultDate,
            pago: false,
            ...(templateId
              ? {
                  templateId,
                  recorrencia:
                    recorrencia === "parcelado_fixo"
                      ? "parcelado_fixo"
                      : "mensal",
                  startKey,
                  endKey,
                  repeatMonths:
                    recorrencia === "mensal" ? repeatMonths : undefined,
                  totalParcelas:
                    recorrencia === "parcelado_fixo" ? numParcelas : undefined,
                  parcelaNum: parcelaAtual,
                }
              : {}),
          });
          Store.set("ciclos", ciclos);
          this.closeModal();
          this.toast(
            recorrencia === "mensal"
              ? `Repetido por ${repeatMonths} meses!`
              : recorrencia === "parcelado_fixo"
                ? `Parcelado em ${numParcelas}x!`
                : "Gasto registrado!",
          );
          this.go(this.currentScreen);
        },

        deleteGasto(key, idx) {
          const ciclos = Store.get("ciclos") || {};
          const c = ciclos[key];
          if (!c || !c.gastos || !c.gastos[idx]) return;
          const g = c.gastos[idx];
          if (g.templateId && g.recorrencia === "mensal") {
            this.openRecurringDeleteModal(key, idx, g);
            return;
          }
          if (
            g.templateId &&
            (g.recorrencia === "parcelado" ||
              g.recorrencia === "parcelado_fixo")
          ) {
            this.openParcelMonthDeleteModal(key, idx, g);
            return;
          }
          const nome = FarolHelpers.escapeHtml(
            g.descricao || "este lançamento",
          );
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-confirm";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(400px,92vw);";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir lançamento</div><div class="modal-subtitle">Deseja realmente excluir <strong>${nome}</strong>?</div></div><button class="modal-close" onclick="this.closest('.overlay').remove()">×</button></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button><button class="btn btn-danger" onclick="App.confirmDeleteGasto('${key}',${idx})">Excluir</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },

        confirmDeleteGasto(key, idx) {
          document.getElementById("modal-overlay-confirm")?.remove();
          const ciclos = Store.get("ciclos") || {};
          const c = ciclos[key];
          if (!c || !c.gastos || !c.gastos[idx]) return;
          c.gastos.splice(idx, 1);
          Store.set("ciclos", ciclos);
          this.toast("Lançamento excluído.");
          this.go(this.currentScreen);
        },

        openRecurringDeleteModal(key, idx, gasto) {
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay";
          overlay.onclick = (e) => {
            if (e.target === overlay) this.closeModal();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir lançamento recorrente</div><div class="modal-subtitle">Escolha o alcance da exclusão para "${FarolHelpers.escapeHtml(gasto.descricao)}".</div></div><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div style="padding:22px 28px 10px;">
          <div class="structural-list">
            <div class="structural-pill"><div><strong>Somente este mês</strong><span><br>Remove apenas a ocorrência atual e preserva os demais meses.</span></div></div>
            <div class="structural-pill"><div><strong>Deste mês em diante</strong><span><br>Interrompe a recorrência a partir do mês atual.</span></div></div>
            <div class="structural-pill"><div><strong>Todos os meses</strong><span><br>Apaga toda a série recorrente do histórico.</span></div></div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
          <button class="btn btn-outline" onclick="App.confirmRecurringDelete('${key}',${idx},'once')">Só este mês</button>
          <button class="btn btn-primary" onclick="App.confirmRecurringDelete('${key}',${idx},'forward')">Deste mês em diante</button>
          <button class="btn btn-danger" onclick="App.confirmRecurringDelete('${key}',${idx},'all')">Todos</button>
        </div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },

        confirmRecurringDelete(key, idx, scope) {
          const ciclos = Store.get("ciclos") || {};
          const c = ciclos[key];
          if (!c || !c.gastos || !c.gastos[idx]) {
            this.closeModal();
            return;
          }
          const g = c.gastos[idx];
          const fixos = Store.get("gastosFixos") || [];
          const tIndex = fixos.findIndex((t) => t.id === g.templateId);
          if (scope === "once") {
            c.gastos.splice(idx, 1);
            if (tIndex >= 0) {
              const skip = new Set(fixos[tIndex].skipMonths || []);
              skip.add(key);
              fixos[tIndex].skipMonths = Array.from(skip);
              Store.set("gastosFixos", fixos);
            }
            Store.set("ciclos", ciclos);
            this.closeModal();
            this.toast("Removido apenas neste mês.");
            this.go(this.currentScreen);
            return;
          }
          if (scope === "forward" && tIndex >= 0) {
            const prevKey = FarolHelpers.shiftMonthKey(key, -1);
            fixos[tIndex].endKey = prevKey;
            Store.set("gastosFixos", fixos);
            Object.keys(ciclos).forEach((k) => {
              if (
                FarolHelpers.keyNum(k) >= FarolHelpers.keyNum(key) &&
                ciclos[k] &&
                ciclos[k].gastos
              )
                ciclos[k].gastos = ciclos[k].gastos.filter(
                  (x) => x.templateId !== g.templateId,
                );
            });
            Store.set("ciclos", ciclos);
            this.closeModal();
            this.toast("× Recorrência interrompida deste mês em diante.");
            this.go(this.currentScreen);
            return;
          }
          const left = fixos.filter((t) => t.id !== g.templateId);
          Store.set("gastosFixos", left);
          Object.keys(ciclos).forEach((k) => {
            const ciclo = ciclos[k];
            if (ciclo && ciclo.gastos)
              ciclo.gastos = ciclo.gastos.filter(
                (x) => x.templateId !== g.templateId,
              );
          });
          Store.set("ciclos", ciclos);
          this.closeModal();
          this.toast("Recorrência removida de todos os meses.");
          this.go(this.currentScreen);
        },

        saveRenda() {
          const valor = parseFloat(
            document.getElementById("m-renda-valor")?.value || 0,
          );
          const origemSel =
            document.getElementById("m-renda-origem")?.value?.trim() ||
            "Entrada";
          const origemCustom = (
            document.getElementById("m-renda-origem-custom")?.value || ""
          ).trim();
          const origem =
            origemSel === "_novo_" ? origemCustom || "Entrada" : origemSel;
          const data =
            document.getElementById("m-renda-data")?.value ||
            new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .split("T")[0];
          if (!valor || valor <= 0) {
            this.toast("Digite o valor");
            return;
          }
          const separacoesRaw = Array.from(
            document.querySelectorAll(".m-sep-row"),
          )
            .map((row) => {
              const selVal =
                row.querySelector(".m-sep-nome-select")?.value || "";
              const nome =
                selVal === "_outro_"
                  ? row.querySelector(".m-sep-nome-custom")?.value?.trim() || ""
                  : selVal;
              const tipo = row.querySelector(".m-sep-tipo")?.value || "valor";
              const valorRaw =
                parseFloat(row.querySelector(".m-sep-valor")?.value || 0) || 0;
              return nome && valorRaw > 0
                ? { nome, tipo, valor: valorRaw }
                : null;
            })
            .filter(Boolean);
          this.saveSeparacaoSuggestions(
            separacoesRaw.map(function (s) {
              return s.nome;
            }),
          );
          // Resolve categoria de cada separação (pergunta se desconhecida)
          const _resolveAll = (seps, idx, result, done) => {
            if (idx >= seps.length) return done(result);
            this._resolveCategoriaSep(seps[idx].nome, (cat) => {
              result.push({ ...seps[idx], categoria: cat });
              _resolveAll(seps, idx + 1, result, done);
            });
          };
          _resolveAll(separacoesRaw, 0, [], (separacoes) => {
            const key = this.getActiveCycleKey();
            const ciclos = Store.get("ciclos") || {};
            if (!ciclos[key])
              ciclos[key] = { renda: 0, gastos: [], decisao: "", fontes: [] };
            if (!Array.isArray(ciclos[key].fontes)) ciclos[key].fontes = [];
            ciclos[key].fontes.push({ origem, valor, data, separacoes });
            ciclos[key].renda = Calc.rendaNoMes(ciclos[key]);
            Store.set("ciclos", ciclos);
            this.closeModal();
            this.toast("Entrada adicionada!");
            this.go(this.currentScreen);
          });
        },

        deleteEntrada(key, idx) {
          const ciclos = Store.get("ciclos") || {};
          const fontes = ciclos[key] && ciclos[key].fontes;
          const entrada = Array.isArray(fontes) ? fontes[idx] : null;
          const nome = entrada
            ? FarolHelpers.escapeHtml(entrada.origem || "Entrada")
            : "esta entrada";
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-confirm";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(400px,92vw);";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir entrada</div><div class="modal-subtitle">Deseja realmente excluir <strong>${nome}</strong>?</div></div><button class="modal-close" onclick="this.closest('.overlay').remove()">×</button></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button><button class="btn btn-danger" onclick="App.confirmDeleteEntrada('${key}',${idx})">Excluir</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },

        confirmDeleteEntrada(key, idx) {
          document.getElementById("modal-overlay-confirm")?.remove();
          const ciclos = Store.get("ciclos") || {};
          if (ciclos[key] && Array.isArray(ciclos[key].fontes)) {
            ciclos[key].fontes.splice(idx, 1);
            ciclos[key].renda = Calc.rendaNoMes(ciclos[key]);
            Store.set("ciclos", ciclos);
          }
          this.closeModal();
          this.toast("Entrada excluída.");
          this.go(this.currentScreen);
        },

        addSeparacaoRow(data) {
          const list = document.getElementById("m-sep-list");
          if (!list) return;
          const tipos = this.getSeparacaoSuggestions();
          const nomeAtual = (data && data.nome) || "";
          const isOutro = nomeAtual && !tipos.includes(nomeAtual);
          const row = document.createElement("div");
          row.className = "m-sep-row";
          row.style.cssText =
            "display:grid;grid-template-columns:1.4fr .8fr .8fr auto;gap:8px;align-items:end;margin-bottom:10px;";
          row.innerHTML = `<div><label class="label">Tipo de separação</label><select class="form-select m-sep-nome-select" onchange="App.toggleSepNomeCustom(this)"><option value="">Selecione…</option>${tipos.map((t) => `<option value="${FarolHelpers.escapeHtml(t)}" ${t === nomeAtual ? "selected" : ""}>${FarolHelpers.escapeHtml(t)}</option>`).join("")}<option value="_outro_" ${isOutro ? "selected" : ""}>Outro…</option></select><input class="form-input m-sep-nome-custom mt-8 ${isOutro ? "" : "hidden"}" placeholder="Nome do tipo" value="${FarolHelpers.escapeHtml(isOutro ? nomeAtual : "")}"></div><div><label class="label">Forma</label><select class="form-select m-sep-tipo" onchange="App.updateRendaSeparationSummary()"><option value="valor" ${data && data.tipo === "percentual" ? "" : "selected"}>R$</option><option value="percentual" ${data && data.tipo === "percentual" ? "selected" : ""}>%</option></select></div><div><label class="label">Valor</label><input class="form-input m-sep-valor" type="number" min="0" step="0.01" placeholder="0,00" value="${data && data.valor ? data.valor : ""}" oninput="App.updateRendaSeparationSummary()"></div><button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove();App.updateRendaSeparationSummary()">×</button>`;
          list.appendChild(row);
          this.updateRendaSeparationSummary();
        },

        toggleSepNomeCustom(sel) {
          const row = sel.closest(".m-sep-row");
          const custom = row?.querySelector(".m-sep-nome-custom");
          if (!custom) return;
          custom.classList.toggle("hidden", sel.value !== "_outro_");
          if (sel.value === "_outro_") custom.focus();
        },

        // Versão genérica do toggle, por ID de elemento — usada no modal "Separar valor"
        toggleSepNomeCustomEl(sel, customId) {
          const custom = document.getElementById(customId);
          if (!custom) return;
          custom.classList.toggle("hidden", sel.value !== "_outro_");
          if (sel.value === "_outro_") custom.focus();
        },

        // Registra uma separação independente, vinculada ao mês (não a uma entrada específica)
        // Resolve a categoria de uma separação — se desconhecida, abre mini-modal para o usuário escolher
        _resolveCategoriaSep(nome, callback) {
          const n = nome.toLowerCase().trim();
          if (["dízimo", "dizimo"].includes(n)) return callback("devolucao");
          if (["oferta", "ajuda familiar", "doação", "doacao"].includes(n))
            return callback("oferta");
          const mem = Store.get("categorias_separacao") || {};
          if (mem[n]) return callback(mem[n]);
          // Nome desconhecido — pergunta
          const overlay = document.createElement("div");
          overlay.style.cssText =
            "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
          overlay.innerHTML = `
          <div style="background:var(--card-bg,#fff);border-radius:16px;padding:24px;max-width:320px;width:100%;">
            <div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:6px;">"${FarolHelpers.escapeHtml(nome)}" é para…</div>
            <div style="font-size:13px;color:var(--grey);margin-bottom:16px;">O sistema vai lembrar sua escolha.</div>
            ${[
              {
                cat: "futuro",
                cor: "#0D8F6E",
                label: "Futuro",
                sub: "Investimento, reserva, poupança",
              },
              {
                cat: "devolucao",
                cor: "#3B6FD4",
                label: "Devolução",
                sub: "Dízimo, compromisso espiritual",
              },
              {
                cat: "oferta",
                cor: "#D4973B",
                label: "Oferta",
                sub: "Doação, ajuda familiar",
              },
            ]
              .map(
                (o) => `
              <button data-cat="${o.cat}" style="width:100%;display:flex;align-items:center;gap:12px;padding:12px;border:2px solid var(--grey-l);border-radius:10px;background:transparent;cursor:pointer;margin-bottom:8px;text-align:left;">
                <span style="width:10px;height:10px;border-radius:50%;background:${o.cor};flex-shrink:0;"></span>
                <div>
                  <div style="font-size:14px;font-weight:700;color:var(--navy);">${o.label}</div>
                  <div style="font-size:12px;color:var(--grey);">${o.sub}</div>
                </div>
              </button>`,
              )
              .join("")}
          </div>`;
          document.body.appendChild(overlay);
          overlay.querySelectorAll("button[data-cat]").forEach((btn) => {
            btn.addEventListener("click", () => {
              const cat = btn.dataset.cat;
              // Salva na memória
              const mem2 = Store.get("categorias_separacao") || {};
              mem2[n] = cat;
              Store.set("categorias_separacao", mem2);
              document.body.removeChild(overlay);
              callback(cat);
            });
          });
        },

        saveSeparacaoMes() {
          const selVal = document.getElementById("m-csep-select")?.value || "";
          const nome =
            selVal === "_outro_"
              ? document.getElementById("m-csep-custom")?.value?.trim() || ""
              : selVal;
          const valor = parseFloat(
            document.getElementById("m-csep-valor")?.value || 0,
          );
          const data = document.getElementById("m-csep-data")?.value;
          if (!nome) {
            this.toast("Selecione o tipo de separação");
            return;
          }
          if (!valor || valor <= 0) {
            this.toast("Digite o valor");
            return;
          }
          if (selVal === "_outro_") this.saveSeparacaoSuggestions([nome]);

          const key = this.getActiveCycleKey();
          const ciclos = Store.get("ciclos") || {};
          if (!ciclos[key])
            ciclos[key] = { renda: 0, gastos: [], decisao: "", fontes: [] };
          if (!Array.isArray(ciclos[key].separacoes))
            ciclos[key].separacoes = [];

          // Verifica se a categoria é conhecida; se não, pergunta antes de salvar
          const dataFinal =
            data ||
            new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .split("T")[0];
          this._resolveCategoriaSep(nome, (cat) => {
            ciclos[key].separacoes.push({
              nome,
              valor,
              data: dataFinal,
              categoria: cat,
            });
            Store.set("ciclos", ciclos);
            this.closeModal();
            this.toast("Valor separado!");
            this.go(this.currentScreen);
          });
        },

        deleteSeparacaoMes(key, idx) {
          const ciclos = Store.get("ciclos") || {};
          const c = ciclos[key];
          if (!c || !Array.isArray(c.separacoes) || !c.separacoes[idx]) return;
          c.separacoes.splice(idx, 1);
          Store.set("ciclos", ciclos);
          this.toast("Separação removida.");
          this.go(this.currentScreen);
        },

        updateRendaSeparationSummary() {
          const bruto =
            parseFloat(document.getElementById("m-renda-valor")?.value || 0) ||
            0;
          const total = Array.from(
            document.querySelectorAll(".m-sep-row"),
          ).reduce((s, row) => {
            const tipo = row.querySelector(".m-sep-tipo")?.value || "valor";
            const raw =
              parseFloat(row.querySelector(".m-sep-valor")?.value || 0) || 0;
            return s + (tipo === "percentual" ? bruto * (raw / 100) : raw);
          }, 0);
          const totalEl = document.getElementById("m-renda-sep-total");
          const baseEl = document.getElementById("m-renda-base");
          if (totalEl) totalEl.textContent = Calc.fmt(total);
          if (baseEl) baseEl.textContent = Calc.fmt(Math.max(0, bruto - total));
        },

        async saveObjetivo() {
          const nome = document.getElementById("m-obj-nome")?.value?.trim();
          const valor = parseFloat(
            document.getElementById("m-obj-valor")?.value || 0,
          );
          const pago = parseFloat(
            document.getElementById("m-obj-pago")?.value || 0,
          );
          const prazo = document.getElementById("m-obj-prazo")?.value;
          const prio = document.getElementById("m-obj-prio")?.value || "media";

          if (!nome) {
            this.toast("Digite o nome");
            return;
          }
          if (!valor || valor <= 0) {
            this.toast("Digite o valor");
            return;
          }

          try {
            // Passo 1: Salvar localmente primeiro (para feedback imediato)
            const objs = Store.get("objetivos") || [];
            const novoObj = {
              nome,
              valor: valor, // Nota: renomeado de 'meta' para 'valor'
              valorPago: Math.max(pago, 0), // Nota: renomeado de 'atual' para 'valorPago'
              prazo: prazo ? `${prazo}-01` : "",
              prioridade: prio,
              concluido: false,
              order: objs.length, // Adicionar ordem
            };
            objs.push(novoObj);
            objs.sort(
              (a, b) =>
                ({ alta: 0, media: 1, baixa: 2 })[a.prioridade] -
                { alta: 0, media: 1, baixa: 2 }[b.prioridade],
            );
            Store.set("objetivos", objs);

            // Passo 2: Sincronizar com Supabase (se conectado)
            if (supa && CloudSync.session) {
              const wsId = Store.get("workspaceId");
              if (!wsId) {
                console.warn("workspace_id não encontrado");
                this.toast(
                  "⚠️ Objetivo salvo localmente (sem sincronização com servidor)",
                );
                this.closeModal();
                this.go("objetivos");
                return;
              }

              const { data: insertedObjs, error } = await supa
                .from("objetivos")
                .insert([
                  {
                    workspace_id: wsId,
                    nome: nome,
                    valor_meta: valor,
                    valor_atual: Math.max(pago, 0),
                    prazo: prazo ? `${prazo}-01` : null,
                    concluido: false,
                    prioridade: prio,
                    ordem: objs.length - 1,
                  },
                ])
                .select();

              if (error) {
                console.error("Erro ao salvar no Supabase:", error);
                this.toast(
                  "⚠️ Salvo localmente, erro ao sincronizar com servidor",
                );
              } else {
                // Guardar o ID retornado pelo banco para atualizações futuras
                if (insertedObjs && insertedObjs.length > 0) {
                  objs[objs.length - 1].id = insertedObjs[0].id;
                  Store.set("objetivos", objs);
                }
                this.toast("✅ Objetivo salvo com sucesso!");
              }
            } else {
              this.toast("Objetivo criado (modo offline)");
            }

            this.closeModal();
            this.go("objetivos");
          } catch (err) {
            console.error("Erro ao salvar objetivo:", err);
            this.toast(
              "❌ Erro ao salvar objetivo: " + (err.message || "desconhecido"),
            );
          }
        },

        deleteObj(idx) {
          const objs = Store.get("objetivos") || [];
          const obj = objs[idx];
          if (!obj) return;
          const nome = FarolHelpers.escapeHtml(obj.nome || "este objetivo");
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-confirm";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(400px,92vw);";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir objetivo</div><div class="modal-subtitle">Deseja realmente excluir <strong>${nome}</strong>?</div></div><button class="modal-close" onclick="this.closest('.overlay').remove()">×</button></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button><button class="btn btn-danger" onclick="App.confirmDeleteObj(${idx})">Excluir</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },
        async confirmDeleteObj(idx) {
          document.getElementById("modal-overlay-confirm")?.remove();
          const objs = Store.get("objetivos") || [];
          const obj = objs[idx];

          if (!obj) return;

          try {
            // Deletar do Supabase se tiver ID
            if (supa && obj.id && CloudSync.session) {
              const wsId = Store.get("workspaceId");
              const { error } = await supa
                .from("objetivos")
                .delete()
                .eq("id", obj.id)
                .eq("workspace_id", wsId);

              if (error) {
                console.error("Erro ao deletar do banco:", error);
                this.toast("⚠️ Erro ao sincronizar com servidor");
                return;
              }
            }

            // Deletar localmente
            objs.splice(idx, 1);
            Store.set("objetivos", objs);
            this.toast("✅ Objetivo excluído.");
            this.go("objetivos");
          } catch (err) {
            console.error("Erro ao excluir objetivo:", err);
            this.toast("❌ Erro ao excluir");
          }
        },
        editObj(idx) {
          this.openGoalEditModal(idx);
        },

        addToObj(idx) {
          this.openGoalFundingModal(idx);
        },

        toggleParcelaCartaoField(val) {
          document
            .getElementById("m-p-cartao-wrap")
            ?.classList.toggle("hidden", val !== "cartao");
        },

        async saveParcela() {
          const nome = document.getElementById("m-p-nome")?.value?.trim();
          const sub = document.getElementById("m-p-sub")?.value?.trim() || "";
          const dia = parseInt(
            document.getElementById("m-p-dia")?.value || "1",
            10,
          );
          const valor = parseFloat(
            document.getElementById("m-p-valor")?.value || 0,
          );
          const inicio = document.getElementById("m-p-inicio")?.value;
          const fim = document.getElementById("m-p-fim")?.value;
          const origem =
            document.getElementById("m-p-origem")?.value || "separado";
          const cartaoId =
            origem === "cartao"
              ? document.getElementById("m-p-cartao")?.value || ""
              : "";
          if (!nome) {
            this.toast("Digite o nome");
            return;
          }
          if (!valor || valor <= 0) {
            this.toast("Digite o valor");
            return;
          }
          if (!inicio || !fim) {
            this.toast("Informe início e término");
            return;
          }
          if (origem === "cartao" && !cartaoId) {
            this.toast("Selecione o cartão ou cadastre um em Cartões");
            return;
          }

          const dataInicio = inicio + "-01";
          const dataFim = fim + "-28";

          try {
            // Passo 1: salvar localmente primeiro (feedback imediato)
            const parcelas = Store.get("parcelas") || [];
            const novaParcela = {
              id: "p_" + Date.now(),
              nome,
              subcategoria: sub,
              diaVencimento: dia,
              valor,
              dataInicio,
              dataFim,
              origem,
              cartaoId,
            };
            parcelas.push(novaParcela);
            Store.set("parcelas", parcelas);

            // Passo 2: sincronizar com Supabase (se conectado)
            if (supa && CloudSync.session) {
              const wsId = Store.get("workspaceId");
              if (!wsId) {
                console.warn("workspace_id não encontrado");
                this.toast(
                  "⚠️ Parcela salva localmente (sem sincronização com servidor)",
                );
                this.closeModal();
                this.go("parcelas");
                return;
              }

              const { data: inserted, error } = await supa
                .from("parcelas")
                .insert([
                  {
                    workspace_id: wsId,
                    nome: nome,
                    descricao: nome,
                    subcategoria: sub,
                    valor_parcela: valor,
                    dia_vencimento: dia,
                    data_inicio: dataInicio,
                    data_fim: dataFim,
                    mes_inicio: inicio,
                    origem: origem,
                    cartao_id: origem === "cartao" ? cartaoId : null,
                    quitada: false,
                  },
                ])
                .select();

              if (error) {
                console.error("Erro ao salvar parcela no Supabase:", error);
                this.toast(
                  "⚠️ Salva localmente, erro ao sincronizar com servidor",
                );
              } else if (inserted && inserted.length > 0) {
                // Substitui o id local temporário pelo id real do banco
                const idx = parcelas.findIndex((p) => p.id === novaParcela.id);
                if (idx >= 0) {
                  const oldId = parcelas[idx].id;
                  const newId = inserted[0].id;
                  parcelas[idx].id = newId;
                  Store.set("parcelas", parcelas);

                  // Atualiza o templateId de gastos já gerados nos ciclos
                  // (gerados com o id temporário) para o id real do banco —
                  // senão, na próxima renderização syncRecurring não reconhece
                  // o templateId antigo e gera um gasto duplicado.
                  const oldTid = `parcela:${oldId}`;
                  const newTid = `parcela:${newId}`;
                  const ciclos = Store.get("ciclos") || {};
                  Object.keys(ciclos).forEach((k) => {
                    const c = ciclos[k];
                    if (c && Array.isArray(c.gastos)) {
                      c.gastos.forEach((g) => {
                        if (g.templateId === oldTid) g.templateId = newTid;
                      });
                    }
                  });
                  Store.set("ciclos", ciclos);
                }
                this.toast("✅ Parcela registrada!");
              }
            } else {
              this.toast("Parcela registrada (modo offline)");
            }

            this.closeModal();
            this.go("parcelas");
          } catch (err) {
            console.error("Erro ao salvar parcela:", err);
            this.toast(
              "❌ Erro ao salvar parcela: " + (err.message || "desconhecido"),
            );
          }
        },

        deleteParcela(idx) {
          this.openParcelaDeleteModal(idx);
        },

        openParcelaDeleteModal(idx) {
          const p = Store.get("parcelas") || [];
          const parcela = p[idx];
          if (!parcela) {
            this.toast("Parcela não encontrada");
            return;
          }
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay";
          overlay.onclick = (e) => {
            if (e.target === overlay) this.closeModal();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          const key = this.getActiveCycleKey();
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir parcela</div><div class="modal-subtitle">Como deseja excluir "${FarolHelpers.escapeHtml(parcela.nome)}"?</div></div><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div style="padding:22px 28px 10px;">
          <div class="structural-list">
            <div class="structural-pill"><div><strong>Somente neste mês</strong><span><br>Remove a cobrança de ${FarolHelpers.monthLabelByKey(key)} e preserva os demais meses.</span></div></div>
            <div class="structural-pill"><div><strong>Excluir do cadastro inteiro</strong><span><br>Remove a parcela de todos os meses e do histórico.</span></div></div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
          <button class="btn btn-outline" onclick="App.confirmParcelaDelete(${idx},'once')">Só este mês</button>
          <button class="btn btn-danger" onclick="App.confirmParcelaDelete(${idx},'all')">Excluir tudo</button>
        </div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },

        async confirmParcelaDelete(idx, scope) {
          const p = Store.get("parcelas") || [];
          const parcela = p[idx];
          if (!parcela) {
            this.closeModal();
            return;
          }
          const key = this.getActiveCycleKey();

          if (scope === "once") {
            // "Só este mês": adiciona o mês ao skipMonths e atualiza no banco
            parcela.skipMonths = Array.from(
              new Set([...(parcela.skipMonths || []), key]),
            );
            Store.set("parcelas", p);
            const ciclos = Store.get("ciclos") || {};
            const c = ciclos[key];
            const tid = `parcela:${parcela.id}`;
            if (c && c.gastos)
              c.gastos = c.gastos.filter((g) => g.templateId !== tid);
            Store.set("ciclos", ciclos);

            // Persiste skipMonths no banco (se o id não for temporário local)
            if (
              supa &&
              CloudSync.session &&
              parcela.id &&
              !String(parcela.id).startsWith("p_")
            ) {
              const wsId = Store.get("workspaceId");
              const { error } = await supa
                .from("parcelas")
                .update({ skip_months: parcela.skipMonths })
                .eq("id", parcela.id)
                .eq("workspace_id", wsId);
              if (error)
                console.error("Erro ao atualizar skipMonths no banco:", error);
            }

            this.closeModal();
            this.toast("Removido apenas neste mês.");
            this.go("parcelas");
            return;
          }

          // "Excluir tudo": remove do banco e do Store local
          const tid = `parcela:${parcela.id}`;

          if (
            supa &&
            CloudSync.session &&
            parcela.id &&
            !String(parcela.id).startsWith("p_")
          ) {
            const wsId = Store.get("workspaceId");
            const { error } = await supa
              .from("parcelas")
              .delete()
              .eq("id", parcela.id)
              .eq("workspace_id", wsId);
            if (error)
              console.error("Erro ao excluir parcela do banco:", error);
          }

          p.splice(idx, 1);
          Store.set("parcelas", p);
          const ciclos = Store.get("ciclos") || {};
          Object.keys(ciclos).forEach((k) => {
            const c = ciclos[k];
            if (c && c.gastos)
              c.gastos = c.gastos.filter((g) => g.templateId !== tid);
          });
          Store.set("ciclos", ciclos);
          this.closeModal();
          this.toast("✅ Parcela excluída do cadastro.");
          this.go("parcelas");
        },

        openParcelMonthDeleteModal(key, idx, gasto) {
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay";
          overlay.onclick = (e) => {
            if (e.target === overlay) this.closeModal();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir parcela recorrente</div><div class="modal-subtitle">Escolha o alcance para "${FarolHelpers.escapeHtml(gasto.descricao)}".</div></div><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div style="padding:22px 28px 10px;">
          <div class="structural-list">
            <div class="structural-pill"><div><strong>Somente este mês</strong><span><br>Remove apenas a ocorrência de ${FarolHelpers.monthLabelByKey(key)} e preserva os demais meses.</span></div></div>
            <div class="structural-pill"><div><strong>Excluir do cadastro inteiro</strong><span><br>Remove a parcela de todos os meses e do histórico.</span></div></div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
          <button class="btn btn-outline" onclick="App.confirmParcelMonthDelete('${key}',${idx},'once')">Só este mês</button>
          <button class="btn btn-danger" onclick="App.confirmParcelMonthDelete('${key}',${idx},'all')">Excluir tudo</button>
        </div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },

        confirmParcelMonthDelete(key, idx, scope) {
          const ciclos = Store.get("ciclos") || {};
          const c = ciclos[key];
          if (!c || !c.gastos || !c.gastos[idx]) {
            this.closeModal();
            return;
          }
          const g = c.gastos[idx];
          const tid = g.templateId;
          const parcelaId =
            tid && tid.startsWith("parcela:")
              ? tid.replace("parcela:", "")
              : null;
          if (scope === "once") {
            c.gastos.splice(idx, 1);
            Store.set("ciclos", ciclos);
            if (parcelaId) {
              const p = Store.get("parcelas") || [];
              const parcela = p.find((x) => x.id === parcelaId);
              if (parcela) {
                parcela.skipMonths = Array.from(
                  new Set([...(parcela.skipMonths || []), key]),
                );
                Store.set("parcelas", p);
              }
            }
            this.closeModal();
            this.toast("Removido apenas neste mês.");
            this.go(this.currentScreen);
            return;
          }
          if (parcelaId) {
            const p = Store.get("parcelas") || [];
            const pIdx = p.findIndex((x) => x.id === parcelaId);
            if (pIdx >= 0) {
              p.splice(pIdx, 1);
              Store.set("parcelas", p);
            }
            Object.keys(ciclos).forEach((k) => {
              const ciclo = ciclos[k];
              if (ciclo && ciclo.gastos)
                ciclo.gastos = ciclo.gastos.filter((x) => x.templateId !== tid);
            });
            Store.set("ciclos", ciclos);
          }
          // tratar parcelado_fixo (templateId começa com pfx_)
          if (tid && tid.startsWith("pfx_")) {
            const fixos = Store.get("gastosFixos") || [];
            const nFixos = fixos.filter((t) => t.id !== tid);
            Store.set("gastosFixos", nFixos);
            Object.keys(ciclos).forEach((k) => {
              const ciclo = ciclos[k];
              if (ciclo && ciclo.gastos)
                ciclo.gastos = ciclo.gastos.filter((x) => x.templateId !== tid);
            });
            Store.set("ciclos", ciclos);
          }
          this.closeModal();
          this.toast("Parcelamento excluído.");
          this.go(this.currentScreen);
        },

        saveRecebimento() {
          const nome = document.getElementById("m-r-nome")?.value?.trim();
          const tipo = document.getElementById("m-r-tipo")?.value || "fixo";
          const dia = parseInt(
            document.getElementById("m-r-dia")?.value || "1",
            10,
          );
          const valor = parseFloat(
            document.getElementById("m-r-valor")?.value || 0,
          );
          if (!nome) {
            this.toast("Digite o nome");
            return;
          }
          const recs = Store.get("recebimentos") || [];
          recs.push({ nome, tipo, dia, valor });
          Store.set("recebimentos", recs);
          this.closeModal();
          this.toast("Recebimento cadastrado!");
          this.go("recebimentos");
        },

        deleteRecebimento(idx) {
          const recs = Store.get("recebimentos") || [];
          const rec = recs[idx];
          if (!rec) return;
          const nome = FarolHelpers.escapeHtml(rec.nome || "este recebimento");
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-confirm";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(400px,92vw);";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir recebimento</div><div class="modal-subtitle">Deseja excluir <strong>${nome}</strong>?</div></div><button class="modal-close" onclick="this.closest('.overlay').remove()">×</button></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button><button class="btn btn-danger" onclick="App.confirmDeleteRecebimento(${idx})">Excluir</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },
        confirmDeleteRecebimento(idx) {
          document.getElementById("modal-overlay-confirm")?.remove();
          const r = Store.get("recebimentos") || [];
          r.splice(idx, 1);
          Store.set("recebimentos", r);
          this.toast("Recebimento excluído.");
          this.go("recebimentos");
        },

        // ─── CARTÕES DE CRÉDITO ──────────────────────────────────
        saveCartao() {
          const idxRaw = document.getElementById("m-cart-idx")?.value;
          const idx =
            idxRaw !== "" && idxRaw != null ? parseInt(idxRaw, 10) : null;
          const nome = document.getElementById("m-cart-nome")?.value?.trim();
          const diaFechamento = parseInt(
            document.getElementById("m-cart-fechamento")?.value || "0",
            10,
          );
          const diaVencimento = parseInt(
            document.getElementById("m-cart-vencimento")?.value || "0",
            10,
          );
          if (!nome) {
            this.toast("Digite o nome do cartão");
            return;
          }
          if (!diaFechamento || diaFechamento < 1 || diaFechamento > 31) {
            this.toast("Informe o dia de fechamento");
            return;
          }
          if (!diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
            this.toast("Informe o dia de vencimento");
            return;
          }

          const cartoes = Store.get("cartoes") || [];

          if (idx !== null && cartoes[idx]) {
            cartoes[idx] = {
              ...cartoes[idx],
              nome,
              diaFechamento,
              diaVencimento,
            };
          } else {
            const inicial =
              parseFloat(
                document.getElementById("m-cart-inicial")?.value || 0,
              ) || 0;
            const novo = {
              id:
                "c" +
                Date.now().toString(36) +
                Math.random().toString(36).slice(2, 5),
              nome,
              diaFechamento,
              diaVencimento,
              faturaAtual: inicial,
              historico:
                inicial > 0
                  ? [
                      {
                        data: new Date(
                          Date.now() - new Date().getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .split("T")[0],
                        valorAnterior: 0,
                        valorNovo: inicial,
                        diferenca: inicial,
                      },
                    ]
                  : [],
              faturasFechadas: [],
            };
            cartoes.push(novo);
          }
          Store.set("cartoes", cartoes);
          this.closeModal();
          this.toast(
            idx !== null ? "Cartão atualizado!" : "Cartão cadastrado!",
          );
          this.go("cartoes");
        },

        deleteCartao(idx) {
          const cartoes = Store.get("cartoes") || [];
          const c = cartoes[idx];
          if (!c) return;
          const nome = FarolHelpers.escapeHtml(c.nome || "este cartão");
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-confirm";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(400px,92vw);";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Excluir cartão</div><div class="modal-subtitle">Deseja excluir <strong>${nome}</strong>? O histórico de atualizações será perdido.</div></div><button class="modal-close" onclick="this.closest('.overlay').remove()">×</button></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button><button class="btn btn-danger" onclick="App.confirmDeleteCartao(${idx})">Excluir</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },
        confirmDeleteCartao(idx) {
          document.getElementById("modal-overlay-confirm")?.remove();
          const cartoes = Store.get("cartoes") || [];
          cartoes.splice(idx, 1);
          Store.set("cartoes", cartoes);
          this.toast("Cartão excluído.");
          this.go("cartoes");
        },

        saveFaturaUpdate() {
          const idx = parseInt(
            document.getElementById("m-fat-idx")?.value || "-1",
            10,
          );
          const novoValor = parseFloat(
            document.getElementById("m-fat-valor")?.value || 0,
          );
          if (isNaN(novoValor) || novoValor < 0) {
            this.toast("Digite um valor válido");
            return;
          }
          const cartoes = Store.get("cartoes") || [];
          const c = cartoes[idx];
          if (!c) return;
          const valorAnterior = c.faturaAtual || 0;
          const diferenca = novoValor - valorAnterior;
          if (!Array.isArray(c.historico)) c.historico = [];
          c.historico.push({
            data: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .split("T")[0],
            valorAnterior,
            valorNovo: novoValor,
            diferenca,
          });
          c.faturaAtual = novoValor;
          cartoes[idx] = c;
          Store.set("cartoes", cartoes);
          this.closeModal();
          this.toast("Fatura atualizada!");
          this.go("cartoes");
        },

        saveFaturaVencimento() {
          const idx = parseInt(
            document.getElementById("m-prev-idx")?.value || "-1",
            10,
          );
          const valor = parseFloat(
            document.getElementById("m-prev-valor")?.value || 0,
          );
          const data = document.getElementById("m-prev-data")?.value;
          if (!data) {
            this.toast("Informe a data de vencimento");
            return;
          }
          if (isNaN(valor) || valor <= 0) {
            this.toast("Digite um valor válido");
            return;
          }
          const cartoes = Store.get("cartoes") || [];
          const c = cartoes[idx];
          if (!c) return;
          c.faturaVencimento = { data, valor };
          cartoes[idx] = c;
          Store.set("cartoes", cartoes);
          CloudSync.scheduleSync();
          this.closeModal();
          this.toast("✅ Fatura lançada!");
          this.go("cartoes");
        },

        clearFaturaVencimento(idx) {
          const cartoes = Store.get("cartoes") || [];
          const c = cartoes[idx];
          if (!c) return;
          c.faturaVencimento = null;
          cartoes[idx] = c;
          Store.set("cartoes", cartoes);
          CloudSync.scheduleSync();
          this.closeModal();
          this.toast("Lançamento removido");
          this.go("cartoes");
        },

        // Confirma o fechamento da fatura: registra o valor como gasto do mês
        // (lançamento de saída sem categoria) e zera a fatura para o próximo ciclo
        confirmarFechamentoFatura(idx) {
          const cartoes = Store.get("cartoes") || [];
          const c = cartoes[idx];
          if (!c) return;
          const valor = c.faturaAtual || 0;
          const now = new Date();
          const key = `${now.getFullYear()}-${now.getMonth()}`;
          const dataStr = new Date(Date.now() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
          // Data de vencimento da fatura = dia de vencimento do cartão, no mês atual
          const diaVenc = Math.min(
            Math.max(parseInt(c.diaVencimento, 10) || 1, 1),
            28,
          );
          const vencimentoStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(diaVenc).padStart(2, "0")}`;

          // Registra como gasto do mês (categoria oculta — modo simples não exibe categorias)
          const ciclos = Store.get("ciclos") || {};
          if (!ciclos[key])
            ciclos[key] = { renda: 0, gastos: [], decisao: "", fontes: [] };
          if (!Array.isArray(ciclos[key].gastos)) ciclos[key].gastos = [];
          if (valor > 0) {
            ciclos[key].gastos.push({
              descricao: `Fatura ${c.nome}`,
              valor,
              categoria: "V",
              data: vencimentoStr,
              pago: false,
              origem: "cartao",
              cartaoId: c.id,
            });
          }
          Store.set("ciclos", ciclos);

          // Marca a fatura como fechada e zera o acumulado
          if (!Array.isArray(c.faturasFechadas)) c.faturasFechadas = [];
          c.faturasFechadas.push({ mesRef: key, valor, fechadaEm: dataStr });
          if (!Array.isArray(c.historico)) c.historico = [];
          if (valor > 0) {
            c.historico.push({
              data: dataStr,
              valorAnterior: valor,
              valorNovo: 0,
              diferenca: -valor,
              fechamento: true,
            });
          }
          c.faturaAtual = 0;
          cartoes[idx] = c;
          Store.set("cartoes", cartoes);

          this.toast("Fatura fechada e registrada como gasto do mês!");
          this.go("cartoes");
        },

        saveDecisao() {
          const t = document.getElementById("decisao-text")?.value || "";
          const key = App.getActiveCycleKey
            ? App.getActiveCycleKey()
            : Calc.cicloAtual();
          const ciclos = Store.get("ciclos") || {};
          if (!ciclos[key])
            ciclos[key] = { renda: 0, gastos: [], decisao: "", fontes: [] };
          ciclos[key].decisao = t;
          Store.set("ciclos", ciclos);
          this.toast("Decisão salva!");
          this.go("decisao");
        },

        // ── ADMIN ────────────────────────────────────────────────────
        _adminUsers: [],

        async loadAdmin() {
          if (!supa || !CloudSync.isAdmin()) return;
          // Usa RPC para buscar todos os profiles (bypassa RLS via security definer)
          const { data: profiles, error } = await supa.rpc(
            "admin_get_all_profiles",
          );
          if (error) {
            console.error("[admin] erro ao buscar profiles:", error);
            const el = document.getElementById("admin-users-list");
            if (el)
              el.innerHTML = `<div style="color:var(--red);font-size:13px;padding:12px;">Erro: ${error.message}</div>`;
            return;
          }
          if (!profiles) return;
          this._adminUsers = profiles;
          this._renderAdminStats(profiles);
          this._renderAdminUsers(profiles);
        },

        _renderAdminStats(profiles) {
          const now = new Date();
          const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const ativos = profiles.filter(
            (p) => p.status === "ativo" && p.plano === "ativo",
          ).length;
          const trial = profiles.filter(
            (p) => p.plano === "free" && p.status === "ativo",
          ).length;
          const expirando = profiles.filter((p) => {
            if (!p.trial_expires_at) return false;
            const exp = new Date(p.trial_expires_at);
            return exp > now && exp <= in7;
          }).length;
          const el = (id, v) => {
            const e = document.getElementById(id);
            if (e) e.textContent = v;
          };
          el("admin-total", profiles.length);
          el("admin-ativos", ativos);
          el("admin-trial", trial);
          el("admin-expirando", expirando);
        },

        _renderAdminUsers(profiles) {
          const el = document.getElementById("admin-users-list");
          if (!el) return;
          if (!profiles.length) {
            el.innerHTML =
              '<div style="text-align:center;padding:20px;color:var(--grey);font-size:13px;">Nenhum usuário encontrado.</div>';
            return;
          }
          const now = new Date();
          el.innerHTML = profiles
            .map((p) => {
              const exp = p.trial_expires_at
                ? new Date(p.trial_expires_at)
                : null;
              const diasRestantes = exp
                ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
                : null;
              const statusColor =
                p.status === "ativo"
                  ? "var(--green)"
                  : p.status === "suspenso"
                    ? "var(--amber)"
                    : "var(--red)";
              const planoLabel =
                p.plano === "ativo"
                  ? "Pago"
                  : p.plano === "free"
                    ? `Trial${diasRestantes !== null ? ` (${diasRestantes}d)` : ""}`
                    : p.plano;
              return `<div style="padding:12px 0;border-bottom:1px solid var(--grey-xl);" data-email="${(p.email || "").toLowerCase()}" data-status="${p.plano || "free"}">
            <div class="flex justify-between items-start" style="gap:8px;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${FarolHelpers.escapeHtml(p.nome || "—")}</div>
                <div style="font-size:11px;color:var(--grey);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${FarolHelpers.escapeHtml(p.email || "—")}</div>
                <div style="font-size:11px;color:var(--grey);margin-top:2px;">Cadastro: ${p.criado_em ? new Date(p.criado_em).toLocaleDateString("pt-BR") : "—"}</div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:11px;font-weight:700;color:${statusColor};">${p.status?.toUpperCase() || "—"}</div>
                <div style="font-size:11px;color:var(--grey);">${planoLabel}</div>
              </div>
            </div>
            <div class="flex gap-6" style="margin-top:8px;flex-wrap:wrap;">
              <button onclick="App.adminExtendTrial('${p.id}',30)" style="font-size:11px;padding:4px 8px;background:var(--teal);color:#fff;border:none;border-radius:6px;cursor:pointer;">+30 dias</button>
              <button onclick="App.adminExtendTrial('${p.id}',90)" style="font-size:11px;padding:4px 8px;background:var(--teal);color:#fff;border:none;border-radius:6px;cursor:pointer;">+90 dias</button>
              <button onclick="App.adminSetPlan('${p.id}','ativo')" style="font-size:11px;padding:4px 8px;background:var(--green);color:#fff;border:none;border-radius:6px;cursor:pointer;">Ativar</button>
              <button onclick="App.adminToggleSuspend('${p.id}','${p.status}')" style="font-size:11px;padding:4px 8px;background:${p.status === "suspenso" ? "var(--green)" : "var(--amber)"};color:#fff;border:none;border-radius:6px;cursor:pointer;">${p.status === "suspenso" ? "Reativar" : "Suspender"}</button>
              <button onclick="App.adminDeleteUser('${p.id}','${FarolHelpers.escapeHtml(p.email || "")}')" style="font-size:11px;padding:4px 8px;background:var(--red);color:#fff;border:none;border-radius:6px;cursor:pointer;">Excluir</button>
            </div>
          </div>`;
            })
            .join("");
        },

        adminFilter() {
          const search = (
            document.getElementById("admin-search")?.value || ""
          ).toLowerCase();
          const status =
            document.getElementById("admin-filter-status")?.value || "";
          let filtered = this._adminUsers;
          if (search)
            filtered = filtered.filter(
              (p) =>
                (p.email || "").toLowerCase().includes(search) ||
                (p.nome || "").toLowerCase().includes(search),
            );
          if (status) filtered = filtered.filter((p) => p.plano === status);
          this._renderAdminUsers(filtered);
          this._renderAdminStats(filtered);
        },

        async adminExtendTrial(userId, days) {
          const { data: prof } = await supa
            .from("profiles")
            .select("trial_expires_at")
            .eq("id", userId)
            .single();
          const base = prof?.trial_expires_at
            ? new Date(prof.trial_expires_at)
            : new Date();
          if (base < new Date()) base.setTime(new Date().getTime());
          base.setDate(base.getDate() + days);
          const { data: updated, error } = await supa
            .from("profiles")
            .update({ trial_expires_at: base.toISOString() })
            .eq("id", userId)
            .select("id");
          if (error) {
            this.toast("Erro ao estender trial: " + error.message);
            return;
          }
          if (!updated || updated.length === 0) {
            this.toast(
              "Nada foi alterado (provável bloqueio de permissão/RLS no banco).",
            );
            return;
          }
          this.toast(`Trial estendido por ${days} dias!`);
          setTimeout(() => this.loadAdmin(), 500);
        },

        async adminSetPlan(userId, plano) {
          const { data: updated, error } = await supa
            .from("profiles")
            .update({ plano, status: "ativo" })
            .eq("id", userId)
            .select("id");
          if (error) {
            this.toast("Erro ao atualizar plano: " + error.message);
            return;
          }
          if (!updated || updated.length === 0) {
            this.toast(
              "Nada foi alterado (provável bloqueio de permissão/RLS no banco).",
            );
            return;
          }
          this.toast("Plano atualizado!");
          setTimeout(() => this.loadAdmin(), 500);
        },

        async adminToggleSuspend(userId, currentStatus) {
          const newStatus = currentStatus === "suspenso" ? "ativo" : "suspenso";
          const { data: updated, error } = await supa
            .from("profiles")
            .update({ status: newStatus })
            .eq("id", userId)
            .select("id");
          if (error) {
            this.toast("Erro: " + error.message);
            return;
          }
          if (!updated || updated.length === 0) {
            this.toast(
              "Nada foi alterado (provável bloqueio de permissão/RLS no banco).",
            );
            return;
          }
          this.toast(
            newStatus === "suspenso"
              ? "Usuário suspenso."
              : "Usuário reativado!",
          );
          setTimeout(() => this.loadAdmin(), 500);
        },

        async adminDeleteUser(userId, email) {
          if (
            !confirm(
              `Excluir permanentemente o usuário ${email}? Todos os dados serão apagados.`,
            )
          )
            return;
          // Apaga dados do workspace do usuário
          const { data: ws } = await supa
            .from("workspaces")
            .select("id")
            .eq("owner_id", userId)
            .maybeSingle();
          if (ws) {
            await supa.from("gastos").delete().eq("workspace_id", ws.id);
            await supa.from("entradas").delete().eq("workspace_id", ws.id);
            await supa
              .from("separacoes_mes")
              .delete()
              .eq("workspace_id", ws.id);
            await supa.from("ciclos").delete().eq("workspace_id", ws.id);
            await supa.from("gastos_fixos").delete().eq("user_id", userId);
            await supa
              .from("workspace_members")
              .delete()
              .eq("workspace_id", ws.id);
            await supa.from("workspaces").delete().eq("id", ws.id);
          }
          await supa.from("profiles").delete().eq("id", userId);
          this.toast("Usuário excluído.");
          setTimeout(() => this.loadAdmin(), 500);
        },

        async redefinirSenha() {
          if (!supa || !CloudSync.session) return;
          const email = CloudSync.session.user.email;
          const { error } = await supa.auth.resetPasswordForEmail(email, {
            redirectTo:
              "https://meu-mes-controle.praticaformatacao.workers.dev",
          });
          if (error) {
            this.toast("Erro: " + error.message);
            return;
          }
          this.toast("Link enviado para " + email + "!");
        },

        // Pull periódico a cada 5 minutos (padrão apps financeiros)
        startPeriodicSync() {
          if (this._periodicTimer) clearInterval(this._periodicTimer);
          this._periodicTimer = setInterval(
            async () => {
              if (CloudSync.status === "connected" && !CloudSync._syncing) {
                await CloudSync.pull();
                // Re-renderiza tela atual silenciosamente
                if (this.currentScreen && Screens[this.currentScreen]) {
                  const el = document.getElementById("screen-content");
                  if (el) el.innerHTML = Screens[this.currentScreen]();
                }
              }
            },
            5 * 60 * 1000,
          );
        },

        async desativarConta() {
          if (
            !confirm(
              "Desativar sua conta? Você não conseguirá mais acessar o app, mas seus dados serão preservados.",
            )
          )
            return;
          if (!supa || !CloudSync.session) return;
          const uid = CloudSync.session.user.id;
          await supa
            .from("profiles")
            .update({ status: "suspenso" })
            .eq("id", uid);
          this.toast("Conta desativada.");
          setTimeout(() => this.logout(), 1500);
        },

        async excluirConta() {
          if (
            !confirm(
              "Excluir sua conta permanentemente? Todos os seus dados serão apagados e não poderão ser recuperados.",
            )
          )
            return;
          if (!confirm("Tem certeza? Esta ação é irreversível.")) return;
          if (!supa || !CloudSync.session) return;
          const uid = CloudSync.session.user.id;
          const wsId = Store.get("workspaceId");
          // Apaga dados do workspace
          if (wsId) {
            await supa.from("gastos").delete().eq("workspace_id", wsId);
            await supa.from("entradas").delete().eq("workspace_id", wsId);
            await supa.from("separacoes_mes").delete().eq("workspace_id", wsId);
            await supa.from("ciclos").delete().eq("workspace_id", wsId);
            await supa.from("gastos_fixos").delete().eq("user_id", uid);
            await supa
              .from("workspace_members")
              .delete()
              .eq("workspace_id", wsId);
            await supa.from("workspaces").delete().eq("id", wsId);
          }
          await supa.from("profiles").delete().eq("id", uid);
          await supa.auth.signOut();
          Store.clearLocal();
          this.toast("Conta excluída.");
          setTimeout(() => location.reload(), 1500);
        },

        logout() {
          if (this._periodicPull) {
            clearInterval(this._periodicPull);
            this._periodicPull = null;
          }
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-confirm";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(400px,92vw);";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Sair do sistema</div><div class="modal-subtitle">Você precisará entrar novamente com seu e-mail e senha para acessar seus dados.</div></div><button class="modal-close" onclick="this.closest('.overlay').remove()">&#x00D7;</button></div><div class="modal-actions"><button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button><button class="btn btn-danger" onclick="App.confirmLogout()">Sair</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },

        async confirmLogout() {
          document.getElementById("modal-overlay-confirm")?.remove();
          await CloudSync.signOut();
          document.getElementById("app-layout").classList.add("hidden");
          const sc = document.getElementById("screen-content");
          if (sc) sc.innerHTML = "";
          // Limpa estado local para não misturar com a próxima conta
          Store.data = {
            user: null,
            recebimentos: [],
            objetivos: [],
            parcelas: [],
            ciclos: {},
            compromisso: "",
            categorias: [
              {
                id: "E",
                nome: "Essencial",
                cor: "var(--cat-e)",
                bg: "var(--cat-e-t)",
              },
              {
                id: "P",
                nome: "Compromissos",
                cor: "var(--cat-p)",
                bg: "var(--cat-p-t)",
              },
              {
                id: "V",
                nome: "Variável",
                cor: "var(--cat-v)",
                bg: "var(--cat-v-t)",
              },
              {
                id: "F",
                nome: "Construção",
                cor: "var(--cat-f)",
                bg: "var(--cat-f-t)",
              },
            ],
            planoContas: {},
            gastosFixos: [],
            modoLancamento: "simples",
            separacaoSugestoes: [
              "Dízimo",
              "Oferta",
              "Reserva de emergência",
              "Investimento",
              "Ajuda familiar",
            ],
            cartoes: [],
          };
          Store.save();
          Login.show();
          Login.switchMode("signin");
        },

        // ── Workspace: carregar membros ──────────────────────────────
        async loadMembers() {
          const el = document.getElementById("members-list");
          if (!el || !supa) return;
          const wsId = Store.get("workspaceId");
          const isAdmin = Store.get("is_admin");
          const uid = this.session?.user?.id;
          if (!wsId) {
            el.innerHTML =
              '<div style="font-size:13px;color:var(--grey);">Workspace não encontrado.</div>';
            return;
          }
          let query = supa
            .from("workspace_members")
            .select("id,invited_email,role,status,accepted_at,invited_by")
            .eq("workspace_id", wsId)
            .neq("status", "removed");
          // Usuário comum só vê os convites que ele mesmo fez
          if (!isAdmin) query = query.eq("invited_by", uid);
          const { data: members } = await query;

          // Atualiza estado do formulário de convite (limite de 1 ativo por usuário comum)
          const wrap = document.getElementById("invite-form-wrap");
          if (wrap && !isAdmin) {
            const temConviteAtivo = (members || []).some(
              (m) => m.status === "pending" || m.status === "active",
            );
            if (temConviteAtivo) {
              wrap.innerHTML =
                '<div style="font-size:13px;color:var(--grey);">Você já utilizou seu convite. Remova-o para convidar outra pessoa.</div>';
            } else {
              wrap.innerHTML = `
                <input id="invite-email" type="email" class="form-input" placeholder="email@exemplo.com" style="flex:1;min-width:180px;font-size:14px;padding:10px 12px;">
                <button class="btn btn-primary btn-sm" onclick="App.inviteMember()">Convidar</button>`;
            }
          }

          if (!members || !members.length) {
            el.innerHTML =
              '<div style="font-size:13px;color:var(--grey);">Nenhum membro convidado ainda.</div>';
            return;
          }
          el.innerHTML = members
            .map(
              (m) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--grey-xl);">
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;color:var(--navy);">${FarolHelpers.escapeHtml(m.invited_email)}</div>
              <div style="font-size:11px;color:${m.status === "active" ? "var(--green)" : "var(--amber)"};">${m.status === "active" ? "Ativo" : "Convite pendente"}</div>
            </div>
            ${m.role !== "owner" && (isAdmin || m.invited_by === uid) ? `<button onclick="App.removeMember('${m.id}')" style="font-size:12px;color:var(--red);background:none;border:none;cursor:pointer;">Remover</button>` : ""}
          </div>`,
            )
            .join("");
        },

        async inviteMember() {
          const email = (document.getElementById("invite-email")?.value || "")
            .trim()
            .toLowerCase();
          const msg = document.getElementById("invite-msg");
          if (!email || !email.includes("@")) {
            if (msg)
              ((msg.style.color = "var(--red)"),
                (msg.textContent = "Email inválido."));
            return;
          }
          const wsId = Store.get("workspaceId");
          if (!wsId) {
            if (msg) msg.textContent = "Workspace não encontrado.";
            return;
          }
          const isAdmin = Store.get("is_admin");
          const uid = this.session?.user?.id;

          // Usuário comum: limite de 1 convite ativo por vez
          if (!isAdmin) {
            const { data: meusConvites } = await supa
              .from("workspace_members")
              .select("id,status")
              .eq("workspace_id", wsId)
              .eq("invited_by", uid)
              .in("status", ["pending", "active"]);
            if (meusConvites && meusConvites.length > 0) {
              if (msg)
                ((msg.style.color = "var(--red)"),
                  (msg.textContent =
                    "Você já tem um convite ativo. Remova-o antes de convidar outra pessoa."));
              return;
            }
          }

          if (msg) msg.textContent = "Enviando convite…";
          const { error } = await supa.from("workspace_members").upsert(
            {
              workspace_id: wsId,
              invited_email: email,
              invited_by: uid,
              role: "member",
              status: "pending",
            },
            { onConflict: "workspace_id,invited_email" },
          );
          if (error) {
            if (msg)
              ((msg.style.color = "var(--red)"),
                (msg.textContent = "Erro: " + error.message));
            return;
          }
          if (msg)
            ((msg.style.color = "var(--green)"),
              (msg.textContent =
                "Convite registrado! Peça para " +
                email +
                " criar uma conta com este email."));
          const emailInput = document.getElementById("invite-email");
          if (emailInput) emailInput.value = "";
          setTimeout(() => this.loadMembers(), 500);
        },

        async removeMember(memberId) {
          if (!confirm("Remover este membro?")) return;
          const isAdmin = Store.get("is_admin");
          const uid = this.session?.user?.id;
          let query = supa
            .from("workspace_members")
            .update({ status: "removed" })
            .eq("id", memberId);
          // Usuário comum só pode remover convite que ele mesmo fez
          if (!isAdmin) query = query.eq("invited_by", uid);
          await query;
          this.loadMembers();
        },

        async cloudPush() {
          this.toast("Enviando dados…");
          const r = await CloudSync.push();
          this.toast(r.ok ? "Dados enviados!" : "Falha: " + (r.msg || ""));
          this.go("nuvem");
        },

        async cloudPull() {
          this.toast("Buscando dados da nuvem…");
          const r = await CloudSync.pull();
          if (r.ok) {
            this.toast("Dados restaurados!");
            setTimeout(() => this.go("dashboard"), 800);
          } else {
            this.toast("Falha: " + (r.msg || ""));
          }
          this.go("nuvem");
        },

        // ─── Marcar/desmarcar lançamento como pago ────────────
        toggleGastoPago(key, idx) {
          const ciclos = Store.get("ciclos") || {};
          const g = ciclos[key]?.gastos?.[idx];
          if (!g) return;
          g.pago = !g.pago;
          g.pagoEm = g.pago
            ? new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                .toISOString()
                .split("T")[0]
            : null;
          Store.set("ciclos", ciclos);
          this.go(this.currentScreen);
        },

        // ─── Edição inline de valor ────────────────────────
        editarValorGasto(key, idx) {
          const ciclos = Store.get("ciclos") || {};
          const g = ciclos[key]?.gastos?.[idx];
          if (!g) return;
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-editar";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(360px,92vw);";
          modal.innerHTML = `
          <div class="modal-header">
            <div><div class="modal-title">Editar valor</div><div class="modal-subtitle">${FarolHelpers.escapeHtml(g.descricao)}</div></div>
            <button class="modal-close" onclick="this.closest('.overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="label">Novo valor</label>
              <div class="input-money"><span>R$</span><input id="editar-valor-input" class="form-input" type="number" step="0.01" min="0" value="${g.valor}" placeholder="0,00"></div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button>
            <button class="btn btn-primary" onclick="App.confirmarEditarValor('${key}',${idx})">Salvar</button>
          </div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
          setTimeout(() => {
            const inp = document.getElementById("editar-valor-input");
            if (inp) {
              inp.focus();
              inp.select();
            }
          }, 80);
        },

        confirmarEditarValor(key, idx) {
          const novoValor = parseFloat(
            document.getElementById("editar-valor-input")?.value || 0,
          );
          if (!novoValor || novoValor <= 0) {
            this.toast("Digite um valor válido");
            return;
          }
          const ciclos = Store.get("ciclos") || {};
          if (ciclos[key]?.gastos?.[idx]) {
            ciclos[key].gastos[idx].valor = novoValor;
            Store.set("ciclos", ciclos);
            document.getElementById("modal-overlay-editar")?.remove();
            this.toast("Valor atualizado!");
            this.go(this.currentScreen);
          }
        },

        // ───Copiar mês anterior ────────────────────────────
        copiarMesAnterior() {
          const key = this.getActiveCycleKey();
          const anteriorKey = FarolHelpers.shiftMonthKey(key, -1);
          const ciclos = Store.get("ciclos") || {};
          const anterior = ciclos[anteriorKey];
          const atual = ciclos[key] || {
            renda: 0,
            gastos: [],
            decisao: "",
            fontes: [],
          };
          if (!anterior || !anterior.gastos || anterior.gastos.length === 0) {
            this.toast("Mês anterior sem lançamentos para copiar.");
            return;
          }
          const jaTemGastos = atual.gastos && atual.gastos.length > 0;
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay-copiar";
          overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
          };
          const modal = document.createElement("div");
          modal.className = "modal";
          modal.style.cssText = "width:min(440px,92vw);";
          const mesAnteriorLabel = FarolHelpers.monthLabelByKey(anteriorKey);
          modal.innerHTML = `
          <div class="modal-header">
            <div><div class="modal-title">Copiar mês anterior</div><div class="modal-subtitle">Copiar ${anterior.gastos.length} lançamento(s) de ${mesAnteriorLabel}</div></div>
            <button class="modal-close" onclick="this.closest('.overlay').remove()">×</button>
          </div>
          <div class="modal-body">
            ${jaTemGastos ? `<div class="box" style="background:var(--amb-t);border:1px solid rgba(183,110,18,.2);padding:12px 14px;border-radius:var(--r);margin-bottom:14px;"><p style="font-size:13px;color:var(--amber);margin:0;"><strong>Atenção:</strong> O mês atual já tem ${atual.gastos.length} lançamento(s). A cópia será adicionada por cima.</p></div>` : ""}
            <div style="max-height:200px;overflow-y:auto;">
              ${anterior.gastos
                .slice(0, 20)
                .map(
                  (g) =>
                    `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--grey-xl);font-size:13px;"><span style="color:var(--navy);font-weight:600;">${FarolHelpers.escapeHtml(g.descricao)}</span><span style="color:var(--grey);font-weight:700;">${Calc.fmt(g.valor)}</span></div>`,
                )
                .join("")}
              ${anterior.gastos.length > 20 ? `<div style="font-size:12px;color:var(--grey);padding-top:8px;text-align:center;">+${anterior.gastos.length - 20} lançamentos...</div>` : ""}
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Cancelar</button>
            <button class="btn btn-primary" onclick="App.confirmarCopiarMes('${key}','${anteriorKey}')">Copiar ${anterior.gastos.length} lançamento(s)</button>
          </div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
        },

        confirmarCopiarMes(key, anteriorKey) {
          document.getElementById("modal-overlay-copiar")?.remove();
          const ciclos = Store.get("ciclos") || {};
          const anterior = ciclos[anteriorKey];
          if (!anterior?.gastos) return;
          if (!ciclos[key])
            ciclos[key] = { renda: 0, gastos: [], decisao: "", fontes: [] };
          // copiar apenas gastos sem templateId (avulsos) e os templates que ainda estão ativos
          // Para não duplicar os gerados pelo syncRecurring
          const [y, m] = key.split("-").map(Number);
          anterior.gastos.forEach((g) => {
            if (g.templateId) return; // recorrentes já são gerados por syncRecurring
            const jaExiste = ciclos[key].gastos.some(
              (x) => x.descricao === g.descricao && x.valor === g.valor,
            );
            if (!jaExiste) {
              const dia = g.data ? g.data.split("-")[2] : "01";
              const novaData = `${y}-${String(m + 1).padStart(2, "0")}-${dia}`;
              ciclos[key].gastos.push({
                ...g,
                data: novaData,
                templateId: undefined,
              });
            }
          });
          Store.set("ciclos", ciclos);
          this.toast(
            `${anterior.gastos.filter((g) => !g.templateId).length} lançamento(s) copiado(s)!`,
          );
          this.go(this.currentScreen);
        },

        // ─── Alternar modo de lançamento ───────────────────
        alternarModoLancamento() {
          const atual = Store.get("modoLancamento") || "simples";
          const novo = atual === "simples" ? "detalhado" : "simples";
          Store.set("modoLancamento", novo);
          this.toast(
            novo === "simples"
              ? "Modo simplificado ativado"
              : "Modo detalhado ativado",
          );
          this.go("meumes");
        },

        toggleSidebar() {
          const s = document.getElementById("sidebar");
          const b = document.getElementById("sidebar-backdrop");
          const willOpen = !s.classList.contains("open");
          s.classList.toggle("open", willOpen);
          b.classList.toggle("open", willOpen);
          if (window.innerWidth <= 1024) {
            if (willOpen) {
              this._scrollY = window.scrollY || window.pageYOffset || 0;
              document.body.classList.add("sidebar-open");
              document.body.style.top = `-${this._scrollY}px`;
            } else {
              document.body.classList.remove("sidebar-open");
              document.body.style.top = "";
              window.scrollTo(0, this._scrollY || 0);
            }
          }
        },
        closeSidebar() {
          const wasOpen = document
            .getElementById("sidebar")
            ?.classList.contains("open");
          document.getElementById("sidebar")?.classList.remove("open");
          document.getElementById("sidebar-backdrop")?.classList.remove("open");
          if (wasOpen && document.body.classList.contains("sidebar-open")) {
            document.body.classList.remove("sidebar-open");
            document.body.style.top = "";
            window.scrollTo(0, this._scrollY || 0);
          }
        },

        // Goal funding modal
        openGoalFundingModal(idx) {
          const objs = Store.get("objetivos") || [];
          const obj = objs[idx];
          if (!obj) {
            this.toast("Objetivo não encontrado");
            return;
          }
          const key = Calc.cicloAtual();
          const mes = Calc.getCiclo(key);
          const disponivel = Math.max(
            Calc.rendaNoMes(mes) - Calc.totalGastos(mes.gastos || []),
            0,
          );
          const restante = Math.max((obj.valor || 0) - (obj.valorPago || 0), 0);
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay";
          overlay.onclick = (e) => {
            if (e.target === overlay) this.closeModal();
          };
          const modal = document.createElement("div");
          modal.className = "modal panel-modal";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Aplicar valor ao objetivo</div><div class="modal-subtitle">Direcione o disponível com clareza.</div></div><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div class="modal-body">
          <div class="goal-spotlight mb-16"><div class="goal-headline"><div><div class="obj-name">${FarolHelpers.escapeHtml(obj.nome)}</div><div class="obj-meta">${FarolHelpers.goalStatus(obj)}</div></div><span class="obj-priority ${obj.prioridade || "media"}">${obj.prioridade || "média"}</span></div><div class="goal-inline-progress"><div class="progress-wrap" style="flex:1;"><div class="progress-bar" style="width:${Calc.objPct(obj)}%;"></div></div><strong>${Math.round(Calc.objPct(obj))}%</strong></div></div>
          <div class="funding-availability"><div class="funding-box good"><div class="tag">Disponível no mês</div><div class="amount">${Calc.fmt(disponivel)}</div></div><div class="funding-box target"><div class="tag">Falta para concluir</div><div class="amount">${Calc.fmt(restante)}</div></div></div>
          <div class="form-group"><label class="label">Quanto aplicar</label><input id="goal-funding-value" class="form-input" type="number" min="0" step="0.01" value="${Math.min(disponivel, restante) || ""}" placeholder="0,00"></div>
        </div>
        <div class="modal-actions"><button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button><button class="btn btn-gold" onclick="App.confirmGoalFunding(${idx})">Confirmar →</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
          setTimeout(
            () => document.getElementById("goal-funding-value")?.focus(),
            80,
          );
        },

        async confirmGoalFunding(idx) {
          const objs = Store.get("objetivos") || [];
          if (!objs[idx]) return;
          const key = Calc.cicloAtual();
          const mes = Calc.getCiclo(key);
          const disponivel = Math.max(
            Calc.rendaNoMes(mes) - Calc.totalGastos(mes.gastos || []),
            0,
          );
          const restante = Math.max(
            (objs[idx].valor || 0) - (objs[idx].valorPago || 0),
            0,
          );
          const valor = parseFloat(
            document.getElementById("goal-funding-value")?.value || 0,
          );
          if (!valor || valor <= 0) {
            this.toast("Digite um valor válido");
            return;
          }
          if (valor > disponivel) {
            this.toast("Valor maior do que o disponível");
            return;
          }
          objs[idx].valorPago =
            (objs[idx].valorPago || 0) + Math.min(valor, restante || valor);
          Store.set("objetivos", objs);

          // Sincronizar valor_atual atualizado com o banco
          if (supa && objs[idx].id && CloudSync.session) {
            const wsId = Store.get("workspaceId");
            const { error } = await supa
              .from("objetivos")
              .update({ valor_atual: objs[idx].valorPago })
              .eq("id", objs[idx].id)
              .eq("workspace_id", wsId);
            if (error)
              console.error("Erro ao atualizar valor_atual no banco:", error);
          }

          this.closeModal();
          this.toast("✅ Valor aplicado!");
          this.go("objetivos");
        },

        openGoalEditModal(idx) {
          const objs = Store.get("objetivos") || [];
          const obj = objs[idx];
          if (!obj) return;
          const overlay = document.createElement("div");
          overlay.className = "overlay center";
          overlay.id = "modal-overlay";
          overlay.onclick = (e) => {
            if (e.target === overlay) this.closeModal();
          };
          const modal = document.createElement("div");
          modal.className = "modal panel-modal";
          modal.innerHTML = `<div class="modal-header"><div><div class="modal-title">Editar objetivo</div></div><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="label">Nome</label><input id="goal-edit-name" class="form-input" value="${FarolHelpers.escapeHtml(obj.nome)}"></div>
          <div class="funding-availability"><div class="form-group" style="margin:0;"><label class="label">Valor da meta</label><input id="goal-edit-target" class="form-input" type="number" step="0.01" value="${obj.valor || 0}"></div><div class="form-group" style="margin:0;"><label class="label">Valor acumulado</label><input id="goal-edit-paid" class="form-input" type="number" step="0.01" value="${obj.valorPago || 0}"></div></div>
          <div class="funding-availability"><div class="form-group" style="margin:0;"><label class="label">Prazo</label><input id="goal-edit-deadline" class="form-input" type="month" value="${obj.prazo ? String(obj.prazo).slice(0, 7) : ""}"></div><div class="form-group" style="margin:0;"><label class="label">Prioridade</label><select id="goal-edit-priority" class="form-select"><option value="alta" ${obj.prioridade === "alta" ? "selected" : ""}>Alta</option><option value="media" ${obj.prioridade === "media" ? "selected" : ""}>Média</option><option value="baixa" ${obj.prioridade === "baixa" ? "selected" : ""}>Baixa</option></select></div></div>
        </div>
        <div class="modal-actions"><button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="App.saveGoalEdit(${idx})">Salvar</button></div>`;
          overlay.appendChild(modal);
          document.getElementById("overlay-container").appendChild(overlay);
          setTimeout(
            () => document.getElementById("goal-edit-name")?.focus(),
            80,
          );
        },

        async saveGoalEdit(idx) {
          const objs = Store.get("objetivos") || [];
          if (!objs[idx]) return;
          const nome = document.getElementById("goal-edit-name")?.value?.trim();
          const valor = parseFloat(
            document.getElementById("goal-edit-target")?.value || 0,
          );
          const pago = parseFloat(
            document.getElementById("goal-edit-paid")?.value || 0,
          );
          const prazo = document.getElementById("goal-edit-deadline")?.value;
          const prio =
            document.getElementById("goal-edit-priority")?.value || "media";
          if (!nome) {
            this.toast("Nome obrigatório");
            return;
          }
          if (!valor || valor <= 0) {
            this.toast("Valor obrigatório");
            return;
          }

          try {
            // Atualizar localmente
            objs[idx] = {
              ...objs[idx],
              nome,
              valor,
              valorPago: Math.max(pago, 0),
              prazo: prazo ? `${prazo}-01` : objs[idx].prazo,
              prioridade: prio,
            };
            objs.sort(
              (a, b) =>
                ({ alta: 0, media: 1, baixa: 2 })[a.prioridade] -
                { alta: 0, media: 1, baixa: 2 }[b.prioridade],
            );
            Store.set("objetivos", objs);

            // Atualizar no Supabase se tiver ID
            if (supa && objs[idx].id && CloudSync.session) {
              const wsId = Store.get("workspaceId");
              const { error } = await supa
                .from("objetivos")
                .update({
                  nome: nome,
                  valor_meta: valor,
                  valor_atual: Math.max(pago, 0),
                  prazo: prazo ? `${prazo}-01` : null,
                  concluido: objs[idx].concluido || false,
                  prioridade: prio,
                })
                .eq("id", objs[idx].id)
                .eq("workspace_id", wsId);

              if (error) {
                console.error("Erro ao atualizar no banco:", error);
                this.toast("⚠️ Atualizado localmente, erro ao sincronizar");
              } else {
                this.toast("✅ Objetivo atualizado!");
              }
            } else {
              this.toast("Objetivo atualizado (modo offline)");
            }

            this.closeModal();
            this.go("objetivos");
          } catch (err) {
            console.error("Erro ao editar objetivo:", err);
            this.toast("❌ Erro ao atualizar");
          }
        },

        applySobraToGoal(idx) {
          this.openGoalFundingModal(idx);
        },
      };

      // Medal icon renderer
      function getMedalSvg(iconName, size, color) {
        var paths = {
          leaf: '<path d="M17 8C8 10 5.9 16.17 3.82 22"/><path d="M3.82 22c2-5 5.5-8 11.18-8c2 0 4.82-1 6-4"/>',
          calendar:
            '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
          check: '<polyline points="20 6 9 17 4 12"/>',
          save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
          target:
            '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
          trophy:
            '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 17 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
          chart:
            '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
          star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
          unlock:
            '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
          shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        };
        var lockPath =
          '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
        var p = paths[iconName] || paths["star"];
        return (
          '<svg width="' +
          size +
          '" height="' +
          size +
          '" viewBox="0 0 24 24" fill="none" stroke="' +
          color +
          '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          p +
          "</svg>"
        );
      }
      function getMedalLockSvg(size) {
        return (
          '<svg width="' +
          size +
          '" height="' +
          size +
          '" viewBox="0 0 24 24" fill="none" stroke="#9FB0C0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
        );
      }
