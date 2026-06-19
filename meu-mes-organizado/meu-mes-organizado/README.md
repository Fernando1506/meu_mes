# Meu Mês — versão organizada

Estrutura separada mantendo a ordem original de carregamento:

```
index.html
css/
  01-base.css
  02-components.css
  03-layout.css
  04-pages.css
  05-responsive.css
  06-auth-onboarding.css
  07-extras.css
js/
  01-store.js
  02-calc.js
  03-medals.js
  04-supabase-config.js
  05-cloud-sync.js
  06-login.js
  07-onboarding.js
  08-farol-helpers.js
  09-screens.js
  10-modals.js
  11-app-controller.js
  12-init.js
```

Observações:
- Os scripts foram mantidos como scripts clássicos, não como ES modules, para preservar o funcionamento global do arquivo original.
- A ordem dos arquivos JS no `index.html` é importante.
- A biblioteca Supabase e as fontes Google continuam sendo carregadas por CDN, como no arquivo original.
