# Correção aplicada — fluxo por recebimento dos cartões

## Problema

As faturas de cartão estavam sendo distribuídas na 1ª ou 2ª entrada usando o **dia de fechamento**.

Exemplo que estava errado:

- fecha: 15/06
- vence: 20/06

Como o fechamento era dia 15, o sistema colocava na 1ª entrada.  
Mas financeiramente a fatura precisa entrar na janela do **vencimento**, ou seja, na 2ª entrada.

## Correção

Arquivo alterado:

- `09-screens.js`

A função interna do bloco **Fluxo por recebimento** foi ajustada.

Antes:

```js
cartaoJanelaDia(...)
```

usava fechamento do cartão.

Agora:

```js
gastoJanelaDia(...)
```

usa vencimento do cartão.

## Regra final

- Vencimento antes do dia 20: 1ª entrada
- Vencimento a partir do dia 20: 2ª entrada

## Compatibilidade

A alteração mantém compatibilidade com cartões antigos:

- `dataVencimento`
- `diaVencimento`
- `vencimento`

Todos continuam sendo aceitos.
