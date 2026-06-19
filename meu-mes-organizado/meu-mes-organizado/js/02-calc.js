// ═══════════════════════════════════════════════════════
      // CALC
      // ═══════════════════════════════════════════════════════
      const Calc = {
        fmt(v) {
          return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(v || 0);
        },
        pct(v) {
          return Math.round(v || 0) + "%";
        },
        mesKey(ano, mes) {
          return `${ano}-${mes}`;
        },
        cicloAtual() {
          const n = new Date();
          return this.mesKey(n.getFullYear(), n.getMonth());
        },
        getCiclo(key) {
          const c = Store.get("ciclos");
          return c[key] || { renda: 0, gastos: [], decisao: "", fontes: [] };
        },
        totalGastos(g) {
          return (g || []).reduce((s, x) => s + (x.valor || 0), 0);
        },
        porCategoria(g) {
          return Store.get("categorias").map((c) => ({
            ...c,
            valor: (g || [])
              .filter((x) => x.categoria === c.id)
              .reduce((s, x) => s + x.valor, 0),
          }));
        },
        pctSobra(renda, gastos) {
          if (!renda) return 0;
          return ((renda - this.totalGastos(gastos)) / renda) * 100;
        },
        objPct(obj) {
          const p = obj.valorPago || 0;
          return Math.min((p / (obj.valor || 1)) * 100, 100);
        },
        rendaNoMes(c) {
          if (c && Array.isArray(c.fontes) && c.fontes.length)
            return c.fontes.reduce((s, f) => s + (parseFloat(f.valor) || 0), 0);
          return parseFloat((c && c.renda) || 0);
        },
        sumSeparacoesEntrada(f) {
          return (
            (f && Array.isArray(f.separacoes) ? f.separacoes : []) || []
          ).reduce((s, x) => {
            const bruto = parseFloat((f && f.valor) || 0) || 0;
            const tipo = (x && x.tipo) || "valor";
            const raw = parseFloat((x && x.valor) || 0) || 0;
            const val = tipo === "percentual" ? bruto * (raw / 100) : raw;
            return s + Math.max(0, val);
          }, 0);
        },
        baseEntrada(f) {
          const bruto = parseFloat((f && f.valor) || 0) || 0;
          return Math.max(0, bruto - this.sumSeparacoesEntrada(f));
        },
        totalSeparacoesNoMes(c) {
          return this.entradasNoMes(c).reduce(
            (s, f) => s + (f.totalSeparado || 0),
            0,
          );
        },
        baseRendaNoMes(c) {
          return this.entradasNoMes(c).reduce(
            (s, f) => s + (f.baseAposSeparacao || 0),
            0,
          );
        },
        entradasNoMes(c) {
          if (c && Array.isArray(c.fontes) && c.fontes.length)
            return c.fontes.map((f) => {
              const bruto = parseFloat((f && f.valor) || 0) || 0;
              const totalSeparado = this.sumSeparacoesEntrada(f);
              return {
                ...f,
                valor: bruto,
                separacoes: Array.isArray(f && f.separacoes)
                  ? f.separacoes
                  : [],
                totalSeparado,
                baseAposSeparacao: Math.max(0, bruto - totalSeparado),
              };
            });
          if (c && c.renda) {
            const bruto = parseFloat(c.renda) || 0;
            return [
              {
                origem: c.fonteRenda || "Entrada",
                valor: bruto,
                data: c.dataRenda || new Date().toISOString().split("T")[0],
                separacoes: [],
                totalSeparado: 0,
                baseAposSeparacao: bruto,
              },
            ];
          }
          return [];
        },
        totaisPorBloco(g) {
          g = g || [];
          return {
            consumo: g
              .filter((x) => x.categoria === "E" || x.categoria === "V")
              .reduce((s, x) => s + (x.valor || 0), 0),
            compromissos: g
              .filter((x) => x.categoria === "P")
              .reduce((s, x) => s + (x.valor || 0), 0),
            construcao: g
              .filter((x) => x.categoria === "F")
              .reduce((s, x) => s + (x.valor || 0), 0),
          };
        },
        sinal(pct) {
          if (pct < 0) return { tipo: "red", label: "Vermelho" };
          if (pct < 10) return { tipo: "amber", label: "Âmbar" };
          return { tipo: "verde", label: "Verde" };
        },
        // Gastos "virtuais": fatura em aberto (mês atual) + fatura prevista (mês do vencimento).
        cardVirtualGastos(key) {
          const cartoes = Store.get("cartoes") || [];
          const hoje = new Date().toISOString().split("T")[0];
          const result = [];

          // 1) Fatura em aberto — só aparece no mês atual
          if (key === this.cicloAtual()) {
            cartoes
              .filter((c) => (parseFloat(c.faturaAtual) || 0) > 0)
              .forEach((c) => {
                result.push({
                  descricao: `Fatura ${c.nome}`,
                  valor: parseFloat(c.faturaAtual) || 0,
                  categoria: "V",
                  data: hoje,
                  origem: "cartao-aberto",
                  cartaoId: c.id,
                  virtual: true,
                });
              });
          }

          // 2) Fatura prevista — aparece no mês da data de vencimento informada
          cartoes
            .filter(
              (c) =>
                c.faturaVencimento &&
                c.faturaVencimento.data &&
                (parseFloat(c.faturaVencimento.valor) || 0) > 0,
            )
            .forEach((c) => {
              const dataVenc = c.faturaVencimento.data; // "YYYY-MM-DD"
              const partes = dataVenc.split("-").map(Number);
              const mesKey = this.mesKey(partes[0], partes[1] - 1); // mês JS é 0-based
              if (mesKey === key) {
                result.push({
                  descricao: `Fatura ${c.nome}`,
                  valor: parseFloat(c.faturaVencimento.valor) || 0,
                  categoria: "V",
                  data: dataVenc,
                  origem: "cartao-previsto",
                  cartaoId: c.id,
                  virtual: true,
                });
              }
            });

          return result;
        },
        diagnosticoCiclo(key) {
          const c = typeof key === "string" ? this.getCiclo(key) : key || {};
          const rendaBruta = this.rendaNoMes(c);
          const rendaAposFonteSep = this.baseRendaNoMes(c);
          const gastosVirtuais =
            typeof key === "string" ? this.cardVirtualGastos(key) : [];
          const gastos = [...(c.gastos || []), ...gastosVirtuais];
          const total = this.totalGastos(gastos);
          const blocos = this.totaisPorBloco(gastos);
          // Separações registradas diretamente no mês (independente da entrada)
          const cicloSeparacoes = Array.isArray(c.separacoes)
            ? c.separacoes
            : [];
          const cicloSeparadoTotal = cicloSeparacoes.reduce(
            (s, x) => s + Math.max(0, parseFloat((x && x.valor) || 0) || 0),
            0,
          );
          const renda = Math.max(0, rendaAposFonteSep - cicloSeparadoTotal);
          const disponivel = renda - total;
          // Resumo combinado: separações da entrada (pague-se primeiro) + separações do mês
          const _catSep = (n) => {
            const nl = n.toLowerCase().trim();
            if (["dízimo", "dizimo"].includes(nl)) return "devolucao";
            if (["oferta", "ajuda familiar", "doação", "doacao"].includes(nl))
              return "oferta";
            const mem = Store.get("categorias_separacao") || {};
            return mem[nl] || "futuro";
          };
          const separacoesResumo = Object.values(
            this.entradasNoMes(c).reduce((acc, f) => {
              (f.separacoes || []).forEach((s) => {
                const nome = (s && s.nome) || "Separação";
                const raw = parseFloat((s && s.valor) || 0) || 0;
                const val =
                  (s && s.tipo) === "percentual"
                    ? (parseFloat(f.valor) || 0) * (raw / 100)
                    : raw;
                acc[nome] = acc[nome] || {
                  nome: nome,
                  valor: 0,
                  categoria: _catSep(nome),
                };
                acc[nome].valor += Math.max(0, val);
              });
              return acc;
            }, {}),
          );
          cicloSeparacoes.forEach((s) => {
            const nome = (s && s.nome) || "Separação";
            const val = Math.max(0, parseFloat((s && s.valor) || 0) || 0);
            let entry = separacoesResumo.find((x) => x.nome === nome);
            if (!entry) {
              entry = { nome, valor: 0, categoria: _catSep(nome) };
              separacoesResumo.push(entry);
            }
            entry.valor += val;
          });
          const fonteSeparadoTotal = Math.max(
            0,
            rendaBruta - rendaAposFonteSep,
          );
          const totalSeparado = fonteSeparadoTotal + cicloSeparadoTotal;
          // "Construção" combina categoria F (modo completo, oculto) + valores separados (entrada ou mês)
          const construcaoTotal = blocos.construcao + totalSeparado;
          const margemPct = renda > 0 ? (disponivel / renda) * 100 : 0;
          let status = {
            tipo: "amber",
            label: "Âmbar",
            titulo: "Ciclo ainda sem direção suficiente",
            resumo:
              "Você registrou o mês, mas ainda não transformou isso em construção real.",
          };
          if (!renda && !rendaBruta) {
            status = {
              tipo: "amber",
              label: "Sem base",
              titulo: "Falta registrar a renda",
              resumo:
                "Sem entrada registrada, a leitura do ciclo fica incompleta.",
            };
          } else if (disponivel < 0) {
            status = {
              tipo: "red",
              label: "Vermelho",
              titulo: "O mês fechou pressionado",
              resumo:
                "Você terminou acima da renda. O foco agora é recuperar margem e interromper vazamentos.",
            };
          } else if (construcaoTotal > 0 && disponivel === 0) {
            status = {
              tipo: "verde",
              label: "Verde",
              titulo: "Tudo foi direcionado com propósito",
              resumo:
                "Zerar o mês não é o problema quando houve construção. O ponto de atenção é manter alguma folga para imprevistos.",
            };
          } else if (construcaoTotal > 0 && disponivel > 0) {
            status = {
              tipo: "verde",
              label: "Verde",
              titulo: "Você construiu futuro neste ciclo",
              resumo:
                "Houve construção e ainda restou espaço de decisão. Esse é o tipo de mês que amadurece a vida financeira.",
            };
          } else if (disponivel === 0) {
            status = {
              tipo: "amber",
              label: "Âmbar",
              titulo: "Tudo foi consumido pelo presente",
              resumo:
                "Zerar o mês sem construir mantém você ocupado, mas não faz você avançar.",
            };
          } else {
            status = {
              tipo: "amber",
              label: "Âmbar",
              titulo: "Houve folga, mas faltou construção",
              resumo:
                "Sobrar e não direcionar é melhor do que faltar, mas ainda não é maturidade completa.",
            };
          }
          return {
            renda,
            rendaBruta,
            totalSeparado,
            separacoesResumo,
            construcaoTotal,
            gastos,
            total,
            blocos,
            disponivel,
            margemPct,
            status,
          };
        },
        alertasEstruturais(key) {
          const d = this.diagnosticoCiclo(key);
          const alerts = [];
          if (!d.renda) return alerts;
          if (d.disponivel < 0)
            alerts.push({
              tipo: "danger",
              titulo: "Saldo negativo",
              desc: "Você gastou mais do que recebeu. O primeiro objetivo é parar a sangria antes de pensar em acelerar.",
            });
          if (d.disponivel >= 0 && d.margemPct < 8)
            alerts.push({
              tipo: "warn",
              titulo: "Sem folga para imprevistos",
              desc: "O mês não ficou negativo, mas qualquer surpresa aperta sua estrutura.",
            });
          if (d.blocos.compromissos / d.renda > 0.3)
            alerts.push({
              tipo: "danger",
              titulo: "Compromissos altos",
              desc: `Compromissos consomem ${this.pct((d.blocos.compromissos / d.renda) * 100)} da renda. Isso reduz sua capacidade de decidir.`,
            });
          if (d.blocos.consumo / d.renda > 0.7)
            alerts.push({
              tipo: "warn",
              titulo: "Consumo muito pesado",
              desc: `Consumo está em ${this.pct((d.blocos.consumo / d.renda) * 100)} da renda. Sua margem está sendo engolida pelo presente.`,
            });
          const variavel = d.gastos
            .filter((x) => x.categoria === "V")
            .reduce((s, x) => s + (x.valor || 0), 0);
          if (variavel / d.renda > 0.25)
            alerts.push({
              tipo: "warn",
              titulo: "Variável elevado",
              desc: `O variável representa ${this.pct((variavel / d.renda) * 100)} da renda. Esse costuma ser o corte mais rápido.`,
            });
          if (d.blocos.construcao === 0 && d.construcaoTotal === 0)
            alerts.push({
              tipo: "info",
              titulo: "Ausência de construção",
              desc: "O mês foi usado para manter o presente, não para fortalecer o futuro. Separe um valor para reserva, investimento ou objetivo antes de fechar o mês.",
            });
          if (alerts.length === 0)
            alerts.push({
              tipo: "success",
              titulo: "Estrutura saudável",
              desc: "O ciclo teve construção e a distribuição ficou equilibrada.",
            });
          return alerts;
        },
        direcaoRecomendada(key) {
          const d = this.diagnosticoCiclo(key);
          const alerts = this.alertasEstruturais(key);
          if (!d.renda && !d.rendaBruta)
            return {
              titulo: "Comece pela base",
              texto:
                "Registre a renda do mês. Sem isso, qualquer sensação de controle é só impressão.",
            };
          if (d.disponivel < 0)
            return {
              titulo: "Recuperar margem primeiro",
              texto:
                "Corte variável, pause novos compromissos e proteja o essencial. A meta agora não é performar bonito; é voltar ao chão firme.",
            };
          if (d.construcaoTotal === 0 && d.disponivel > 0)
            return {
              titulo: "Transforme sobra em construção",
              texto:
                "Defina antes para onde a folga vai. Sobra sem destino vira gasto emocional. Crie uma separação para reserva, investimento ou objetivo.",
            };
          if (d.construcaoTotal > 0 && d.margemPct < 8)
            return {
              titulo: "Construiu, mas ainda apertado",
              texto:
                "Você já deu um passo certo. Agora precisa aliviar compromissos e criar uma faixa mínima de segurança.",
            };
          return {
            titulo: "Repita o que funcionou",
            texto:
              "Mantenha a construção ativa e use a folga para acelerar objetivo, reserva ou redução de compromissos.",
          };
        },
        sugestoesCat(cats, renda) {
          const ideais = { E: 50, P: 20, V: 20, F: 10 };
          return cats.map((c) => {
            const pR = renda > 0 ? (c.valor / renda) * 100 : 0;
            const id = ideais[c.id];
            const st =
              c.id === "F"
                ? pR < id
                  ? "baixo"
                  : "ok"
                : pR > id
                  ? "alto"
                  : "ok";
            return { ...c, pctReal: pR, ideal: id, status: st };
          });
        },
        dicasPorSinal(t) {
          const d = {
            red: [
              {
                titulo: "Corte com alvo claro",
                texto:
                  "Ataque primeiro o variável e o compromisso que mais rouba margem.",
              },
              {
                titulo: "Reconstrua a base",
                texto:
                  "O foco não é sobrar bonito. É parar o negativo e voltar a respirar.",
              },
              {
                titulo: "Trave novas parcelas",
                texto:
                  "Quem já está pressionado não precisa de mais compromissos futuros.",
              },
              {
                titulo: "Negocie agora",
                texto:
                  "Renegociação cedo custa menos do que insistir em carregar peso morto.",
              },
            ],
            amber: [
              {
                titulo: "Dê destino à folga",
                texto:
                  "Se houver sobra, transforme em construção antes que o mês a absorva.",
              },
              {
                titulo: "Abra margem",
                texto:
                  "Procure um corte simples que devolva ar ao próximo ciclo.",
              },
              {
                titulo: "Observe o padrão",
                texto:
                  "O problema pode não ser ganhar pouco, mas repetir o mesmo mês sem evolução.",
              },
              {
                titulo: "Mantenha constância",
                texto:
                  "Decisão madura nasce de dados reais repetidos, não de sensação.",
              },
            ],
            verde: [
              {
                titulo: "Proteja a construção",
                texto:
                  "O verde não serve para relaxar. Serve para consolidar o hábito certo.",
              },
              {
                titulo: "Acelere um objetivo",
                texto:
                  "Escolha um alvo e concentre energia. Dinheiro espalhado perde força.",
              },
              {
                titulo: "Crie folga real",
                texto:
                  "Mesmo construindo, preserve uma pequena margem para não voltar à pressão.",
              },
              {
                titulo: "Libere renda futura",
                texto:
                  "Use parte da força do mês para reduzir compromissos recorrentes.",
              },
            ],
          };
          return d[t] || d.verde;
        },
        parcelaFim(p) {
          const i = new Date(p.dataInicio);
          const f = new Date(i);
          f.setMonth(f.getMonth() + (p.totalParcelas - p.parcelaAtual));
          return f;
        },
        // Soma tudo que já foi separado (dízimo, reserva, investimento...) em todos os meses registrados
        totalSeparadoAcumulado() {
          const ciclos = Store.get("ciclos") || {};
          return Object.keys(ciclos).reduce(
            (s, key) => s + (this.diagnosticoCiclo(key).totalSeparado || 0),
            0,
          );
        },
      };
