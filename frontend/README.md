# Resume AI Analyzer - Frontend

A modern React application built with TypeScript and TailwindCSS for the AI-powered Applicant Tracking System.

## 🚀 Features

- **Authentication**: Login/Register with JWT tokens
- **Role-Based Access**: Different interfaces for candidates, recruiters, and admins
- **Job Management**: Browse, search, and filter job listings
- **Application Tracking**: Submit and track job applications
- **AI Analysis**: View AI-powered resume analysis results
- **Responsive Design**: Mobile-first responsive design
- **Real-time Updates**: Live notifications and status updates

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **React Hot Toast** - Beautiful notifications
- **Heroicons** - Beautiful SVG icons

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── ui/             # Generic UI components
├── pages/              # Page components
│   ├── auth/           # Login/Register pages
│   ├── jobs/           # Job-related pages
│   ├── applications/   # Application pages
│   └── dashboards/     # Role-specific dashboards
├── store/              # Zustand stores
├── services/           # API services
├── types/              # TypeScript type definitions
├── lib/                # Utilities and helpers
├── routes/             # Router configuration
└── styles/             # Global styles
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Update environment variables in `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Build

Build for production:
```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🔧 Configuration

### Environment Variables

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

### API Proxy

During development, API calls are proxied through Vite to avoid CORS issues:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Proxied API calls: `http://localhost:3000/api/*` → `http://localhost:5000/api/*`

## 📱 Pages and Routes

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/jobs` - Public job listings

### Protected Routes
- `/profile` - User profile management
- `/applications` - User's applications

### Role-Specific Routes

**Candidates:**
- `/dashboard/candidate` - Candidate dashboard

**Recruiters:**
- `/dashboard/recruiter` - Recruiter dashboard
- `/jobs/manage` - Job management

**Admins:**
- `/dashboard/admin` - Admin dashboard
- `/admin/users` - User management

## 🎨 Styling

The application uses TailwindCSS with custom utilities:

### Component Classes
- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.card` - Card container
- `.form-input` - Form input styling

### Colors
- Primary: Blue (`blue-600`, `blue-700`)
- Success: Green (`green-600`)
- Warning: Yellow (`yellow-600`)
- Error: Red (`red-600`)

## 🔄 State Management

### Zustand Stores

1. **Auth Store** (`useAuthStore`)
   - User authentication state
   - Login/logout actions
   - User profile management

2. **Job Store** (`useJobStore`)
   - Job listings and search
   - Job creation/editing (recruiters)
   - Filtering and pagination

3. **Application Store** (`useApplicationStore`)
   - Job applications
   - Status updates
   - AI analysis results

4. **Analytics Store** (`useAnalyticsStore`)
   - Dashboard analytics
   - Recruitment funnel data
   - Performance metrics

## 🌐 API Integration

API calls are handled through service modules in `/src/services/api.ts`:

- `authAPI` - Authentication endpoints
- `jobsAPI` - Job management
- `applicationsAPI` - Application management
- `analyticsAPI` - Analytics and reporting
- `adminAPI` - Administrative functions

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test

# Run tests with coverage
npm run test:coverage
```

## 📦 Build and Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting provider

## 🔐 Security Features

- JWT token management with automatic refresh
- Role-based route protection
- XSS protection through React's built-in escaping
- CSRF protection via SameSite cookies
- Secure file uploads with validation

## 📈 Performance

- Code splitting with Vite
- Lazy loading of routes
- Optimized bundle size
- Tree shaking for unused code
- Image optimization

## 🐛 Error Handling

- Global error boundary
- API error handling
- User-friendly error messages
- Automatic retry for failed requests
- Offline detection

## 🔧 Development Tools

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type checking
- Hot reload during development
