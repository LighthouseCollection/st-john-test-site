# St. John the Beloved test site: Node 22 and the PostgreSQL driver, nothing else. The build stage compiles site/ into
# public/ (build.js, with Babel); the image keeps only the server, the database scripts and public/.
FROM node:22-alpine AS build
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --omit=optional
COPY build.js ./
COPY site ./site
RUN node build.js

FROM node:22-alpine
WORKDIR /srv
ENV NODE_ENV=production PORT=8790 TZ=America/New_York
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --omit=dev --omit=optional && npm cache clean --force
COPY server ./server
COPY db ./db
COPY --from=build /srv/public ./public
USER node
EXPOSE 8790
CMD ["node", "server/server.js"]
