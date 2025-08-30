# Resume AI Analyzer 🤖📄

An AI-powered Applicant Tracking System (ATS) that helps both job seekers and recruiters with intelligent resume analysis, job matching, and candidate evaluation.

## ✨ Features

### For Job Seekers
- **AI Resume Analysis** - Get detailed feedback on your resume
- **ATS Compatibility Scoring** - Ensure your resume passes ATS filters
- **Skill Gap Analysis** - Identify missing skills for target roles
- **Resume Optimization** - AI-powered suggestions for improvement
- **Job Matching** - Find jobs that match your profile

### For Recruiters
- **Candidate Screening** - AI-powered resume screening and ranking
- **Bulk Resume Analysis** - Process multiple resumes simultaneously  
- **Advanced Search Filters** - Find candidates by skills, experience, etc.
- **Interview Scheduling** - Integrated calendar and scheduling tools
- **Analytics Dashboard** - Track recruitment metrics and insights

### Technical Features
- **Modern UI/UX** - Smooth animations and responsive design
- **Real-time Processing** - Instant AI analysis and feedback
- **Secure Authentication** - JWT-based user authentication
- **Cloud Storage** - Secure document storage and management
- **API Integration** - RESTful API for all functionality

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast development
- **Tailwind CSS** for styling
- **Framer Motion** for smooth animations
- **React Router** for navigation
- **Zustand** for state management
- **React Hook Form** for form handling

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database
- **Prisma** ORM
- **JWT** authentication
- **Multer** for file uploads
- **OpenAI API** for AI functionality

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/resume-ai-analyzer.git
cd resume-ai-analyzer
```

2. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
```

3. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npx prisma migrate dev
npm run dev
```

### Environment Variables

#### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Resume AI Analyzer
```

#### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/resume_ai_db"
JWT_SECRET=your-jwt-secret-key
OPENAI_API_KEY=your-openai-api-key
PORT=5000
NODE_ENV=development
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Resume Endpoints
- `POST /api/resumes/upload` - Upload resume for analysis
- `GET /api/resumes/` - Get user's resumes
- `GET /api/resumes/:id` - Get specific resume
- `DELETE /api/resumes/:id` - Delete resume

### Analysis Endpoints
- `POST /api/analysis/analyze` - Analyze resume
- `GET /api/analysis/:id` - Get analysis results
- `POST /api/analysis/compare` - Compare resume to job description

## 🚢 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Backend (Render)
1. Connect your GitHub repository to Render
2. Configure environment variables in Render dashboard
3. Deploy as Web Service with:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- The React and Node.js communities for excellent tools
- Contributors and testers who helped improve the application

## 📞 Support

For support, email support@resumeaianalyzer.com or join our Slack channel.

---

Built with ❤️ by the Resume AI Analyzer team
