# sqlite3 がネイティブモジュールのため、build ステージでコンパイルし
# prune した node_modules ごと本番ステージへコピーする。
FROM node:22-bookworm AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production TZ=Asia/Tokyo
WORKDIR /app
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/dist ./
EXPOSE 5001
CMD ["node", "index.js"]
