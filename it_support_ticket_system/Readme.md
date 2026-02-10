# Project : IT_SUPPORT_TICKET

## โครงสร้าง Project IT_SUPPORT_TICKET_SYSTEM
```
MINI_TASK_API
│
├── 📁 app/             
│   ├── 📁config 
│   │    └── database.js                # Database Project
│   ├── 📁controller  
│   │    ├── commentController.js       # จัดการการเพิ่ม/ลบ/แก้ไขความคิดเห็นของ Ticket
│   │    ├── ticketController.js        # จัดการ Ticket เช่น การสร้าง, อัปเดตสถานะ, ลบ            
│   │    └── userController.js          # จัดการข้อมูลผู้ใช้ เช่น ลงทะเบียน, เข้าสู่ระบบ, ดูโปรไฟล์   
│   ├── 📁middleware
│   │    ├── abacMiddleware.js          # Attribute-Based Access Control ตรวจสิทธิ์เชิงคุณสมบัติ (owner, visibility)               
│   │    ├── authMiddleware.js          # ตรวจสอบ JWT Token ก่อนเข้าถึง API            
│   │    └── rbacMiddleware.js          # Role-Based Access Control ตรวจสอบสิทธิ์ตามบทบาท (user, staff, admin)          
│   ├── 📁models  
│   │     ├── commentModel.js           # โครงสร้างข้อมูล comment และการ Query ที่เกี่ยวข้อง
│   │     ├── ticketModel.js            # โครงสร้างข้อมูล ticket เช่น title, status, priority
│   │     └── userModel.js              # โครงสร้างข้อมูล user เช่น username, password, role
│   ├── 📁route
│   │    ├── commentRoutes.js           # เส้นทาง API สำหรับการจัดการ Comment
│   │    ├── ticketRoutes.js            # เส้นทาง API สำหรับ Ticket เช่น POST /tickets, PUT /tickets/:id
│   │    └── userRoutes.js              # เส้นทาง API สำหรับผู้ใช้ เช่น /register, /login, /profile
│   │
│   ├── 📁view
│   │    ├── 📁css                      # เก็บไฟล์ตกแต่งหน้าตาเว็บไซต์ (CSS)
│   │    ├── 📁js                       # เก็บไฟล์ JavaScript สำหรับฝั่ง Client
│   │    └── *.html                     # หน้าเว็บ เช่น login.html, register.html, dashboard.html
│   │
│   │
│   │
|   |
├── 📁 mysql/             
│    └── init.sql                       # สคริปต์สำหรับสร้างตาราง (users, tickets, comments, roles)
│
├──.env                                 # Environment variables
├──docker-compose.yml
├──dockerfile
├──package-lock.json                    # Collect data logs
├──package.json                         # Dependencies
├──README.md                            # คำอธิบายโปรเจกต์และวิธีการใช้งาน
└──server.js                            # Main server file
```

## วิธีการติดตั้งและรัน

### ขั้นตอนที่ 1: โหลด ไฟล์ ZIP แตกไฟล์ จะได้โฟลเดอร์โปรเจกต์

```bash
# เปิด โปรเจกต์ด้วย Visual Studio Code
เปิด terminal ใน Vscode
cd MINI_TASK_API
```
### ขั้นตอนที่ 2: รัน Docker Container 

```bash
# รัน docker compose
docker-compose up --build -d

# ตรวจสอบว่า containers รันอยู่
docker-compose ps
```

### ขั้นตอนที่ 3: เข้าถึง phpMyAdmin

เปิดเบราว์เซอร์และไปที่: `http://localhost:8081`

**ข้อมูลเข้าสู่ระบบ:**

- Server: `mysql`
- Username: `root`
- Password: `root`

## 🔧 คำสั่ง Docker ที่ใช้บ่อย

```bash
# เริ่มต้น containers
docker-compose up -d

# ใช้สร้างข้อมูลใหม่
docker-compose up --build -d

# หยุด containers
docker-compose down

# หยุด containers
docker-compose down -v ล่างข้อมูลทั้งหมด

# ดู logs
docker-compose logs -f  ชื่อ container

# เข้า MySQL command line
docker exec -it bugtracking_mysql mysql -u root -p

# Restart containers
docker-compose restart
```
==========================================================================
### การใช้งาน WEB SITE  IT_SUPPORT_TICKET  
==========================================================================
ระบบ IT Support Ticket เป็นเว็บแอปสำหรับจัดการการแจ้งปัญหาทาง IT ภายในองค์กร
โดยผู้ใช้สามารถสร้าง Ticket แจ้งปัญหา เจ้าหน้าที่ (Staff) สามารถตอบกลับและแก้ไขได้
ส่วนผู้ดูแลระบบ (Admin) สามารถมอบหมายงานและจัดการสิทธิ์ของผู้ใช้งานได้

### ขั้นตอนที่ 1: เปิด Website

เปิดเบราว์เซอร์และไปที่: `http://localhost:3000`

### ขั้นตอนที่ 2: ทำการสมัคร User, staff , admin

### ขั้นตอนที่ 3: ทำการทดสอบ Role : User

## สิ่งที่ User ต้องทำได้

- สร้าง Ticket ใหม่ (Create Ticket) – ระบุหัวข้อ (subject), รายละเอียด, ประเภทปัญหาได้
- ดูรายการ Ticket ของตัวเอง
- แก้ไขรายละเอียด Ticket (เฉพาะของตัวเอง) แต่ต้องอยู่ในสถานะ Open
- ลบ Ticket ของตัวเอง (เมื่อยังไม่ปิด)
- comment ได้
- ดูประวัติการสื่อสาร (Comment thread)

### ขั้นตอนที่ 4: ทำการทดสอบ Role : Staff

## สิ่งที่ Staff ต้องทำได้

- ดูรายการ Ticket ได้เฉพาะที่ได้รับหมอบหมาย
- กำหนดสถานะ Ticket (in progress / resolved)
- ตอบกลับ/เพิ่ม Comment
- ปิด Ticket (mark resolved)
- ดู Ticket ตาม priority / user

### ขั้นตอนที่ 5: ทำการทดสอบ Role : Admin

## สิ่งที่ Admin ต้องทำได้

- ดูทุก Ticket ทุกผู้ใช้
- ลบ Ticket ผิดพลาดหรือไม่เหมาะสม
- assigned ให้ staff ได้
- แก้ไขข้อมูล Ticket ได้ทั้งหมด

## คุณสมบัติหลักของระบบ
- ระบบลงทะเบียน / เข้าสู่ระบบ (JWT Authentication)
- ระบบสร้างและจัดการ Ticket
- ระบบ Comment และการสื่อสารระหว่าง User และ Staff
- ระบบ Role-Based Access Control (RBAC)
- ระบบ Attribute-Based Access Control (ABAC)
- ระบบจัดการสิทธิ์ของผู้ใช้ (User / Staff / Admin)
- ระบบฐานข้อมูล MySQL (Dockerized)
- รองรับการเข้าถึงผ่าน Web Interface (HTML + JS + Bootstrap)