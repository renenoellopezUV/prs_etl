# Next.js Frontend Project

This project is a frontend application built with Next.js, React, and Prisma, following modern development practices and organized architecture.

## 🚀 Technologies

- **Next.js**: React framework for production
- **React**: JavaScript library for building user interfaces
- **Prisma**: ORM for database access
- **TypeScript**: Static type-checking
- **ESLint**: Code linting
- **PostCSS**: CSS processing

## 📁 Project Structure

```
base_project/
├── next/                    # Next.js cache and build files
├── node_modules/            # Dependencies
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
├── src/                     # Source code
│   ├── app/                 # Next.js App Router
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── api/             # server API endpoints
│   │   └── services/        # API and service integrations in the client
│   └── utils/               # Utility functions
│       └── prisma.ts        # Prisma client configuration
├── .gitignore               # Git ignore file
├── eslint.config.mjs        # ESLint configuration
├── next.config.ts           # Next.js configuration
├── next-env.d.ts            # Next.js TypeScript declarations
├── package.json             # Project dependencies
├── package-lock.json        # Locked dependencies
├── postcss.config.mjs       # PostCSS configuration
├── README.md                # Project documentation
└── tsconfig.json            # TypeScript configuration
```

## 🏗️ Architecture

The project follows a modular architecture:

- **Components**: Reusable UI elements
- **Hooks**: Shared React hooks for state management and logic
- **Services**: API clients and external service integrations
- **Utils**: Helper functions and shared utilities

## ⚙️ Setup and Installation

### Prerequisites

- Node.js (v18.x or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd base_project
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 💻 Key Components

### Prisma Configuration

```typescript
// src/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

### Custom Hooks Example

```typescript
// src/app/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      router.push('/dashboard');
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, login, logout };
}
```

### API Service Example

```typescript
// src/app/services/apiService.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

## 🛠️ Common Tasks

### Creating a New Component

1. Create a new file in the appropriate directory:
   ```tsx
   // src/app/components/Button.tsx
   import React from 'react';
   
   interface ButtonProps {
     children: React.ReactNode;
     onClick?: () => void;
     variant?: 'primary' | 'secondary';
   }
   
   export default function Button({ 
     children, 
     onClick, 
     variant = 'primary' 
   }: ButtonProps) {
     return (
       <button 
         className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
         onClick={onClick}
       >
         {children}
       </button>
     );
   }
   ```

### Connecting to the Database

```typescript
// Example of a data service
import prisma from '../../utils/prisma';

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}
```

## 🔄 Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Add your feature"
   ```

3. Push to the repository:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a pull request for review.

## 📋 Best Practices

- Use TypeScript for all new files
- Follow component naming conventions (PascalCase for components)
- Keep components small and focused on a single responsibility
- Place shared logic in custom hooks
- Use services for API communication
- Document complex functions and components

---
