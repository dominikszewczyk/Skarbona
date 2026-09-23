FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY apps/web/package*.json apps/web/
RUN npm ci

COPY apps/api apps/api
COPY apps/web apps/web

RUN npx prisma generate --schema apps/api/prisma/schema.prisma
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace @skarbona/web

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache nginx supervisor

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api /app/apps/api
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/http.d/default.conf
COPY deploy/supervisord.conf /etc/supervisord.conf

ENV API_PORT=3000
EXPOSE 80
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
