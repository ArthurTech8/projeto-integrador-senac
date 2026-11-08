# Etapa 1: o Node baixa as bibliotecas, verifica os tipos e gera o site estático (pasta dist/)
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# Verifica os tipos do TypeScript: se houver erro de tipo, o build para aqui
RUN npm run typecheck
# Endereço da API, lido pelo Vue no build (só variáveis VITE_ chegam ao navegador)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: o nginx serve o site pronto
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
