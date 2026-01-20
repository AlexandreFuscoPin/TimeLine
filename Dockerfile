# Stage 1: Build React Client
FROM node:18-alpine as client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Node Server
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN apk -U add openssl
RUN npm install --production
COPY server/ ./
# Generate Prisma Client
RUN npx prisma generate

# Copy Client Build to Server Public Directory
COPY --from=client-build /app/client/dist ./public

# Expose Port
ENV PORT=8080
EXPOSE 8080

# Start Command
CMD ["npm", "start"]
