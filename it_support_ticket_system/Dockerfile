# ใช้ Node.js เวอร์ชัน 18
FROM node:18

# ตั้ง working directory
WORKDIR /usr/src/app

# copy package.json และ package-lock.json จาก context
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install
RUN npm install -g nodemon
RUN npm install jsonwebtoken
# copy โค้ดทั้งหมด
COPY . .

# เปิดพอร์ต 3000
EXPOSE 3000

# คำสั่งเริ่มรันแอป
CMD ["npx", "nodemon", "server.js"]
