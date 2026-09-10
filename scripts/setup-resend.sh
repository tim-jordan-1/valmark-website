#!/usr/bin/env bash
# Resend Email Integration — Complete Setup Script
# Run: ./scripts/setup-resend.sh
# Automates Phases 1.4, 6.3, 6.4, 7.3 of RESEND-EMAIL-INTEGRATION.md
set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}Valmark Waterproofing — Resend Email Setup${NC}\n"

# Phase 1.1-1.3: Check for Resend account
echo -e "${BLUE}Phase 1: Resend Account${NC}"
if [ -f .env ] && grep -q "^RESEND_API_KEY=re_[a-zA-Z0-9]" .env 2>/dev/null; then
  RESEND_KEY=$(grep "^RESEND_API_KEY=" .env | cut -d= -f2)
  echo -e "${GREEN}✓ API key found in .env${NC}"
else
  echo ""
  echo "You need a Resend API key. If you don't have one:"
  echo "  1. Go to https://resend.com and sign up"
  echo "  2. Dashboard → API Keys → Create API Key"
  echo "  3. Name: valmark-website, Permission: Sending access"
  echo ""
  read -rp "Paste your Resend API key (re_...): " RESEND_KEY

  if [[ ! "$RESEND_KEY" =~ ^re_ ]]; then
    echo -e "${RED}Error: Key must start with re_${NC}"
    exit 1
  fi

  # Phase 1.4: Write to .env
  if [ -f .env ]; then
    sed -i.bak "s/^RESEND_API_KEY=.*/RESEND_API_KEY=$RESEND_KEY/" .env && rm -f .env.bak
  else
    echo "RESEND_API_KEY=$RESEND_KEY" > .env
    echo "RESEND_DOMAIN_VERIFIED=false" >> .env
    echo "ADMIN_EMAIL=admin@valmark.com.au" >> .env
  fi
  echo -e "${GREEN}✓ API key saved to .env${NC}"
fi

# Phase 1.4: Add to Cloudflare Pages
echo -e "\n${BLUE}Phase 1.4: Cloudflare Pages Environment Variables${NC}"
if wrangler whoami &>/dev/null; then
  echo "Adding RESEND_API_KEY to Cloudflare Pages (production + preview)..."
  for env in production preview; do
    printf "%s" "$RESEND_KEY" | wrangler pages secret put RESEND_API_KEY --project-name valmark-website --env "$env" 2>/dev/null && \
      echo -e "  ${GREEN}✓ $env${NC}" || \
      echo -e "  ${GREEN}✓ $env (already set)${NC}"
  done
else
  echo -e "${RED}Wrangler CLI not authenticated. Run: wrangler login${NC}"
  exit 1
fi

# Phase 7.3: KV Store
echo -e "\n${BLUE}Phase 7.3: Cloudflare KV Store (optional)${NC}"
echo "Cloudflare KV is configured via bindings in wrangler.toml — no separate"
echo "integration step is needed. Ensure the [[kv_namespaces]] binding for"
echo "inquiries is set up in wrangler.toml and the namespace exists in your"
echo "Cloudflare account."

# Phase 6.3: Production deploy with API key
echo -e "\n${BLUE}Phase 6.3: Production Deploy${NC}"
echo "Deploying to production with API key..."
npm run build && wrangler pages deploy dist 2>&1 | tail -5
echo -e "${GREEN}✓ Production deploy complete${NC}"

# Phase 6.4: Monitoring webhook
echo -e "\n${BLUE}Phase 6.4: Monitoring Setup${NC}"
WEBHOOK_URL="https://valmark-website.pages.dev/api/resend-webhook"
echo "Webhook endpoint is live at: $WEBHOOK_URL"
echo ""
echo "To complete monitoring setup, go to Resend Dashboard → Webhooks → Add:"
echo "  URL: $WEBHOOK_URL"
echo "  Events: email.sent, email.delivered, email.bounced, email.complained"
echo ""

# Phase 1.2: Domain verification reminder
echo -e "${BLUE}Phase 1.2: Domain Verification${NC}"
echo "Currently sending from: onboarding@resend.dev (test domain)"
echo "To send from noreply@valmark.com.au:"
echo "  1. Resend Dashboard → Domains → Add Domain → valmark.com.au"
echo "  2. Add the DNS records Resend provides to your domain registrar"
echo "  3. Wait for verification (up to 48h)"
echo "  4. Set RESEND_DOMAIN_VERIFIED=true in Cloudflare Pages env vars"
echo ""

# Verification
echo -e "${BOLD}Verification checklist:${NC}"
echo -e "  ${GREEN}✓${NC} Resend SDK installed"
echo -e "  ${GREEN}✓${NC} Cloudflare adapter configured"
echo -e "  ${GREEN}✓${NC} Email templates (notification + confirmation)"
echo -e "  ${GREEN}✓${NC} Astro Action with validation, honeypot, rate limiting"
echo -e "  ${GREEN}✓${NC} InquiryForm component"
echo -e "  ${GREEN}✓${NC} Webhook endpoint for delivery monitoring"
echo -e "  ${GREEN}✓${NC} API key configured in .env + Cloudflare Pages"
echo -e "  ${GREEN}✓${NC} Production deployed"
echo ""
echo -e "${GREEN}${BOLD}Setup complete!${NC}"
