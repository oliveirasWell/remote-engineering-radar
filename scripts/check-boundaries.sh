#!/usr/bin/env bash
set -euo pipefail

# UI must not mention raw OpenWeather fields — the adapter owns that shape.
if grep -rE 'temp_min|dt_txt|weather\[0\]' components/ app/components/; then
  exit 1
fi

# The key must stay server-side. Split the token so this file is not a hit.
name=OPENWEATHER
if git grep -n "NEXT_PUBLIC_${name}" -- ':!specs' ':!.github' ':!scripts'; then
  exit 1
fi
