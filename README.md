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
* Cloudinary Account (For image hosting)

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/machine-yard.git](https://github.com/your-username/machine-yard.git)
   cd machine-yard
