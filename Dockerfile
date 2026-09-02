# モノレポ全体を単一の実行イメージにまとめる (#11)。
# client のビルド成果物を server の静的配信ディレクトリへ焼き込み、
# ローカル/リモートで同一のアーティファクトを使う。
FROM node:22-bookworm AS build
WORKDIR /src
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production TZ=Asia/Tokyo
COPY --from=build /src/node_modules /app/node_modules
COPY --from=build /src/shared/package.json /app/shared/package.json
COPY --from=build /src/shared/dist /app/shared/dist
COPY --from=build /src/server/dist /app/server/dist
COPY --from=build /src/client/dist /app/server/public
WORKDIR /app/server/dist
EXPOSE 5001
CMD ["node", "index.js"]
