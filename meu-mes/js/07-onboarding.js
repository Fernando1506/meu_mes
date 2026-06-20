/*
  ═══════════════════════════════════════════════════════
  07-ONBOARDING.JS
  ═══════════════════════════════════════════════════════
  Fluxo de onboarding simplificado: redireciona direto ao app sem slides introdutórios.
*/

const Ob = {
  step: 0,
  steps: 1,
  start() {
    // Marca onboarding como concluído e vai direto ao app
    Store.set("onboardingDone", true);
    document.getElementById("onboarding").classList.add("hidden");
    App.startApp();
  },
  next() {
    Store.set("onboardingDone", true);
    document.getElementById("onboarding").classList.add("hidden");
    App.startApp();
  },
  back() {},
  render() {},
};
