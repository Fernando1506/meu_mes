// ═══════════════════════════════════════════════════════
      // MODALS
      // ═══════════════════════════════════════════════════════
      const Modals = {
        gasto() {
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:24px;">Registrar Gasto</div>
        <div class="form-group"><label class="label">Descrição</label><input id="m-desc" class="form-input" placeholder="Ex: Mercado, Aluguel, Netflix..."></div>
        <div class="form-group"><label class="label">Valor</label><div class="input-money"><span>R$</span><input id="m-valor" class="form-input" type="number" step="0.01" placeholder="0,00"></div></div>
        <input id="m-cat" type="hidden" value="V">
        <div class="grid-2"><div class="form-group"><label class="label">Data</label><input id="m-data" class="form-input" type="date" value="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}"></div><div class="form-group"><label class="label">Tipo de lançamento</label><select id="m-repete" class="form-select" onchange="App.toggleRecorrenciaFields(this.value)"><option value="avulso">Somente este mês</option><option value="mensal">Repetir por meses</option><option value="parcelado_fixo">Parcelado (N vezes)</option></select></div></div>
        <div class="grid-2 hidden" id="m-repeticao-meses-wrap"><div class="form-group"><label class="label">Quantidade de meses</label><input id="m-repetir-meses" class="form-input" type="number" min="1" value="12"></div><div></div></div>
        <div class="grid-2 hidden" id="m-parcelas-wrap"><div class="form-group"><label class="label">Número de parcelas</label><input id="m-num-parcelas" class="form-input" type="number" min="2" max="120" value="12" placeholder="Ex: 12"></div><div class="form-group"><label class="label" style="opacity:0;">—</label><div class="box box-light" style="padding:10px 12px;font-size:12px;color:var(--grey);line-height:1.5;">Aparecerá como<br><strong style="color:var(--navy);">1/12, 2/12...</strong> em cada mês</div></div></div>
        <button class="btn btn-primary btn-full btn-lg" onclick="App.saveGasto()">Salvar Gasto</button>`;
        },
        renda() {
          const key = App.getActiveCycleKey
            ? App.getActiveCycleKey()
            : Calc.cicloAtual();
          const mes = Calc.getCiclo(key);
          const entradas = Calc.entradasNoMes(mes);
          const recs = Store.get("recebimentos") || [];
          const mesLabel = FarolHelpers.monthLabelByKey
            ? FarolHelpers.monthLabelByKey(key)
            : key;
          const isFuturo = key !== Calc.cicloAtual();
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:${isFuturo ? "6px" : "24px"};">Registrar Entrada</div>
        ${isFuturo ? `<div style="font-size:12px;color:var(--teal-d);font-weight:700;background:var(--teal-lt);border-radius:8px;padding:6px 12px;margin-bottom:18px;display:inline-block;">Lançando em ${mesLabel}</div>` : ""}
        <div class="form-group"><label class="label">Origem da renda</label><select id="m-renda-origem" class="form-select" onchange="App.toggleRendaOrigem(this.value)">${recs
          .filter((r) => r.tipo !== "extra")
          .map(
            (r) =>
              `<option value="${r.nome}">${r.nome}${r.dia ? ` · dia ${r.dia}` : ""}</option>`,
          )
          .join(
            "",
          )}<option value="Renda extra">Renda extra</option><option value="_novo_">+ Digitar outra origem...</option></select><input id="m-renda-origem-custom" class="form-input mt-8 hidden" placeholder="Nome da origem (ex: Freelance, Bônus...)"></div>
        <div class="form-group"><label class="label">Valor recebido</label><div class="input-money"><span>R$</span><input id="m-renda-valor" class="form-input" type="number" step="0.01" placeholder="0,00" oninput="App.updateRendaSeparationSummary()"></div></div>
        <div class="form-group"><label class="label">Data</label><input id="m-renda-data" class="form-input" type="date" value="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}"></div>
        <div class="card-soft mb-16">
          <div class="flex justify-between items-center mb-12" style="gap:12px;flex-wrap:wrap;"><div><div style="font-size:14px;font-weight:800;color:var(--navy);">Separações desta entrada</div><div class="text-xs text-grey mt-4">Use para valores que você separa antes de organizar o mês.</div></div><button class="btn btn-ghost btn-sm" type="button" onclick="App.addSeparacaoRow()">+ Adicionar separação</button></div>
          <div id="m-sep-list"></div>
          <div class="grid-2 mt-12"><div class="card-sm"><div class="text-xs text-grey mb-4">Total separado</div><div id="m-renda-sep-total" style="font-weight:800;color:var(--amber);">${Calc.fmt(0)}</div></div><div class="card-sm"><div class="text-xs text-grey mb-4">Base após separação</div><div id="m-renda-base" style="font-weight:800;color:var(--green);">${Calc.fmt(0)}</div></div></div>
        </div>
        <button class="btn btn-primary btn-full btn-lg" onclick="App.saveRenda()">Adicionar entrada</button>
        ${
          entradas.length
            ? `<div class="card mt-20"><div style="font-size:14px;font-weight:700;margin-bottom:12px;">Entradas já lançadas</div>${entradas
                .map(
                  (e, i) =>
                    `<div class="gasto-row"><div><div class="gasto-desc">${FarolHelpers.escapeHtml(e.origem || "Entrada")}</div><div class="gasto-date">${FarolHelpers.formatDate(e.data)}${e.totalSeparado > 0 ? ` · separado ${Calc.fmt(e.totalSeparado)} · base ${Calc.fmt(e.baseAposSeparacao)}` : ""}</div></div><span class="chip chip-f">R</span><div class="gasto-valor">${Calc.fmt(e.valor)}</div><button class="gasto-delete" onclick="App.deleteEntrada('${key}',${i})">×</button></div>${
                      e.totalSeparado > 0
                        ? `<div class="box box-light" style="margin:8px 0 12px 0;padding:12px 14px;">${e.separacoes
                            .map((s) => {
                              const bruto = parseFloat(e.valor) || 0;
                              const raw = parseFloat(s.valor || 0) || 0;
                              const val =
                                s.tipo === "percentual"
                                  ? bruto * (raw / 100)
                                  : raw;
                              return `<div class="text-xs text-grey" style="margin-bottom:4px;"><strong style="color:var(--navy);">${FarolHelpers.escapeHtml(s.nome || "Separação")}</strong> · ${s.tipo === "percentual" ? raw + "%" : Calc.fmt(raw)} · ${Calc.fmt(val)}</div>`;
                            })
                            .join("")}</div>`
                        : ""
                    }`,
                )
                .join("")}</div>`
            : ""
        }`;
        },
        objetivo() {
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:24px;">Novo Objetivo</div>
        <div class="form-group"><label class="label">Nome do objetivo</label><input id="m-obj-nome" class="form-input" placeholder="Ex: Quitar cartão, Reserva de emergência, Viagem..."></div>
        <div class="form-group"><label class="label">Valor da meta</label><div class="input-money"><span>R$</span><input id="m-obj-valor" class="form-input" type="number" step="0.01" placeholder="0,00"></div></div>
        <div class="grid-2">
          <div class="form-group"><label class="label">Já acumulado</label><div class="input-money"><span>R$</span><input id="m-obj-pago" class="form-input" type="number" step="0.01" placeholder="0,00"></div></div>
          <div class="form-group"><label class="label">Prazo</label><input id="m-obj-prazo" class="form-input" type="month"></div>
        </div>
        <div class="form-group"><label class="label">Prioridade</label><select id="m-obj-prio" class="form-select"><option value="alta">Alta</option><option value="media" selected>Média</option><option value="baixa">Baixa</option></select></div>
        <button class="btn btn-primary btn-full btn-lg" onclick="App.saveObjetivo()">Salvar Objetivo</button>`;
        },
        parcela() {
          const cartoes = Store.get("cartoes") || [];
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:24px;">Nova Parcela / Dívida</div>
        <div class="form-group"><label class="label">Nome</label><input id="m-p-nome" class="form-input" placeholder="Ex: Financiamento do carro, Notebook..."></div>
        <div class="grid-2"><div class="form-group"><label class="label">Subcategoria</label><input id="m-p-sub" class="form-input" placeholder="Ex: Financiamento"></div><div class="form-group"><label class="label">Dia do vencimento</label><input id="m-p-dia" class="form-input" type="number" min="1" max="28" placeholder="Ex: 15"></div></div>
        <div class="form-group"><label class="label">Valor mensal</label><div class="input-money"><span>R$</span><input id="m-p-valor" class="form-input" type="number" step="0.01" placeholder="0,00"></div></div>
        <div class="grid-2"><div class="form-group"><label class="label">Data de início</label><input id="m-p-inicio" class="form-input" type="month"></div><div class="form-group"><label class="label">Data de término</label><input id="m-p-fim" class="form-input" type="month"></div></div>
        <div class="form-group">
          <label class="label">Como essa parcela é paga?</label>
          <select id="m-p-origem" class="form-select" onchange="App.toggleParcelaCartaoField(this.value)">
            <option value="separado">Boleto, débito ou pagamento separado</option>
            <option value="cartao">No cartão de crédito</option>
          </select>
        </div>
        <div class="form-group hidden" id="m-p-cartao-wrap">
          <label class="label">Qual cartão?</label>
          <select id="m-p-cartao" class="form-select">
            ${cartoes.length === 0 ? `<option value="">Nenhum cartão cadastrado</option>` : cartoes.map((c) => `<option value="${c.id}">${FarolHelpers.escapeHtml(c.nome)}</option>`).join("")}
          </select>
          <div class="text-xs text-grey mt-8">Essa parcela já está incluída no valor da fatura que você atualiza. Ela não será somada de novo no total do mês — fica aqui só para acompanhar quando termina.</div>
        </div>
        <div class="card-gold mb-16"><span class="eyebrow">exemplo</span><p class="body-text" style="margin:0;font-size:13px;">Começou em janeiro e termina em julho → o sistema calculará automaticamente a parcela atual e o valor restante.</p></div>
        <button class="btn btn-primary btn-full btn-lg" onclick="App.saveParcela()">Salvar Parcela</button>`;
        },
        recebimento() {
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:24px;">Novo Recebimento</div>
        <div class="form-group"><label class="label">Nome</label><input id="m-r-nome" class="form-input" placeholder="Ex: Salário, Freelance, Aluguel recebido..."></div>
        <div class="form-group"><label class="label">Tipo</label><select id="m-r-tipo" class="form-select" onchange="App.toggleRecType(this.value)"><option value="fixo">Fixo mensal</option><option value="extra">Renda extra</option></select></div>
        <div class="grid-2" id="m-r-grid-fixo"><div class="form-group"><label class="label">Dia do recebimento</label><input id="m-r-dia" class="form-input" type="number" min="1" max="31" placeholder="Ex: 5"></div><div class="form-group"><label class="label">Valor estimado</label><div class="input-money"><span>R$</span><input id="m-r-valor" class="form-input" type="number" step="0.01" placeholder="0,00"></div></div></div>
        <button class="btn btn-primary btn-full btn-lg" onclick="App.saveRecebimento()">Salvar</button>`;
        },

        cartao(arg) {
          const cartoes = Store.get("cartoes") || [];
          const idx = typeof arg === "number" ? arg : null;
          const c = idx !== null ? cartoes[idx] : null;
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:24px;">${c ? "Editar cartão" : "Novo cartão"}</div>
        <input type="hidden" id="m-cart-idx" value="${idx !== null ? idx : ""}">
        <div class="form-group"><label class="label">Nome do cartão</label><input id="m-cart-nome" class="form-input" placeholder="Ex: Cartão Nubank, Cartão Inter..." value="${c ? FarolHelpers.escapeHtml(c.nome) : ""}"></div>
        <div class="grid-2">
          <div class="form-group"><label class="label">Dia de fechamento</label><input id="m-cart-fechamento" class="form-input" type="number" min="1" max="31" placeholder="Ex: 10" value="${c ? c.diaFechamento : ""}"></div>
          <div class="form-group"><label class="label">Dia de vencimento</label><input id="m-cart-vencimento" class="form-input" type="number" min="1" max="31" placeholder="Ex: 17" value="${c ? c.diaVencimento : ""}"></div>
        </div>
        ${!c ? `<div class="form-group"><label class="label">Valor já em aberto na fatura atual (opcional)</label><div class="input-money"><span>R$</span><input id="m-cart-inicial" class="form-input" type="number" step="0.01" placeholder="0,00"></div></div>` : ""}
        <div class="card-gold mb-16"><span class="eyebrow">como funciona</span><p class="body-text" style="margin:0;font-size:13px;">Sempre que você gastar no cartão, volte aqui e atualize o <strong>valor total acumulado</strong> da fatura — não é necessário lançar cada compra. Quando a fatura fechar, o app avisa e você confirma o valor final do mês.</p></div>
        <button class="btn btn-primary btn-full btn-lg" onclick="App.saveCartao()">${c ? "Salvar alterações" : "Adicionar cartão"}</button>`;
        },

        faturaUpdate(idx) {
          const cartoes = Store.get("cartoes") || [];
          const c = cartoes[idx];
          if (!c) return "";
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:4px;">Atualizar fatura</div>
        <div class="text-sm text-grey mb-20">${FarolHelpers.escapeHtml(c.nome)}</div>
        <input type="hidden" id="m-fat-idx" value="${idx}">
        <div class="card-soft mb-16 text-center">
          <div class="text-xs text-grey mb-4">Valor atual da fatura</div>
          <div style="font-size:26px;font-weight:800;color:var(--navy);">${Calc.fmt(c.faturaAtual || 0)}</div>
        </div>
        <div class="form-group"><label class="label">Novo valor total da fatura</label><div class="input-money"><span>R$</span><input id="m-fat-valor" class="form-input" type="number" step="0.01" placeholder="0,00" value="${c.faturaAtual || 0}"></div></div>
        <p class="text-xs text-grey mb-16">Informe o <strong>total acumulado</strong> até agora, não apenas o que gastou hoje. Ex: se já estava R$ 400 e gastou mais R$ 700 nesta semana, informe R$ 1.100.</p>
        <button class="btn btn-primary btn-full btn-lg" onclick="App.saveFaturaUpdate()">Atualizar valor</button>`;
        },

        faturaVencimento(idx) {
          const cartoes = Store.get("cartoes") || [];
          const c = cartoes[idx];
          if (!c) return "";
          const st = FarolHelpers.cartaoStatus(c);
          // Data pré-preenchida: próximo vencimento calculado
          const proxVencDate = st.proxVencimento;
          const proxVencISO = proxVencDate
            ? `${proxVencDate.getFullYear()}-${String(proxVencDate.getMonth() + 1).padStart(2, "0")}-${String(proxVencDate.getDate()).padStart(2, "0")}`
            : "";
          const jaLancado = c.faturaVencimento && c.faturaVencimento.data;
          const dataAtual = jaLancado ? c.faturaVencimento.data : proxVencISO;
          const valorAtual = jaLancado
            ? parseFloat(c.faturaVencimento.valor) || 0
            : 0;
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:4px;">Lançar fatura no vencimento</div>
        <div class="text-sm text-grey mb-20">${FarolHelpers.escapeHtml(c.nome)}</div>
        <input type="hidden" id="m-prev-idx" value="${idx}">
        <div class="form-group"><label class="label">Data do vencimento</label><input id="m-prev-data" class="form-input" type="date" value="${dataAtual}"></div>
        <div class="form-group"><label class="label">Valor da fatura</label><div class="input-money"><span>R$</span><input id="m-prev-valor" class="form-input" type="number" step="0.01" placeholder="0,00" value="${valorAtual > 0 ? valorAtual : ""}"></div></div>
        <p class="text-xs text-grey mb-16">Vai aparecer no mês da data escolhida igual aos outros lançamentos — com badge <strong>previsto</strong> para identificar.</p>
        ${jaLancado ? `<button class="btn btn-ghost btn-full mb-8" onclick="App.clearFaturaVencimento(${idx})">Remover lançamento</button>` : ""}
        <button class="btn btn-primary btn-full btn-lg" onclick="App.saveFaturaVencimento()">Salvar</button>`;
        },

        editarEntradaPrevista(arg) {
          // arg = { key, idx, origem, valor, data }
          if (!arg) return "";
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:6px;">Editar entrada prevista</div>
        <div style="font-size:13px;color:var(--grey);margin-bottom:20px;">${FarolHelpers.escapeHtml(arg.origem || "Entrada")} · ${FarolHelpers.monthLabelByKey ? FarolHelpers.monthLabelByKey(arg.key) : arg.key}</div>
        <input type="hidden" id="m-eprev-key" value="${arg.key}">
        <input type="hidden" id="m-eprev-idx" value="${arg.idx}">
        <div class="form-group">
          <label class="label">Valor previsto</label>
          <div class="input-money"><span>R$</span><input id="m-eprev-valor" class="form-input" type="number" step="0.01" value="${parseFloat(arg.valor) || ""}"></div>
        </div>
        <div class="form-group">
          <label class="label">Data</label>
          <input id="m-eprev-data" class="form-input" type="date" value="${arg.data || ""}">
        </div>
        <div style="display:grid;gap:10px;margin-top:4px;">
          <button class="btn btn-primary btn-full btn-lg" onclick="App.salvarEntradaPrevista('somente')">Alterar só este mês</button>
          <button class="btn btn-ghost btn-full" onclick="App.salvarEntradaPrevista('seguintes')">Alterar este e os seguintes</button>
        </div>`;
        },

        separar() {
          const tipos = App.getSeparacaoSuggestions();
          return `<div class="sheet-handle"></div>
        <div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:4px;">Separar valor</div>
        <p class="text-sm text-grey mb-20">Guarde uma parte do que sobrou para dízimo, reserva, investimento ou outro propósito. Esse valor não conta como gasto.</p>
        <div class="form-group">
          <label class="label">Tipo de separação</label>
          <select id="m-csep-select" class="form-select" onchange="App.toggleSepNomeCustomEl(this,'m-csep-custom')">
            <option value="">Selecione…</option>
            ${tipos.map((t) => `<option value="${FarolHelpers.escapeHtml(t)}">${FarolHelpers.escapeHtml(t)}</option>`).join("")}
            <option value="_outro_">Outro…</option>
          </select>
          <input id="m-csep-custom" class="form-input mt-8 hidden" placeholder="Nome do tipo">
        </div>
        <div class="form-group"><label class="label">Valor</label><div class="input-money"><span>R$</span><input id="m-csep-valor" class="form-input" type="number" step="0.01" placeholder="0,00"></div></div>
        <div class="grid-2"><div class="form-group"><label class="label">Data</label><input id="m-csep-data" class="form-input" type="date" value="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}"></div><div></div></div>
        <button class="btn btn-gold btn-full btn-lg" onclick="App.saveSeparacaoMes()">Separar valor</button>`;
        },
      };
