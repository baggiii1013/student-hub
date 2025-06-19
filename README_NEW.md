# Student Hub - Next.js Application

A modern student management and search application built with Next.js, featuring user authentication and student data management.

## Features

- 🔐 **User Authentication** - Register/Login with JWT tokens
- 🔍 **Student Search** - Search students by name, UG number, branch, etc.
- 📱 **Responsive Design** - Beautiful UI with Tailwind CSS
- 🚀 **Next.js API Routes** - Built-in API functionality
- 🗄️ **MongoDB Integration** - Database connectivity with Mongoose
- 🎨 **Animated UI** - Smooth animations and transitions

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd /mnt/240GB_SATA/Development/student-hub/nextjs-student-hub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   The `.env.local` file is already configured with:
   ```
   MONGODB_URI=mongodb+srv://admin:root@cluster0.xvfnikd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nextjs-student-hub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── users/         # User authentication endpoints
│   │   │   └── students/      # Student data endpoints
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── layout.js          # Root layout with AuthProvider
│   │   └── page.js            # Home page with search
│   ├── components/            # Reusable components
│   │   └── ProtectedRoute.js  # Route protection component
│   ├── contexts/              # React contexts
│   │   └── AuthContext.js     # Authentication context
│   ├── lib/                   # Utility libraries
│   │   ├── api.js             # API client functions
│   │   ├── auth.js            # Authentication utilities
│   │   └── dbConnection.js    # MongoDB connection
│   └── models/                # Database models
│       ├── User.js            # User model
│       └── Student.js         # Student model
├── .env.local                 # Environment variables
├── tailwind.config.js         # Tailwind CSS configuration
└── package.json               # Dependencies and scripts
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/current` - Get current user (protected)

### Students
- `GET /api/students/search` - Search students with filters
- `GET /api/students` - Get all students with pagination

## Usage

### Registration/Login
1. Visit [http://localhost:3000/register](http://localhost:3000/register) to create an account
2. Or visit [http://localhost:3000/login](http://localhost:3000/login) to sign in

### Student Search
1. After logging in, use the search bar on the home page
2. Search by:
   - Student name (e.g., "Mohit")
   - UG number (e.g., "24UG050281")
   - Branch (e.g., "AI", "CSE")
   - Any combination of the above

## Key Features

### Data Transformation
The application handles data normalization for students imported from CSV/Excel files with inconsistent field names (e.g., "Name Of Student" vs "name").

### Authentication Flow
- JWT tokens stored in localStorage
- Protected routes redirect to login
- Automatic token validation

### Search Functionality
- Real-time search with regex matching
- Case-insensitive search
- Multiple field search support
- Pagination support

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Converting from Express to Next.js

This project was converted from a separate Express.js backend + React frontend to a unified Next.js application. The main changes include:

1. **API Routes**: Express routes moved to Next.js API routes in `src/app/api/`
2. **Database Connection**: Optimized for serverless with connection reuse
3. **Authentication**: Middleware adapted for Next.js Request/Response objects
4. **File Structure**: Organized using Next.js App Router structure

## Production Deployment

For production deployment:

1. Update the `JWT_SECRET` in `.env.local`
2. Configure your production MongoDB connection
3. Build the application: `npm run build`
4. Deploy to Vercel, Netlify, or your preferred platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes.
