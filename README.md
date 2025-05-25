# 🏢 Visitor Management System (VMS) - Node.js & Express

A scalable and modular backend API for managing visitors in corporate environments. It handles visitor registration, approval workflows, QR-based check-ins/outs, pre-approvals, and notification via email.

---

## 📌 Features

- Visitor registration with photo and time window
- Email-based approval system with secure token links
- Daily visitor limit enforcement
- Pre-approval management
- Visitor check-in and check-out via QR
- Admin dashboard for visitor analytics
- Scheduled visit windows with validations
- File uploads (photo, ID proofs)
- Cleanup of expired approvals
- Modular architecture with MVC pattern

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/visitor-management-system.git
cd visitor-management-system
```

### 2. Create an .env file 
DB_HOST=localhost
DB_PORT=3306
DB_NAME=visitor_management
DB_USER=root
DB_PASSWORD=your_password

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_app_password

PORT=3000
NODE_ENV=development

### 3. Setup Database
npx sequelize-cli db:create
npx sequelize-cli db:migrate

### 4. Start the server
npm start


## 📬 API Endpoints

### 📝 Visitor Registration
**POST** `/api/visitors`  
Registers a new visitor and sends an approval email to the respective staff member.

### ✅ Approve or Reject Visitor
**GET** `/api/approvals/approve/:token`  
**GET** `/api/approvals/reject/:token`  
Approves or rejects a visitor based on the unique token received via email.

### 🔍 View All Visitors
**GET** `/api/visitors`  
Returns a list of all registered visitors.

**GET** `/api/visitors/:id`  
Fetches details for a specific visitor by their ID.

### 🔐 QR Code Check-In / Check-Out
**PATCH** `/api/checkin/:badgeId`  
Marks a visitor as checked in using their unique badge ID.

**PATCH** `/api/checkout/:badgeId`  
Marks a visitor as checked out using their unique badge ID.

### 🕓 Pre-Approval
**POST** `/api/pre-approval`  
Creates a pre-approved visit for a future date and time.

**GET** `/api/pre-approval`  
Fetches a list of all pre-approved visits.

> 📄 **Full documentation** with request/response examples is available in the `docs/` folder.

---

## 📦 Technologies Used

- **Node.js** with **Express** – REST API backend
- **MySQL** with **Sequelize ORM** – Relational data management
- **Nodemailer** – Email service for visitor approvals
- **Multer** – Middleware for handling file uploads (photos, documents)
- **QRCode** – QR code generation for visitor check-in/out
- **UUID** – For generating secure, unique tokens and identifiers

---

