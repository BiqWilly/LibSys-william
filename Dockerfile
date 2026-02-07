# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy project files
COPY . .

# Final instruction
CMD ["echo", "LibSys Build Successful"]