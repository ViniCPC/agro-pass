FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Uploaded documents. Mount a persistent disk here in production.
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 3000

# Applies migrations and adds missing demo fixtures without rewriting data.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED_DEMO\" = \"true\" ]; then npm run seed; fi && exec node dist/src/main.js"]
