# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Non-root user
RUN addgroup -S app && adduser -S app -G app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev && npm cache clean --force
COPY server/ ./server/
COPY scripts/ ./scripts/
COPY --from=frontend /app/dist ./dist
RUN mkdir -p server/uploads logs backups && chown -R app:app /app
USER app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node scripts/healthcheck.js || exit 1
CMD ["node", "server/server.js"]
