# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy project files
COPY . .

RUN npm install

# Final instruction
CMD ["node", "index.js"]