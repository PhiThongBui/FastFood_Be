# 1. Dùng Node.js bản nhẹ nhất. Tạo một máy ảo cài sẵn Nodejs
FROM node:18
# 2. Tạo thư mục chứa code trong container. Tương đương cd/app
WORKDIR /app

# 3. Copy file package.json vào trước để cài thư viện
COPY package*.json ./

# 4. Cài đặt dependencies. Chạy khi build image, cài thư viện vào app/node_modules
RUN npm install

# 5. Copy toàn bộ code nguồn vào
COPY . .

# 6. Build code (Tạo thư mục dist)
RUN npm run build

# 7. Mở port (Chỉ để khai báo - không tự mở port).Docker compose sẽ tự hiểu
EXPOSE 8000

# 8. Lệnh chạy ứng dụng khi deploy xong
CMD ["node", "dist/main"]