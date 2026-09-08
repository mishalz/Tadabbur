# Tadabbur

A full-stack web application for the study and contemplation of the Holy Quran.

Tadabbur provides a focused digital study space where users can explore verses and visualise meaningful semantic or syntactic relationships between them. Its distinguishing feature is the use of a graph-oriented NoSQL data model to create, store, and visualise connections across Quranic verses.

**Live application:** [Open Tadabbur](https://benevolent-rolypoly-b74a4a.netlify.app/studyspace)

## Overview

The flow of meaning in the Quran is not conventionally unidirectional, rather multiple themes are discussed simultaneously in a Surah, sometimes recurringly appearing elsewhere in the Quran, as well. 
Due to this richness of the flow of meaning, the study of the Quran requires keeping track of the different connections that one comes across within a Surah, between succeeding and preceding Surahs and the recurrence elsewhere in the Quran. 
Tadabbur is designed to make those relationships easier to capture and explore through an interactive web experience.

The application combines a modern React client with a backend service and graph-based data storage to support connected Quranic study rather than isolated verse reading.

## Key Features

- Dedicated Quran study space.
- Interactive visualisation of relationships between verses.
- Support for semantic and syntactic verse connections.
- Graph-based storage model for flexible, connected data.
- Modern responsive interface built with React and Tailwind CSS.
- Client-side routing for a smoother single-page application experience.
- OAuth setup documentation for authenticated user flows.

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Radix UI and shadcn/ui-style components
- D3 Force for graph visualisation
- Axios for HTTP requests
- Lucide React icons
- Vitest and Testing Library

### Backend

- Node.js server application
- API layer housed in the `server` directory
- Graph-oriented NoSQL data model for verse relationships
- OAuth-based authentication support

> See [`OAUTH2_SETUP.md`](./OAUTH2_SETUP.md) for authentication configuration and [`QUICKSTART.md`](./QUICKSTART.md) for additional project-specific setup guidance.

## Project Structure

```text
Tadabbur/
├── client/                 # React + Vite frontend
│   ├── public/             # Static assets
│   ├── src/                # Application source code
│   ├── package.json        # Frontend scripts and dependencies
│   ├── tailwind.config.js  # Tailwind configuration
│   └── vite.config.js      # Vite configuration
├── server/                 # Backend API and graph data services
├── OAUTH2_SETUP.md         # OAuth configuration guide
├── QUICKSTART.md           # Setup and usage guide
└── .gitignore
```

## Local Development

### Prerequisites

Install the following before starting:

- Node.js 18 or later
- npm
- A configured graph database instance for backend data
- OAuth credentials, if authentication is enabled

### 1. Clone the repository

```bash
git clone [https://github.com/mishalz/Tadabbur.git](https://github.com/mishalz/Tadabbur.git)
cd Tadabbur
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Configure environment variables

Create an environment file in the appropriate client and/or server directory based on the variables used by your local configuration.

```bash
cp .env.example .env
```

Add the required API endpoint, graph-database credentials, session settings, and OAuth credentials. Do not commit `.env` files or private keys.

For OAuth-specific guidance, see [`OAUTH2_SETUP.md`](./OAUTH2_SETUP.md).

### 4. Start the frontend

```bash
cd client
npm run dev
```

Vite will provide a local development URL, usually:

```text
http://localhost:5173
```

### 5. Start the backend

In a separate terminal, install and run the server dependencies:

```bash
cd server
npm install
npm run dev
```

If the server uses a different script name, inspect `server/package.json` and run the relevant development command.

## Available Frontend Scripts

Run these commands from the `client` directory:

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Creates an optimized production build.

```bash
npm run preview
```

Serves the production build locally for verification.

```bash
npm test
```

Runs the frontend test suite with Vitest.

## Data Model

Tadabbur uses a graph-based approach because verse relationships are naturally connected rather than strictly hierarchical.

At a high level:

- **Nodes** represent Quranic verses or study entities.
- **Edges** represent a relationship between nodes.
- **Relationship metadata** can describe the connection type, such as semantic similarity, linguistic structure, topic, or reference.
- **Graph visualisation** helps users navigate clusters of related verses and discover connections that would be difficult to see in a linear interface.

## Deployment

The frontend is deployed on Netlify:

- [Live study space](https://benevolent-rolypoly-b74a4a.netlify.app/studyspace)

For a Netlify deployment, configure:

- The frontend working directory as `client`
- The build command as `npm run build`
- The publish directory as `client/dist`
- Required environment variables in Netlify project settings

Ensure the backend API URL is supplied through environment configuration and that CORS permits requests from the deployed Netlify domain.

## Security Notes

- Keep OAuth client secrets, database credentials, session secrets, and API keys outside source control.
- Store production secrets in your deployment provider’s environment-variable settings.
- Restrict OAuth redirect URLs to known local and production domains.
- Validate and authorise all backend requests before querying or writing graph data.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused, tested changes.
4. Run the relevant frontend and backend checks.
5. Open a pull request describing the problem, approach, and verification steps.

## License

Add a license file to clarify how others may use, modify, and distribute this project.

## Acknowledgements

Tadabbur is built to support thoughtful engagement with the Holy Quran through technology, structured exploration, and visual understanding of interconnected verses.
