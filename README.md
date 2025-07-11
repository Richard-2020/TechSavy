# TechSavy - Volunteer Senior Ridesharing Application

A comprehensive MERN stack application for managing volunteer-based senior ridesharing services. Built with modern technologies and designed for scalability and ease of use.

## 🚀 Features

### Core Functionality
- **User Management**: Role-based access control (Admin/Dispatcher)
- **Rider Management**: Complete CRUD operations for senior citizen profiles
- **Ride Management**: Comprehensive ride scheduling and tracking
- **Driver Management**: Volunteer driver registration and availability tracking
- **Real-time Dashboard**: Live statistics and activity monitoring
- **Reporting & Analytics**: Detailed reports and performance metrics

### Technical Features
- **Secure Authentication**: JWT-based authentication with role-based authorization
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Real-time Updates**: React Query for efficient data management
- **Form Validation**: Comprehensive client and server-side validation
- **Error Handling**: Robust error handling and user feedback
- **Mobile Responsive**: Optimized for all device sizes

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications
- **Framer Motion** - Animations

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Mongosh**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TechSavy
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp env.example .env
```

Update the `.env` file with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/techsavy-ridesharing
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_URL=http://localhost:3000
```
### 4. Data Load
```bash
# Load sample admin and distpachers
node seedusers.js
```

### 4. Start the Application

#### Development Mode
```bash
# Start both backend and frontend concurrently
npm run dev
```

#### Production Mode
```bash
# Build the frontend
npm run build

# Start the backend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔐 Default Users

The application comes with demo users for testing:

### Admin User
- **Email**: admin@techsavy.com
- **Password**: password123
- **Role**: Admin (full access)

### Dispatcher User
- **Email**: dispatcher@techsavy.com
- **Password**: password123
- **Role**: Dispatcher (limited access)

## 📁 Project Structure

```
TechSavy/
├── client/                # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── ...
│   └── package.json
├── models/                # MongoDB models
├── routes/                # API routes
├── middleware/            # Custom middleware
├── seedusers.js           # User Import
├── server.js              # Express server
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Riders
- `GET /api/riders` - Get all riders
- `POST /api/riders` - Create new rider
- `GET /api/riders/:id` - Get rider by ID
- `PUT /api/riders/:id` - Update rider
- `DELETE /api/riders/:id` - Delete rider

### Rides
- `GET /api/rides` - Get all rides
- `POST /api/rides` - Create new ride
- `GET /api/rides/:id` - Get ride by ID
- `PUT /api/rides/:id` - Update ride
- `PUT /api/rides/:id/assign` - Assign driver to ride
- `PUT /api/rides/:id/status` - Update ride status

### Drivers
- `GET /api/drivers` - Get all drivers
- `POST /api/drivers` - Create new driver
- `GET /api/drivers/:id` - Get driver by ID
- `PUT /api/drivers/:id` - Update driver
- `PUT /api/drivers/:id/status` - Update driver status

### Reports
- `GET /api/reports/rides` - Ride statistics
- `GET /api/reports/drivers` - Driver performance
- `GET /api/reports/riders` - Rider usage
- `GET /api/reports/dashboard` - Dashboard summary

## 🚀 Deployment

### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups for ports 22, 80, 443, 3000, 5000

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx mongodb
   ```

3. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd TechSavy
   npm install
   cd client && npm install && npm run build
   ```

4. **Environment Configuration**
   ```bash
   # Set production environment
   export NODE_ENV=production
   export MONGODB_URI=mongodb://localhost:27017/techsavy-ridesharing
   export JWT_SECRET=your-production-secret
   export CLIENT_URL=https://your-domain.com
   ```

5. **PM2 Process Management**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "techsavy"
   pm2 startup
   pm2 save
   ```

6. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Comprehensive validation on both client and server
- **CORS Protection**: Configured for production environments
- **Rate Limiting**: Protection against abuse
- **Helmet Security**: Security headers middleware
- **Role-based Access**: Granular permission system

## 📊 Database Schema

### Users Collection
- Authentication and profile information
- Role-based access control
- Activity tracking

### Riders Collection
- Senior citizen profiles
- Medical information
- Emergency contacts
- Preferences and requirements

### Rides Collection
- Ride requests and scheduling
- Status tracking
- Driver assignments
- Timing and feedback

### Drivers Collection
- Volunteer driver profiles
- Vehicle information
- Availability schedules
- Background checks

## 📝 License

MIT License

Copyright (c) 2025 Kieran Sullivan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 

## Author
Kieran: Ksullivan87

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Basic CRUD operations for all entities
- Authentication and authorization
- Responsive dashboard
- API endpoints for all features

---

**TechSavy** - Empowering communities through technology-driven senior care solutions.