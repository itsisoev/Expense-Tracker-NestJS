FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++ bash


FROM base AS deps
COPY package*.json ./
RUN npm ci


FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
