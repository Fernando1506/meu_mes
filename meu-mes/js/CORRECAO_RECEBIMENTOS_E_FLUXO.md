# Correção — recebimentos e fluxo por data

## Problemas corrigidos

### 1. Cadastro de recebimento não persistia no banco

O cadastro em `Store.data.recebimentos` era salvo só no estado do app, mas o `CloudSync` não enviava nem puxava esses dados do Supabase.

Arquivos alterados:

- `05-cloud-sync.js`
- `11-app-controller.js`

Agora:

- `saveRecebimento()` força `CloudSync.push()` imediatamente;
- `confirmDeleteRecebimento()` também força `CloudSync.push()`;
- `CloudSync.push()` tenta salvar os recebimentos na tabela `public.recebimentos`;
- `CloudSync.pull()` tenta carregar os recebimentos da tabela `public.recebimentos`.

## Atenção

Para persistir no Supabase, rode o arquivo:

```txt
SQL_CRIAR_TABELA_RECEBIMENTOS.sql
```

no SQL Editor do Supabase.

O código tem fallback seguro: se a tabela ainda não existir, o restante do app não quebra.

---

### 2. Dois salários no dia 05/07 caíam em janelas diferentes

A tela `Meu Mês` tinha uma lógica antiga que tentava adivinhar segunda entrada quando todas as entradas estavam antes do dia 20.

Isso fazia este caso ficar errado:

```txt
Salário 1 — 05/07
Salário 2 — 05/07
```

O sistema colocava um na 1ª entrada e outro na 2ª.

Agora a regra é objetiva:

```txt
Dia 01 a 19  → 1ª entrada
Dia 20 a 31  → 2ª entrada
```

Ou seja: se as duas entradas forem dia 05/07, as duas ficam na 1ª entrada.

Arquivo alterado:

- `09-screens.js`

## Regra final

A divisão considera a data que você digitou no lançamento da entrada, não a ordem de cadastro e não o nome.
