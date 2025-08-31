# SharkSports - Sports Venue Booking Platform

A comprehensive **Next.js 15** sports venue booking platform with **Admin** and **Vendor** dashboards, built with **JavaScript**, **TailwindCSS**, and **MariaDB**.

## 🚀 Features

### Admin Dashboard
- **Vendor Management**: Add, edit, delete vendors and assign venues
- **Venue Management**: Manage all sports venues across the platform
- **Booking Management**: Oversee all bookings with status updates
- **Reports & Analytics**: Comprehensive reports with charts and data visualization
- **User Management**: Full control over platform users and permissions

### Vendor Dashboard
- **My Venues**: Manage owned venues with pricing and availability
- **Booking Management**: Handle bookings for owned venues
- **Reports**: Analytics for owned venues and revenue tracking
- **Profile Settings**: Update account information and preferences

### Core Features
- **JWT-based Authentication** with role-based access control
- **Responsive Design** with professional SaaS-style UI
- **PayU Payment Integration** (dummy implementation for development)
- **Real-time Notifications** and activity logging
- **Data Export** capabilities (CSV reports)
- **Mobile-friendly** interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), JavaScript, TailwindCSS
- **Database**: MariaDB with mysql2 package (no ORM)
- **Authentication**: JWT tokens with bcryptjs password hashing
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Styling**: TailwindCSS with custom components
- **State Management**: React hooks with js-cookie for persistence

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- XAMPP with MariaDB running (default port 3306)
- Git (optional)

### 1. Clone or Download
```bash
# If using Git
git clone <repository-url>
cd sharksports-booking

# Or download and extract the ZIP file
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
1. Start XAMPP and ensure MariaDB is running
2. The application will automatically create the database and tables on first API call
3. Default database name: `sharksports_booking`

### 4. Environment Configuration (Optional)
Create a `.env.local` file in the root directory:
```env
# JWT Secret (optional - defaults to development key)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration (optional - defaults to XAMPP settings)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sharksports_booking
DB_PORT=3306

# PayU Configuration (for production)
PAYU_KEY=your-payu-key
PAYU_SALT=your-payu-salt
PAYU_BASE_URL=https://test.payu.in

# App URL (for payment callbacks)
NEXTAUTH_URL=http://localhost:3000
```

### 5. Initialize Database
Visit `http://localhost:3000/api/setup` in your browser to:
- Create database tables
- Set up default admin and vendor users

### 6. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` - you'll be redirected to the login page.

## 🔐 Default Login Credentials

### Admin Account
- **Email**: admin@sharksports.com
- **Password**: admin123

### Vendor Account
- **Email**: vendor@example.com
- **Password**: vendor123

## 📊 Database Schema

### Users Table
- `id`, `name`, `email`, `phone`, `password`, `role` (admin/vendor), `status`, timestamps

### Venues Table
- `id`, `name`, `location`, `description`, `vendor_id`, `base_price`, `peak_price`, `capacity`, `facilities` (JSON), `status`, timestamps

### Bookings Table
- `id`, `venue_id`, `customer_name`, `customer_email`, `customer_phone`, `booking_date`, `start_time`, `end_time`, `total_amount`, `payment_status`, `booking_status`, `payment_id`, `notes`, timestamps

### Activity Logs Table
- `id`, `user_id`, `action`, `description`, `entity_type`, `entity_id`, `created_at`

## 🎨 UI Components

### Layout Components
- **Sidebar**: Collapsible navigation with role-based menu items
- **Navbar**: Top navigation with search, notifications, and profile dropdown
- **DashboardLayout**: Wrapper component with authentication and responsive design

### Page Components
- **Dashboard**: Overview cards, charts, and activity feeds
- **Vendor Management**: CRUD operations with data tables
- **Venue Management**: Card-based venue display with detailed modals
- **Booking Management**: Calendar and list views with status management
- **Reports**: Interactive charts and data exports
- **Settings**: Profile management and configuration

## 🔧 API Routes

### Authentication
- `POST /api/auth/login` - User login with JWT token generation
- `POST /api/auth/register` - User registration
- `GET /api/setup` - Database initialization

### Vendors (Admin only)
- `GET /api/vendors` - List all vendors
- `POST /api/vendors` - Create new vendor
- `PUT /api/vendors/[id]` - Update vendor
- `DELETE /api/vendors/[id]` - Delete vendor

### Venues
- `GET /api/venues` - List venues (filtered by role)
- `POST /api/venues` - Create venue
- `PUT /api/venues/[id]` - Update venue
- `DELETE /api/venues/[id]` - Delete venue

### Bookings
- `GET /api/bookings` - List bookings (filtered by role)
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/[id]` - Update booking status

### Reports
- `GET /api/reports` - Generate reports (bookings, revenue, venues)

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile and password

### Payments
- `POST /api/payments/initiate` - Start payment process
- `POST /api/payments/success` - Handle successful payments
- `POST /api/payments/failure` - Handle failed payments

## 🏗️ Project Structure

```
sharksports-booking/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── vendors/          # Vendor management
│   ├── venues/           # Venue management
│   ├── bookings/         # Booking management
│   ├── reports/          # Reports & analytics
│   ├── settings/         # User settings
│   ├── login/            # Authentication
│   └── payment/          # Payment success/failure pages
├── components/           # Reusable UI components
├── lib/                  # Utility functions
│   ├── db.js            # Database connection
│   ├── auth.js          # JWT authentication
│   └── payu.js          # Payment integration
└── public/              # Static assets
```

## 🚀 Production Deployment

### 1. Environment Variables
Set production environment variables:
```env
JWT_SECRET=your-production-jwt-secret-min-32-chars
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
PAYU_KEY=your-live-payu-key
PAYU_SALT=your-live-payu-salt
NEXTAUTH_URL=https://your-domain.com
```

### 2. Database
- Set up MariaDB on production server
- Run database initialization via `/api/setup`
- Update default admin credentials

### 3. Build & Deploy
```bash
npm run build
npm start
```

## 🔒 Security Considerations

- JWT tokens expire in 7 days
- Passwords are hashed with bcryptjs (12 rounds)
- Role-based access control on all API routes
- SQL injection protection with parameterized queries
- Input validation on all forms

## 🎯 Future Enhancements

- **Real PayU Integration**: Complete payment gateway implementation
- **Email Notifications**: Booking confirmations and reminders
- **File Uploads**: Venue images and document management
- **Advanced Reporting**: More detailed analytics and insights
- **Mobile App**: React Native companion app
- **Multi-language Support**: Internationalization
- **Advanced Calendar**: Drag-and-drop scheduling interface

## 🐛 Known Issues

- PayU integration is dummy implementation for development
- CSV export generates alerts (needs actual implementation)
- Notification dropdown shows static data
- Payment retry functionality shows alerts

## 📝 License

This project is for educational and demonstration purposes. All rights reserved.

## 🤝 Support

For support or questions:
1. Check the console for error messages
2. Verify XAMPP/MariaDB is running
3. Ensure all dependencies are installed
4. Visit `/api/setup` to initialize database

---

**Built with ❤️ using Next.js 15, TailwindCSS, and MariaDB**
