#!/bin/sh
set -eu

for grammar_file in grammars/*.bf; do
  if [ ! -e "$grammar_file" ]; then
    continue
  fi
  if ! bun ../index.ts "$grammar_file"; then
    echo "bun failed for ${grammar_file}"
    break
  fi
done
