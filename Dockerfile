# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# 👉 Copy prisma first
COPY prisma ./prisma

# 👉 Generate Prisma client BEFORE build
RUN npx prisma generate

# Copy rest of code
COPY . .

# Build Next.js app
RUN npm run build


# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only required files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# 👉 No need prisma generate again
CMD ["npm", "start"]
