# Use Node.js 20 Alpine for a lightweight image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose port (Vite default is 5173, but config said 3000)
EXPOSE 3000

# Start the application in development mode
# --host is required for Docker to map the port correctly
CMD ["npm", "run", "dev", "--", "--host"]
