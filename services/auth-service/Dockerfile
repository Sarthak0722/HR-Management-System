FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile --include=dev

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build the application
RUN pnpm build

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Start the application
CMD ["pnpm", "start"]
