FROM node:18-alpine

WORKDIR /app

# Cài đặt các dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Port mà backend sẽ chạy
EXPOSE 4000

# Khởi chạy server
CMD ["npm", "start"]
