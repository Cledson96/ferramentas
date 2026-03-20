#!/usr/bin/env bash
# sync.sh — Sincroniza o plugin JC entre o repositório e o Claude Code local.
#
# Uso:
#   ./sync.sh deploy  [--dry-run]   # repo → ambiente local
#   ./sync.sh capture [--dry-run]   # ambiente local → repo
#
# O deploy limpa o destino primeiro (repo é fonte da verdade).
# O capture copia por cima sem apagar extras do repo.

set -euo pipefail

# ─── Paths ────────────────────────────────────────────────────────────────────

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_REPO="$REPO_ROOT/claude"
CLAUDE_LOCAL="$HOME/.claude/plugins/cache/local-desktop-app-uploads/jc/1.0.0"

# ─── Excludes (padrões que NÃO devem ser sincronizados) ──────────────────────

is_excluded() {
  local file="$1"
  case "$file" in
    .orphaned_at)      return 0 ;;
    .claude/*)         return 0 ;;
    node_modules/*)    return 0 ;;
  esac
  return 1
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}[sync]${NC} $*"; }
warn()  { echo -e "${YELLOW}[sync]${NC} $*"; }
fail()  { echo -e "${RED}[erro]${NC} $*" >&2; exit 1; }
file_line() { echo -e "  ${CYAN}→${NC} $*"; }

usage() {
  echo "Uso: $0 <deploy|capture> [--dry-run]"
  echo ""
  echo "  deploy   repo claude/ → plugin local (~/.claude/plugins/...)"
  echo "  capture  plugin local → repo claude/"
  echo ""
  echo "  --dry-run  simula sem copiar"
  exit 1
}

# ─── Parse args ───────────────────────────────────────────────────────────────

DIRECTION="${1:-}"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
  esac
done

[[ -z "$DIRECTION" ]] && usage

# ─── Sync via cp (funciona em qualquer Git Bash) ─────────────────────────────

sync_copy() {
  local src="$1"
  local dst="$2"
  local clean_dst="$3"  # "true" para limpar destino antes (deploy)
  local count=0

  [[ ! -d "$src" ]] && fail "Pasta origem nao encontrada: $src"
  [[ ! -d "$dst" ]] && fail "Pasta destino nao encontrada: $dst"

  # Se deploy, limpar destino (exceto os excludes que já existem lá)
  if [[ "$clean_dst" == "true" && "$DRY_RUN" != "true" ]]; then
    # Remover tudo do destino exceto excludes
    find "$dst" -mindepth 1 -maxdepth 1 | while read -r item; do
      local name
      name="$(basename "$item")"
      if ! is_excluded "$name"; then
        rm -rf "$item"
      fi
    done
  fi

  # Copiar arquivos do src para dst
  cd "$src"
  local files
  files="$(find . -type f)"
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    # Remover ./ do início
    file="${file#./}"

    # Pular excludes
    if is_excluded "$file"; then
      continue
    fi

    local dst_file="$dst/$file"
    local dst_dir
    dst_dir="$(dirname "$dst_file")"

    if [[ "$DRY_RUN" == "true" ]]; then
      file_line "$file"
    else
      mkdir -p "$dst_dir"
      cp "$src/$file" "$dst_file"
      file_line "$file"
    fi

    count=$((count + 1))
  done <<< "$files"

  echo ""
  info "$count arquivo(s) sincronizado(s)."
}

# ─── Sync ─────────────────────────────────────────────────────────────────────

case "$DIRECTION" in
  deploy)
    [[ ! -d "$CLAUDE_REPO" ]] && fail "Pasta repo nao encontrada: $CLAUDE_REPO"
    [[ ! -d "$CLAUDE_LOCAL" ]] && fail "Pasta local nao encontrada: $CLAUDE_LOCAL"

    info "Deploy: repo → local"
    info "  De:   $CLAUDE_REPO/"
    info "  Para: $CLAUDE_LOCAL/"
    [[ "$DRY_RUN" == "true" ]] && warn "  (dry-run — nenhum arquivo sera copiado)"
    echo ""

    sync_copy "$CLAUDE_REPO" "$CLAUDE_LOCAL" true

    info "Deploy concluido."
    ;;

  capture)
    [[ ! -d "$CLAUDE_LOCAL" ]] && fail "Pasta local nao encontrada: $CLAUDE_LOCAL"
    [[ ! -d "$CLAUDE_REPO" ]] && fail "Pasta repo nao encontrada: $CLAUDE_REPO"

    # Avisar se há mudanças não commitadas no repo
    if cd "$REPO_ROOT" && ! git diff --quiet -- claude/ 2>/dev/null; then
      warn "Existem mudancas nao commitadas em claude/. O capture vai sobrescrever."
      if [[ "$DRY_RUN" != "true" ]]; then
        read -rp "Continuar? (s/N) " confirm
        [[ "$confirm" != [sS] ]] && { info "Cancelado."; exit 0; }
      fi
    fi

    info "Capture: local → repo"
    info "  De:   $CLAUDE_LOCAL/"
    info "  Para: $CLAUDE_REPO/"
    [[ "$DRY_RUN" == "true" ]] && warn "  (dry-run — nenhum arquivo sera copiado)"
    echo ""

    sync_copy "$CLAUDE_LOCAL" "$CLAUDE_REPO" false

    info "Capture concluido."
    ;;

  *)
    usage
    ;;
esac
