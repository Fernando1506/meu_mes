// ═══════════════════════════════════════════════════════
      // STORE
      // ═══════════════════════════════════════════════════════
      const Store = {
        data: {
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
        },
        load() {
          // Não usa mais localStorage — dados vêm do banco
          return this;
        },
        clearLocal() {
          try {
            localStorage.removeItem("farol_v3");
          } catch (e) {}
          this.data = {
            user: null,
            recebimentos: [],
            objetivos: [],
            parcelas: [],
            ciclos: {},
            compromisso: "",
            separacaoSugestoes: [
              "Dízimo",
              "Oferta",
              "Reserva de emergência",
              "Investimento",
              "Ajuda familiar",
            ],
            cartoes: [],
            planoContas: {},
            gastosFixos: [],
            modoLancamento: "simples",
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
        },
        save() {
          if (window.CloudSync) window.CloudSync.scheduleSync();
        },
        get(k) {
          return this.data[k];
        },
        set(k, v) {
          this.data[k] = v;
          this.save();
        },
      };
