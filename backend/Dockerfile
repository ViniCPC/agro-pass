FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Diretório para uploads em runtime (montado como volume em produção)
RUN mkdir -p uploads

EXPOSE 3000

# Roda migrations pendentes antes de iniciar o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
