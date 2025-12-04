#!/bin/bash
# Fix app.use routes in server.ts

sed -i '' "s/app.use('\([^']*\)', import from '\([^']*\)'));/import route_\1 from '\2'; app.use('\1', route_\1);/g" server.ts
sed -i '' "s/route_\/api\//route_api_/g" server.ts
sed -i '' "s/\//_/g" server.ts | head -1 || true

# Simpler approach - just replace the broken imports
sed -i '' "s/import from '\.\([^']*\)'));/import('\.\1');/g" server.ts

echo "✅ Fixed server routes"
