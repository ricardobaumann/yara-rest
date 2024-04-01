#!/bin/sh
docker-compose -d && npx prisma generate && npx prisma migrate dev && npm start