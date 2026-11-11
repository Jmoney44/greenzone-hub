#!/usr/bin/env bash
# Builds dist/greenzone-hub-upperlink.zip: a ready-to-run package for cPanel "Setup Node.js App".
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=dist/upperlink
rm -rf "$OUT" dist/greenzone-hub-upperlink.zip
mkdir -p "$OUT/data-template"

npm run build

# Database client that carries the engines for the Linux versions cPanel hosts use.
SCHEMA=prisma/.upperlink.schema.prisma
sed -e 's#provider = "prisma-client-js"#provider = "prisma-client-js"\n  output = "'"$PWD/$OUT"'/prisma-client"\n  binaryTargets = ["native", "rhel-openssl-1.1.x", "rhel-openssl-3.0.x", "debian-openssl-1.1.x", "debian-openssl-3.0.x"]#' \
  prisma/schema.prisma > "$SCHEMA"
npx prisma generate --schema "$SCHEMA"
# Empty database with all the tables.
DATABASE_URL="file:$PWD/$OUT/data-template/hub.db" npx prisma db push --skip-generate --schema "$SCHEMA"
rm -f "$SCHEMA"
# Put back the normal client for local development.
npx prisma generate >/dev/null

cp -r .next "$OUT/.next" && rm -rf "$OUT/.next/cache"
cp -r public "$OUT/public"
cp upperlink/app.js upperlink/README.txt "$OUT/"

# Only what the running site needs, at the exact versions it was built with.
node -e '
const v = (n) => require("./node_modules/" + n + "/package.json").version;
const deps = {};
for (const n of ["next", "react", "react-dom", "@prisma/client", "bcryptjs"]) deps[n] = v(n);
require("fs").writeFileSync(process.argv[1] + "/package.json", JSON.stringify({
  name: "greenzone-hub", version: "1.0.0", private: true, main: "app.js",
  scripts: { start: "node app.js" }, engines: { node: ">=18.18" }, dependencies: deps,
}, null, 2));
' "$OUT"

(cd "$OUT" && zip -qr ../greenzone-hub-upperlink.zip .)
ls -la dist/greenzone-hub-upperlink.zip
