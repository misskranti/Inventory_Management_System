# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install PostCSS CLI for Tailwind processing
RUN npm install -g postcss-cli

# Copy source code
COPY . .

# Build the application with explicit CSS processing
RUN npm run build

# Enable standalone output
ENV NEXT_TELEMETRY_DISABLED 1

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
