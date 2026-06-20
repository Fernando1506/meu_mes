/*
  ═══════════════════════════════════════════════════════
  08-FAROL-HELPERS.JS
  ═══════════════════════════════════════════════════════
  Funções auxiliares de interface e inteligência contextual do app.

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
      // FAROL HELPERS
      // ═══════════════════════════════════════════════════════
      /* FarolHelpers: utilidades de UI, mensagens e análises contextuais. */
      const FarolHelpers = {
        // Cor e label de cada categoria de separação
        sepCatStyle(cat) {
          return (
            {
              futuro: { cor: "#0D8F6E", bg: "#E6F7F3", label: "futuro" },
              devolucao: { cor: "#3B6FD4", bg: "#EAF0FB", label: "devolução" },
              oferta: { cor: "#D4973B", bg: "#FBF3EA", label: "oferta" },
            }[cat] || { cor: "#888", bg: "#f5f5f5", label: cat }
          );
        },
        escapeHtml(s) {
          return String(s || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        },
        formatDate(d) {
          if (!d) return "";
          try {
            const dt = new Date(d);
            if (isNaN(dt)) return d;
            return dt.toLocaleDateString("pt-BR", { timeZone: "UTC" });
          } catch (e) {
            return d;
          }
        },
        parseLocalDate(s) {
          if (!s) return new Date();
          const [a, m, d] = s.split("T")[0].split("-").map(Number);
          return new Date(a, m - 1, d || 1);
        },
        monthLabelByKey(key) {
          if (!key) return "";
          const [y, m] = key.split("-").map(Number);
          const n = [
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
          ];
          return `${n[m]} ${y}`;
        },
        isCurrentKey(key) {
          const now = new Date();
          return key === `${now.getFullYear()}-${now.getMonth()}`;
        },
        // Verifica se um lançamento está vencido (data passou e não foi marcado como pago)
        isVencido(g) {
          if (!g || g.pago || g.virtual || !g.data) return false;
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const venc = this.parseLocalDate(g.data);
          venc.setHours(0, 0, 0, 0);
          return venc < hoje;
        },
        // Resumo de pagamentos do ciclo: quanto falta pagar e quais estão vencidos
        pagamentosResumo(gastos) {
          gastos = gastos || [];
          // Faturas em aberto (virtuais) sempre contam como "falta pagar", mas nunca como "vencido"
          // (ainda não têm data de vencimento — isso só passa a existir após o fechamento da fatura).
          const pendentes = gastos.filter((g) => !g.pago);
          const vencidos = pendentes.filter((g) => this.isVencido(g));
          const faltaPagar = pendentes.reduce((s, g) => s + (g.valor || 0), 0);
          const totalVencido = vencidos.reduce((s, g) => s + (g.valor || 0), 0);
          return {
            pendentes,
            vencidos,
            faltaPagar,
            totalVencido,
            qtdPendentes: pendentes.length,
            qtdVencidos: vencidos.length,
          };
        },
        shiftMonthKey(key, n) {
          const [y, m] = key.split("-").map(Number);
          const d = new Date(y, m, 1);
          d.setMonth(d.getMonth() + n);
          return `${d.getFullYear()}-${d.getMonth()}`;
        },
        keyNum(k) {
          if (!k) return 0;
          const [y, m] = k.split("-").map(Number);
          return (y || 0) * 12 + (m || 0);
        },
        currentKeyParts(key) {
          const [y, m] = key.split("-").map(Number);
          return { year: y, month: m };
        },
        goalDueLabel(obj) {
          if (!obj || !obj.prazo) return "sem prazo";
          const d = new Date(obj.prazo);
          return d.toLocaleDateString("pt-BR", {
            month: "short",
            year: "numeric",
          });
        },
        goalStatus(obj) {
          const p = Calc.objPct(obj);
          if (p >= 100) return "Concluído";
          if (p >= 70) return "Quase lá";
          if (p >= 30) return "Em andamento";
          return "Iniciando";
        },
        defaultGoalIndex() {
          const objs = Store.get("objetivos") || [];
          if (!objs.length) return -1;
          let idx = objs.findIndex(
            (o) => Calc.objPct(o) < 100 && o.prioridade === "alta",
          );
          if (idx < 0) idx = objs.findIndex((o) => Calc.objPct(o) < 100);
          return idx >= 0 ? idx : 0;
        },
        suggestGoalMessage() {
          const objs = Store.get("objetivos") || [];
          const key = App.getActiveCycleKey
            // Retorna o ciclo financeiro atualmente selecionado.
            ? App.getActiveCycleKey()
            : Calc.cicloAtual();
          const mes = Calc.getCiclo(key);
          const renda = Calc.rendaNoMes(mes);
          const total = Calc.totalGastos(mes.gastos || []);
          const sobra = renda - total;
          if (!objs.length)
            return {
              text: "Nenhum objetivo definido ainda. Objetivo não é enfeite: é o que impede o dinheiro de ser engolido pelo mês.",
              positive: false,
              idx: -1,
            };
          const idx = this.defaultGoalIndex();
          const obj = objs[idx];
          if (!obj)
            return {
              text: "Todos os objetivos foram concluídos. Hora de definir o próximo alvo relevante.",
              positive: true,
              idx: -1,
            };
          const falta = Math.max((obj.valor || 0) - (obj.valorPago || 0), 0);
          const pct = Calc.objPct(obj);
          if (sobra > 0 && falta > 0)
            return {
              text: `Existe espaço para avançar no objetivo "${this.escapeHtml(obj.nome)}". Ele está em ${Math.round(pct)}% e faltam ${Calc.fmt(falta)}.`,
              positive: true,
              idx,
            };
          return {
            text: `Objetivo em foco: "${this.escapeHtml(obj.nome)}" — ${Math.round(pct)}% concluído. Faltam ${Calc.fmt(falta)}.`,
            positive: false,
            idx,
          };
        },
        monthDiffInclusive(start, end) {
          if (
            !(start instanceof Date) ||
            isNaN(start) ||
            !(end instanceof Date) ||
            isNaN(end)
          )
            return 0;
          return (
            (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth()) +
            1
          );
        },
        // ─── CARTÕES DE CRÉDITO ──────────────────────────────────
        // Os cartões agora aceitam data completa no cadastro (YYYY-MM-DD),
        // mas mantêm diaFechamento/diaVencimento para compatibilidade com dados antigos.
        // A data completa evita erro quando fechamento/vencimento caem em mês diferente.
        _parseISODate(value) {
          if (!value || typeof value !== "string") return null;
          const [y, m, d] = value.split("-").map(Number);
          if (!y || !m || !d) return null;
          const dt = new Date(y, m - 1, d);
          return isNaN(dt) ? null : dt;
        },

        _dateToISO(dt) {
          if (!(dt instanceof Date) || isNaN(dt)) return "";
          return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        },

        _safeCardDay(c, tipo) {
          const campoData = tipo === "fechamento" ? "dataFechamento" : "dataVencimento";
          const campoDia = tipo === "fechamento" ? "diaFechamento" : "diaVencimento";
          const dt = this._parseISODate(c && c[campoData]);
          const day = dt ? dt.getDate() : parseInt(c && c[campoDia], 10);
          return Math.min(Math.max(day || 1, 1), 31);
        },

        _monthlyCardDate(c, tipo, baseDate, preferNext = false) {
          const now = baseDate instanceof Date ? new Date(baseDate) : new Date();
          const campoData = tipo === "fechamento" ? "dataFechamento" : "dataVencimento";
          const dtBase = this._parseISODate(c && c[campoData]);
          const day = this._safeCardDay(c, tipo);

          let ano = now.getFullYear();
          let mes = now.getMonth();

          // Se a data completa cadastrada ainda está no futuro, respeita esse mês/ano exato.
          // Depois disso, o cartão volta a se repetir mensalmente no mesmo dia.
          if (dtBase && dtBase >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            ano = dtBase.getFullYear();
            mes = dtBase.getMonth();
          } else if (preferNext && now.getDate() > day) {
            mes += 1;
            if (mes > 11) {
              mes = 0;
              ano += 1;
            }
          }

          const diasNoMes = this.daysInMonth(ano, mes);
          return new Date(ano, mes, Math.min(day, diasNoMes));
        },

        // Calcula o status do cartão: dias até fechamento, se está vencido (precisa confirmar fechamento)
        cartaoStatus(c, baseDate) {
          const now = baseDate instanceof Date ? new Date(baseDate) : new Date();
          now.setHours(0, 0, 0, 0);
          const fechamentoAtual = this._monthlyCardDate(c, "fechamento", now, false);
          const proximoFechamento = fechamentoAtual < now
            ? this._monthlyCardDate(c, "fechamento", now, true)
            : fechamentoAtual;
          const vencimentoAtual = this._monthlyCardDate(c, "vencimento", now, false);
          const proxVencimento = this.proximoVencimento(c, now);

          const fech = fechamentoAtual.getDate();
          const venc = vencimentoAtual.getDate();
          const diasParaFechar = Math.max(
            0,
            Math.ceil((proximoFechamento - now) / (1000 * 60 * 60 * 24)),
          );

          const faturas = Array.isArray(c.faturasFechadas) ? c.faturasFechadas : [];
          const ultima = faturas.length ? faturas[faturas.length - 1] : null;
          const cicloAtualKey = `${fechamentoAtual.getFullYear()}-${fechamentoAtual.getMonth()}`;
          const jaFechouEsteCiclo = now >= fechamentoAtual;
          const aindaNaoConfirmou = !ultima || ultima.mesRef !== cicloAtualKey;
          const pendenteFechamento =
            jaFechouEsteCiclo && aindaNaoConfirmou && (c.faturaAtual || 0) > 0;

          return {
            diasParaFechar,
            pendenteFechamento,
            fech,
            venc,
            fechamentoAtual,
            proximoFechamento,
            proxVencimento,
          };
        },

        // Retorna a data do próximo vencimento (Date). Aceita cartão completo ou número antigo.
        proximoVencimento(cartaoOuDia, baseDate) {
          const now = baseDate instanceof Date ? new Date(baseDate) : new Date();
          now.setHours(0, 0, 0, 0);
          if (typeof cartaoOuDia === "object") {
            const vencAtual = this._monthlyCardDate(cartaoOuDia, "vencimento", now, false);
            return vencAtual < now
              ? this._monthlyCardDate(cartaoOuDia, "vencimento", now, true)
              : vencAtual;
          }
          const diaVenc = Math.min(Math.max(parseInt(cartaoOuDia, 10) || 1, 1), 31);
          let ano = now.getFullYear();
          let mes = now.getMonth();
          if (now.getDate() > diaVenc) {
            mes += 1;
            if (mes > 11) {
              mes = 0;
              ano += 1;
            }
          }
          const diasNoMes = this.daysInMonth(ano, mes);
          return new Date(ano, mes, Math.min(diaVenc, diasNoMes));
        },

        formatDateBR(date) {
          if (!(date instanceof Date)) return "—";
          return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        },
        daysInMonth(year, month) {
          return new Date(year, month + 1, 0).getDate();
        },

        parcelSnapshot(p, baseDate) {
          if (!p || !p.dataInicio || !p.dataFim) return null;
          const inicio = this.parseLocalDate(p.dataInicio);
          const fim = this.parseLocalDate(p.dataFim);
          const now =
            baseDate instanceof Date ? new Date(baseDate) : new Date();
          const total = Math.max(1, this.monthDiffInclusive(inicio, fim));
          const decorridosRaw =
            (now.getFullYear() - inicio.getFullYear()) * 12 +
            (now.getMonth() - inicio.getMonth()) +
            1;
          const decorridos = Math.max(0, Math.min(total, decorridosRaw));
          const restantes = Math.max(0, total - decorridos);
          const liberaEm = new Date(fim.getFullYear(), fim.getMonth() + 1, 1);
          const mesesParaLiberar = Math.max(
            0,
            (liberaEm.getFullYear() - now.getFullYear()) * 12 +
              (liberaEm.getMonth() - now.getMonth()),
          );
          return {
            inicio,
            fim,
            total,
            decorridos,
            restantes,
            pctFeit: Math.min(
              100,
              Math.round((decorridos / Math.max(1, total)) * 100),
            ),
            liberaEm,
            mesesParaLiberar,
            valorLivre: p.valor || 0,
            totalPago: decorridos * (p.valor || 0),
            ativa: now <= fim,
          };
        },
        nextParcelRelease(baseDate) {
          const parcelas = (Store.get("parcelas") || [])
            .map((p) => ({
              parcela: p,
              snap: this.parcelSnapshot(p, baseDate),
            }))
            .filter((x) => x.snap && x.snap.restantes > 0);
          if (!parcelas.length) return null;
          parcelas.sort(
            (a, b) =>
              a.snap.liberaEm - b.snap.liberaEm ||
              (b.parcela.valor || 0) - (a.parcela.valor || 0),
          );
          return parcelas[0];
        },
        releaseUseSuggestion(amount) {
          const val = amount || 0;
          const key = App.getActiveCycleKey
            ? App.getActiveCycleKey()
            : Calc.cicloAtual();
          const d = Calc.diagnosticoCiclo(key);
          const goalMsg = this.suggestGoalMessage();
          if (d.disponivel < 0)
            return {
              title: "Use para recompor margem",
              desc: `Quando ${Calc.fmt(val)} ficar livre, não aumente o padrão de vida. Use esse espaço para parar o negativo e recuperar fôlego.`,
            };
          if (d.construcaoTotal === 0)
            return {
              title: "Transforme em construção",
              desc: `Quando ${Calc.fmt(val)} liberar, direcione primeiro para reserva, objetivo ou separação. Não devolva esse valor ao consumo automático.`,
            };
          if (
            d.blocos.compromissos > 0 &&
            d.renda > 0 &&
            d.blocos.compromissos / d.renda > 0.3
          )
            return {
              title: "Ataque outro compromisso",
              desc: `Use os ${Calc.fmt(val)} para antecipar ou quitar outro peso do mês. Liberdade cresce quando a renda futura deixa de nascer comprometida.`,
            };
          if (goalMsg.idx >= 0)
            return {
              title: "Acelere o objetivo principal",
              desc: `Quando esse valor liberar, concentre-o no objetivo em foco. ${goalMsg.text.replace(/<[^>]*>/g, "")}`,
            };
          return {
            title: "Proteja a folga nova",
            desc: `Quando ${Calc.fmt(val)} ficar disponível, preserve parte como margem e direcione o restante com intenção. Dinheiro liberado sem destino tende a desaparecer.`,
          };
        },
        releaseTimingLabel(date) {
          if (!(date instanceof Date) || isNaN(date)) return "";
          return date.toLocaleDateString("pt-BR", {
            month: "short",
            year: "numeric",
          });
        },
        monthlySummary() {
          const key = App.getActiveCycleKey
            ? App.getActiveCycleKey()
            : Calc.cicloAtual();
          const d = Calc.diagnosticoCiclo(key);
          if (!d.renda && !d.rendaBruta)
            return {
              title: "Base incompleta",
              summary:
                "Registre sua renda para que o sistema leia o mês com contexto real.",
            };
          if (d.status.tipo === "red")
            return {
              title: "Ciclo em pressão",
              summary: `Você terminou ${Calc.fmt(Math.abs(d.disponivel))} acima da renda. Prioridade: recuperar margem.`,
            };
          if (d.status.tipo === "verde" && d.disponivel === 0)
            return {
              title: "Tudo foi direcionado",
              summary:
                "Você zerou o mês, mas houve construção. Agora o próximo passo é abrir folga para imprevistos.",
            };
          if (d.status.tipo === "verde")
            return {
              title: "Você construiu futuro",
              summary: `Construção de ${Calc.fmt(d.construcaoTotal)} neste ciclo. Preserve esse padrão.`,
            };
          if (d.disponivel > 0)
            return {
              title: "Há folga para decidir",
              summary:
                "Ainda falta transformar a folga em construção consciente.",
            };
          return {
            title: "Sem avanço estrutural",
            summary:
              "O presente consumiu todo o mês. O problema não é zerar; é zerar sem construir.",
          };
        },
        dynamicDirectionMessage() {
          const key = Calc.cicloAtual();
          const d = Calc.diagnosticoCiclo(key);
          const ciclos = Object.values(Store.get("ciclos") || {}).filter(
            (m) => Calc.rendaNoMes(m) > 0,
          ).length;
          if (!d.renda && !d.rendaBruta)
            return {
              headline: `Olá, ${FarolHelpers.escapeHtml(Store.get("user")?.nome || "Usuário")}`,
              sub: "Registre a renda deste mês para o MEU MÊS mostrar a realidade com clareza.",
            };
          if (d.status.tipo === "red")
            return {
              headline: "Seu mês pede correção, não maquiagem.",
              sub: "Enxergar a pressão cedo é melhor do que fingir que ela não existe.",
            };
          if (d.status.tipo === "verde" && d.disponivel === 0)
            return {
              headline: "Tudo foi direcionado com intenção.",
              sub: "Você construiu futuro neste ciclo. Agora precisa proteger uma pequena folga.",
            };
          if (d.status.tipo === "verde")
            return {
              headline: "Você está construindo, não apenas pagando contas.",
              sub: `${ciclos} mês(es) registrado(s). Consistência financeira é repetição inteligente.`,
            };
          if (d.disponivel > 0)
            return {
              headline: "Existe espaço para uma decisão melhor.",
              sub: "A folga existe. O desafio agora é dar destino antes que ela desapareça.",
            };
          return {
            headline: "O mês foi consumido pelo presente.",
            sub: "A boa notícia é que agora você está vendo isso com clareza.",
          };
        },
        currentAchievement() {
          const earned = Medals.getEarned();
          if (earned.length === 0)
            return {
              icon: "leaf",
              title: "Sua jornada começa agora",
              text: "Registre seu primeiro gasto para ganhar sua primeira medalha e iniciar sua trajetória.",
            };
          const last = earned[earned.length - 1];
          return {
            icon: last.icon || "star",
            title: `Conquista: ${last.name}`,
            text: last.desc,
          };
        },
        monthlyChallenge(key) {
          const d = Calc.diagnosticoCiclo(
            key ||
              (App.getActiveCycleKey
                ? App.getActiveCycleKey()
                : Calc.cicloAtual()),
          );
          if (!d.renda && !d.rendaBruta)
            return {
              title: "Desafio de clareza",
              tag: "Fundação",
              desc: "Registrar renda e gastos do mês atual sem deixar lacunas.",
              why: "Sem dados honestos, não existe diagnóstico confiável.",
            };
          if (d.disponivel < 0)
            return {
              title: "Desafio de reação",
              tag: "Recuperação",
              desc: "Reduzir um gasto variável relevante ou renegociar um compromisso ainda neste ciclo.",
              why: "O objetivo é interromper a perda, não buscar perfeição.",
            };
          if (d.construcaoTotal === 0)
            return {
              title: "Desafio de construção",
              tag: "Direção",
              desc: "Direcionar um valor concreto ao futuro antes do fechamento do mês — através de uma separação ou objetivo.",
              why: "É isso que separa controle aparente de avanço real.",
            };
          if (d.margemPct < 8)
            return {
              title: "Desafio de margem",
              tag: "Proteção",
              desc: "Abrir pelo menos uma pequena folga para que imprevistos não destruam o próximo ciclo.",
              why: "Construção sem margem ainda deixa a estrutura vulnerável.",
            };
          return {
            title: "Desafio de consistência",
            tag: "Maturidade",
            desc: "Repetir o mesmo padrão saudável no próximo mês, sem depender de motivação.",
            why: "A vitória real não é um mês bom. É um padrão bom.",
          };
        },
        principlesCatalog() {
          return [
            {
              id: "prudencia",
              titulo: "Prudência",
              ref: "Provérbios 21:5",
              versiculo: "Os planos do diligente tendem à abundância.",
              contexto:
                "Provérbios contrasta pressa e diligência. O texto valoriza preparação, ritmo e decisão anterior ao impulso.",
              aplicacao:
                "Planejar antes do mês começar reduz decisões emocionais e dá direção ao dinheiro.",
            },
            {
              id: "dominio",
              titulo: "Domínio próprio",
              ref: "Provérbios 25:28",
              versiculo:
                "Como cidade derrubada, que não tem muros, assim é o homem que não tem domínio próprio.",
              contexto:
                "A imagem é de uma cidade vulnerável, aberta a invasões. Sem domínio, qualquer desejo entra e ocupa espaço.",
              aplicacao:
                "Quando o variável cresce sem critério, o problema não é só financeiro. É falta de contenção prática.",
            },
            {
              id: "mordomia",
              titulo: "Mordomia fiel",
              ref: "Lucas 16:10",
              versiculo: "Quem é fiel no pouco também é fiel no muito.",
              contexto:
                "Jesus mostra que fidelidade não começa no muito. Ela se prova no cuidado com o que já foi confiado.",
              aplicacao:
                "Registrar pequenos valores e cumprir a decisão do mês é treino de caráter administrativo.",
            },
            {
              id: "liberdade",
              titulo: "Liberdade diante da dívida",
              ref: "Provérbios 22:7",
              versiculo: "O que toma emprestado é servo do que empresta.",
              contexto:
                "O provérbio não nega a existência da dívida, mas mostra seu peso relacional e sua capacidade de reduzir liberdade.",
              aplicacao:
                "Compromissos altos precisam ser vistos como pressão estrutural, não como detalhe do mês.",
            },
            {
              id: "provisao",
              titulo: "Provisão e preparo",
              ref: "Provérbios 6:6-8",
              versiculo:
                "Vai ter com a formiga, ó preguiçoso; olha para os seus caminhos e sê sábio.",
              contexto:
                "A formiga prepara no tempo oportuno. A sabedoria bíblica valoriza antecipação, não improviso contínuo.",
              aplicacao:
                "Construção, reserva e objetivos são formas concretas de preparo, não exagero.",
            },
            {
              id: "fidelidade",
              titulo: "Fidelidade constante",
              ref: "1 Coríntios 4:2",
              versiculo:
                "O que se requer dos despenseiros é que cada um deles seja encontrado fiel.",
              contexto:
                "Paulo fala de responsabilidade na administração do que foi recebido. Fidelidade é continuidade, não pico emocional.",
              aplicacao:
                "A evolução financeira aparece quando um bom mês vira padrão, e não exceção.",
            },
            {
              id: "contentamento",
              titulo: "Contentamento",
              ref: "1 Timóteo 6:6-8",
              versiculo: "Grande fonte de lucro é a piedade com contentamento.",
              contexto:
                "Paulo confronta a ilusão de que acumular ou consumir resolve o coração.",
              aplicacao:
                "Nem todo desejo precisa virar saída financeira. Contentamento preserva margem.",
            },
          ];
        },
        contextualPrinciple(key) {
          const d = Calc.diagnosticoCiclo(
            key ||
              (App.getActiveCycleKey
                ? App.getActiveCycleKey()
                : Calc.cicloAtual()),
          );
          const c = this.principlesCatalog();
          if (!d.renda && !d.rendaBruta)
            return c.find((x) => x.id === "mordomia");
          if (d.disponivel < 0) return c.find((x) => x.id === "liberdade");
          if (d.construcaoTotal > 0 && d.margemPct >= 8)
            return c.find((x) => x.id === "fidelidade");
          if (d.construcaoTotal > 0) return c.find((x) => x.id === "provisao");
          const variavel = d.gastos
            .filter((x) => x.categoria === "V")
            .reduce((s, x) => s + (x.valor || 0), 0);
          if (d.renda > 0 && variavel / d.renda > 0.25)
            return c.find((x) => x.id === "dominio");
          return c.find((x) => x.id === "prudencia");
        },
        syncRecurring(key) {
          const ciclos = Store.get("ciclos") || {};
          if (!ciclos[key])
            ciclos[key] = { renda: 0, gastos: [], decisao: "", fontes: [] };
          const cicloBase = ciclos[key];
          const [year, month] = key.split("-").map(Number);

          // Trabalha com cópia profunda dos gastos para evitar mutação acidental
          // do Store em chamadas repetidas (que causava duplicação de parcelas).
          const gastosBase = JSON.parse(JSON.stringify(cicloBase.gastos || []));

          // Saneamento: remove gastos de parcela duplicados ou órfãos.
          const parcelasAtuais = Store.get("parcelas") || [];
          const idsValidos = new Set(
            parcelasAtuais.map((p) => `parcela:${p.id}`),
          );
          const vistos = new Set();

          // 1ª passada: identifica os gastos de parcela válidos (com templateId)
          const gastosParcelaValidos = gastosBase.filter(
            (g) =>
              g.templateId &&
              g.templateId.startsWith("parcela:") &&
              idsValidos.has(g.templateId),
          );

          const gastosSaneados = gastosBase.filter((g) => {
            if (g.templateId && g.templateId.startsWith("parcela:")) {
              if (!idsValidos.has(g.templateId)) return false; // órfão
              if (vistos.has(g.templateId)) return false; // duplicado
              vistos.add(g.templateId);
              return true;
            }
            // Gasto sem templateId de parcela: verifica se é lixo legado
            if (!g.pago) {
              const duplicaParcela = gastosParcelaValidos.some(
                (gp) =>
                  gp.descricao === g.descricao &&
                  gp.valor === g.valor &&
                  gp.data === g.data,
              );
              if (duplicaParcela) return false;
            }
            return true;
          });

          const fixos = Store.get("gastosFixos") || [];
          fixos.forEach((t) => {
            if (!t.id || !t.startKey || !t.endKey) return;
            if (
              FarolHelpers.keyNum(key) < FarolHelpers.keyNum(t.startKey) ||
              FarolHelpers.keyNum(key) > FarolHelpers.keyNum(t.endKey)
            )
              return;
            if (Array.isArray(t.skipMonths) && t.skipMonths.includes(key))
              return;
            const exists = gastosSaneados.some((g) => g.templateId === t.id);
            if (!exists) {
              const day = Math.min(Math.max(t.diaVencimento || 1, 1), 28);
              const localDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const parcelaNum =
                t.recorrencia === "parcelado_fixo"
                  ? FarolHelpers.keyNum(key) -
                    FarolHelpers.keyNum(t.startKey) +
                    1
                  : undefined;
              gastosSaneados.push({
                descricao: t.descricao,
                valor: t.valor,
                categoria: t.categoria,
                subcategoria: t.subcategoria || "",
                data: localDate,
                pago: false,
                templateId: t.id,
                recorrencia: t.recorrencia || "mensal",
                startKey: t.startKey,
                endKey: t.endKey,
                repeatMonths: t.repeatMonths,
                totalParcelas: t.totalParcelas,
                parcelaNum,
              });
            }
          });

          const parcelas = Store.get("parcelas") || [];
          const cicloDate = new Date(year, month, 1);
          parcelas.forEach((p) => {
            if (!p || !p.id || !p.dataInicio || !p.dataFim) return;
            const inicio = FarolHelpers.parseLocalDate(p.dataInicio);
            const fim = FarolHelpers.parseLocalDate(p.dataFim);
            if (cicloDate < inicio || cicloDate > fim) return;
            if (Array.isArray(p.skipMonths) && p.skipMonths.includes(key))
              return;
            if (p.origem === "cartao") return;
            const tId = `parcela:${p.id}`;
            const exists = gastosSaneados.some((g) => g.templateId === tId);
            if (!exists) {
              const venc = parseInt(
                p.diaVencimento || inicio.getDate() || 1,
                10,
              );
              const day = Math.min(Math.max(venc, 1), 28);
              const localDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const snap = FarolHelpers.parcelSnapshot(p, cicloDate);
              gastosSaneados.push({
                descricao: p.nome,
                valor: p.valor,
                categoria: "P",
                subcategoria: p.subcategoria || "",
                data: localDate,
                pago: false,
                templateId: tId,
                recorrencia: "parcelado",
                parcelaNum: snap ? snap.decorridos : undefined,
                totalParcelas: snap ? snap.total : undefined,
              });
            }
          });

          // Monta o ciclo final com os gastos já saneados e injetados
          const cicloFinal = { ...cicloBase, gastos: gastosSaneados };
          ciclos[key] = cicloFinal;
          // NÃO chamar Store.set aqui: syncRecurring só monta a visão
          // temporária para renderização — não deve disparar scheduleSync/push.
          Store.data.ciclos = ciclos;
          return cicloFinal;
        },
        evolutionInsights() {
          const now = new Date();
          const months = [
            "Jan",
            "Fev",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Out",
            "Nov",
            "Dez",
          ];
          const y = now.getFullYear();
          const lines = Array.from({ length: 12 }, (_, i) => {
            const key = `${y}-${i}`;
            const m = Calc.getCiclo(key);
            const renda = Calc.rendaNoMes(m);
            const gastos = m.gastos || [];
            const total = Calc.totalGastos(gastos);
            const diag = Calc.diagnosticoCiclo(key);
            const blocos = diag.blocos;
            const active = i <= now.getMonth();
            return {
              name: months[i],
              key,
              renda,
              rendaBruta: diag.rendaBruta,
              total,
              sobra: diag.disponivel,
              blocos,
              construcaoTotal: diag.construcaoTotal,
              totalSeparado: diag.totalSeparado,
              active,
              sinal: diag.status,
            };
          });
          const past = lines.filter(
            (l) => l.active && (l.renda > 0 || l.rendaBruta > 0),
          );
          const monthsWithData = past.length;
          const avgSobra = monthsWithData
            ? past.reduce((s, l) => s + l.sobra, 0) / monthsWithData
            : 0;
          const best =
            past.slice().sort((a, b) => b.sobra - a.sobra)[0] || null;
          const worst =
            past.slice().sort((a, b) => a.sobra - b.sobra)[0] || null;
          const futureMonths = past.filter((l) => l.construcaoTotal > 0).length;
          const negativeMonths = past.filter((l) => l.sobra < 0).length;
          const tightMonths = past.filter(
            (l) => l.sobra >= 0 && l.sobra <= l.renda * 0.08,
          ).length;
          let headline = "Ainda faltam dados suficientes para ler o ano.";
          let summary =
            "Continue registrando os meses para transformar números em padrão.";
          let nowAction = "Comece registrando com constância.";
          if (monthsWithData) {
            if (negativeMonths >= Math.ceil(monthsWithData / 3)) {
              headline = "O ano mostra repetição de pressão.";
              summary =
                "Há meses demais terminando sem margem ou no negativo. O problema parece estrutural.";
              nowAction =
                "Revise compromissos e ataque o principal vazamento agora.";
            } else if (futureMonths >= Math.ceil(monthsWithData / 2)) {
              headline = "Existe amadurecimento financeiro em andamento.";
              summary =
                "Construção aparece com frequência, o que indica decisão e não apenas registro.";
              nowAction =
                "O próximo passo é consolidar o padrão e abrir margem adicional.";
            } else if (avgSobra >= 0) {
              headline = "Há registro, mas a direção ainda oscila.";
              summary =
                "Você não está desorganizado como antes, porém a construção ainda não se tornou hábito.";
              nowAction =
                "Escolha uma mudança concreta para o próximo ciclo: construir ou aliviar pressão.";
            }
          }
          return {
            lines,
            monthsWithData,
            avgSobra,
            best,
            worst,
            futureMonths,
            negativeMonths,
            tightMonths,
            headline,
            summary,
            nowAction,
          };
        },
      };
