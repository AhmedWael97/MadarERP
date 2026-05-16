FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

# Install dependencies first so the layer is cached when only source changes.
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

EXPOSE 5173

# Wait for the backend to actually accept connections on :8000 before starting
# Vite. Compose's `depends_on: service_healthy` covers `up`, but `docker compose
# restart` and `up` of an already-built stack do NOT honor depends_on ordering —
# so without this wait, Vite starts ~3s after restart while Frappe still needs
# minutes to migrate + boot, and the browser's first /api/* request gets a
# proxy ECONNREFUSED → 500 from Vite. The user then has to refresh.
#
# We use Node (already in the image) instead of curl/wget to avoid an extra
# package layer. Polls /api/method/ping every 2s, gives up after 15 min so the
# container doesn't hang forever if backend is genuinely broken.
CMD ["sh", "-c", "node -e \"const http=require('http');const start=Date.now();const tryPing=()=>{const req=http.get('http://backend:8000/api/method/ping',{timeout:3000},r=>{if(r.statusCode===200){console.log('[wait] backend is up');process.exit(0)}else{retry()}});req.on('error',retry);req.on('timeout',()=>{req.destroy();retry()})};const retry=()=>{if(Date.now()-start>900000){console.error('[wait] backend never came up after 15 min — giving up so you can see vite logs');process.exit(0)}console.log('[wait] backend not ready yet, retrying in 2s...');setTimeout(tryPing,2000)};tryPing();\" && exec pnpm dev --host 0.0.0.0"]
