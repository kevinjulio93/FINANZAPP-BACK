# Finanzas Backend

Backend application for personal finance management.

## Architecture

This project follows Clean Architecture principles with SOLID design patterns:

- **Domain Layer**: Entities and repository interfaces (SRP, DIP)
- **Application Layer**: Business logic services (Repository pattern)
- **Infrastructure Layer**: Mongoose models and concrete repository implementations (LSP)
- **Presentation Layer**: Express controllers and routes
- **DI Container**: Dependency injection setup

## Project Structure

```
finanzas-backend/
├── src/
│   ├── domain/          # Entidades e interfaces (SRP, DIP)
│   │   ├── entities/    # Budget.ts, Category.ts, Service.ts, User.ts
│   │   └── repositories/# IBudgetRepository.ts, ICategoryRepository.ts
│   ├── application/     # Services con lógica de negocio (Repository pattern)
│   │   └── services/    # BudgetService.ts, CategoryService.ts
│   ├── infrastructure/  # Mongoose models y repos concretos (LSP)
│   │   ├── database/    # connection.ts
│   │   ├── models/      # Budget.model.ts
│   │   └── repositories/# BudgetRepository.ts (impl de IBudgetRepository)
│   ├── presentation/    # Controllers y routes (Express)
│   │   ├── controllers/ # BudgetController.ts
│   │   └── routes/      # budget.routes.ts (/api/budgets)
│   ├── di/              # Dependency Injection container
│   │   └── container.ts
│   └── app.ts           # Express setup (middlewares, routes)
├── .env                 # MONGO_URI=mongodb://localhost:27017/finanzas
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure environment variables in `.env`

3. Start development server:
   ```bash
   pnpm dev
   ```

## Database

MongoDB connection configured via `MONGO_URI` environment variable.
