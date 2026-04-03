#!/bin/sh
set -e
cd /app
export NODE_PATH=/prisma-cli/node_modules
node /prisma-cli/node_modules/prisma/build/index.js migrate deploy
exec "$@"
