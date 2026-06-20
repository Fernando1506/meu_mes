/*
  ═══════════════════════════════════════════════════════
  06-LOGIN.JS
  ═══════════════════════════════════════════════════════
  Controle da tela de login/cadastro e eventos relacionados à autenticação.

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
      // LOGIN — Autenticação real via Supabase Auth
      // ═══════════════════════════════════════════════════════
      /* Login: controla exibição, cadastro, entrada e saída da tela de autenticação. */
      const Login = {
        show() {
          document.getElementById("login-screen").classList.remove("hidden");
        },

        switchMode(mode) {
          ["signin", "signup", "reset"].forEach((m) => {
            const el = document.getElementById("login-mode-" + m);
            if (el) el.classList.toggle("hidden", m !== mode);
          });
        },

        _showError(elId, msg) {
          const el = document.getElementById(elId);
          if (!el) return;
          el.textContent = msg;
          el.classList.remove("hidden");
        },
        _hideError(elId) {
          const el = document.getElementById(elId);
          if (el) el.classList.add("hidden");
        },

        async signUp() {
          this._hideError("signup-error");
          const nome = (
            document.getElementById("signup-name")?.value || ""
          ).trim();
          const email = (
            document.getElementById("signup-email")?.value || ""
          ).trim();
          const senha = document.getElementById("signup-password")?.value || "";

          if (!nome) {
            this._showError("signup-error", "Digite seu nome.");
            return;
          }
          if (!email) {
            this._showError("signup-error", "Digite seu e-mail.");
            return;
          }
          if (senha.length < 6) {
            this._showError(
              "signup-error",
              "A senha precisa ter ao menos 6 caracteres.",
            );
            return;
          }

          if (!supa) {
            this._showError(
              "signup-error",
              "Conexão com o servidor não configurada. Contate o suporte.",
            );
            return;
          }

          const btn = document.getElementById("login-signup-btn");
          if (btn) {
            btn.disabled = true;
            btn.textContent = "Criando conta…";
          }

          try {
            const { data, error } = await supa.auth.signUp({
              email,
              password: senha,
              options: {
                data: { nome },
                emailRedirectTo:
                  "https://meu-mes-controle.praticaformatacao.workers.dev",
              },
            });
            if (error) throw error;

            if (data.session) {
              // Confirmação de e-mail desativada — login imediato
              await this._afterAuth(nome);
            } else {
              // Confirmação de e-mail necessária
              this._showError("signup-error", "");
              document.getElementById("signup-error").classList.add("hidden");
              App.toast("Conta criada! Verifique seu e-mail para confirmar.");
              this.switchMode("signin");
            }
          } catch (e) {
            this._showError("signup-error", this._friendlyError(e.message));
          } finally {
            if (btn) {
              btn.disabled = false;
              btn.textContent = "Criar conta →";
            }
          }
        },

        async signIn() {
          this._hideError("login-error");
          const email = (
            document.getElementById("login-email")?.value || ""
          ).trim();
          const senha = document.getElementById("login-password")?.value || "";

          if (!email || !senha) {
            this._showError("login-error", "Preencha e-mail e senha.");
            return;
          }
          if (!supa) {
            this._showError(
              "login-error",
              "Conexão com o servidor não configurada. Contate o suporte.",
            );
            return;
          }

          const btn = document.getElementById("login-signin-btn");
          if (btn) {
            btn.disabled = true;
            btn.textContent = "Entrando…";
          }

          try {
            const { data, error } = await supa.auth.signInWithPassword({
              email,
              password: senha,
            });
            if (error) throw error;
            await this._afterAuth();
          } catch (e) {
            this._showError("login-error", this._friendlyError(e.message));
          } finally {
            if (btn) {
              btn.disabled = false;
              btn.textContent = "Entrar →";
            }
          }
        },

        async resetPassword() {
          this._hideError("reset-error");
          document.getElementById("reset-success")?.classList.add("hidden");
          const email = (
            document.getElementById("reset-email")?.value || ""
          ).trim();
          if (!email) {
            this._showError("reset-error", "Digite seu e-mail.");
            return;
          }
          if (!supa) {
            this._showError(
              "reset-error",
              "Conexão com o servidor não configurada.",
            );
            return;
          }

          const btn = document.getElementById("login-reset-btn");
          if (btn) {
            btn.disabled = true;
            btn.textContent = "Enviando…";
          }

          try {
            const { error } = await supa.auth.resetPasswordForEmail(email, {
              redirectTo:
                "https://meu-mes-controle.praticaformatacao.workers.dev",
            });
            if (error) throw error;
            const ok = document.getElementById("reset-success");
            if (ok) {
              ok.textContent = "Link enviado! Confira seu e-mail.";
              ok.classList.remove("hidden");
            }
          } catch (e) {
            this._showError("reset-error", this._friendlyError(e.message));
          } finally {
            if (btn) {
              btn.disabled = false;
              btn.textContent = "Enviar link de recuperação";
            }
          }
        },

        // Executado após login/cadastro bem-sucedido
        async _afterAuth(nomeFromSignup) {
          const session = await CloudSync.getSession();
          if (!session) {
            App.toast("Não foi possível autenticar. Tente novamente.");
            return;
          }

          CloudSync.status = "connected";
          await CloudSync.pull();

          // Garante que existe um "user" local (nome para exibição)
          let user = Store.get("user");
          const nomeMeta = session.user?.user_metadata?.nome;
          const nome =
            nomeFromSignup ||
            nomeMeta ||
            user?.nome ||
            session.user?.email?.split("@")[0] ||
            "Usuário";
          if (!user) {
            Store.set("user", {
              nome,
              email: session.user.email,
              criadoEm: new Date().toISOString(),
            });
          } else if (!user.email) {
            Store.set("user", { ...user, nome, email: session.user.email });
          }

          document.getElementById("login-screen").classList.add("hidden");
          if (Store.get("onboardingDone")) {
            App.startApp();
          } else {
            Ob.start();
          }
        },

        _friendlyError(msg) {
          if (!msg) return "Ocorreu um erro. Tente novamente.";
          if (msg.includes("Invalid login credentials"))
            return "E-mail ou senha incorretos.";
          if (msg.includes("User already registered"))
            return "Este e-mail já está cadastrado. Tente entrar.";
          if (msg.includes("Email not confirmed"))
            return "Confirme seu e-mail antes de entrar.";
          if (msg.toLowerCase().includes("password"))
            return "Senha inválida. Use ao menos 6 caracteres.";
          return msg;
        },
      };
