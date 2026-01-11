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
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del servicio',
            },
            name: {
              type: 'string',
              description: 'Nombre del servicio',
            },
            categoryId: {
              type: 'string',
              description: 'ID de la categoría',
            },
            montoEstimado: {
              type: 'number',
              description: 'Monto estimado mensual',
            },
            estado: {
              type: 'string',
              enum: ['ACTIVO', 'VENCIDO', 'PENDIENTE'],
              description: 'Estado del servicio',
            },
            proximoPago: {
              type: 'string',
              format: 'date',
              description: 'Fecha del próximo pago',
            },
            userId: {
              type: 'string',
              description: 'ID del usuario propietario',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        DashboardOverview: {
          type: 'object',
          properties: {
            totalServices: {
              type: 'integer',
              description: 'Total de servicios activos',
            },
            totalEstimatedCost: {
              type: 'number',
              description: 'Suma de montos estimados mensuales',
            },
            totalPaidThisMonth: {
              type: 'number',
              description: 'Total pagado en el mes actual',
            },
            pendingPayments: {
              type: 'integer',
              description: 'Cantidad de pagos pendientes',
            },
            overduePayments: {
              type: 'integer',
              description: 'Cantidad de pagos vencidos',
            },
          },
        },
        ExpenseByCategory: {
          type: 'object',
          properties: {
            categoryId: {
              type: 'string',
            },
            categoryName: {
              type: 'string',
            },
            color: {
              type: 'string',
            },
            totalAmount: {
              type: 'number',
              description: 'Total gastado en esta categoría',
            },
            servicesCount: {
              type: 'integer',
              description: 'Cantidad de servicios en esta categoría',
            },
            percentage: {
              type: 'number',
              description: 'Porcentaje del total de gastos',
            },
          },
        },
        PaymentTrend: {
          type: 'object',
          properties: {
            month: {
              type: 'string',
              description: 'Mes en formato YYYY-MM',
            },
            totalPaid: {
              type: 'number',
              description: 'Total pagado en el mes',
            },
            totalEstimated: {
              type: 'number',
              description: 'Total estimado para el mes',
            },
            variance: {
              type: 'number',
              description: 'Diferencia entre pagado y estimado',
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
