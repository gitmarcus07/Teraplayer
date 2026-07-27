# Cloudflare Worker — TeraBox Extractor

Self-hosted Cloudflare Worker for TeraBox link extraction. Used as the primary
extractor by the TeraPlayer backend when `TERABOX_WORKER_URL` is configured.

## Deployment

### Prerequisites
- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account (free plan: 100k requests/day)

### Steps

1. Install dependencies:
   ```bash
   cd cloudflare-worker
   npm install
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy to production:
   ```bash
   wrangler deploy
   ```

4. Set the `TERABOX_WORKER_URL` env var on your backend:
   ```
   TERABOX_WORKER_URL=https://terabox-extractor.your-subdomain.workers.dev
   ```

## Optional: ndus Cookie

If you have a TeraBox ndus cookie, set it as a secret for the worker:

```bash
echo '{"ndus":"your_ndus_value_here"}' | wrangler secret put COOKIE_JSON
```

This makes extraction more reliable by providing an authenticated session.

## Monitoring

View worker logs:
```bash
wrangler tail
```

## Production Considerations

- Free plan: 100k requests/day, 10ms CPU per request
- Upgrade to Workers Paid ($5/mo) if you need more capacity
- The worker is self-contained and needs no environment variables to function
- CORS headers allow all origins (`Access-Control-Allow-Origin: *`)
- All extraction errors are returned as JSON with status 200 to avoid confusing CORS failures
