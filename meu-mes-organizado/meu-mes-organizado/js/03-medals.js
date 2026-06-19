// ═══════════════════════════════════════════════════════
      // MEDALS SYSTEM
      // ═══════════════════════════════════════════════════════
      const Medals = {
        definitions: [
          {
            id: "primeiro_passo",
            icon: "check",
            name: "Primeiro Passo",
            desc: "Você registrou seu primeiro gasto. A consciência começa aqui.",
            tier: "bronze",
            check: () => {
              const c = Store.get("ciclos") || {};
              return Object.values(c).some(
                (m) => m.gastos && m.gastos.length > 0,
              );
            },
          },
          {
            id: "mes_completo",
            icon: "calendar",
            name: "Mês Completo",
            desc: "Concluiu um mês com renda e gastos registrados.",
            tier: "silver",
            check: () => {
              const c = Store.get("ciclos") || {};
              return Object.values(c).some(
                (m) =>
                  (m.renda || Calc.rendaNoMes(m)) > 0 &&
                  m.gastos &&
                  m.gastos.length > 0,
              );
            },
          },
          {
            id: "sinal_verde",
            icon: "chart",
            name: "Sinal Verde",
            desc: "Fechou um mês com sobra acima de 10% da renda.",
            tier: "gold",
            check: () => {
              const c = Store.get("ciclos") || {};
              return Object.values(c).some((m) => {
                const r = Calc.rendaNoMes(m);
                return r > 0 && Calc.pctSobra(r, m.gastos || []) >= 10;
              });
            },
          },
          {
            id: "meta_criada",
            icon: "target",
            name: "Meta Criada",
            desc: "Definiu seu primeiro objetivo financeiro.",
            tier: "bronze",
            check: () => (Store.get("objetivos") || []).length > 0,
          },
          {
            id: "meta_alcancada",
            icon: "trophy",
            name: "Meta Alcançada",
            desc: "Concluiu um objetivo com 100% do valor atingido.",
            tier: "gold",
            check: () =>
              (Store.get("objetivos") || []).some((o) => Calc.objPct(o) >= 100),
          },
          {
            id: "tres_meses",
            icon: "calendar",
            name: "3 Meses de Dados",
            desc: "Registrou 3 meses consecutivos com renda.",
            tier: "silver",
            check: () => {
              const c = Store.get("ciclos") || {};
              return (
                Object.values(c).filter((m) => Calc.rendaNoMes(m) > 0).length >=
                3
              );
            },
          },
          {
            id: "meio_ano",
            icon: "calendar",
            name: "Meio Ano",
            desc: "Seis meses com dados registrados.",
            tier: "gold",
            check: () => {
              const c = Store.get("ciclos") || {};
              return (
                Object.values(c).filter((m) => Calc.rendaNoMes(m) > 0).length >=
                6
              );
            },
          },
          {
            id: "disciplina_total",
            icon: "star",
            name: "Disciplina Total",
            desc: "Doze meses com registros. Isso é hábito.",
            tier: "platinum",
            check: () => {
              const c = Store.get("ciclos") || {};
              return (
                Object.values(c).filter((m) => Calc.rendaNoMes(m) > 0).length >=
                12
              );
            },
          },
          {
            id: "liberdade",
            icon: "unlock",
            name: "Liberdade",
            desc: "Quitou uma parcela ou dívida registrada.",
            tier: "silver",
            check: () => {
              const p = Store.get("parcelas") || [];
              return p.some((x) => x.quitada);
            },
          },
          {
            id: "fiel_no_pouco",
            icon: "shield",
            name: "Fiel no Pouco",
            desc: "Registrou gastos e renda em pelo menos 5 meses.",
            tier: "gold",
            check: () => {
              const c = Store.get("ciclos") || {};
              return (
                Object.values(c).filter(
                  (m) =>
                    Calc.rendaNoMes(m) > 0 && m.gastos && m.gastos.length > 0,
                ).length >= 5
              );
            },
          },
          // ── Construção do futuro (dízimo, reserva, investimento, objetivos...) ──
          {
            id: "primeiro_passo_futuro",
            icon: "leaf",
            name: "Primeiro Passo para o Futuro",
            desc: "Separou um valor para o futuro pela primeira vez — dízimo, reserva, investimento ou objetivo.",
            tier: "bronze",
            check: () => {
              const ciclos = Store.get("ciclos") || {};
              return Object.keys(ciclos).some(
                (key) => Calc.diagnosticoCiclo(key).construcaoTotal > 0,
              );
            },
          },
          {
            id: "poupador",
            icon: "save",
            name: "Poupador",
            desc: "Separou algo para o futuro em 3 meses diferentes.",
            tier: "silver",
            check: () => {
              const ciclos = Store.get("ciclos") || {};
              return (
                Object.keys(ciclos).filter(
                  (key) => Calc.diagnosticoCiclo(key).construcaoTotal > 0,
                ).length >= 3
              );
            },
          },
          {
            id: "construtor",
            icon: "save",
            name: "Construtor",
            desc: "Separou algo para o futuro em 6 meses diferentes. Isso já é hábito.",
            tier: "gold",
            check: () => {
              const ciclos = Store.get("ciclos") || {};
              return (
                Object.keys(ciclos).filter(
                  (key) => Calc.diagnosticoCiclo(key).construcaoTotal > 0,
                ).length >= 6
              );
            },
          },
          {
            id: "legado",
            icon: "trophy",
            name: "Legado",
            desc: "Separou algo para o futuro em 12 meses diferentes. Um ano inteiro construindo.",
            tier: "platinum",
            check: () => {
              const ciclos = Store.get("ciclos") || {};
              return (
                Object.keys(ciclos).filter(
                  (key) => Calc.diagnosticoCiclo(key).construcaoTotal > 0,
                ).length >= 12
              );
            },
          },
          {
            id: "primeiro_mil",
            icon: "star",
            name: "Primeiro Mil",
            desc: "Acumulou R$ 1.000 separados para o futuro, somando todos os meses.",
            tier: "gold",
            check: () => Calc.totalSeparadoAcumulado() >= 1000,
          },
          {
            id: "reserva_robusta",
            icon: "shield",
            name: "Reserva Robusta",
            desc: "Acumulou R$ 5.000 separados para o futuro, somando todos os meses.",
            tier: "platinum",
            check: () => Calc.totalSeparadoAcumulado() >= 5000,
          },
        ],
        tierColors: {
          bronze: "#CD7F32",
          silver: "#A8A9AD",
          gold: "#FFD700",
          platinum: "#E5E4E2",
        },
        tierEmoji: { bronze: "B", silver: "P", gold: "O", platinum: "★" },
        getEarned() {
          return this.definitions.filter((m) => {
            try {
              return m.check();
            } catch (e) {
              return false;
            }
          });
        },
        isEarned(id) {
          const m = this.definitions.find((x) => x.id === id);
          if (!m) return false;
          try {
            return m.check();
          } catch (e) {
            return false;
          }
        },
        getProgress(id) {
          /* future: return 0-100 */ return 0;
        },
      };
