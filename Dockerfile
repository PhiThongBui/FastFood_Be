# 1. Dùng Node.js bản nhẹ nhất
FROM node:18-alpine

# 2. Tạo thư mục chứa code trong container
WORKDIR /app

# 3. Copy file package.json vào trước để cài thư viện
COPY package*.json ./

# 4. Cài đặt dependencies
RUN npm install

# 5. Copy toàn bộ code nguồn vào
COPY . .

# 6. Build code (Tạo thư mục dist)
RUN npm run build

# 7. Mở port (Chỉ để khai báo)
EXPOSE 3000

# 8. Lệnh chạy ứng dụng khi deploy xong
CMD ["node", "dist/main"]