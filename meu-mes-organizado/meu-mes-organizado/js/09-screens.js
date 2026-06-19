// ═══════════════════════════════════════════════════════
      // SCREENS
      // ═══════════════════════════════════════════════════════
      const Screens = {};

      Screens.dashboard = function () {
        const user = Store.get("user");
        const key = Calc.cicloAtual();
        const mes = FarolHelpers.syncRecurring(key);
        const gastos = mes.gastos || [];
        const entradas = Calc.entradasNoMes(mes);
        const diag = Calc.diagnosticoCiclo(key);
        const { renda, blocos, total, disponivel, status } = diag;
        const objs = Store.get("objetivos") || [];
        const idx = FarolHelpers.defaultGoalIndex();
        const obj = idx >= 0 ? objs[idx] : null;
        const resumo = FarolHelpers.monthlySummary();
        const mensagem = FarolHelpers.dynamicDirectionMessage();
        const conquista = FarolHelpers.currentAchievement();
        const earnedMedals = Medals.getEarned();
        const decisao = (mes.decisao || "").trim();
        const challenge = FarolHelpers.monthlyChallenge(key);
        const direction = Calc.direcaoRecomendada(key);
        const contextual = FarolHelpers.contextualPrinciple(key);
        const nextRelease = FarolHelpers.nextParcelRelease();
        const releaseAdvice = nextRelease
          ? FarolHelpers.releaseUseSuggestion(nextRelease.snap.valorLivre)
          : null;
        const availableLabel =
          renda === 0 && !diag.rendaBruta
            ? "Registre suas entradas"
            : disponivel < 0
              ? "Faltou no mês"
              : disponivel === 0 && diag.construcaoTotal > 0
                ? "Tudo foi direcionado"
                : disponivel === 0
                  ? "Sem folga para decidir"
                  : "Livre para decidir";
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div>
            <div class="topbar-title">Olá, ${FarolHelpers.escapeHtml(user?.nome || "Usuário")} </div>
            <div class="topbar-sub">Visão executiva do mês — entradas, consumo, compromissos, construção e o que ainda está livre para decidir.</div>
          </div>
          <div class="topbar-actions">
            <button class="btn btn-ghost btn-sm" onclick="App.openModal('renda')">+ Entrada</button>
            <button class="btn btn-primary btn-sm" onclick="App.openModal('gasto')">+ Gasto</button>
          </div>
        </div>

        <div class="dashboard-highlight mb-24">
          <span class="eyebrow">painel do mês</span>
          <h3>${mensagem.headline}</h3>
          <p>${mensagem.sub}</p>
          ${renda > 0 ? `<div style="margin-top:16px;"><span class="widget-sinal ${status.tipo}">${status.label}</span></div>` : ""}
        </div>

        ${(() => {
          const pag = FarolHelpers.pagamentosResumo(diag.gastos);
          if (!pag.qtdVencidos) return "";
          return `<div class="alert-item danger mb-16">
          <div>
            <div class="alert-title">${pag.qtdVencidos > 1 ? `${pag.qtdVencidos} contas venceram` : "Uma conta venceu"} e ${pag.qtdVencidos > 1 ? "não foram marcadas" : "não foi marcada"} como pagas</div>
            <div class="alert-desc">Total vencido: ${Calc.fmt(pag.totalVencido)}. ${pag.vencidos
              .slice(0, 3)
              .map((g) => FarolHelpers.escapeHtml(g.descricao))
              .join(", ")}${pag.vencidos.length > 3 ? "..." : ""}</div>
            <div class="mt-8"><button class="btn btn-gold btn-sm" onclick="App.go('meumes')">Ver em Meu Mês</button></div>
          </div>
        </div>`;
        })()}

        ${(() => {
          const cartoes = Store.get("cartoes") || [];
          const pendentes = cartoes
            .map((c, i) => ({ c, i, st: FarolHelpers.cartaoStatus(c) }))
            .filter((x) => x.st.pendenteFechamento);
          if (!pendentes.length) return "";
          return `<div class="alert-item warn mb-16">
          <div>
            <div class="alert-title">${pendentes.length > 1 ? `${pendentes.length} faturas fecharam` : "Uma fatura fechou"}</div>
            <div class="alert-desc">${pendentes.map((x) => FarolHelpers.escapeHtml(x.c.nome)).join(", ")} — confirme o valor final para registrar como gasto do mês.</div>
            <div class="mt-8"><button class="btn btn-gold btn-sm" onclick="App.go('cartoes')">Ver cartões</button></div>
          </div>
        </div>`;
        })()}

        <div class="kpi-shell mb-20">
          <div class="metric-card" style="border-top:3px solid var(--navy);">
            <div class="metric-label">Sobrou</div>
            <div class="metric-value" style="color:${disponivel < 0 ? "var(--red)" : "var(--navy)"};">${disponivel < 0 ? "-" : ""}${Calc.fmt(Math.abs(disponivel))}</div>
            <div class="metric-sub">${availableLabel}</div>
          </div>
          <div class="metric-card" style="border-top:3px solid var(--green);">
            <div class="metric-label">Entrou</div>
            <div class="metric-value" style="color:var(--green);">${Calc.fmt(diag.rendaBruta || renda)}</div>
            <div class="metric-sub">${entradas.length} entrada(s)</div>
          </div>
          <div class="metric-card" style="border-top:3px solid var(--navy);">
            <div class="metric-label">Saiu</div>
            <div class="metric-value">${Calc.fmt(diag.total)}</div>
            <div class="metric-sub">${diag.gastos.length} lançamento(s)</div>
          </div>
          <div class="metric-card" style="border-top:3px solid var(--teal);cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            <div class="metric-label">Separações do mês</div>
            <div class="metric-value" style="color:var(--teal-d);">${Calc.fmt(diag.totalSeparado || 0)}</div>
            <div class="metric-sub">${(diag.totalSeparado || 0) > 0 ? "Toque para ver o detalhe ▾" : "Nada separado ainda"}</div>
          </div>
          <div style="display:none;margin:-12px 0 16px 0;background:var(--surface);border-radius:0 0 12px 12px;padding:8px 12px;border:1px solid var(--grey-l);border-top:none;">
            ${
              diag.separacoesResumo.length
                ? diag.separacoesResumo
                    .map((s) => {
                      const st = FarolHelpers.sepCatStyle(s.categoria);
                      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--grey-l);">
              <span style="width:8px;height:8px;border-radius:50%;background:${st.cor};flex-shrink:0;"></span>
              <span style="flex:1;font-size:13px;color:var(--navy);font-weight:600;">${FarolHelpers.escapeHtml(s.nome)}</span>
              <span style="font-size:11px;color:${st.cor};background:${st.bg};padding:2px 6px;border-radius:20px;font-weight:700;">${st.label}</span>
              <span style="font-size:13px;font-weight:800;color:var(--teal-d);">${Calc.fmt(s.valor)}</span>
            </div>`;
                    })
                    .join("")
                : '<div style="font-size:13px;color:var(--grey);padding:4px 0;">Nenhuma separação registrada.</div>'
            }
          </div>
        </div>

        ${
          diag.separacoesResumo && diag.separacoesResumo.length > 0
            ? `
        <div class="card mb-20">
          <div style="font-weight:800;font-size:14px;color:var(--navy);margin-bottom:10px;">Separações do mês</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${diag.separacoesResumo
              .map((s) => {
                const st = FarolHelpers.sepCatStyle(s.categoria);
                return `
              <div class="flex justify-between items-center" style="padding:8px 12px;background:var(--surface-2);border-radius:8px;gap:8px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${st.cor};flex-shrink:0;"></span>
                <span style="flex:1;font-size:13px;font-weight:600;color:var(--navy);">${FarolHelpers.escapeHtml(s.nome)}</span>
                <span style="font-size:11px;color:${st.cor};background:${st.bg};padding:2px 7px;border-radius:20px;font-weight:700;">${st.label}</span>
                <span style="font-size:14px;font-weight:800;color:var(--teal-d);">${Calc.fmt(s.valor)}</span>
              </div>`;
              })
              .join("")}
          </div>
        </div>`
            : ""
        }

        <div class="analysis-summary mb-20">
          <div class="smart-note">
            <h4> Status principal do ciclo</h4>
            <p><strong>${status.titulo}.</strong> ${status.resumo}</p>
            <div class="decision-actions">
              <button class="btn btn-primary btn-sm" onclick="App.go('analise')">Ver análise completa →</button>
              <button class="btn btn-ghost btn-sm" onclick="App.go('meumes')">Abrir lançamentos</button>
            </div>
          </div>
          <div class="decision-card">
            <div class="decision-kicker">Direção recomendada</div>
            <h4>${direction.titulo}</h4>
            <p class="decision-body">${direction.texto}</p>
            <div class="box box-gold mt-12"><p class="body-text" style="margin:0;font-size:13px;"><strong>Princípio do mês:</strong> ${contextual.titulo} — ${contextual.ref}</p></div>
          </div>
        </div>

        <div class="dashboard-grid-strong mb-20">
          <div class="decision-card">
            <div class="decision-kicker">Decisão do mês</div>
            ${decisao ? `<h4>${FarolHelpers.escapeHtml(decisao)}</h4><p class="decision-body">Essa decisão precisa continuar visível para não virar intenção esquecida.</p>` : `<h4>Nenhuma decisão registrada</h4><p class="decision-body">Você já viu os números. Agora precisa assumir um compromisso claro com o próximo ciclo.</p>`}
            <div class="decision-actions">
              <button class="btn btn-primary btn-sm" onclick="App.go('decisao')">${decisao ? "Revisar decisão" : "Registrar decisão"}</button>
              <button class="btn btn-ghost btn-sm" onclick="App.go('analise')">Voltar à análise</button>
            </div>
          </div>

          <div class="challenge-card">
            <span class="challenge-tag">Desafio do mês · ${challenge.tag}</span>
            <h4 style="font-size:16px;font-weight:800;color:var(--navy);margin:12px 0 8px;">${challenge.title}</h4>
            <p class="decision-body">${challenge.desc}</p>
            <div class="box box-light mt-12"><p class="body-text" style="margin:0;font-size:13px;"><strong>Por que existe:</strong> ${challenge.why}</p></div>
          </div>
        </div>

        ${
          nextRelease
            ? `
        <div class="card-soft mb-20">
          <div class="flex justify-between items-center" style="gap:12px;flex-wrap:wrap;">
            <div>
              <div class="text-xs text-gold mb-8" style="font-weight:800;letter-spacing:.1em;text-transform:uppercase;">Próximo valor a ser liberado</div>
              <div style="font-size:18px;font-weight:800;color:var(--navy);">${FarolHelpers.escapeHtml(nextRelease.parcela.nome)} · ${Calc.fmt(nextRelease.snap.valorLivre)}/mês</div>
              <div class="text-sm text-grey mt-4">Fica disponível em <strong>${FarolHelpers.releaseTimingLabel(nextRelease.snap.liberaEm)}</strong>${nextRelease.snap.mesesParaLiberar === 0 ? " · já no próximo fechamento" : ` · em ${nextRelease.snap.mesesParaLiberar} mês(es)`}.</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="App.go('parcelas')">Ver parcelas →</button>
          </div>
          <div class="box box-gold mt-12"><p class="body-text" style="margin:0;font-size:13px;"><strong>${releaseAdvice.title}:</strong> ${releaseAdvice.desc}</p></div>
        </div>`
            : ""
        }

        ${
          earnedMedals.length > 0
            ? `
        <div class="dashboard-medals">
          <div class="dashboard-medals-header">
            <div class="dashboard-medals-title"> Conquistas reais (${earnedMedals.length}/${Medals.definitions.length})</div>
            <button class="btn btn-ghost btn-sm" onclick="App.go('conquistas')">Ver todas →</button>
          </div>
          <div class="medals-row">
            ${earnedMedals
              .slice(-6)
              .map(
                (m) => `
              <div class="mini-medal" title="${m.name}: ${m.desc}">
                <div class="mini-medal-icon">${getMedalSvg(m.icon, 22, "#0D8F6E")}</div>
                <div class="mini-medal-name">${m.name}</div>
              </div>
            `,
              )
              .join("")}
            ${earnedMedals.length > 6 ? `<div class="mini-medal"><div class="mini-medal-icon" style="background:var(--surface-2);font-size:16px;font-weight:800;color:var(--grey);">+${earnedMedals.length - 6}</div><div class="mini-medal-name">mais</div></div>` : ""}
          </div>
        </div>`
            : ""
        }

        <div class="dashboard-grid-strong mb-20">
          <div class="card-soft">
            <div class="flex justify-between items-center mb-16">
              <div style="font-size:15px;font-weight:800;color:var(--navy);">Entradas do mês</div>
              <button class="btn btn-ghost btn-sm" onclick="App.openModal('renda')">+ Nova entrada</button>
            </div>
            ${(diag.totalSeparado || 0) > 0 ? `<div class="box box-light mb-12"><p class="body-text" style="margin:0;font-size:13px;"><strong>Antes de organizar:</strong> Entradas ${Calc.fmt(diag.rendaBruta || 0)} · Separado ${Calc.fmt(diag.totalSeparado || 0)} · Base real ${Calc.fmt(renda)}</p>${diag.separacoesResumo && diag.separacoesResumo.length ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">${diag.separacoesResumo.map((s) => `<span class="badge" style="background:var(--surface);color:var(--navy);border:1px solid var(--grey-l);">${FarolHelpers.escapeHtml(s.nome)} · ${Calc.fmt(s.valor)}</span>`).join("")}</div>` : ""}</div>` : ""}
            ${
              entradas.length
                ? entradas
                    .map(
                      (e) => `
              <div class="gasto-row">
                <div><div class="gasto-desc">${FarolHelpers.escapeHtml(e.origem || "Entrada")}</div><div class="gasto-date">${FarolHelpers.formatDate(e.data)}${e.totalSeparado > 0 ? ` · separado ${Calc.fmt(e.totalSeparado)} · base ${Calc.fmt(e.baseAposSeparacao)}` : ""}</div></div>
                <span class="chip chip-f">R</span>
                <div class="gasto-valor">${Calc.fmt(e.valor)}</div>
                <div></div>
              </div>${
                e.totalSeparado > 0
                  ? `<div class="box box-light" style="margin:8px 0 12px 0;padding:10px 12px;"><div class="text-xs text-grey mb-4" style="font-weight:700;letter-spacing:.04em;text-transform:uppercase;">Separado desta entrada</div>${e.separacoes
                      .map((s) => {
                        const bruto = parseFloat(e.valor) || 0;
                        const raw = parseFloat(s.valor || 0) || 0;
                        const val =
                          s.tipo === "percentual" ? bruto * (raw / 100) : raw;
                        return `<div class="text-xs text-grey" style="margin-bottom:4px;"><strong style="color:var(--navy);">${FarolHelpers.escapeHtml(s.nome || "Separação")}</strong> · ${s.tipo === "percentual" ? raw + "%" : Calc.fmt(raw)} · ${Calc.fmt(val)}</div>`;
                      })
                      .join("")}</div>`
                  : ""
              }`,
                    )
                    .join("")
                : `<div class="text-sm text-grey">Nenhuma entrada lançada.</div>`
            }
          </div>

          <div class="goal-spotlight">
            <div class="text-xs text-gold mb-10" style="font-weight:800;letter-spacing:.1em;text-transform:uppercase;">Objetivo em destaque</div>
            ${
              obj
                ? `
              <div class="goal-headline">
                <div><div class="obj-name">${FarolHelpers.escapeHtml(obj.nome)}</div><div class="obj-meta">${FarolHelpers.goalStatus(obj)} · prazo ${FarolHelpers.goalDueLabel(obj)}</div></div>
                <span class="obj-priority ${obj.prioridade || "media"}">${obj.prioridade || "média"}</span>
              </div>
              <div class="goal-inline-progress">
                <div class="progress-wrap" style="height:10px;"><div class="progress-bar" style="width:${Calc.objPct(obj)}%;background:linear-gradient(90deg,var(--teal),var(--teal-b));height:100%;border-radius:999px;"></div></div>
                <strong>${Math.round(Calc.objPct(obj))}%</strong>
              </div>
              <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
                <div class="card-sm" style="flex:1;"><div class="text-xs text-grey mb-4">Acumulado</div><div style="font-weight:800;color:var(--green);">${Calc.fmt(obj.valorPago || 0)}</div></div>
                <div class="card-sm" style="flex:1;"><div class="text-xs text-grey mb-4">Falta</div><div style="font-weight:800;color:var(--navy);">${Calc.fmt(Math.max((obj.valor || 0) - (obj.valorPago || 0), 0))}</div></div>
              </div>
              <div style="margin-top:14px;"><button class="btn btn-gold btn-sm btn-full" onclick="App.openGoalFundingModal(${idx})">Aplicar valor ao objetivo</button></div>
            `
                : `<div class="empty-state" style="padding:24px 0;"><div class="empty-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg></div><div class="empty-title" style="font-size:16px;">Nenhum objetivo ainda</div><div class="empty-sub" style="font-size:13px;">Crie um objetivo para dar direção ao seu dinheiro.</div><button class="btn btn-outline btn-sm" onclick="App.go('objetivos')">Criar objetivo</button></div>`
            }
          </div>
        </div>

        <div class="achievement-card">
          ${getMedalSvg ? `<div class="achievement-icon-box" style="background-image:none;display:flex;align-items:center;justify-content:center;">${getMedalSvg(conquista.icon || "star", 22, "#0D8F6E")}</div>` : `<div class="achievement-icon-box"></div>`}
          <h4 style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:8px;">${conquista.title}</h4>
          <p style="font-size:13px;color:var(--grey);line-height:1.65;">${conquista.text}</p>
        </div>
      </div>`;
      };

      Screens.meumes = function () {
        return Screens.meumesSimples();
      };

      // ─── MEU MÊS — MODO SIMPLES (caderno digital) ────────────
      Screens.meumesSimples = function () {
        const key = App.getActiveCycleKey
          ? App.getActiveCycleKey()
          : Calc.cicloAtual();
        const ciclo = FarolHelpers.syncRecurring(key);
        const gastos = ciclo.gastos || [];
        const gastosVirtuais = Calc.cardVirtualGastos(key);
        const gastosDisplay = [...gastos, ...gastosVirtuais];
        const cartoesAll = Store.get("cartoes") || [];
        const entradas = Calc.entradasNoMes(ciclo);
        const diag = Calc.diagnosticoCiclo(key);
        const { renda, total, disponivel, status } = diag;
        const mesLabel = FarolHelpers.monthLabelByKey(key);
        const pagamentos = FarolHelpers.pagamentosResumo(gastosDisplay);
        const direction = FarolHelpers.isCurrentKey(key)
          ? Calc.direcaoRecomendada(key)
          : null;

        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div><div class="topbar-title">Meu Mês</div><div class="topbar-sub">${mesLabel} — registre o que entrou e o que saiu. Simples assim.</div></div>
          <div class="topbar-actions">
            <button class="btn btn-ghost btn-sm" onclick="App.openModal('renda')">+ Entrada</button>
            <button class="btn btn-ghost btn-sm" onclick="App.openModal('separar')">+ Separar valor</button>
            <button class="btn btn-ghost btn-sm" onclick="App.copiarMesAnterior()">Copiar mês anterior</button>
            <button class="btn btn-primary btn-sm" onclick="App.openModal('gasto')">+ Saída</button>
          </div>
        </div>

        <div class="month-nav">
          <button class="month-nav-btn" onclick="App.shiftMonth(-1)">←</button>
          <div class="month-nav-label">${mesLabel}</div>
          <button class="month-nav-btn" onclick="App.shiftMonth(1)">→</button>
        </div>

        <div class="grid-2 mb-16" style="gap:10px;">
          <div class="card-dark" style="cursor:pointer;" onclick="App.openModal('renda')">
            <div class="metric-label" style="color:rgba(255,255,255,.4);">ENTROU</div>
            <div style="font-size:24px;font-weight:800;color:var(--teal-b);margin-top:4px;">${Calc.fmt(diag.rendaBruta || renda)}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:4px;">${diag.rendaBruta || renda ? `${entradas.length} entrada(s)` : "Toque para registrar"}</div>
          </div>
          <div class="card" onclick="App.openModal('gasto')" style="cursor:pointer;">
            <div class="metric-label">SAIU</div>
            <div style="font-size:24px;font-weight:800;color:var(--navy);margin-top:4px;">${Calc.fmt(total)}</div>
            <div style="font-size:11px;color:var(--grey);margin-top:4px;">${gastosDisplay.length} lançamento(s)</div>
          </div>
        </div>

        ${
          pagamentos.qtdVencidos > 0
            ? `
        <div class="alert-item danger mb-16">
          <div>
            <div class="alert-title">${pagamentos.qtdVencidos > 1 ? `${pagamentos.qtdVencidos} contas venceram` : "Uma conta venceu"} e ${pagamentos.qtdVencidos > 1 ? "ainda não foram marcadas" : "ainda não foi marcada"} como pagas</div>
            <div class="alert-desc">Total vencido: ${Calc.fmt(pagamentos.totalVencido)}. Se já pagou, marque o lançamento abaixo. Se não, regularize o quanto antes.</div>
          </div>
        </div>`
            : ""
        }

        ${
          renda > 0
            ? `<div class="card mb-16" style="background:${disponivel < 0 ? "var(--red-t)" : "var(--grn-t)"};border-color:${disponivel < 0 ? "rgba(197,59,49,.2)" : "rgba(18,122,92,.2)"};padding:14px 18px;">
          <div style="font-size:12px;font-weight:700;color:var(--grey);text-transform:uppercase;letter-spacing:.06em;">Sobrou</div>
          <div style="font-size:26px;font-weight:800;color:${disponivel < 0 ? "var(--red)" : "var(--green)"};">${disponivel < 0 ? "-" : ""}${Calc.fmt(Math.abs(disponivel))}</div>
          <span class="widget-sinal ${status.tipo}" style="margin-top:8px;display:inline-flex;">${status.label}</span>
          ${pagamentos.qtdPendentes > 0 ? `<div style="font-size:12px;color:var(--grey);margin-top:10px;">Ainda falta pagar <strong style="color:var(--navy);">${Calc.fmt(pagamentos.faltaPagar)}</strong> (${pagamentos.qtdPendentes} conta${pagamentos.qtdPendentes > 1 ? "s" : ""})</div>` : gastos.length > 0 ? `<div style="font-size:12px;color:var(--green);margin-top:10px;">Tudo pago até agora ✓</div>` : ""}
        </div>`
            : ""
        }

        ${
          direction
            ? `<div class="card-soft mb-16">
          <span class="eyebrow">para este mês</span>
          <div style="font-weight:800;font-size:14px;color:var(--navy);margin-bottom:4px;">${FarolHelpers.escapeHtml(direction.titulo)}</div>
          <p class="text-sm text-grey" style="margin:0;line-height:1.6;">${FarolHelpers.escapeHtml(direction.texto)}</p>
        </div>`
            : ""
        }

        <div class="card mb-16">
          <div class="flex justify-between items-center mb-12">
            <div style="font-weight:800;font-size:15px;color:var(--navy);">Separações</div>
            <button class="btn btn-gold btn-sm" onclick="App.openModal('separar')">+ Separar valor</button>
          </div>
          ${(() => {
            // Monta lista unificada: separações das entradas + avulsas do mês
            const _cat = (n) => {
              const nl = n.toLowerCase().trim();
              if (["dízimo", "dizimo"].includes(nl)) return "devolucao";
              if (["oferta", "ajuda familiar", "doação", "doacao"].includes(nl))
                return "oferta";
              const mem = Store.get("categorias_separacao") || {};
              return mem[nl] || "futuro";
            };
            const itens = [];
            // Da entrada (vinculadas à renda)
            Calc.entradasNoMes(ciclo).forEach((f) => {
              (f.separacoes || []).forEach((s) => {
                const bruto = parseFloat(f.valor) || 0;
                const raw = parseFloat(s.valor || 0) || 0;
                const val = s.tipo === "percentual" ? bruto * (raw / 100) : raw;
                if (val > 0)
                  itens.push({
                    nome: s.nome || "Separação",
                    valor: val,
                    data: f.data,
                    origem: "entrada",
                    categoria: s.categoria || _cat(s.nome || ""),
                  });
              });
            });
            // Avulsas do mês
            (ciclo.separacoes || []).forEach((s, sIdx) => {
              itens.push({
                nome: s.nome || "Separação",
                valor: parseFloat(s.valor) || 0,
                data: s.data,
                origem: "avulsa",
                idx: sIdx,
                categoria: s.categoria || _cat(s.nome || ""),
              });
            });
            if (!itens.length) return "";
            // Ordena por data
            itens.sort((a, b) => (a.data || "").localeCompare(b.data || ""));
            const totalGeral = itens.reduce((s, i) => s + i.valor, 0);
            return `
            <div style="display:flex;flex-direction:column;gap:2px;">
              ${itens
                .map((s) => {
                  const st = FarolHelpers.sepCatStyle(s.categoria);
                  return `<div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--grey-xl);">
                  <span style="width:8px;height:8px;border-radius:50%;background:${st.cor};flex-shrink:0;"></span>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:600;color:var(--navy);">${FarolHelpers.escapeHtml(s.nome)}</div>
                    <div style="font-size:11px;color:var(--grey);">${FarolHelpers.formatDate(s.data)} · <span style="color:${st.cor};font-weight:700;">${st.label}</span>${s.origem === "entrada" ? " · da entrada" : ""}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                    <span style="font-size:15px;font-weight:800;color:var(--teal-d);">${Calc.fmt(s.valor)}</span>
                    ${s.origem === "avulsa" ? `<button class="gasto-delete" onclick="App.deleteSeparacaoMes('${key}',${s.idx})" style="opacity:.5;">×</button>` : ""}
                  </div>
                </div>`;
                })
                .join("")}
            </div>
            <div style="border-top:2px solid var(--teal);padding-top:12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:800;color:var(--navy);font-size:13px;">TOTAL SEPARADO</span>
              <span style="font-size:20px;font-weight:800;color:var(--teal-d);">${Calc.fmt(totalGeral)}</span>
            </div>`;
          })()}
          ${
            diag.totalSeparado === 0
              ? `
            <div class="empty-state" style="padding:20px 0;">
              <div class="empty-sub" style="font-size:13px;">Nada separado ainda neste mês. Que tal guardar uma parte para dízimo, reserva ou investimento?</div>
              <button class="btn btn-gold btn-sm" onclick="App.openModal('separar')">+ Separar valor</button>
            </div>
          `
              : ""
          }
        </div>

        ${(() => {
          // ── Fluxo de Caixa por Janela de Recebimento ─────────────────
          const todasEntradas = Calc.entradasNoMes(ciclo);
          if (todasEntradas.length === 0) return "";

          const dayOf = (dateStr) => {
            if (!dateStr) return 1;
            const parts = dateStr.split("-");
            return parseInt(parts[2] || "1", 10);
          };

          const fmt = Calc.fmt.bind(Calc);
          const CORTE = 20;

          // Todos os gastos: reais + virtuais de cartão (faturas)
          const todosGastos = [...gastos, ...gastosVirtuais];

          // Para cartões virtuais, a janela é definida pelo dia de FECHAMENTO (não vencimento).
          // Se o fechamento ocorre antes do corte (dia 20), a fatura é paga na janela 1.
          const cartoes = Store.get("cartoes") || [];
          const cartaoJanelaDia = (g) => {
            if (g.virtual && g.cartaoId) {
              const c = cartoes.find((x) => x.id === g.cartaoId);
              if (c)
                return (
                  parseInt(c.diaFechamento, 10) ||
                  parseInt(c.fechamento, 10) ||
                  dayOf(g.data)
                );
            }
            return dayOf(g.data);
          };

          // Divide por janela de vencimento — cartões usam dia de fechamento como critério
          const gastos1 = todosGastos.filter((g) => cartaoJanelaDia(g) < CORTE);
          const gastos2 = todosGastos.filter(
            (g) => cartaoJanelaDia(g) >= CORTE,
          );

          const sumVal = (arr) =>
            arr.reduce((s, x) => s + (parseFloat(x.valor) || 0), 0);
          const sumPend = (arr) =>
            arr
              .filter((g) => !g.pago)
              .reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);

          // Entradas: divide por data. Se entrada não tem data ou tem dia < 20 → janela 1.
          // Se a entrada tem dia >= 20 → janela 2.
          // Caso especial: se TODAS as entradas têm dia < 20, distribui a renda
          // proporcionalmente (60% janela 1, 40% janela 2) para não zerar o saldo da janela 2.
          const ent1raw = todasEntradas.filter((f) => dayOf(f.data) < CORTE);
          const ent2raw = todasEntradas.filter((f) => dayOf(f.data) >= CORTE);

          // Se não há entrada com dia >= 20, tenta deduzir pelo nome ("vale", "adiantamento")
          let ent1 = ent1raw,
            ent2 = ent2raw;
          if (ent2raw.length === 0 && ent1raw.length > 1) {
            // Separa por nome: entradas com "vale" ou "adiantamento" vão para janela 2
            const valeWords = ["vale", "adiantamento", "quinzena", "parcela"];
            ent2 = ent1raw.filter((f) =>
              valeWords.some((w) => (f.origem || "").toLowerCase().includes(w)),
            );
            ent1 = ent1raw.filter((f) => !ent2.includes(f));
            if (ent2.length === 0) {
              // Sem pista de nome: usa a primeira entrada como janela 1, restantes como janela 2
              ent1 = [ent1raw[0]];
              ent2 = ent1raw.slice(1);
            }
          }

          const totalEnt1 = sumVal(ent1);
          const totalEnt2 = sumVal(ent2);
          const totalGas1 = sumVal(gastos1);
          const totalGas2 = sumVal(gastos2);
          const saldo1 = totalEnt1 - totalGas1;
          // Saldo da janela 2 considera o que sobrou da janela 1
          const saldo2 = saldo1 + totalEnt2 - totalGas2;

          // ── Previsão mês seguinte ──────────────────────────────────────
          const [yearN, monthN] = key.split("-").map(Number);
          const nextDate = new Date(yearN, monthN + 1, 1);
          const nextKey = `${nextDate.getFullYear()}-${nextDate.getMonth()}`;
          // Busca ciclo do próximo mês (sem syncRecurring para não poluir)
          const ciclosAll = Store.get("ciclos") || {};
          const proximoCiclo = ciclosAll[nextKey] || {};
          const proximasEntradas = Calc.entradasNoMes(proximoCiclo);
          const totalProximo = sumVal(proximasEntradas);

          const renderEntrada = (f) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-bottom:1px solid var(--grey-xl);">
              <div style="display:flex;align-items:center;gap:8px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--teal-d)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                <span style="font-size:13px;color:var(--grey);">${FarolHelpers.escapeHtml(f.origem || "Entrada")} · dia ${dayOf(f.data)}</span>
              </div>
              <span style="font-size:14px;font-weight:700;color:var(--teal-d);">+${fmt(parseFloat(f.valor) || 0)}</span>
            </div>`;

          const renderGasto = (g) => {
            const cartoesList = Store.get("cartoes") || [];
            let diaLabel = `dia ${dayOf(g.data)}`;
            if (g.virtual && g.cartaoId) {
              const c = cartoesList.find((x) => x.id === g.cartaoId);
              if (c) {
                const fech =
                  parseInt(c.diaFechamento, 10) || parseInt(c.fechamento, 10);
                const venc =
                  parseInt(c.diaVencimento, 10) || parseInt(c.vencimento, 10);
                const [ano, mes] = (g.data || "").split("-").map(Number);
                const fmtData = (dia) => {
                  const d = new Date(ano, mes - 1, dia);
                  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                };
                diaLabel =
                  fech && venc
                    ? `fecha ${fmtData(fech)} · vence ${fmtData(venc)}`
                    : fech
                      ? `fecha ${fmtData(fech)}`
                      : `vence ${fmtData(venc || dayOf(g.data))}`;
              }
            }
            return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 4px;border-bottom:1px solid var(--grey-xl);opacity:${g.pago ? ".45" : "1"};">
              <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                <span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:${g.pago ? "var(--green)" : "var(--grey-l)"};"></span>
                <span style="font-size:13px;color:var(--navy);${g.pago ? "text-decoration:line-through;" : ""}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${FarolHelpers.escapeHtml(g.descricao)}</span>
                <span style="font-size:11px;color:var(--grey);flex-shrink:0;">${diaLabel}</span>
              </div>
              <span style="font-size:13px;font-weight:700;color:${g.pago ? "var(--grey)" : "var(--navy)"};flex-shrink:0;">-${fmt(parseFloat(g.valor) || 0)}</span>
            </div>`;
          };

          const renderSaldo = (saldo, pendente, gastosList, extra) => {
            const cor = saldo >= 0 ? "var(--green)" : "var(--red)";
            const label = saldo >= 0 ? "sobra" : "falta";
            return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 4px 2px;margin-top:6px;border-top:1.5px solid var(--navy);">
              <div>
                <span style="font-size:11px;font-weight:800;color:var(--navy);text-transform:uppercase;letter-spacing:.05em;">Saldo desta janela</span>
                ${pendente > 0 ? `<div style="font-size:11px;color:var(--grey);margin-top:2px;">Falta pagar ${fmt(pendente)}</div>` : gastosList.length > 0 ? `<div style="font-size:11px;color:var(--green);margin-top:2px;">Tudo pago ✓</div>` : ""}
                ${extra || ""}
              </div>
              <div style="text-align:right;">
                <div style="font-size:20px;font-weight:800;color:${cor};">${saldo < 0 ? "-" : ""}${fmt(Math.abs(saldo))}</div>
                <div style="font-size:11px;color:${cor};font-weight:600;">${label} após contas</div>
              </div>
            </div>`;
          };

          // Monta blocos
          const pend1 = sumPend(gastos1);
          const pend2 = sumPend(gastos2);
          // Label do saldo da janela 2: mostra de onde vem o acumulado
          const extraSaldo2 =
            saldo1 !== 0
              ? `<div style="font-size:11px;color:var(--grey);margin-top:2px;">Inclui ${saldo1 >= 0 ? "+" : ""}${fmt(saldo1)} da janela anterior</div>`
              : "";

          // Previsão próximo mês
          const proximoLabel = FarolHelpers.monthLabelByKey
            ? FarolHelpers.monthLabelByKey(nextKey)
            : nextKey;
          const proximoHtml = `
            <div style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--grey-l);">
              <div style="font-size:11px;font-weight:800;color:var(--grey);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Prévia — ${proximoLabel}</div>
              ${
                totalProximo > 0
                  ? `
                ${proximasEntradas
                  .map(
                    (f, fi) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 4px;border-bottom:1px solid var(--grey-xl);">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    <span style="font-size:12px;color:var(--grey);">${FarolHelpers.escapeHtml(f.origem || "Entrada")} · dia ${dayOf(f.data)}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:13px;font-weight:700;color:var(--teal-d);opacity:.7;">+${fmt(parseFloat(f.valor) || 0)}</span>
                    <button onclick="App.openModal('editarEntradaPrevista',${JSON.stringify({ key: nextKey, idx: fi, origem: f.origem || "Entrada", valor: f.valor, data: f.data })})" style="background:none;border:1px solid var(--grey-l);border-radius:6px;padding:3px 8px;font-size:11px;color:var(--grey);cursor:pointer;">editar</button>
                  </div>
                </div>`,
                  )
                  .join("")}
                <div style="display:flex;justify-content:space-between;padding:8px 4px 0;margin-top:4px;">
                  <span style="font-size:11px;font-weight:800;color:var(--navy);text-transform:uppercase;letter-spacing:.04em;">Total previsto</span>
                  <span style="font-size:15px;font-weight:800;color:var(--teal-d);">+${fmt(totalProximo)}</span>
                </div>
              `
                  : `
                <div style="font-size:12px;color:var(--grey);padding:6px 4px;">
                  Sem entradas cadastradas para ${proximoLabel}.
                  <button class="btn btn-ghost btn-sm" style="margin-left:8px;font-size:11px;" onclick="App.activeCycleKey='${nextKey}';App.go('meumes');setTimeout(()=>App.openModal('renda'),120)">+ Cadastrar</button>
                </div>
              `
              }
            </div>`;

          return `
          <div class="card mb-16">
            <div style="font-weight:800;font-size:15px;color:var(--navy);margin-bottom:16px;">Fluxo por recebimento</div>

            <div style="margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <div style="width:3px;height:18px;background:var(--teal);border-radius:2px;flex-shrink:0;"></div>
                <span style="font-size:12px;font-weight:800;color:var(--navy);text-transform:uppercase;letter-spacing:.05em;">1ª entrada · dia 5</span>
                <span style="font-size:11px;color:var(--grey);">contas que vencem até dia 19</span>
              </div>
              ${ent1.map(renderEntrada).join("")}
              ${gastos1
                .sort((a, b) => (a.data || "").localeCompare(b.data || ""))
                .map(renderGasto)
                .join("")}
              ${renderSaldo(saldo1, pend1, gastos1, "")}
            </div>

            <div style="border-top:1px dashed var(--grey-l);margin:8px 0 14px;"></div>

            <div style="margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <div style="width:3px;height:18px;background:var(--teal);border-radius:2px;flex-shrink:0;"></div>
                <span style="font-size:12px;font-weight:800;color:var(--navy);text-transform:uppercase;letter-spacing:.05em;">2ª entrada · dia 20</span>
                <span style="font-size:11px;color:var(--grey);">contas do dia 20 em diante</span>
              </div>
              ${ent2.map(renderEntrada).join("")}
              ${gastos2
                .sort((a, b) => (a.data || "").localeCompare(b.data || ""))
                .map(renderGasto)
                .join("")}
              ${renderSaldo(saldo2, pend2, gastos2, extraSaldo2)}
            </div>

            ${proximoHtml}
          </div>`;
        })()}



        <div class="card mb-16">
          <div class="flex justify-between items-center mb-12">
            <div style="font-weight:800;font-size:15px;color:var(--navy);">Lançamentos</div>
            <div class="flex gap-8">
              <button class="btn btn-ghost btn-sm" onclick="App.copiarMesAnterior()">Copiar anterior</button>
              <button class="btn btn-primary btn-sm" onclick="App.openModal('gasto')">+ Adicionar</button>
            </div>
          </div>
          ${
            gastosDisplay.length === 0
              ? `
            <div class="empty-state" style="padding:24px 0;">
              <div class="empty-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg></div>
              <div class="empty-title" style="font-size:15px;">Nenhum lançamento</div>
              <div class="empty-sub" style="font-size:13px;">Adicione suas contas fixas ou copie o mês anterior</div>
              <div class="flex gap-8 justify-center" style="flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm" onclick="App.openModal('gasto')">+ Adicionar gasto</button>
                <button class="btn btn-ghost btn-sm" onclick="App.copiarMesAnterior()">Copiar mês anterior</button>
              </div>
            </div>
          `
              : `
            <div style="display:flex;flex-direction:column;gap:2px;">
              ${gastosDisplay
                .map((g, gIdx) => {
                  if (g.virtual) {
                    const cardIdx = cartoesAll.findIndex(
                      (c) => c.id === g.cartaoId,
                    );
                    if (g.origem === "cartao-previsto") {
                      return `
                  <div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--grey-xl);" class="gasto-row-simples">
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:14px;font-weight:600;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${FarolHelpers.escapeHtml(g.descricao)} <span style="font-size:10px;font-weight:700;color:var(--teal-d);background:var(--teal-lt);padding:1px 6px;border-radius:5px;">previsto</span></div>
                      <div style="font-size:11px;color:var(--grey);">Vence ${FarolHelpers.formatDate(g.data)} · previsão lançada no cartão</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                      <button class="btn btn-ghost btn-sm" style="font-size:12px;padding:5px 10px;" onclick="App.openModal('faturaVencimento',${cardIdx})">${Calc.fmt(g.valor)}</button>
                    </div>
                  </div>`;
                    }
                    return `
                  <div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--grey-xl);" class="gasto-row-simples">
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:14px;font-weight:600;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${FarolHelpers.escapeHtml(g.descricao)} <span style="font-size:10px;font-weight:700;color:var(--amber);background:var(--amb-t);padding:1px 6px;border-radius:5px;">em aberto</span></div>
                      <div style="font-size:11px;color:var(--grey);">Atualizado automaticamente · ainda não fechou</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                      <button class="btn btn-ghost btn-sm" style="font-size:12px;padding:5px 10px;" onclick="App.openModal('faturaUpdate',${cardIdx})">${Calc.fmt(g.valor)}</button>
                    </div>
                  </div>`;
                  }
                  const vencido = FarolHelpers.isVencido(g);
                  return `
                <div style="display:flex;align-items:center;gap:10px;padding:10px 8px;border-bottom:1px solid var(--grey-xl);${vencido ? "background:var(--red-t);border-radius:8px;margin:2px 0;" : ""}" class="gasto-row-simples">
                  <button onclick="App.toggleGastoPago('${key}',${gIdx})" title="${g.pago ? "Marcar como não pago" : "Marcar como pago"}" style="width:22px;height:22px;border-radius:50%;border:2px solid ${g.pago ? "var(--green)" : vencido ? "var(--red)" : "var(--grey-l)"};background:${g.pago ? "var(--green)" : "transparent"};display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;padding:0;">
                    ${g.pago ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ""}
                  </button>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:600;color:${g.pago ? "var(--grey)" : "var(--navy)"};${g.pago ? "text-decoration:line-through;" : ""}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${FarolHelpers.escapeHtml(g.descricao)}${(g.recorrencia === "parcelado_fixo" || g.recorrencia === "parcelado") && g.parcelaNum && g.totalParcelas ? ` <span style="font-size:10px;font-weight:700;color:var(--cat-p);background:var(--cat-p-t);padding:1px 6px;border-radius:5px;">${g.parcelaNum}/${g.totalParcelas}</span>` : ""}${g.origem === "cartao" ? ` <span style="font-size:10px;font-weight:700;color:var(--teal-d);background:var(--teal-lt);padding:1px 6px;border-radius:5px;">fatura</span>` : ""}</div>
                    <div style="font-size:11px;color:${vencido ? "var(--red)" : "var(--grey)"};font-weight:${vencido ? 700 : 400};">${vencido ? "Vencido · " : ""}${g.pago ? `Pago em ${FarolHelpers.formatDate(g.pagoEm)}` : `Vence ${FarolHelpers.formatDate(g.data)}`}${g.recorrencia === "mensal" ? " · recorrente" : ""}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                    <button onclick="App.editarValorGasto('${key}',${gIdx})" style="font-size:15px;font-weight:800;color:var(--navy);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:8px;border:1.5px solid transparent;transition:.15s;" onmouseover="this.style.borderColor='var(--grey-l)'" onmouseout="this.style.borderColor='transparent'">${Calc.fmt(g.valor)}</button>
                    <button class="gasto-delete" onclick="App.deleteGasto('${key}',${gIdx})" title="Excluir" style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>
                  </div>
                </div>`;
                })
                .join("")}
            </div>
            <div style="border-top:2px solid var(--navy);padding-top:12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:800;color:var(--navy);font-size:13px;">TOTAL</span>
              <span style="font-size:20px;font-weight:800;color:var(--navy);">${Calc.fmt(total)}</span>
            </div>
          `
          }
        </div>

        <div class="flex gap-8 mb-16" style="flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm flex-1" onclick="App.openModal('renda')">+ Registrar entrada</button>
          <button class="btn btn-primary btn-sm flex-1" onclick="App.go('analise')">Ver análise →</button>
        </div>
      </div>`;
      };

      Screens.meumesDetalhado = function () {
        const key = App.getActiveCycleKey
          ? App.getActiveCycleKey()
          : Calc.cicloAtual();
        const ciclo = FarolHelpers.syncRecurring(key);
        const gastos = ciclo.gastos || [];
        const entradas = Calc.entradasNoMes(ciclo);
        const diag = Calc.diagnosticoCiclo(key);
        const { renda, total, blocos, disponivel, status } = diag;
        const mesLabel = FarolHelpers.monthLabelByKey(key);
        const decisao = (ciclo.decisao || "").trim();
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div><div class="topbar-title">Meu Mês</div><div class="topbar-sub">${mesLabel} · Modo detalhado</div></div>
          <div class="topbar-actions">
            <button class="btn btn-ghost btn-sm" onclick="App.openModal('renda')">+ Entrada</button>
            <button class="btn btn-primary btn-sm" onclick="App.openModal('gasto')">+ Gasto</button>
          </div>
        </div>

        <div class="month-nav">
          <button class="month-nav-btn" onclick="App.shiftMonth(-1)">←</button>
          <div class="month-nav-label">${mesLabel}</div>
          <button class="month-nav-btn" onclick="App.shiftMonth(1)">→</button>
        </div>

        ${decisao ? `<div class="decision-card mb-20"><div class="decision-kicker">Compromisso visível</div><h4>${FarolHelpers.escapeHtml(decisao)}</h4><p class="decision-body">A decisão do mês fica aqui porque compromisso bom é o que aparece no fluxo principal.</p><div class="decision-actions"><button class="btn btn-ghost btn-sm" onclick="App.go('decisao')">Editar decisão</button></div></div>` : ""}

        <div class="grid-2 mb-20" style="gap:10px;">
          <div class="card-dark" style="cursor:pointer;" onclick="App.openModal('renda')">
            <div class="metric-label" style="color:rgba(255,255,255,.4);">ENTRADAS</div>
            <div style="font-size:26px;font-weight:800;color:var(--teal-b);margin-top:6px;">${Calc.fmt(renda)}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.3);margin-top:6px;">${renda ? `${entradas.length} entrada(s)` : "Toque para registrar"}</div>
          </div>
          <div class="card" onclick="App.openModal('gasto')" style="cursor:pointer;">
            <div class="metric-label">SAÍDAS</div>
            <div style="font-size:26px;font-weight:800;color:var(--navy);margin-top:6px;">${Calc.fmt(total)}</div>
            <div style="font-size:12px;color:var(--grey);margin-top:6px;">${gastos.length} lançamento(s)</div>
          </div>
        </div>

        ${
          renda > 0
            ? `
        <div class="card mb-20">
          <div class="flex justify-between items-center" style="gap:12px;flex-wrap:wrap;">
            <div>
              <div style="font-size:13px;color:var(--grey);margin-bottom:6px;">Leitura do ciclo</div>
              <div style="font-size:28px;font-weight:800;color:${disponivel >= 0 ? "var(--navy)" : "var(--red)"};">${disponivel < 0 ? "-" : ""}${Calc.fmt(Math.abs(disponivel))}</div>
              <div style="font-size:12px;color:var(--grey);margin-top:4px;">${disponivel === 0 && blocos.construcao > 0 ? "Tudo foi direcionado com construção" : disponivel === 0 ? "Sem folga e sem construção" : "Livre para decidir"}</div>
            </div>
            <div>
              <span class="widget-sinal ${status.tipo}">${status.label}</span>
              <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                ${blocos.consumo > 0 ? `<span class="chip chip-e">Consumo ${Calc.pct((blocos.consumo / renda) * 100)}</span>` : ""}
                ${blocos.compromissos > 0 ? `<span class="chip chip-p">Compromissos ${Calc.pct((blocos.compromissos / renda) * 100)}</span>` : ""}
                ${blocos.construcao > 0 ? `<span class="chip chip-f">Construção ${Calc.pct((blocos.construcao / renda) * 100)}</span>` : ""}
              </div>
            </div>
          </div>
        </div>`
            : ""
        }

        <div class="card">
          <div class="flex justify-between items-center mb-16">
            <div style="font-weight:800;font-size:15px;color:var(--navy);">Lançamentos</div>
            <button class="btn btn-primary btn-sm" onclick="App.openModal('gasto')">+ Gasto</button>
          </div>
          ${
            gastos.length === 0
              ? `<div class="empty-state" style="padding:28px 0;"><div class="empty-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg></div><div class="empty-title">Nenhum gasto registrado</div><div class="empty-sub">Comece lançando os gastos deste mês</div><button class="btn btn-primary" onclick="App.openModal('gasto')">+ Primeiro lançamento</button></div>`
              : `
            ${Store.get("categorias")
              .map((cat) => {
                const itens = gastos.filter((g) => g.categoria === cat.id);
                if (!itens.length) return "";
                return `
              <div style="margin-bottom:18px;">
                <div class="flex items-center gap-8 mb-10">
                  <span class="chip chip-${cat.id.toLowerCase()}">${cat.nome}</span>
                  <span style="margin-left:auto;font-size:13px;font-weight:800;color:${cat.cor};">${Calc.fmt(itens.reduce((s, i) => s + i.valor, 0))}</span>
                </div>
                ${itens
                  .map(
                    (g) => `
                  <div class="gasto-row">
                    <div><div class="gasto-desc">${FarolHelpers.escapeHtml(g.descricao)}${g.recorrencia === "parcelado_fixo" && g.parcelaNum && g.totalParcelas ? ` <span style="font-size:11px;font-weight:700;color:var(--cat-p);background:var(--cat-p-t);padding:2px 7px;border-radius:6px;margin-left:4px;">${g.parcelaNum}/${g.totalParcelas}</span>` : ""}</div><div class="gasto-date">${FarolHelpers.formatDate(g.data)}${g.subcategoria ? " · " + FarolHelpers.escapeHtml(g.subcategoria) : ""}${g.recorrencia === "mensal" ? " · recorrente" : ""}${g.recorrencia === "parcelado_fixo" ? " · parcelado" : ""}</div></div>
                    <span class="chip chip-${g.categoria.toLowerCase()}">${g.categoria}</span>
                    <div class="gasto-valor">${Calc.fmt(g.valor)}</div>
                    <button class="gasto-delete" onclick="App.deleteGasto('${key}',${gastos.indexOf(g)})">×</button>
                  </div>`,
                  )
                  .join("")}
              </div>`;
              })
              .join("")}
            <div style="border-top:2px solid var(--navy);padding-top:14px;display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
              <span style="font-weight:800;color:var(--navy);font-size:14px;">TOTAL</span>
              <span style="font-size:22px;font-weight:800;color:var(--navy);">${Calc.fmt(total)}</span>
            </div>`
          }
        </div>
        <div style="margin-top:20px;"><button class="btn btn-primary btn-full btn-lg" onclick="App.go('analise')">Ver análise do mês →</button></div>
        <div class="card-soft mt-12" style="padding:12px 16px;">
          <div class="flex justify-between items-center">
            <span class="text-xs text-grey">Modo: <strong style="color:var(--navy);">Detalhado</strong></span>
            <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 10px;" onclick="App.alternarModoLancamento()">Trocar para simplificado</button>
          </div>
        </div>
      </div>`;
      };

      Screens.analise = function () {
        const key = App.getActiveCycleKey
          ? App.getActiveCycleKey()
          : Calc.cicloAtual();
        const ciclo = Calc.getCiclo(key);
        const diag = Calc.diagnosticoCiclo(key);
        const gastos = diag.gastos;
        const { renda, total, disponivel, status } = diag;
        const dicas = Calc.dicasPorSinal(status.tipo);
        const alerts = Calc.alertasEstruturais(key);
        const goalInfo = FarolHelpers.suggestGoalMessage();
        const direction = Calc.direcaoRecomendada(key);
        const contextual = FarolHelpers.contextualPrinciple(key);
        if (!renda && !gastos.length)
          return `<div class="page-wrap"><div class="topbar desktop-only"><div class="topbar-title">Análise</div></div><div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg></div><div class="empty-title">Sem dados para analisar</div><div class="empty-sub">Registre sua renda e gastos em Meu Mês para ver a análise.</div><button class="btn btn-primary" onclick="App.go('meumes')">Ir para Meu Mês</button></div></div>`;
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only"><div><div class="topbar-title">Análise do Mês</div><div class="topbar-sub">Status principal, alertas estruturais e direção recomendada — cada parte com uma função clara.</div></div></div>

        <div class="analise-hero mb-20">
          <div class="metric-label" style="color:rgba(255,255,255,.4);">STATUS PRINCIPAL DO CICLO</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin:16px 0;">
            <div><div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:6px;">ENTRADAS</div><div style="font-size:24px;font-weight:800;color:var(--teal-b);">${Calc.fmt(renda)}</div></div>
            <div><div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:6px;">SAÍDAS</div><div style="font-size:24px;font-weight:800;color:#fff;">${Calc.fmt(total)}</div></div>
            <div><div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:6px;">LIVRE / FALTA</div><div style="font-size:24px;font-weight:800;color:${disponivel >= 0 ? "#7EE7C6" : "#FCA5A5"};">${disponivel < 0 ? "-" : ""}${Calc.fmt(Math.abs(disponivel))}</div></div>
          </div>
          <div class="flex items-center justify-between" style="gap:10px;flex-wrap:wrap;">
            <span class="widget-sinal ${status.tipo}">${status.label}</span>
            <span style="color:rgba(255,255,255,.7);font-size:13px;">${status.titulo}</span>
          </div>
          <div style="margin-top:12px;color:rgba(255,255,255,.72);font-size:13px;line-height:1.65;">${status.resumo}</div>
        </div>

        ${goalInfo.text ? `<div class="card-gold mb-20"><span class="eyebrow">objetivo e direção</span><div style="font-size:14px;color:var(--navy);line-height:1.65;">${goalInfo.text}</div>${goalInfo.positive && goalInfo.idx >= 0 ? `<button class="btn btn-gold mt-12 btn-sm" onclick="App.openGoalFundingModal(${goalInfo.idx})">Aplicar valor ao objetivo</button>` : ""}</div>` : ""}

        <div class="analysis-main-grid mb-20">
          <div class="card">
            <div style="font-weight:800;font-size:15px;color:var(--navy);margin-bottom:18px;">Para onde foi o dinheiro</div>
            ${
              diag.totalSeparado > 0 || diag.separacoesResumo.length > 0
                ? `
              <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--grey);margin-bottom:8px;">Separado para o futuro</div>
              ${diag.separacoesResumo
                .map((s) => {
                  const pctS =
                    renda > 0 ? (s.valor / diag.rendaBruta) * 100 : 0;
                  return `
              <div class="cat-bar-row">
                <div class="cat-bar-label">
                  <span class="cat-bar-name">${FarolHelpers.escapeHtml(s.nome)}</span>
                  <span class="cat-bar-meta"><strong style="color:var(--teal-d);">${Calc.fmt(s.valor)}</strong> <span style="color:var(--grey-l);">/ ${Calc.pct(pctS)}</span></span>
                </div>
                <div class="progress-wrap"><div class="progress-bar" style="width:${Math.min(pctS, 100)}%;background:var(--teal);"></div></div>
              </div>`;
                })
                .join("")}
              <div class="mb-16"></div>
            `
                : ""
            }
            <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--grey);margin-bottom:8px;">Maiores saídas do mês</div>
            ${
              gastos.length === 0
                ? `<div class="text-sm text-grey">Nenhum gasto registrado ainda.</div>`
                : gastos
                    .slice()
                    .sort((a, b) => b.valor - a.valor)
                    .slice(0, 5)
                    .map((g) => {
                      const pctG = total > 0 ? (g.valor / total) * 100 : 0;
                      return `
              <div class="cat-bar-row">
                <div class="cat-bar-label">
                  <span class="cat-bar-name">${FarolHelpers.escapeHtml(g.descricao)}${g.virtual ? ` <span style="font-size:10px;font-weight:700;color:var(--amber);">· em aberto</span>` : ""}</span>
                  <span class="cat-bar-meta"><strong style="color:var(--navy);">${Calc.fmt(g.valor)}</strong> <span style="color:var(--grey-l);">/ ${Calc.pct(pctG)}</span></span>
                </div>
                <div class="progress-wrap"><div class="progress-bar" style="width:${Math.min(pctG, 100)}%;background:var(--navy);"></div></div>
              </div>`;
                    })
                    .join("")
            }
          </div>
          <div class="card">
            <div style="font-weight:800;font-size:15px;color:var(--navy);margin-bottom:14px;">Direção recomendada</div>
            <div class="smart-note" style="padding:16px;margin-bottom:12px;">
              <h4 style="margin-bottom:6px;">${direction.titulo}</h4>
              <p>${direction.texto}</p>
            </div>
            <div style="font-weight:800;font-size:14px;color:var(--navy);margin-bottom:10px;">Alertas estruturais</div>
            <div class="structural-list">
              ${alerts.map((a) => `<div class="structural-pill" style="border-left:3px solid ${a.tipo === "danger" ? "var(--red)" : a.tipo === "warn" ? "var(--amber)" : a.tipo === "success" ? "var(--green)" : "var(--blue)"}"><div><strong>${a.titulo}</strong><span><br>${a.desc}</span></div></div>`).join("")}
            </div>
          </div>
        </div>

        <div class="analysis-main-grid mb-20">
          <div>
            <div style="font-weight:800;font-size:15px;color:var(--navy);margin-bottom:14px;">Dicas práticas</div>
            ${dicas.map((d) => `<div class="dica-card"><div class="dica-icon">${d.icon}</div><div class="dica-title">${d.titulo}</div><div class="dica-text">${d.texto}</div></div>`).join("")}
          </div>
          <div class="card">
            <div style="font-weight:800;font-size:15px;color:var(--navy);margin-bottom:14px;">Princípio bíblico contextual</div>
            <div class="principle-ref">${contextual.ref}</div>
            <div style="font-size:16px;font-weight:800;color:var(--navy);margin-bottom:8px;">${contextual.titulo}</div>
            <p class="body-text"><em>"${contextual.versiculo}"</em></p>
            <p class="principle-context"><strong>Contexto:</strong> ${contextual.contexto}</p>
            <div class="box box-gold"><p class="body-text" style="margin:0;font-size:13px;"><strong>Aplicação prática:</strong> ${contextual.aplicacao}</p></div>
          </div>
        </div>
        <div class="mt-20"><button class="btn btn-primary btn-full btn-lg" onclick="App.go('decisao')">Registrar minha decisão</button></div>
      </div>`;
      };

      Screens.decisao = function () {
        const key = App.getActiveCycleKey
          ? App.getActiveCycleKey()
          : Calc.cicloAtual();
        const ciclo = Calc.getCiclo(key);
        const decisao = ciclo.decisao || "";
        const direction = Calc.direcaoRecomendada(key);
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only"><div class="topbar-title">Decisão do Mês</div><div class="topbar-sub">A análise só muda a vida quando vira compromisso escrito e visível.</div></div>
        <div class="card-gold mb-20">
          <span class="eyebrow">o que precisa acontecer aqui</span>
          <p class="body-text" style="margin:0;"><strong>${direction.titulo}.</strong> ${direction.texto}</p>
        </div>
        <div class="card">
          <label class="label">Minha decisão para este ciclo</label>
          <textarea id="decisao-text" class="form-textarea" rows="7" placeholder="Ex: Vou cortar R$ 150 do variável, direcionar R$ 200 à construção e não assumir novas parcelas até abrir folga real.">${FarolHelpers.escapeHtml(decisao)}</textarea>
          <button class="btn btn-primary btn-full mt-16" onclick="App.saveDecisao()">Salvar decisão</button>
        </div>
        ${decisao ? `<div class="decision-card mt-16"><div class="decision-kicker">Compromisso atual</div><h4>${FarolHelpers.escapeHtml(decisao)}</h4><p class="decision-body">Essa decisão também aparece no Dashboard e em Meu Mês para não ficar escondida.</p></div>` : ""}
      </div>`;
      };

      Screens.evolucao = function () {
        const data = FarolHelpers.evolutionInsights();
        const now = new Date();
        const y = now.getFullYear();
        const valid = data.lines.filter(
          (l) => l.active && (l.renda > 0 || l.rendaBruta > 0),
        );
        const maxBase = Math.max(
          1,
          ...valid.map((l) =>
            Math.max(l.rendaBruta || l.renda, l.total, Math.abs(l.sobra)),
          ),
        );
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only"><div><div class="topbar-title">Minha Evolução ${y}</div><div class="topbar-sub">Uma leitura para decidir melhor, não apenas para acumular números.</div></div></div>

        <div class="evolucao-shell mb-20">
          <div class="evo-insight">
            <span class="eyebrow">leitura anual</span>
            <h3>${data.headline}</h3>
            <p>${data.summary}</p>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1);font-size:13px;color:rgba(255,255,255,.65);line-height:1.7;">
              ${data.best ? `<strong style="color:#fff;">Melhor mês:</strong> ${data.best.name} com ${Calc.fmt(data.best.sobra)} livres.<br>` : ""}
              ${data.worst ? `<strong style="color:#fff;">Mês mais crítico:</strong> ${data.worst.name} com ${Calc.fmt(data.worst.sobra)} de resultado.` : ""}
              <strong style="color:#fff;">O que precisa mudar agora:</strong> ${data.nowAction}
            </div>
          </div>
          <div class="card">
            <div style="font-size:16px;font-weight:800;color:var(--navy);margin-bottom:16px;">Painel de decisão</div>
            <div class="evo-kpis" style="grid-template-columns:1fr 1fr;gap:10px;">
              <div class="evo-kpi"><div class="k">Meses lidos</div><div class="v">${data.monthsWithData}</div><div class="s">Meses com renda registrada</div></div>
              <div class="evo-kpi"><div class="k">Média livre</div><div class="v" style="color:${data.avgSobra >= 0 ? "var(--green)" : "var(--red)"};">${Calc.fmt(data.avgSobra)}</div><div class="s">Resultado médio por mês</div></div>
              <div class="evo-kpi"><div class="k">Meses separando</div><div class="v" style="color:var(--green);">${data.futureMonths}</div><div class="s">Meses com algo separado para o futuro</div></div>
              <div class="evo-kpi"><div class="k">Meses críticos</div><div class="v" style="color:${data.negativeMonths ? "var(--red)" : "var(--navy)"};">${data.negativeMonths}</div><div class="s">Meses no negativo</div></div>
            </div>
          </div>
        </div>

        <div class="grid-2 mb-20">
          <div class="card">
            <div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:16px;">Entradas × saídas por mês</div>
            <div style="display:flex;align-items:flex-end;gap:8px;height:160px;overflow-x:auto;padding-bottom:8px;">
              ${data.lines
                .filter((l) => l.active)
                .map(
                  (l) => `
                <div class="chart-bar-v" style="min-width:36px;">
                  <div style="display:flex;align-items:flex-end;gap:3px;height:136px;">
                    <div style="width:14px;height:${Math.max(6, Math.round(((l.rendaBruta || l.renda) / maxBase) * 128))}px;background:var(--teal);border-radius:5px 5px 0 0;" title="Entrou ${Calc.fmt(l.rendaBruta || l.renda)}"></div>
                    <div style="width:10px;height:${Math.max(4, Math.round((l.total / maxBase) * 128))}px;background:var(--cat-p);opacity:.7;border-radius:5px 5px 0 0;" title="Saídas ${Calc.fmt(l.total)}"></div>
                  </div>
                  <div class="chart-bar-v-label">${l.name}</div>
                </div>`,
                )
                .join("")}
            </div>
            <div class="flex gap-12 mt-8 text-sm text-grey">
              <span><span style="display:inline-block;width:10px;height:10px;background:var(--teal);border-radius:2px;margin-right:4px;"></span>Entradas</span>
              <span><span style="display:inline-block;width:10px;height:10px;background:var(--cat-p);border-radius:2px;margin-right:4px;opacity:.7;"></span>Saídas</span>
            </div>
          </div>
          <div class="card">
            <div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:14px;">Leitura para agir</div>
            <div class="smart-note mb-12" style="padding:16px;">
              <h4 style="margin-bottom:6px;">Padrão dominante</h4>
              <p>${data.futureMonths >= Math.max(1, Math.ceil(data.monthsWithData / 2)) ? "Você está mais perto de um padrão de construção do que de simples sobrevivência financeira." : "Você ainda está registrando mais do que consolidando um padrão de amadurecimento."}</p>
            </div>
            <div class="smart-note" style="padding:16px;">
              <h4 style="margin-bottom:6px;">Pergunta útil</h4>
              <p>${data.negativeMonths > 0 ? "O que precisa ser removido ou renegociado para que os meses críticos parem de se repetir?" : "O que falta para transformar meses bons em rotina?"}</p>
            </div>
          </div>
        </div>

        <div class="evo-month-card">
          <div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:16px;">Linha do ano</div>
          <div class="evo-month-list">
            ${data.lines
              .map((l) => {
                const ratio =
                  l.renda > 0
                    ? Math.min(
                        100,
                        Math.round((Math.max(l.sobra, 0) / l.renda) * 100),
                      )
                    : 0;
                const color =
                  l.sobra > 0
                    ? "var(--green)"
                    : l.sobra < 0
                      ? "var(--red)"
                      : "var(--amber)";
                const semDados = l.renda === 0 && l.rendaBruta === 0;
                const status = semDados
                  ? "Sem dados"
                  : l.sobra > 0 && l.construcaoTotal > 0
                    ? "Construiu com folga"
                    : l.sobra > 0
                      ? "Sobrou, mas faltou direção"
                      : l.sobra < 0
                        ? "Pressionado"
                        : "No limite";
                return `
              <div class="evo-month-row" style="opacity:${l.active ? 1 : 0.38};">
                <div style="font-weight:800;color:var(--navy);">${l.name}</div>
                <div>
                  <div class="evo-month-meta mb-6">Entrou ${Calc.fmt(l.rendaBruta || l.renda)} · Saiu ${Calc.fmt(l.total)} · Sobrou <strong style="color:${color};">${Calc.fmt(l.sobra)}</strong></div>
                  <div class="evo-month-bar"><div class="evo-month-fill" style="width:${ratio}%;background:${l.sobra > 0 ? "linear-gradient(90deg,var(--green),#34d399)" : "linear-gradient(90deg,var(--amber),#fbbf24)"};"></div></div>
                </div>
                <div class="evo-month-meta">${status}<br>${l.construcaoTotal > 0 ? `Separado: ${Calc.fmt(l.construcaoTotal)}` : "Nada separado"}</div>
              </div>`;
              })
              .join("")}
          </div>
        </div>
      </div>
      <style>@media(max-width:1024px){.evolucao-shell{grid-template-columns:1fr!important;}}</style>`;
      };

      Screens.planoContas = function () {
        const cats = Store.get("categorias") || [];
        const plano = Store.get("planoContas") || {};
        const tiposSeparacao = Store.get("separacaoSugestoes") || [];
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div><div class="topbar-title">Plano de Contas</div><div class="topbar-sub">Gerencie as categorias, subcategorias e tipos de separação usados nos seus lançamentos.</div></div>
        </div>
        <div class="card-gold mb-20">
          <span class="eyebrow">como funciona</span>
          <p class="body-text" style="margin:0;">As subcategorias aparecem na hora de registrar um gasto. Você também pode criar uma nova diretamente pelo campo de lançamento.</p>
        </div>
        ${cats
          .map((c) => {
            const subs = plano[c.id] || [];
            return `
        <div class="card mb-16">
          <div class="flex justify-between items-center mb-16" style="gap:12px;">
            <div class="flex items-center gap-8">
              <span class="chip chip-${c.id.toLowerCase()}" style="font-size:13px;padding:5px 12px;">${c.nome}</span>
              <span class="text-xs text-grey">${subs.length} subcategoria(s)</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="App.addSubcatUI('${c.id}')">+ Adicionar</button>
          </div>
          <div id="subcat-list-${c.id}">
            ${
              subs.length === 0
                ? `<div class="text-sm text-grey">Nenhuma subcategoria cadastrada.</div>`
                : subs
                    .map(
                      (s, i) => `
              <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--grey-xl);">
                <span style="font-size:14px;color:var(--navy);">${FarolHelpers.escapeHtml(s)}</span>
                <button class="gasto-delete" onclick="App.deleteSubcat('${c.id}',${i})" title="Excluir subcategoria">×</button>
              </div>`,
                    )
                    .join("")
            }
          </div>
          <div id="subcat-form-${c.id}" class="hidden mt-12">
            <div class="flex gap-8 items-center">
              <input id="subcat-input-${c.id}" class="form-input flex-1" placeholder="Nome da subcategoria" onkeydown="if(event.key==='Enter')App.saveSubcat('${c.id}')">
              <button class="btn btn-primary btn-sm" onclick="App.saveSubcat('${c.id}')">Salvar</button>
              <button class="btn btn-ghost btn-sm" onclick="App.cancelSubcatUI('${c.id}')">Cancelar</button>
            </div>
          </div>
        </div>`;
          })
          .join("")}

        <!-- ── TIPOS DE SEPARAÇÃO ── -->
        <div class="card mb-16">
          <div class="flex justify-between items-center mb-16" style="gap:12px;">
            <div class="flex items-center gap-8">
              <span class="chip" style="font-size:13px;padding:5px 12px;background:var(--teal-lt);color:var(--teal-d);">Separações</span>
              <span class="text-xs text-grey">${tiposSeparacao.length} tipo(s) cadastrado(s)</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="App.addSepTipoUI()">+ Adicionar</button>
          </div>
          <p class="text-xs text-grey mb-12">Esses são os tipos que aparecem ao registrar uma separação dentro de uma entrada (ex: dízimo, reserva, investimento).</p>
          <div id="sep-tipo-list">
            ${
              tiposSeparacao.length === 0
                ? `<div class="text-sm text-grey">Nenhum tipo cadastrado.</div>`
                : tiposSeparacao
                    .map(
                      (s, i) => `
              <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--grey-xl);">
                <span style="font-size:14px;color:var(--navy);">${FarolHelpers.escapeHtml(s)}</span>
                <button class="gasto-delete" onclick="App.deleteSepTipo(${i})" title="Excluir tipo">×</button>
              </div>`,
                    )
                    .join("")
            }
          </div>
          <div id="sep-tipo-form" class="hidden mt-12">
            <div class="flex gap-8 items-center">
              <input id="sep-tipo-input" class="form-input flex-1" placeholder="Nome do tipo de separação" onkeydown="if(event.key==='Enter')App.saveSepTipo()">
              <button class="btn btn-primary btn-sm" onclick="App.saveSepTipo()">Salvar</button>
              <button class="btn btn-ghost btn-sm" onclick="App.cancelSepTipoUI()">Cancelar</button>
            </div>
          </div>
        </div>
      </div>`;
      };

      Screens.nuvem = function () {
        const s = CloudSync.status;
        const user = Store.get("user") || {};
        const statusMap = {
          disconnected: { color: "var(--grey)", label: "Não sincronizado" },
          connecting: { color: "var(--amber)", label: "Conectando…" },
          connected: {
            color: "var(--green)",
            label: "Sincronizado com sua conta",
          },
          syncing: { color: "var(--teal)", label: "Sincronizando…" },
          error: { color: "var(--red)", label: "Erro de sincronização" },
        };
        const sm = statusMap[s] || statusMap.disconnected;
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div><div class="topbar-title">Sua conta</div><div class="topbar-sub">Seus dados são salvos de forma segura e isolada, vinculados à sua conta.</div></div>
        </div>

        <div class="card mb-20" style="border-top:3px solid ${sm.color};">
          <div class="flex items-center justify-between" style="gap:12px;flex-wrap:wrap;">
            <div>
              <div class="metric-label">Status da sincronização</div>
              <div id="cloud-status-badge" style="font-size:18px;font-weight:800;color:${sm.color};">${sm.label}</div>
              <div class="text-xs text-grey mt-4">${FarolHelpers.escapeHtml(user.email || "")}</div>
            </div>
            <div class="flex gap-8" style="flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm" onclick="App.cloudPull()">Restaurar da nuvem</button>
            </div>
          </div>
        </div>

        <div class="card-soft mb-20">
          <span class="eyebrow">Como funciona</span>
          <p class="body-text" style="margin-bottom:0;">Seus dados são salvos automaticamente na nuvem sempre que você faz uma alteração. Eles ficam protegidos por <strong>autenticação segura</strong> e <strong>isolamento por conta</strong> — apenas você pode acessar seus próprios registros, em qualquer dispositivo, fazendo login com seu e-mail e senha.</p>
        </div>

        <div class="card mb-20">
          <span class="eyebrow">Conta</span>
          <div class="flex items-center justify-between mt-8" style="flex-wrap:wrap;gap:12px;">
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--navy);">${FarolHelpers.escapeHtml(user.nome || "Usuário")}</div>
              <div class="text-xs text-grey mt-4">${FarolHelpers.escapeHtml(user.email || "")}</div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="App.logout()">Sair</button>
          </div>
          <div style="border-top:1px solid var(--grey-xl);margin-top:16px;padding-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" onclick="App.desativarConta()" style="color:var(--amber);border-color:var(--amber);">Desativar conta</button>
            <button class="btn btn-outline btn-sm" onclick="App.excluirConta()" style="color:var(--red);border-color:var(--red);">Excluir conta</button>
          </div>
        </div>

        <div class="card" id="workspace-members-card">
          <span class="eyebrow">Membros do workspace</span>
          <div class="text-xs text-grey mt-4 mb-12">Convide pessoas para acessar os mesmos dados. Cada uma entra com seu próprio login.</div>
          <div id="members-list" style="margin-bottom:12px;">
            <div style="font-size:13px;color:var(--grey);">Carregando membros…</div>
          </div>
          <div class="flex gap-8" style="flex-wrap:wrap;">
            <input id="invite-email" type="email" class="form-input" placeholder="email@exemplo.com" style="flex:1;min-width:180px;font-size:14px;padding:10px 12px;">
            <button class="btn btn-primary btn-sm" onclick="App.inviteMember()">Convidar</button>
          </div>
          <div id="invite-msg" style="font-size:12px;margin-top:8px;"></div>
        </div>
      </div>`;
      };

      Screens.conquistas = function () {
        const earned = Medals.getEarned();
        const earnedIds = earned.map((m) => m.id);
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div><div class="topbar-title">Conquistas</div><div class="topbar-sub">Marcos reais de constância, disciplina e fidelidade na sua jornada financeira.</div></div>
          <div class="topbar-actions" style="align-items:center;">
            <div style="background:var(--teal-lt);padding:8px 16px;border-radius:10px;border:1px solid rgba(200,150,60,.2);">
              <span style="font-size:22px;font-weight:800;color:var(--teal-d);">${earned.length}</span>
              <span style="font-size:13px;color:var(--grey);margin-left:4px;">/ ${Medals.definitions.length}</span>
            </div>
          </div>
        </div>

        ${
          earned.length > 0
            ? `
        <div class="medal-celebration mb-20">
          <div class="medal-celebration-icon">${getMedalSvg(earned[earned.length - 1].icon, 28, "#47C9A8")}</div>
          <div class="medal-celebration-text">
            <h3>Última conquista: ${earned[earned.length - 1].name}</h3>
            <p>${earned[earned.length - 1].desc}</p>
          </div>
        </div>`
            : `
        <div class="card-gold mb-20">
          <span class="eyebrow">comece agora</span>
          <p class="body-text" style="margin:0;">Suas primeiras medalhas estão perto. Registre um gasto e crie um objetivo para começar sua jornada.</p>
        </div>`
        }

        <div class="medals-grid">
          ${Medals.definitions
            .map((m) => {
              const isE = earnedIds.includes(m.id);
              return `
            <div class="medal-card ${isE ? "earned" : "locked"}">
              <div class="medal-icon-wrap">
                ${isE ? getMedalSvg(m.icon, 26, "#0D8F6E") : getMedalLockSvg(26)}
                <div class="medal-tier" style="background:${isE ? Medals.tierColors[m.tier] : "var(--grey-l)"};">${isE ? Medals.tierEmoji[m.tier] : "·"}</div>
              </div>
              <div class="medal-name">${m.name}</div>
              <div class="medal-desc">${m.desc}</div>
              <div class="medal-status ${isE ? "earned" : "locked"}">${isE ? "Conquistada" : "Bloqueada"}</div>
            </div>`;
            })
            .join("")}
        </div>

        <div class="card mt-20">
          <span class="eyebrow">sobre as medalhas</span>
          <p class="body-text">As medalhas são ganhas automaticamente ao atingir marcos reais — não há como inflar ou comprar. Cada uma representa um hábito construído de verdade.</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;">
            <span style="font-size:13px;color:var(--grey);">${Medals.tierEmoji.bronze} Bronze — primeiro passo</span>
            <span style="font-size:13px;color:var(--grey);">${Medals.tierEmoji.silver} Prata — hábito em formação</span>
            <span style="font-size:13px;color:var(--grey);">${Medals.tierEmoji.gold} Ouro — consistência real</span>
            <span style="font-size:13px;color:var(--grey);">${Medals.tierEmoji.platinum} Platina — disciplina total</span>
          </div>
        </div>
      </div>`;
      };

      Screens.objetivos = function () {
        const objs = Store.get("objetivos") || [];
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div><div class="topbar-title">Objetivos</div><div class="topbar-sub">Defina o que você quer alcançar. Sem objetivo, o dinheiro perde direção.</div></div>
          <div class="topbar-actions"><button class="btn btn-primary btn-sm" onclick="App.openModal('objetivo')">+ Novo objetivo</button></div>
        </div>
        ${
          objs.length === 0
            ? `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg></div><div class="empty-title">Nenhum objetivo definido</div><div class="empty-sub">Crie seu primeiro objetivo para dar direção ao dinheiro e ganhar sua primeira medalha.</div><button class="btn btn-primary" onclick="App.openModal('objetivo')">+ Criar objetivo</button></div>`
            : objs
                .map(
                  (obj, i) => `
          <div class="obj-card">
            <div class="flex justify-between items-start mb-14">
              <div style="flex:1;">
                <div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:4px;">${FarolHelpers.escapeHtml(obj.nome)}</div>
                <div class="flex gap-8 items-center mt-4">
                  <span class="obj-priority ${obj.prioridade || "media"}">${obj.prioridade || "média"}</span>
                  <span style="font-size:12px;color:var(--grey);">${FarolHelpers.goalStatus(obj)} · prazo ${FarolHelpers.goalDueLabel(obj)}</span>
                </div>
              </div>
              <div class="flex gap-8">
                <button class="btn btn-ghost btn-sm" onclick="App.editObj(${i})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="App.deleteObj(${i})">Excluir</button>
              </div>
            </div>
            <div class="goal-inline-progress mb-12">
              <div class="progress-wrap" style="height:10px;flex:1;"><div class="progress-bar" style="width:${Calc.objPct(obj)}%;background:linear-gradient(90deg,var(--teal),var(--teal-b));height:100%;border-radius:999px;"></div></div>
              <strong style="font-size:14px;min-width:42px;text-align:right;">${Math.round(Calc.objPct(obj))}%</strong>
            </div>
            <div class="grid-3" style="gap:10px;">
              <div class="card-sm"><div class="text-xs text-grey mb-4">Meta</div><div style="font-weight:800;">${Calc.fmt(obj.valor || 0)}</div></div>
              <div class="card-sm"><div class="text-xs text-grey mb-4">Acumulado</div><div style="font-weight:800;color:var(--green);">${Calc.fmt(obj.valorPago || 0)}</div></div>
              <div class="card-sm"><div class="text-xs text-grey mb-4">Falta</div><div style="font-weight:800;color:${Calc.objPct(obj) >= 100 ? "var(--green)" : "var(--navy)"};">${Calc.objPct(obj) >= 100 ? "Concluído!" : Calc.fmt(Math.max((obj.valor || 0) - (obj.valorPago || 0), 0))}</div></div>
            </div>
            <div class="mt-12"><button class="btn btn-gold btn-sm" onclick="App.openGoalFundingModal(${i})">Aplicar valor</button></div>
          </div>`,
                )
                .join("")
        }
        <div class="mt-16"><button class="btn btn-outline btn-full" onclick="App.openModal('objetivo')">+ Novo objetivo</button></div>
      </div>`;
      };

      Screens.parcelas = function () {
        const parcelas = Store.get("parcelas") || [];
        const nextRelease = FarolHelpers.nextParcelRelease();
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div><div class="topbar-title">Parcelas e Dívidas</div><div class="topbar-sub">Registre compromissos mensais para saber quando terminam e quando o valor fica livre.</div></div>
          <div class="topbar-actions"><button class="btn btn-primary btn-sm" onclick="App.openModal('parcela')">+ Nova parcela</button></div>
        </div>
        ${
          parcelas.length === 0
            ? `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg></div><div class="empty-title">Nenhuma parcela registrada</div><div class="empty-sub">Registre financiamentos, carnês e dívidas para visualizar quando ficam livres.</div><button class="btn btn-primary" onclick="App.openModal('parcela')">+ Registrar parcela</button></div>`
            : `
        ${nextRelease ? `<div class="card-gold mb-20"><span class="eyebrow">mais próxima de terminar</span><div style="font-size:18px;font-weight:800;color:var(--navy);margin-bottom:6px;">${FarolHelpers.escapeHtml(nextRelease.parcela.nome)} libera ${Calc.fmt(nextRelease.snap.valorLivre)}/mês em ${FarolHelpers.releaseTimingLabel(nextRelease.snap.liberaEm)}</div><p class="body-text" style="margin:0;">${FarolHelpers.releaseUseSuggestion(nextRelease.snap.valorLivre).desc}</p></div>` : ""}
        ${parcelas
          .map((p, i) => {
            const snap = FarolHelpers.parcelSnapshot(p);
            if (!snap) return "";
            const inicio = snap.inicio;
            const fim = snap.fim;
            const restantes = snap.restantes;
            const pctFeit = snap.pctFeit;
            const sugestao = FarolHelpers.releaseUseSuggestion(snap.valorLivre);
            const cartoes = Store.get("cartoes") || [];
            const cartaoVinc =
              p.origem === "cartao"
                ? cartoes.find((c) => c.id === p.cartaoId)
                : null;
            return `
          <div class="parcela-card">
            <div class="parcela-header">
              <div class="parcela-info"><h4>${FarolHelpers.escapeHtml(p.nome)} <span style="font-size:11px;font-weight:700;color:var(--cat-p);background:var(--cat-p-t);padding:2px 7px;border-radius:6px;">${snap.decorridos}/${snap.total}</span></h4><div class="text-sm text-grey">${p.subcategoria ? `${p.subcategoria} · ` : ""} Vence dia ${p.diaVencimento || "—"}</div>${cartaoVinc ? `<div class="mt-4"><span style="font-size:10px;font-weight:700;color:var(--teal-d);background:var(--teal-lt);padding:2px 8px;border-radius:6px;">Incluso na fatura · ${FarolHelpers.escapeHtml(cartaoVinc.nome)}</span></div>` : p.origem === "cartao" ? `<div class="mt-4"><span style="font-size:10px;font-weight:700;color:var(--amber);background:var(--amb-t);padding:2px 8px;border-radius:6px;">Cartão não encontrado</span></div>` : ""}</div>
              <div class="flex gap-8 items-center">
                <div style="text-align:right;"><div style="font-size:18px;font-weight:800;color:var(--cat-p);">${Calc.fmt(p.valor)}/mês</div><div class="text-xs text-grey">${restantes} parcela(s) restante(s)</div></div>
                <button class="btn btn-danger btn-sm" onclick="App.deleteParcela(${i})">×</button>
              </div>
            </div>
            ${cartaoVinc ? `<div class="box box-light mb-12" style="font-size:12px;color:var(--grey);">Esta parcela já está incluída no valor da fatura do <strong style="color:var(--navy);">${FarolHelpers.escapeHtml(cartaoVinc.nome)}</strong> e não é somada de novo no total do mês.</div>` : ""}
            <div class="goal-inline-progress">
              <div class="progress-wrap" style="flex:1;"><div class="progress-bar" style="width:${pctFeit}%;background:var(--cat-p);"></div></div>
              <strong style="font-size:13px;">${pctFeit}%</strong>
            </div>
            <div class="flex gap-8 mt-12 text-sm text-grey" style="flex-wrap:wrap;">
              <span>Início: ${inicio.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
              <span>·</span>
              <span>Término: ${fim.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
              <span>·</span>
              <span>Total pago: ${Calc.fmt(snap.totalPago)}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;">
              <div class="card-sm"><div class="text-xs text-grey mb-4">Fica disponível em</div><div style="font-weight:800;color:var(--navy);">${FarolHelpers.releaseTimingLabel(snap.liberaEm)}</div></div>
              <div class="card-sm"><div class="text-xs text-grey mb-4">Valor liberado</div><div style="font-weight:800;color:var(--green);">${Calc.fmt(snap.valorLivre)}/mês</div></div>
            </div>
            <div class="box box-light mt-12"><p class="body-text" style="margin:0;font-size:13px;"><strong>${sugestao.title}:</strong> ${sugestao.desc}</p></div>
          </div>`;
          })
          .join("")}`
        }
        <div class="mt-16"><button class="btn btn-outline btn-full" onclick="App.openModal('parcela')">+ Nova parcela</button></div>
      </div>`;
      };

      Screens.recebimentos = function () {
        const recs = Store.get("recebimentos") || [];
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div><div class="topbar-title">Recebimentos</div><div class="topbar-sub">Configure suas fontes de renda. O valor real entra em Meu Mês quando recebido.</div></div>
          <div class="topbar-actions"><button class="btn btn-primary btn-sm" onclick="App.openModal('recebimento')">+ Novo recebimento</button></div>
        </div>
        <div class="card-gold mb-20">
          <span class="eyebrow">como funciona</span>
          <p class="body-text" style="margin:0;">Aqui você cadastra as <strong>origens</strong> do seu dinheiro. Quando ele chegar, registre o valor exato em <strong>Meu Mês → + Entrada</strong>.</p>
        </div>
        ${
          recs.length === 0
            ? `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg></div><div class="empty-title">Nenhum recebimento cadastrado</div><div class="empty-sub">Cadastre seu salário, freelances e outras fontes de renda.</div><button class="btn btn-primary" onclick="App.openModal('recebimento')">+ Cadastrar recebimento</button></div>`
            : recs
                .map(
                  (r, i) => `
          <div class="card mb-12">
            <div class="flex justify-between items-center">
              <div>
                <div style="font-size:16px;font-weight:800;color:var(--navy);">${FarolHelpers.escapeHtml(r.nome)}</div>
                <div class="text-sm text-grey mt-4">${r.tipo === "extra" ? "Renda extra" : `Fixo · todo dia ${r.dia || "—"}`}${r.valor ? ` · estimado ${Calc.fmt(r.valor)}` : ""}</div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="App.deleteRecebimento(${i})">Excluir</button>
            </div>
          </div>`,
                )
                .join("")
        }
        <div class="mt-16"><button class="btn btn-outline btn-full" onclick="App.openModal('recebimento')">+ Novo recebimento</button></div>
      </div>`;
      };

      Screens.cartoes = function () {
        const cartoes = Store.get("cartoes") || [];
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only">
          <div><div class="topbar-title">Cartões</div><div class="topbar-sub">Acompanhe o valor acumulado da fatura de cada cartão e atualize sempre que gastar.</div></div>
          <div class="topbar-actions"><button class="btn btn-primary btn-sm" onclick="App.openModal('cartao')">+ Novo cartão</button></div>
        </div>
        <div class="card-gold mb-20">
          <span class="eyebrow">como funciona</span>
          <p class="body-text" style="margin:0;">Você não precisa lançar cada compra. Sempre que gastar no cartão, abra aqui e <strong>atualize o valor total da fatura</strong>. Quando chegar o dia de fechamento, o app avisa para você confirmar o valor final do mês.</p>
        </div>
        ${
          cartoes.length === 0
            ? `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div><div class="empty-title">Nenhum cartão cadastrado</div><div class="empty-sub">Cadastre seus cartões de crédito para acompanhar o valor da fatura sem precisar lançar cada compra.</div><button class="btn btn-primary" onclick="App.openModal('cartao')">+ Cadastrar cartão</button></div>`
            : cartoes
                .map((c, i) => {
                  const st = FarolHelpers.cartaoStatus(c);
                  const hist = Array.isArray(c.historico) ? c.historico : [];
                  const ultimasAtualizacoes = hist.slice(-3).reverse();
                  const fatVenc = c.faturaVencimento;
                  const fatVencData =
                    fatVenc && fatVenc.data
                      ? FarolHelpers.formatDate(fatVenc.data)
                      : null;
                  const fatVencValor = fatVenc
                    ? parseFloat(fatVenc.valor) || 0
                    : 0;
                  return `
          <div class="card mb-16">
            ${
              st.pendenteFechamento
                ? `
            <div class="alert-item warn mb-16">
              <div>
                <div class="alert-title">Fatura fechou no dia ${st.fech}</div>
                <div class="alert-desc">O valor acumulado é ${Calc.fmt(c.faturaAtual || 0)}. Confirme para registrar como gasto deste mês e zerar a próxima fatura.</div>
                <div class="mt-8"><button class="btn btn-gold btn-sm" onclick="App.confirmarFechamentoFatura(${i})">Confirmar fechamento</button></div>
              </div>
            </div>`
                : ""
            }
            <div class="flex justify-between items-center mb-12" style="gap:12px;flex-wrap:wrap;">
              <div>
                <div style="font-size:16px;font-weight:800;color:var(--navy);">${FarolHelpers.escapeHtml(c.nome)}</div>
                <div class="text-sm text-grey mt-4">Fecha dia ${c.diaFechamento} · Vence dia ${c.diaVencimento}</div>
              </div>
              <div class="flex gap-8">
                <button class="btn btn-ghost btn-sm" onclick="App.openModal('cartao',${i})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="App.deleteCartao(${i})">Excluir</button>
              </div>
            </div>
            <div class="card-soft mb-12 text-center">
              <div class="text-xs text-grey mb-4">Fatura atual (acumulado)</div>
              <div style="font-size:28px;font-weight:800;color:var(--navy);">${Calc.fmt(c.faturaAtual || 0)}</div>
            </div>
            ${
              fatVencData
                ? `
            <div class="card-gold mb-12" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div>
                <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal-d);margin-bottom:4px;">Vence em</div>
                <div style="font-size:15px;font-weight:700;color:var(--navy);">${fatVencData}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal-d);margin-bottom:4px;">Valor previsto</div>
                <div style="font-size:15px;font-weight:700;color:var(--navy);">${Calc.fmt(fatVencValor)}</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="App.openModal('faturaVencimento',${i})" style="white-space:nowrap;">Editar</button>
            </div>`
                : `
            <button class="btn btn-outline btn-full mb-12" onclick="App.openModal('faturaVencimento',${i})">+ Lançar no próximo vencimento</button>`
            }
            <button class="btn btn-primary btn-full" onclick="App.openModal('faturaUpdate',${i})">Atualizar valor da fatura</button>
            ${
              ultimasAtualizacoes.length
                ? `
            <div class="mt-16">
              <div class="text-xs text-grey mb-8" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Últimas atualizações</div>
              ${ultimasAtualizacoes
                .map(
                  (h) => `
                <div class="flex justify-between items-center" style="padding:7px 0;border-bottom:1px solid var(--grey-xl);">
                  <span class="text-sm text-grey">${FarolHelpers.formatDate(h.data)}</span>
                  <span class="text-sm" style="font-weight:600;color:var(--navy);">${Calc.fmt(h.valorAnterior)} → ${Calc.fmt(h.valorNovo)} <span style="color:${h.diferenca >= 0 ? "var(--amber)" : "var(--green)"};">(${h.diferenca >= 0 ? "+" : ""}${Calc.fmt(h.diferenca)})</span></span>
                </div>`,
                )
                .join("")}
            </div>`
                : ""
            }
            ${
              Array.isArray(c.faturasFechadas) && c.faturasFechadas.length
                ? `
            <div class="mt-16">
              <div class="text-xs text-grey mb-8" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Faturas fechadas</div>
              ${c.faturasFechadas
                .slice(-3)
                .reverse()
                .map(
                  (f) => `
                <div class="flex justify-between items-center" style="padding:7px 0;border-bottom:1px solid var(--grey-xl);">
                  <span class="text-sm text-grey">${FarolHelpers.monthLabelByKey(f.mesRef)}</span>
                  <span class="text-sm" style="font-weight:700;color:var(--navy);">${Calc.fmt(f.valor)}</span>
                </div>`,
                )
                .join("")}
            </div>`
                : ""
            }
          </div>`;
                })
                .join("")
        }
        ${cartoes.length ? `<div class="mt-16"><button class="btn btn-outline btn-full" onclick="App.openModal('cartao')">+ Novo cartão</button></div>` : ""}
      </div>`;
      };

      Screens.principios = function () {
        const list = FarolHelpers.principlesCatalog();
        const contextual = FarolHelpers.contextualPrinciple(
          App.getActiveCycleKey ? App.getActiveCycleKey() : Calc.cicloAtual(),
        );
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only"><div><div class="topbar-title">Princípios Bíblicos</div><div class="topbar-sub">Versículo, contexto e aplicação prática ligados à vida financeira real.</div></div></div>
        <div class="card-gold mb-20">
          <span class="eyebrow">princípio do mês</span>
          <div class="principle-ref">${contextual.ref}</div>
          <div style="font-size:18px;font-weight:800;color:var(--navy);margin-bottom:8px;">${contextual.titulo}</div>
          <p class="body-text"><em>"${contextual.versiculo}"</em></p>
          <p class="principle-context"><strong>Contexto:</strong> ${contextual.contexto}</p>
          <p class="body-text" style="margin:0;"><strong>Aplicação prática:</strong> ${contextual.aplicacao}</p>
        </div>
        <div class="grid-2">
          ${list
            .map(
              (p) => `
            <div class="principle-card">
              <div class="principle-ref">${p.ref}</div>
              <div style="font-size:16px;font-weight:800;color:var(--navy);margin-bottom:8px;">${p.titulo}</div>
              <p class="body-text"><em>"${p.versiculo}"</em></p>
              <p class="principle-context"><strong>Contexto:</strong> ${p.contexto}</p>
              <div class="box box-gold mt-12"><p class="body-text" style="margin:0;font-size:13px;"><strong>Aplicação prática:</strong> ${p.aplicacao}</p></div>
            </div>`,
            )
            .join("")}
        </div>
      </div>`;
      };

      Screens["minha-conta"] = function () {
        const user = Store.get("user") || {};
        const trial = Store.get("trialDaysLeft");
        const isAdmin = Store.get("is_admin");
        return `
      <div class="screen-pad">
        <div class="card mb-16">
          <span class="eyebrow">Perfil</span>
          <div class="flex items-center gap-12 mt-12" style="flex-wrap:wrap;">
            <div style="width:52px;height:52px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;flex-shrink:0;">
              ${(user.nome || "U").charAt(0).toUpperCase()}
            </div>
            <div style="flex:1;">
              <div style="font-size:16px;font-weight:800;color:var(--navy);">${FarolHelpers.escapeHtml(user.nome || "Usuário")}</div>
              <div style="font-size:13px;color:var(--grey);margin-top:2px;">${FarolHelpers.escapeHtml(user.email || "")}</div>
              ${typeof trial === "number" ? `<div style="font-size:11px;color:var(--amber);margin-top:4px;font-weight:600;">Trial: ${trial} dia(s) restante(s)</div>` : ""}
            </div>
          </div>
        </div>

        <div class="card mb-16">
          <span class="eyebrow">Acesso</span>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
            <button class="btn btn-outline" onclick="App.redefinirSenha()" style="justify-content:flex-start;gap:10px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Redefinir senha
            </button>
            <button class="btn btn-outline" onclick="App.logout()" style="justify-content:flex-start;gap:10px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sair da conta
            </button>
            <button class="btn btn-outline" onclick="App.desativarConta()" style="justify-content:flex-start;gap:10px;color:var(--amber);border-color:var(--amber);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Desativar minha conta
            </button>
            <button class="btn btn-outline" onclick="App.excluirConta()" style="justify-content:flex-start;gap:10px;color:var(--red);border-color:var(--red);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Excluir minha conta
            </button>
          </div>
        </div>

        <div class="card mb-16">
          <span class="eyebrow">Workspace</span>
          <div class="text-xs text-grey mt-4 mb-12">${isAdmin ? "Convide pessoas para acessar os mesmos dados." : "Você pode convidar 1 pessoa para acessar os mesmos dados."}</div>
          <div style="margin-top:12px;">
            <div id="members-list" style="margin-bottom:12px;">
              <div style="font-size:13px;color:var(--grey);">Carregando membros…</div>
            </div>
            <div id="invite-form-wrap" class="flex gap-8" style="flex-wrap:wrap;">
              <input id="invite-email" type="email" class="form-input" placeholder="email@exemplo.com" style="flex:1;min-width:180px;font-size:14px;padding:10px 12px;">
              <button class="btn btn-primary btn-sm" onclick="App.inviteMember()">Convidar</button>
            </div>
            <div id="invite-msg" style="font-size:12px;margin-top:8px;"></div>
          </div>
        </div>
      </div>`;
      };

      Screens.admin = function () {
        return `
      <div class="screen-pad">
        <div class="grid-2 mb-16" style="gap:10px;" id="admin-stats">
          <div class="card-dark" style="text-align:center;padding:20px;">
            <div style="font-size:28px;font-weight:800;color:var(--teal-b);" id="admin-total">—</div>
            <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px;">Total usuários</div>
          </div>
          <div class="card" style="text-align:center;padding:20px;">
            <div style="font-size:28px;font-weight:800;color:var(--green);" id="admin-ativos">—</div>
            <div style="font-size:12px;color:var(--grey);margin-top:4px;">Ativos</div>
          </div>
          <div class="card" style="text-align:center;padding:20px;">
            <div style="font-size:28px;font-weight:800;color:var(--amber);" id="admin-trial">—</div>
            <div style="font-size:12px;color:var(--grey);margin-top:4px;">No trial</div>
          </div>
          <div class="card" style="text-align:center;padding:20px;">
            <div style="font-size:28px;font-weight:800;color:var(--red);" id="admin-expirando">—</div>
            <div style="font-size:12px;color:var(--grey);margin-top:4px;">Expiram em 7 dias</div>
          </div>
        </div>

        <div class="card mb-16">
          <div class="flex justify-between items-center mb-12">
            <div style="font-weight:800;font-size:15px;color:var(--navy);">Usuários</div>
            <div class="flex gap-8">
              <input id="admin-search" type="text" class="form-input" placeholder="Buscar…" style="font-size:13px;padding:6px 10px;width:140px;" oninput="App.adminFilter()">
              <select id="admin-filter-status" class="form-select" style="font-size:13px;padding:6px 10px;" onchange="App.adminFilter()">
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="free">Trial</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </div>
          </div>
          <div id="admin-users-list">
            <div style="text-align:center;padding:20px;color:var(--grey);font-size:13px;">Carregando…</div>
          </div>
        </div>
      </div>`;
      };

      Screens.suporte = function () {
        return `
      <div class="screen-pad">
        <div class="card-dark mb-16" style="padding:32px 24px;text-align:center;">
          <div style="font-size:13px;font-weight:700;letter-spacing:2px;color:var(--teal-b);margin-bottom:12px;">SUPORTE</div>
          <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;">Como podemos ajudar?</div>
          <div style="font-size:14px;color:rgba(255,255,255,.5);">Nossa equipe responde em até 24 horas nos dias úteis.</div>
        </div>

        <div class="card mb-16">
          <div style="font-weight:800;font-size:14px;color:var(--navy);margin-bottom:16px;">Fale conosco</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <a href="mailto:suporte@meumes.app" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--surface-2);border-radius:12px;text-decoration:none;">
              <div style="width:40px;height:40px;border-radius:10px;background:var(--teal);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div>
                <div style="font-size:14px;font-weight:700;color:var(--navy);">E-mail</div>
                <div style="font-size:12px;color:var(--grey);">suporte@meumes.app</div>
              </div>
              <svg style="margin-left:auto;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--grey-l)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <a href="https://wa.me/5500000000000" target="_blank" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--surface-2);border-radius:12px;text-decoration:none;">
              <div style="width:40px;height:40px;border-radius:10px;background:#25D366;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              </div>
              <div>
                <div style="font-size:14px;font-weight:700;color:var(--navy);">WhatsApp</div>
                <div style="font-size:12px;color:var(--grey);">Resposta mais rápida</div>
              </div>
              <svg style="margin-left:auto;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--grey-l)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
        </div>

        <div class="card">
          <div style="font-weight:800;font-size:14px;color:var(--navy);margin-bottom:16px;">Perguntas frequentes</div>
          ${[
            {
              p: "Como registrar uma entrada de renda?",
              r: 'Na tela Meu Mês, toque no card "ENTROU" para registrar sua renda do mês com as separações.',
            },
            {
              p: "Como compartilhar o app com minha família?",
              r: "Vá em Minha Conta → Workspace e convide pelo e-mail. Cada pessoa acessa com seu próprio login e vê os mesmos dados.",
            },
            {
              p: "Como redefinir minha senha?",
              r: "Vá em Minha Conta → Redefinir senha. Um link será enviado para o seu e-mail.",
            },
            {
              p: "Meus dados são seguros?",
              r: "Sim. Todos os dados são armazenados com criptografia e isolados por usuário. Ninguém além de você tem acesso.",
            },
            {
              p: "Como cancelar ou excluir minha conta?",
              r: 'Vá em Minha Conta e use os botões "Desativar conta" ou "Excluir conta".',
            },
          ]
            .map(
              (faq, i) => `
            <div style="border-bottom:${i < 4 ? "1px solid var(--grey-xl)" : "none"};padding:14px 0;">
              <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:4px;">${faq.p}</div>
              <div style="font-size:13px;color:var(--grey);line-height:1.5;">${faq.r}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>`;
      };

      Screens.introducao = function () {
        const user = Store.get("user") || {};
        return `
      <div class="page-wrap">
        <div class="topbar desktop-only"><div><div class="topbar-title">Visão do produto MEU MÊS</div><div class="topbar-sub">A abertura do método — o que é, por que funciona e como usar.</div></div><button class="btn btn-primary btn-sm" onclick="App.go('objetivos')">Ir para Objetivos</button></div>
        <div class="intro-hero mb-20">
          <span class="eyebrow">clareza financeira</span>
          <div style="font-size:48px;font-weight:800;color:#fff;letter-spacing:.04em;line-height:1;margin-bottom:12px;">MEU MÊS</div>
          <p>Ferramenta de clareza financeira mensal. Organize, interprete, decida e amadureça um mês de cada vez.</p>
          ${user.nome ? `<div class="mt-16 text-sm" style="color:rgba(255,255,255,.45);">Usuário: <strong style="color:var(--teal-b);">${FarolHelpers.escapeHtml(user.nome)}</strong></div>` : ""}
        </div>
        <div class="grid-2 mb-20">
          <div class="card">
            <div style="font-size:22px;font-weight:800;color:var(--navy);margin-bottom:12px;">Você não está aqui por acaso.</div>
            <p class="body-text">Você decidiu olhar para a sua realidade financeira. Agora faça isso com clareza, um mês de cada vez.</p>
            <p class="body-text">Este sistema não foi feito para ser admirado. Foi feito para ser preenchido, analisado e vivido.</p>
            <div class="box box-gold mt-12"><p class="body-text" style="margin:0;"><strong>Comece agora:</strong> Anote 3 gastos recentes que você lembra. Se não lembrar com clareza, esse é o problema que você vai resolver aqui.</p></div>
          </div>
          <div class="card">
            <div style="font-size:22px;font-weight:800;color:var(--navy);margin-bottom:12px;">Como funciona</div>
            <div class="step-card"><div class="step-num">1</div><div><h4>Planejamento</h4><p>Crie objetivos, cadastre recebimentos e parcelas.</p></div></div>
            <div class="step-card"><div class="step-num">2</div><div><h4>Meu Mês</h4><p>Registre entradas e gastos, leia sua análise e decida.</p></div></div>
            <div class="step-card"><div class="step-num">3</div><div><h4>Evolução</h4><p>Veja seu progresso anual e suas conquistas.</p></div></div>
          </div>
        </div>
        <div class="card mb-20">
          <div style="font-size:22px;font-weight:800;color:var(--navy);margin-bottom:16px;">O que o MEU MÊS faz</div>
          <div class="grid-2">
            <div class="box box-light"><p class="body-text" style="margin:0;"><strong>Clareza</strong> — Mostrar para onde o dinheiro realmente está indo.</p></div>
            <div class="box box-light"><p class="body-text" style="margin:0;"><strong>Interpretação</strong> — Ler o mês além do simples “sobrou ou faltou”.</p></div>
            <div class="box box-light"><p class="body-text" style="margin:0;"><strong>Decisão</strong> — Transformar análise em compromisso prático.</p></div>
            <div class="box box-light"><p class="body-text" style="margin:0;"><strong>Construção</strong> — Separar futuro de gasto comum.</p></div>
            <div class="box box-light" style="grid-column:1/-1;"><p class="body-text" style="margin:0;"><strong>Maturidade</strong> — Evoluir de um mês registrado para uma vida financeira dirigida.</p></div>
          </div>
        </div>
      </div>`;
      };
