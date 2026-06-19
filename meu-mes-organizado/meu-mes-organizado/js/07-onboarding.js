// ═══════════════════════════════════════════════════════
      // ONBOARDING
      // ═══════════════════════════════════════════════════════
      const Ob = {
        step: 0,
        steps: 5,
        start() {
          document.getElementById("onboarding").classList.remove("hidden");
          this.render();
        },
        render() {
          const dots = document.getElementById("ob-dots");
          dots.innerHTML = Array.from(
            { length: this.steps },
            (_, i) =>
              `<div class="ob-step-dot${i < this.step ? " done" : ""}"></div>`,
          ).join("");
          const content = document.getElementById("ob-content");
          const footer = document.getElementById("ob-footer");
          const btnNext = `<button class="btn btn-gold btn-full btn-lg" onclick="Ob.next()">Continuar →</button>`;
          const btnBack =
            this.step > 0
              ? `<button class="btn btn-ghost" onclick="Ob.back()">← Voltar</button>`
              : "";
          const steps = [
            {
              icon: "",
              icon: "process",
              title: "Um processo, não uma planilha.",
              sub: "O MEU MÊS foi criado para pessoas reais, com vidas reais. Você vai registrar, analisar e decidir — um mês de cada vez. Sem julgamentos, com clareza.",
              extra: "",
            },
            {
              icon: "",
              icon: "method",
              title: "O método tem 5 pilares.",
              sub: "Cada letra carrega um princípio que sustenta a disciplina financeira:",
              extra: `
            <div class="ob-pillar"><div class="ob-pillar-letter">F</div><div class="ob-pillar-text"><strong>Fé</strong> — Sustenta a decisão mesmo quando os números assustam.</div></div>
            <div class="ob-pillar"><div class="ob-pillar-letter">A</div><div class="ob-pillar-text"><strong>Ação</strong> — Intenção sem ação não muda nenhum mês.</div></div>
            <div class="ob-pillar"><div class="ob-pillar-letter">R</div><div class="ob-pillar-text"><strong>Responsabilidade</strong> — Ninguém organiza sua vida por você.</div></div>
            <div class="ob-pillar"><div class="ob-pillar-letter">O</div><div class="ob-pillar-text"><strong>Organização</strong> — Saber onde cada real está antes de sumir.</div></div>
            <div class="ob-pillar"><div class="ob-pillar-letter">L</div><div class="ob-pillar-text"><strong>Liberdade</strong> — Construída mês a mês, com margem e direção.</div></div>`,
            },

            {
              icon: "",
              icon: "medals",
              title: "Sua disciplina vira conquista.",
              sub: "Cada hábito construído é celebrado com uma medalha. Elas não são decoração — são marcos reais do seu progresso.",
              extra: `
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;">
              <div style="background:rgba(255,255,255,.06);border-radius:14px;padding:14px 18px;text-align:center;">
                <div style="font-size:28px;margin-bottom:6px;"></div>
                <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;">Primeiro Passo</div>
              </div>
              <div style="background:rgba(255,255,255,.06);border-radius:14px;padding:14px 18px;text-align:center;">
                <div style="font-size:28px;margin-bottom:6px;"></div>
                <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;">Sinal Verde</div>
              </div>
              <div style="background:rgba(255,255,255,.06);border-radius:14px;padding:14px 18px;text-align:center;">
                <div style="font-size:28px;margin-bottom:6px;"></div>
                <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;">Meta Alcançada</div>
              </div>
              <div style="background:rgba(255,255,255,.06);border-radius:14px;padding:14px 18px;text-align:center;">
                <div style="font-size:28px;margin-bottom:6px;"></div>
                <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;">Disciplina Total</div>
              </div>
            </div>`,
            },
            {
              icon: "",
              icon: "ready",
              title: "Você está pronto.",
              sub: "O caminho agora é simples: defina seus objetivos, registre o mês e observe o padrão aparecer. Comece pelos objetivos — eles dão direção a tudo.",
              extra: `
            <div style="background:rgba(200,150,60,.12);border:1px solid rgba(200,150,60,.25);border-radius:14px;padding:18px;margin-top:16px;">
              <div style="font-size:13px;color:var(--teal-b);font-weight:700;margin-bottom:8px;">Roteiro de primeira vez</div>
              <div style="font-size:14px;color:rgba(255,255,255,.75);line-height:1.8;">
                1. Crie um objetivo no menu <strong style="color:#fff;">Objetivos</strong><br>
                2. Cadastre sua fonte de renda em <strong style="color:#fff;">Recebimentos</strong><br>
                3. Registre seus gastos em <strong style="color:#fff;">Meu Mês → Registrar</strong><br>
                4. Leia sua <strong style="color:#fff;">Análise</strong> e tome uma decisão
              </div>
            </div>`,
            },
          ];
          const s = steps[this.step];
          content.innerHTML = `<div class="ob-icon" style="background:rgba(71,201,168,.15);border:1px solid rgba(71,201,168,.2);width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;"><span style="font-size:22px;font-weight:700;color:#47C9A8;">${this.step + 1}</span></div><div class="ob-title">${s.title}</div><div class="ob-sub">${s.sub}</div>${s.extra ? `<div style="margin-top:20px;">${s.extra}</div>` : ""}`;
          footer.innerHTML = (btnBack ? btnBack + " " : "") + btnNext;
        },
        next() {
          if (this.step < this.steps - 1) {
            this.step++;
            this.render();
          } else {
            Store.set("onboardingDone", true);
            document.getElementById("onboarding").classList.add("hidden");
            App.startApp();
          }
        },
        back() {
          if (this.step > 0) {
            this.step--;
            this.render();
          }
        },
      };
