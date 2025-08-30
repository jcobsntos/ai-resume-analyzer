# Resume AI Analyzer 🤖📄

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-API-FFD21E?style=for-the-badge&logo=huggingface)](https://huggingface.co/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.x-0055FF?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-Deploy-46E3B7?style=for-the-badge&logo=render)](https://render.com/)

An AI-powered Applicant Tracking System (ATS) that helps both job seekers and recruiters with intelligent resume analysis, job matching, and candidate evaluation.

## 📋 Demo

![Resume AI Analyzer Demo](demo/demo-preview.gif)

### Dashboard
![Dashboard Preview](demo/dashboard.png)

### Resume Analysis
![Analysis Preview](demo/analysis.png)

### Job Matching
![Job Matching Preview](demo/job-matching.png)

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
- **MongoDB** database
- **Mongoose** ODM
- **JWT** authentication
- **Multer** for file uploads
- **Hugging Face API** for AI functionality

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB database
- Hugging Face API key (free)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/jcobsntos/ai-resume-analyzer.git
cd ai-resume-analyzer
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
MONGODB_URI="mongodb://localhost:27017/resume_ai_db"
JWT_SECRET=your-jwt-secret-key
HUGGING_FACE_API_KEY=your-hugging-face-api-key
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

- Hugging Face for providing free AI capabilities
- The React and Node.js communities for excellent tools
- Contributors and testers who helped improve the application

## 👨‍💻 Author

**Jacob Santos** - *Full Stack Developer*

- GitHub: [@jcobsntos](https://github.com/jcobsntos)
- LinkedIn: [Jacob Santos](https://linkedin.com/in/jcobsntos)
- Email: jcobsntos@gmail.com

## 📞 Support

For support, create an issue in this repository or contact the author directly.

---

**⭐ Star this repo if you find it helpful!**

Built with ❤️ by [Jacob Santos](https://github.com/jcobsntos)
