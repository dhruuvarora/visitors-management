# 🏢 Visitor Management System (VMS)

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

![all-details-of-user](https://github.com/user-attachments/assets/e59d0a5a-d56d-4479-9165-edad01bbfbd0)
![approval-gmail(1)](https://github.com/user-attachments/assets/11f92a17-6b78-40d4-a736-5b3fa9310084)
![approve-visitor](https://github.com/user-attachments/assets/aed1c4a4-bba6-4927-8427-c29b5f653611)


![checkedin](https://github.com/user-attachments/assets/5f4a3ea9-00a5-4953-9d9a-afd578397d97)

![checked-out](https://github.com/user-attachments/assets/a3b727d6-ec3a-4217-914f-e39946d83f9e)

![employee-creation](https://github.com/user-attachments/assets/1c78e84c-0ed7-4560-a1e6-a44c94c2a072)

![employee-pre-approval-check](https://github.com/user-attachments/assets/1d99d452-67ba-404c-a470-27ffb8cc9c44)

![get-all-pending-visitors](https://github.com/user-attachments/assets/8780c7d3-be88-4a70-9bd7-46b317fd0f54)

![pre-approval-mail](https://github.com/user-attachments/assets/cec0c774-292d-4a4b-a444-8d10923a5a46)

![pre-approval-visitor](https://github.com/user-attachments/assets/d347c06f-00e4-4ab9-bb05-af65ee3a2781)

![QRcode-details](https://github.com/user-attachments/assets/e22fef9b-cdc3-49bb-8676-26e4c9457dab)

![reject-checkin-not-approve](https://github.com/user-attachments/assets/80a3bfcf-f918-4d4f-8a86-ca7c61503bbe)

![rejection-email](https://github.com/user-attachments/assets/b6570778-307c-41d4-8996-e180d1ddd6c6)

![rejection-reason](https://github.com/user-attachments/assets/438be245-fe01-48b5-b2a4-94c0912a1932)

![rejection-test-visitor](https://github.com/user-attachments/assets/ec99a761-bf1f-4333-9b9f-b832974b6e3f)

![upload-visitor-image](https://github.com/user-attachments/assets/708ef5d3-1db6-4542-9323-d23a72325093)

![visitor-2-picture](https://github.com/user-attachments/assets/d106fe69-14ac-4a75-bfdd-95b97fcea019)

![visitor-creation](https://github.com/user-attachments/assets/fa35910f-23dc-4bcd-b335-fc25d07e742a)
