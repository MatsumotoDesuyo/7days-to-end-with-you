# Node 14 のままコンテナ化 (Node 更新は別 issue)。
# sqlite3 がネイティブモジュールのため、build ステージでコンパイルし
# prune した node_modules ごと本番ステージへコピーする。
FROM node:14-bullseye AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

FROM node:14-bullseye-slim
ENV NODE_ENV=production TZ=Asia/Tokyo
WORKDIR /app
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/dist ./
EXPOSE 5001
CMD ["node", "index.js"]
