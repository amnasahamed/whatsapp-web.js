# Use Node.js 18 or higher as required by the project
FROM node:18-bullseye

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libxss1 \
    libxtst6 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip Chromium download, Puppeteer will use system Chrome)
RUN PUPPETEER_SKIP_DOWNLOAD=true npm install

# Copy the rest of the application
COPY . .

# Create directory for session data
RUN mkdir -p /app/.wwebjs_auth /app/.wwebjs_cache

# Expose port if needed (for example, if you add a web interface)
EXPOSE 3000

# Run the example application
CMD ["node", "example.js"]
