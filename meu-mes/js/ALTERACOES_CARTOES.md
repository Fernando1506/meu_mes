# Alterações realizadas — Cartões com data completa

Foram ajustados os pontos que o Claude deixou incompletos:

1. `10-modals.js`
   - O cadastro/edição de cartão agora usa `type="date"` para fechamento e vencimento.
   - Cartões antigos com apenas `diaFechamento`/`diaVencimento` são convertidos visualmente para uma data do mês atual.

2. `11-app-controller.js`
   - `saveCartao()` agora salva:
     - `dataFechamento` no formato `YYYY-MM-DD`.
     - `dataVencimento` no formato `YYYY-MM-DD`.
     - `diaFechamento` e `diaVencimento` continuam sendo salvos para compatibilidade.
   - `confirmarFechamentoFatura()` passou a calcular o vencimento usando a data completa quando existir.

3. `08-farol-helpers.js`
   - Adicionadas funções auxiliares para datas de cartão:
     - `_parseISODate()`
     - `_dateToISO()`
     - `_safeCardDay()`
     - `_monthlyCardDate()`
   - `cartaoStatus()` agora usa a data completa para identificar fechamento pendente e próximo vencimento.
   - `proximoVencimento()` aceita tanto cartão completo quanto número antigo.

4. `09-screens.js`
   - O fluxo por recebimento usa a data real de fechamento do cartão quando ela existir.
   - A tela de cartões exibe data completa quando disponível.

## Compatibilidade

Os cartões antigos continuam funcionando porque `diaFechamento` e `diaVencimento` foram mantidos.
