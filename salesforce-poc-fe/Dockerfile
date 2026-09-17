FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig.json next.config.ts ./
RUN npm install

COPY src/ ./src/
COPY public/ ./public/
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/src ./src

EXPOSE 3001
CMD ["npm", "start", "--", "-p", "3001"]
