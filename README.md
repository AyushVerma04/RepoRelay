# RepoRelay

RepoRelay is a full-stack web application for analyzing, visualizing, and managing GitHub repositories. It provides a user-friendly interface to explore repository data, run sandboxed code executions, and leverage AI-powered insights for development workflows.

## Features

- **Repository Analysis**: Visualize commits, contributors, languages, and statistics
- **Sandboxed Execution**: Run code in isolated Docker environments for security
- **AI Integration**: Use Groq AI for intelligent code analysis and suggestions
- **Real-time Updates**: WebSocket support for live execution logs
- **Authentication**: Secure user management with JWT tokens
- **Deployment Ready**: Easy setup with Docker and environment configuration

## Tech Stack

### Frontend (Client)
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts for data visualization
- Lucide React for icons

### Backend (Server)
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Docker for containerization
- WebSocket for real-time communication
- JWT for authentication
- Groq AI SDK for AI features

## Project Structure

```
RepoRelay/
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   └── views/       # Page components
│   ├── public/          # Static assets
│   └── package.json
├── server/          # Node.js backend API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── models/      # Database schemas
│   └── package.json
└── README.md       # This file
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Docker (for sandboxed execution)
- MongoDB (local or cloud instance)
- GitHub Personal Access Token (optional, for private repos)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AyushVerma04/RepoRelay.git
   cd RepoRelay
   ```

2. **Install dependencies**

   For the client:
   ```bash
   cd client
   npm install
   ```

   For the server:
   ```bash
   cd ../server
   npm install
   ```

3. **Environment Configuration**

   Copy the example environment file and configure your secrets:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `GROQ_API_KEY`: Your Groq AI API key
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `GITHUB_TOKEN`: GitHub Personal Access Token (optional)

4. **Start the applications**

   Start the server:
   ```bash
   cd server
   npm run dev
   ```

   In a new terminal, start the client:
   ```bash
   cd client
   npm run dev
   ```

5. **Access the application**

   Open your browser to `http://localhost:5173` (client) and the API will be available at `http://localhost:5000`.

## Usage

1. **Repository Analysis**: Enter a GitHub repository URL to analyze commits, contributors, and languages.
2. **Code Execution**: Use the sandboxed environment to run code snippets securely.
3. **AI Features**: Get AI-powered suggestions and analysis for your code.
4. **Deployment**: Deploy applications directly from the interface.

## API Documentation

The backend provides RESTful APIs and WebSocket endpoints:

- `GET /api/health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/repos/:owner/:repo` - Repository information
- WebSocket `/ws` - Real-time execution logs

## Development

### Building for Production

Client:
```bash
cd client
npm run build
```

Server:
```bash
cd server
npm run build
npm start
```

### Running Tests

```bash
# Add test scripts to package.json as needed
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- Built with modern web technologies
- Inspired by the need for secure, AI-enhanced repository management
- Thanks to the open-source community for the amazing tools and libraries