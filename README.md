# Machine Yard

Machine Yard is a full-stack machinery rental platform designed to streamline equipment bookings, availability tracking, and verification across commercial, agricultural, and construction industries.

---

## Key Features

* **Role-Based Access Control (RBAC):** Customized portals for Users, Owners, and Admins.
* **Equipment Management:** Owners can list, edit, upload images for, and soft-delete machinery.
* **Verification Workflow:** Admins review and approve or reject newly registered machinery listings.
* **Real-Time Booking System:** Time-based reservations featuring dynamic hour calculations and automated overlapping-slot prevention.
* **Email Notifications:** Automatic status updates regarding approval or rejection sent to users via Nodemailer.
* **Image Hosting:** Cloudinary integration for handling high-resolution machine and profile media uploads.
* **Rating & Reviews:** Users can leave post-rental ratings to update equipment average feedback.
* **Authentication:** Secure passwords hashed with bcryptjs and route authorization handled via JSON Web Tokens (JWT).

---

## Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose (ODM)
* **Authentication:** JWT (JSON Web Tokens), Bcrypt.js
* **Media & Uploads:** Cloudinary, Multer
* **Email Services:** Nodemailer
* **Environment Management:** Dotenv

---

## Getting Started

### Prerequisites

Ensure you have the following installed locally:

* Node.js (v16+ recommended)
* MongoDB (Local instance or MongoDB Atlas connection string)
* Cloudinary Account (for image hosting)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/machine-yard.git
   cd machine-yard
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the root directory and add the following keys:

   ```env
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Run the application:**

   ```bash
   # Development mode with nodemon
   npm run dev

   # Standard production start
   npm start
   ```

---

## API Documentation

### Authentication Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user (user, owner, or admin) |
| POST | `/api/auth/login` | Public | Authenticate user and return JWT token |
| GET | `/api/auth/profile` | Authenticated | Fetch current user profile details |
| PUT | `/api/auth/profile` | Authenticated | Update user details or profile picture |
| POST | `/api/auth/forgot-password` | Public | Send password reset link to user email |
| POST | `/api/auth/reset-password/:token` | Public | Reset password using valid reset token |

### Machine Management Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/machines` | Public | Get all verified and available machines |
| GET | `/api/machines/:id` | Public | Fetch details for a specific machine |
| POST | `/api/machines` | Owner | Add a new machinery listing |
| PUT | `/api/machines/:id` | Owner | Update an existing machine listing |
| DELETE | `/api/machines/:id` | Owner | Delete a machine listing |
| POST | `/api/machines/:id/rate` | User | Submit rating and feedback after rental |
| GET | `/api/machines/owner` | Owner | Get all machines belonging to the owner |

### Admin Moderation Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/machines/pending` | Admin | View all unverified machinery listings |
| PUT | `/api/machines/verify/:id` | Admin | Approve a pending machine listing |
| PUT | `/api/machines/reject/:id` | Admin | Reject a pending machine listing |

### Booking Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/bookings` | User | Create a time-slot machine reservation |
| GET | `/api/bookings/user` | User | View rental history for current user |
| GET | `/api/bookings/owner` | Owner | View incoming booking requests for owned machines |
| PUT | `/api/bookings/verify/:id` | Owner | Accept or reject a booking request |
| PUT | `/api/bookings/cancel/:id` | User | Cancel an active or approved booking |
