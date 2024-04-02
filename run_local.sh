#!/bin/sh
set -e
docker-compose up -d
npm install
npx prisma generate
npx prisma migrate dev
npm start