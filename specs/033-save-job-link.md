# Save a job to the members area

## Behavior

The job detail page shows a "Save to my area" link (pt-BR: "Salvar na minha
área") under the relevance score. It points to
`${NEXT_PUBLIC_AREA_URL}/save?job=<id>`, a plain anchor because the area is a
separate application. The area authenticates the reader (magic link when
needed), checks the id against this radar's GraphQL API, and stores the saved
job in its own database.

- Rendered only when `NEXT_PUBLIC_AREA_URL` is set, the same switch as the
  header link from SPEC-031. Unset hides both.
- The id is the job's UUID, URL-encoded.

## Known debt

- Job cards on `/jobs` and the companies report have no save link yet; the
  detail page is the single entry point for now.

## Verification

The detail page test renders the link with the exact save URL when the area is
configured and renders no link when it is unset.
