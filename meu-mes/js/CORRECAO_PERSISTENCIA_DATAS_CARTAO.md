# Correção — datas do cartão voltando após atualizar a página

## Problema

Ao editar a data de fechamento/vencimento do cartão e atualizar a página logo depois, o app podia voltar para o valor antigo.

Isso acontecia por dois motivos:

1. `Store.set("cartoes", cartoes)` agendava a sincronização para alguns segundos depois.
2. Se a página fosse atualizada antes do push terminar, o `pull()` buscava o valor antigo do Supabase e sobrescrevia a alteração.
3. O `pull()` também não reconstruía corretamente os campos `diaFechamento` e `diaVencimento` usados pelo formulário novo.

## Correções feitas

Arquivos alterados:

- `11-app-controller.js`
- `05-cloud-sync.js`

### 1. `saveCartao()` agora é assíncrono

Depois de salvar o cartão no Store, ele chama:

```js
await CloudSync.push();
```

Assim, a alteração vai para o banco antes de fechar o modal e renderizar a tela.

### 2. Pull dos cartões corrigido

Agora o `pull()` recria estes campos:

```js
diaFechamento
diaVencimento
dataFechamento
dataVencimento
fechamento
vencimento
```

Isso mantém compatibilidade com dados antigos e com o formulário novo.

## Observação importante

O banco atual guarda o padrão mensal por dia:

```txt
dia_fechamento
dia_vencimento
```

Então, ao recarregar, o formulário monta uma data do mês atual usando o dia salvo.

Exemplo:

```txt
dia_vencimento = 20
```

vira:

```txt
2026-06-20
```

ou o mês atual no momento do uso.
