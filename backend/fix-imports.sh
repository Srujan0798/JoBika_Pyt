#!/bin/bash
# Fix all import syntax errors

# Fix server.ts imports
sed -i '' "s/import \(.*\) from '\.\([^']*\)');/import \1 from '.\2';/g" server.ts
sed -i '' "s/import from '\.\([^']*\)');/import from '.\1';/g" server.ts

# Fix routes
for file in routes/*.ts; do
  sed -i '' "s/import \(.*\) from '\.\([^']*\)');/import \1 from '.\2';/g" "$file"
  sed -i '' "s/import from '\.\([^']*\)');/import from '.\1';/g" "$file"
  sed -i '' "s/export default = /export default /g" "$file"
done

echo "✅ Fixed all imports"
