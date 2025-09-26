# QuirkHire: AI-Powered Career Recommendation Platform


## 🚀 Overview

QuirkHire is an advanced AI-powered recruitment platform that matches candidates with job opportunities using semantic understanding of skills, experiences, and cultural fit. Developed by a team of computer science students from ESPRIT Monastir in Tunisia, this platform uses state-of-the-art NLP and LLM technologies to go beyond simple keyword matching.

## ✨ Key Features

- **Smart Candidate Matching**: Uses `sentence-transformers` and advanced NLP to analyze and match job descriptions with candidate profiles
- **Interview Preparation Assistant**: AI-powered tool to help candidates prepare for interviews
- **Recruiter Dashboard**: Powerful interface for managing candidates and job postings
- **Modern UI/UX**: Beautiful, responsive interface with animated components built with Material UI and Framer Motion
- **Secure Authentication**: Complete user management system with role-based access
- **Multi-Role Support**: Specialized experiences for candidates, recruiters, and administrators

## 🧠 Technology Stack

- **Frontend**: React.js, Material UI, Framer Motion
- **Backend**: Django, Python
- **NLP**: Sentence Transformers, spaCy, Natural Language Processing
- **Database**: PostgreSQL with Supabase
- **Authentication**: JWT with Supabase Auth

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or later)
- Python (v3.8 or later)
- PostgreSQL

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hassen05/CareerReco
   cd CareerReco
   ```

2. **Set up a virtual environment**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install backend dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up the database**
   ```bash
   python manage.py makemigrations recommender
   python manage.py migrate
   ```

5. **Run the backend server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Run the frontend development server**
   ```bash
   npm start
   ```

4. **Access the application**
   
   Open your browser and navigate to [http://localhost:3001](http://localhost:3001)

## 📱 Application Structure

- **/frontend** - React application with UI components
- **/recommender** - Django backend with NLP processing and API
- **/data** - Sample data and processing scripts

## 🔍 How It Works

1. **For Recruiters**: Upload job descriptions and get recommended candidates based on semantic similarity
2. **For Candidates**: Create profiles and receive job recommendations based on your skills and experience
3. **For Both**: Benefit from our advanced matching algorithm that understands the context and semantics of skills

## 👥 Team

Developed by a passionate team of computer science students from ESPRIT Monastir in Tunisia, bringing fresh perspectives and innovative ideas to the recruitment technology space.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/hassen05/CareerReco)
- [Issue Tracker](https://github.com/hassen05/CareerReco/issues)

---

<div align="center">
  <p>Made with ❤️ by the QuirkHire Team</p>
</div>