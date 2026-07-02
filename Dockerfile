# Use Node.js 22 LTS as base image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci --fetch-retries=5 --fetch-retry-mintimeout=15000 --fetch-retry-maxtimeout=120000

# Copy project configuration and source files
COPY tsconfig.json vite.config.ts index.html server.ts db.ts ./
COPY src ./src
COPY assets ./assets

# Build Vite frontend and compile Express server.ts using esbuild
RUN npm run build

# Use lightweight production image
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --fetch-retries=5 --fetch-retry-mintimeout=15000 --fetch-retry-maxtimeout=120000

# Copy the built output from the builder stage (including the compiled server.cjs)
COPY --from=builder /app/dist ./dist

# Expose the default port (Cloud Run will override this via process.env.PORT)
EXPOSE 3000

# Start server using the production start script
CMD ["npm", "run", "start"]
