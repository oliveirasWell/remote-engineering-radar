#!/usr/bin/env bash
set -euo pipefail

# DATABASE_URL must stay server-side. Split the token so this file is not a hit.
name=DATABASE_URL
if git grep -n "NEXT_PUBLIC_${name}" -- ':!specs' ':!.github' ':!scripts' ':!README.md'; then
  exit 1
fi

# Secret connection strings must not be hard-coded in application source.
if git grep -nE 'postgres(ql)?://[^[:space:]]+' -- ':(glob)app/**' ':(glob)components/**' ':(glob)lib/**' ':!*.test.ts' ':!*.test.tsx'; then
  exit 1
fi
