# Spec: escalar fontes — adapters Himalayas e Jobicy

> Rodar com contexto limpo. Tudo que você precisa está aqui; não precisa investigar
> o usematcher (foi só recon de mercado, o código dele não é referência).

## Objetivo

Adicionar duas fontes de vagas remotas de alto volume, JSON público e **sem chave**,
que encaixam no filtro remote-only do pipeline. Cada uma é um `JobSource` novo,
clonando a estrutura de `lib/sources/getonbrd/`.

- **Himalayas** — `totalCount` ~103k vagas, 100% remotas. Maior ROI.
- **Jobicy** — centenas de vagas remotas, JSON v2 limpo.

## Contexto do repositório (reaproveitar, não reinventar)

- Contrato: `lib/sources/types.ts` → `NormalizedJob` e `JobSource = { name, fetchJobs() }`.
- **Molde exato**: `lib/sources/getonbrd/` — copie a estrutura dos 4 arquivos + testes:
  - `constants.ts`, `normalize-{name}-job.ts`, `{name}-adapter.ts`, `fixtures/*.json`,
    `{name}-adapter.test.ts`.
- Helpers de rede: `lib/sources/fetch-json.ts` → `fetchWithRetry`, `readJsonResponse`,
  `discardResponse`. O adapter recebe `fetch?` nas options pra ser testável com fixture.
- HTML → texto: `lib/sources/strip-html.ts` (as descrições dessas duas APIs vêm em HTML;
  o getonbrd não usava, aqui usa).
- Segurança de URL: `isSafeExternalUrl` de `lib/urls/external-url` (descartar URL insegura).
- **Não** classificar tecnologia/senioridade na fonte além do que a API já dá:
  `enrichJob` em `lib/ingestion/run-ingestion.ts` roda `classifyJob`/`scoreClassifiedJob`/
  `resolveJobCountries`/dedupe depois. Deixe `technologies: []`.
- Ambas são remote-only por natureza → `remotePolicy: 'remote'` fixo (passa o filtro
  `REMOTE_POLICY_REMOTE`).

## Regras do projeto (CLAUDE.md)

- Const arrow functions, named exports (sem default).
- Inglês em código, testes, comentários, commits.
- **RED-GREEN-REFACTOR**: fixture real → teste falhando na normalização → mínimo pra passar.
- Sem `index.ts` barrel pra export único; importar o arquivo de implementação direto.
- Strings de teste executáveis (URLs, nomes, ids) vêm de fixtures/constants, não inline.
- Node 22, pnpm 11.22.0, versões de dependência exatas (sem `^`/`~`).

---

## Fonte 1 — Himalayas

**Endpoint** (GET, sem auth):

```
https://himalayas.app/jobs/api?limit=100
```

Paginação **por cursor**: a resposta traz `nextCursor`; refazer com `&cursor=<nextCursor>`
até `nextCursor` sumir OU atingir `HIMALAYAS_MAX_PAGES`. Como são ~103k vagas e o pipeline
já descarta antigas (`JOB_MAX_AGE_MS`), **limite as páginas** (ex.: `HIMALAYAS_MAX_PAGES = 20`,
`HIMALAYAS_PAGE_SIZE = 100`) — a API já devolve mais recentes primeiro.

**Shape da resposta**:

```jsonc
{
  "totalCount": 103442,
  "offset": 0,
  "limit": 100,
  "nextCursor": "…",
  "jobs": [ { …ver campos abaixo… } ]
}
```

**Campos do job → NormalizedJob**:

| API                                                 | NormalizedJob                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `guid` (URL estável)                                | `sourceJobId`                                                          |
| `title`                                             | `title`                                                                |
| `companyName`                                       | `company.name`                                                         |
| `applicationLink` (validar `isSafeExternalUrl`)     | `url`                                                                  |
| `pubDate` (unix **segundos**)                       | `postedAt = new Date(pubDate * 1000)`                                  |
| `locationRestrictions[]` (ex.: `["United States"]`) | `countries`; `location = join(', ')                                    |     | 'Remote'` |
| `seniority[]` (ex.: `["Entry-level"]`)              | `seniority = seniority[0]`                                             |
| `description` (HTML)                                | `description = stripHtml(description)`                                 |
| —                                                   | `source = 'himalayas'`, `remotePolicy = 'remote'`, `technologies = []` |

Guard de descarte (`return null`): faltando `guid`/`title`/`applicationLink`/`companyName`,
ou `applicationLink` não-`isSafeExternalUrl`.

**Arquivos** em `lib/sources/himalayas/`:

- `constants.ts`: `HIMALAYAS_SOURCE_NAME='himalayas'`, `HIMALAYAS_API_BASE_URL`,
  `HIMALAYAS_PAGE_SIZE=100`, `HIMALAYAS_MAX_PAGES=20`.
- `normalize-himalayas-job.ts`: tipos do registro + `normalizeHimalayasJob(record): NormalizedJob | null`.
- `himalayas-adapter.ts`: `createHimalayasAdapter(options?)` → `JobSource`, loop de cursor
  com `fetchWithRetry`/`readJsonResponse`, valida shape (`Array.isArray(payload.jobs)`),
  para no cap ou quando `!nextCursor`, mapeia `normalizeHimalayasJob` filtrando `null`.
- `fixtures/jobs-page-1.json`, `fixtures/jobs-page-2.json` (2ª página via cursor),
  `fixtures/jobs-malformed.json` — **capturar da API real** com curl no passo RED.
- `himalayas-adapter.test.ts`: paginação por cursor (2 páginas → concatena), para no cap,
  descarta malformado; e a normalização (remote fixo, guards, mapeamento de países/datas).

## Fonte 2 — Jobicy

**Endpoint** (GET, sem auth):

```
https://jobicy.com/api/v2/remote-jobs?count=50
```

**Sem cursor** — um request só com `count` (Jobicy tem volume pequeno; `JOBICY_COUNT=50`).

**Shape da resposta**:

```jsonc
{ "jobCount": 50, "jobs": [ { …campos abaixo… } ] }
```

**Campos do job → NormalizedJob**:

| API                                          | NormalizedJob                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `id`                                         | `sourceJobId = String(id)`                                                       |
| `jobTitle`                                   | `title`                                                                          |
| `companyName`                                | `company.name`                                                                   |
| `url` (validar `isSafeExternalUrl`)          | `url`                                                                            |
| `pubDate` (ISO 8601)                         | `postedAt = new Date(pubDate)`                                                   |
| `jobGeo` (string, ex.: `"UK"`, `"Anywhere"`) | `countries = jobGeo && jobGeo!=='Anywhere' ? [jobGeo] : []`; `location = jobGeo` |
| `jobLevel` (ex.: `"Any"`)                    | `seniority = jobLevel!=='Any' ? jobLevel : undefined`                            |
| `jobDescription` (HTML)                      | `description = stripHtml(jobDescription)`                                        |
| —                                            | `source = 'jobicy'`, `remotePolicy = 'remote'`, `technologies = []`              |

Guard de descarte: faltando `id`/`jobTitle`/`url`/`companyName` ou `url` inseguro.

**Arquivos** em `lib/sources/jobicy/`: mesma estrutura (`constants.ts`,
`normalize-jobicy-job.ts`, `jobicy-adapter.ts`, `fixtures/jobs-page-1.json` +
`jobs-malformed.json`, `jobicy-adapter.test.ts`). Adapter é um request único, sem loop.

---

## Registro

Em `scripts/ingest.ts`, adicionar ao array `sources` (sem env, fontes fixas):

```ts
createHimalayasAdapter(),
createJobicyAdapter(),
```

Importar os dois adapters no topo (ordem alfabética com os existentes).

## Verificação

1. `pnpm test` verde — testes de adapter (paginação/descarte) e normalização de cada fonte.
2. Ponta a ponta: rodar o ingest (`pnpm tsx scripts/ingest.ts`) contra o banco de dev;
   confirmar no JSON de saída `sources[]` com `fetched > 0` para `himalayas` e `jobicy`,
   e `persisted` refletindo só remotas após o filtro.
3. `scripts/check-boundaries.sh` sem violação de imports entre camadas.

## Fora de escopo

LinkedIn/Workday/echojobs/adzuna/whatjobs — sem API pública viável ou exigem chave/proxy;
volume em grande parte já coberto por dedupe das fontes ATS existentes. Não fazer.
