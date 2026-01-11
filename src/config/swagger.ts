import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finanzas API',
      version: '1.0.0',
      description: 'API para gestión de finanzas personales',
      contact: {
        name: 'API Support',
        email: 'support@finanzas.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario',
            },
            name: {
              type: 'string',
              description: 'Nombre del usuario',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              description: 'Nombre del usuario',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Contraseña (mínimo 6 caracteres)',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
            },
            password: {
              type: 'string',
              description: 'Contraseña',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'Token JWT de autenticación',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de error',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la categoría',
            },
            name: {
              type: 'string',
              description: 'Nombre de la categoría',
            },
            color: {
              type: 'string',
              description: 'Color de la categoría (hex)',
            },
            userId: {
              type: 'string',
              description: 'ID del usuario propietario',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de actualización',
            },
          },
        },
        CreateCategoryRequest: {
          type: 'object',
          required: ['name', 'color'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              description: 'Nombre de la categoría',
            },
            color: {
              type: 'string',
              minLength: 1,
              description: 'Color de la categoría (hex)',
            },
          },
        },
      },
    },
  },
  apis: ['./src/presentation/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
