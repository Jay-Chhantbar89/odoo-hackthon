# StackIt - A Minimal Q&A Forum Platform

StackIt is a modern, minimal question-and-answer platform designed for collaborative learning and structured knowledge sharing. Built with React, TypeScript, Node.js, and Prisma.

## Features

### Core Features
- **Ask Questions**: Create questions with rich text editor, tags, and formatting
- **Answer Questions**: Post detailed answers with rich formatting
- **Voting System**: Upvote/downvote questions and answers
- **Accept Answers**: Question owners can mark the best answer
- **Tagging System**: Organize content with relevant tags
- **Real-time Notifications**: Get notified of new answers, comments, and mentions
- **User Authentication**: Secure JWT-based authentication
- **Role-based Access**: Guest, User, and Admin roles

### Rich Text Editor Features
- Bold, Italic, Strikethrough
- Numbered lists and bullet points
- Emoji insertion
- Hyperlink insertion
- Image upload support
- Text alignment (Left, Center, Right)

### User Roles & Permissions
- **Guest**: View all questions and answers
- **User**: Register, login, post questions/answers, vote
- **Admin**: Moderate content, ban users, manage platform

## Tech Stack

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma** ORM with SQLite database
- **JWT** for authentication
- **Socket.IO** for real-time notifications
- **bcryptjs** for password hashing

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **TipTap** rich text editor
- **React Router** for navigation
- **Axios** for API calls
- **Socket.IO Client** for real-time features

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stackit
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in server directory
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   cd server
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the development servers**
   ```bash
   # From the root directory
   npm run dev
   ```

This will start:
- Backend server on http://localhost:5000
- Frontend client on http://localhost:3000

### Environment Variables

Create a `.env` file in the `server` directory:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
NODE_ENV=development
CLIENT_URL="http://localhost:3000"
```

## Project Structure

```
stackit/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── index.ts        # Server entry point
│   ├── prisma/             # Database schema
│   └── package.json
└── package.json            # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Questions
- `GET /api/questions` - Get all questions (with pagination/filtering)
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/vote` - Vote on question
- `POST /api/questions/:id/accept-answer/:answerId` - Accept answer

### Answers
- `POST /api/answers` - Create answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/vote` - Vote on answer

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread/count` - Get unread count

### Tags
- `GET /api/tags` - Get all tags
- `GET /api/tags/popular` - Get popular tags

## Development

### Available Scripts

**Root directory:**
- `npm run dev` - Start both frontend and backend in development mode
- `npm run install:all` - Install dependencies for all packages

**Server directory:**
- `npm run dev` - Start server in development mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

**Client directory:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue in the repository. 