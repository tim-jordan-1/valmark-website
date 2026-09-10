#!/usr/bin/env bash
# Resend Email Integration — Verification Script
# Run: ./scripts/verify-resend.sh
# Checks Phase 6 testing requirements from RESEND-EMAIL-INTEGRATION.md
set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check() {
  if eval "$2" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} $1"
    ((FAIL++))
  fi
}

warn() {
  if eval "$2" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASS++))
  else
    echo -e "  ${YELLOW}⚠${NC} $1 (optional)"
    ((WARN++))
  fi
}

echo -e "${BOLD}Resend Integration — Verification${NC}\n"

echo -e "${BOLD}Phase 1: Dependencies${NC}"
check "resend package installed" "node -e \"require('resend')\""
check "@astrojs/cloudflare installed" "node -e \"require('@astrojs/cloudflare')\""
check ".env file exists" "test -f .env"
check "RESEND_API_KEY set in .env" "grep -q '^RESEND_API_KEY=re_[a-zA-Z0-9]' .env"

echo -e "\n${BOLD}Phase 2: Server Configuration${NC}"
check "Cloudflare adapter in astro.config" "grep -q 'cloudflare' astro.config.mjs"
check "Env schema configured" "grep -q 'RESEND_API_KEY' astro.config.mjs"

echo -e "\n${BOLD}Phase 3: Email Templates${NC}"
check "Admin notification template" "test -f src/lib/emails/inquiry-notification.ts"
check "Customer confirmation template" "test -f src/lib/emails/inquiry-confirmation.ts"
check "HTML escaping in notification" "grep -q 'escapeHtml' src/lib/emails/inquiry-notification.ts"
check "HTML escaping in confirmation" "grep -q 'escapeHtml' src/lib/emails/inquiry-confirmation.ts"

echo -e "\n${BOLD}Phase 4: Astro Action${NC}"
check "Action file exists" "test -f src/actions/index.ts"
check "Zod validation schema" "grep -q 'inquirySchema' src/actions/index.ts"
check "SERVICE_NAMES imported" "grep -q 'SERVICE_NAMES' src/actions/index.ts"
check "Honeypot check" "grep -q 'honeypot' src/actions/index.ts"
check "SERVICE_NAMES exported from services.ts" "grep -q 'SERVICE_NAMES' src/data/services.ts"

echo -e "\n${BOLD}Phase 5: Frontend${NC}"
check "InquiryForm component" "test -f src/components/InquiryForm.astro"
check "Progressive enhancement script" "grep -q 'addEventListener.*submit' src/components/InquiryForm.astro"
check "Compact mode support" "grep -q 'compact' src/components/InquiryForm.astro"

echo -e "\n${BOLD}Phase 6: Build & Deploy${NC}"
check "TypeScript passes" "npx astro check 2>&1 | grep -q '0 errors'"
check "Build succeeds" "npm run build 2>&1 | grep -q 'Complete'"
warn "Wrangler CLI authenticated" "wrangler whoami"
warn "Production deployment exists" "wrangler pages deployment list --project-name valmark-website 2>&1 | grep -q 'Ready'"

echo -e "\n${BOLD}Phase 7: Enhancements${NC}"
check "Rate limiting implemented" "grep -q 'checkRateLimit' src/actions/index.ts"
check "KV storage code" "grep -qE 'cloudflare:workers|inquiriesKv.put' src/actions/index.ts"
check "Webhook endpoint" "test -f src/pages/api/resend-webhook.ts"

echo -e "\n${BOLD}Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, ${YELLOW}$WARN warnings${NC}"

if [ $FAIL -eq 0 ]; then
  echo -e "\n${GREEN}${BOLD}All checks passed!${NC}"
else
  echo -e "\n${RED}${BOLD}$FAIL check(s) failed — see above.${NC}"
  exit 1
fi
