# API Testing - Dashboard Endpoints

## Ejemplos de Curl para probar el Dashboard

### 1. Obtener Dashboard Completo (Mes Actual)
```bash
curl -X GET http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Obtener Dashboard para un mes/año específico
```bash
curl -X GET "http://localhost:3000/api/dashboard?month=1&year=2026" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Obtener Comparación Mensual (Mes Actual vs Anterior)
```bash
curl -X GET http://localhost:3000/api/dashboard/comparison \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Obtener Comparación para mes/año específico
```bash
curl -X GET "http://localhost:3000/api/dashboard/comparison?month=1&year=2026" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Respuesta Esperada del Dashboard

### GET /api/dashboard

```json
{
  "overview": {
    "totalServices": 5,
    "totalEstimatedCost": 500,
    "totalPaidThisMonth": 450,
    "pendingPayments": 2,
    "overduePayments": 1
  },
  "mostExpensiveServices": [
    {
      "serviceId": "507f1f77bcf86cd799439011",
      "serviceName": "Netflix Premium",
      "categoryName": "Entretenimiento",
      "monthlyAmount": 150
    },
    {
      "serviceId": "507f1f77bcf86cd799439012",
      "serviceName": "Internet Fibra",
      "categoryName": "Servicios Básicos",
      "monthlyAmount": 120
    }
  ],
  "monthlyExpenses": {
    "month": 1,
    "year": 2026,
    "totalPaid": 450,
    "totalEstimated": 500,
    "servicesCount": 5
  },
  "expensesByCategory": [
    {
      "categoryId": "507f1f77bcf86cd799439013",
      "categoryName": "Entretenimiento",
      "color": "#FF5733",
      "totalAmount": 200,
      "servicesCount": 2,
      "percentage": 44.44
    },
    {
      "categoryId": "507f1f77bcf86cd799439014",
      "categoryName": "Servicios Básicos",
      "color": "#33FF57",
      "totalAmount": 250,
      "servicesCount": 3,
      "percentage": 55.56
    }
  ],
  "paymentTrends": [
    {
      "month": "2025-08",
      "totalPaid": 400,
      "totalEstimated": 450,
      "variance": -50
    },
    {
      "month": "2025-09",
      "totalPaid": 420,
      "totalEstimated": 450,
      "variance": -30
    },
    {
      "month": "2025-10",
      "totalPaid": 445,
      "totalEstimated": 480,
      "variance": -35
    },
    {
      "month": "2025-11",
      "totalPaid": 430,
      "totalEstimated": 490,
      "variance": -60
    },
    {
      "month": "2025-12",
      "totalPaid": 460,
      "totalEstimated": 500,
      "variance": -40
    },
    {
      "month": "2026-01",
      "totalPaid": 450,
      "totalEstimated": 500,
      "variance": -50
    }
  ],
  "upcomingPayments": [
    {
      "serviceId": "507f1f77bcf86cd799439015",
      "serviceName": "Spotify",
      "amount": 50,
      "dueDate": "2026-01-15T00:00:00.000Z",
      "status": "PENDIENTE"
    },
    {
      "serviceId": "507f1f77bcf86cd799439016",
      "serviceName": "Gym Membership",
      "amount": 80,
      "dueDate": "2026-01-18T00:00:00.000Z",
      "status": "PENDIENTE"
    }
  ]
}
```

### GET /api/dashboard/comparison

```json
{
  "current": {
    "month": 1,
    "year": 2026,
    "totalPaid": 500,
    "totalEstimated": 550,
    "servicesCount": 5
  },
  "previous": {
    "month": 12,
    "year": 2025,
    "totalPaid": 400,
    "totalEstimated": 450,
    "servicesCount": 4
  },
  "comparison": {
    "paidDifference": 100,
    "paidPercentageChange": 25,
    "estimatedDifference": 100
  }
}
```

## Interpretación de Métricas

### Overview
- **totalServices**: Total de servicios activos del usuario
- **totalEstimatedCost**: Suma de todos los montos estimados mensuales
- **totalPaidThisMonth**: Total realmente pagado en el mes consultado
- **pendingPayments**: Cantidad de servicios con estado PENDIENTE
- **overduePayments**: Cantidad de servicios con estado VENCIDO

### Most Expensive Services
Top 5 servicios más costosos ordenados por `montoEstimado` descendente

### Monthly Expenses
Resumen del mes específico consultado con total pagado vs estimado

### Expenses By Category
- Agrupación de gastos por categoría
- Incluye porcentaje relativo de cada categoría sobre el total
- Ordenado por monto total descendente

### Payment Trends
- Historial de los últimos 6 meses
- Muestra evolución de pagos reales vs estimados
- **variance**: Diferencia entre pagado y estimado (positivo = gastaste más, negativo = gastaste menos)

### Upcoming Payments
Servicios con próximo pago en los siguientes 7 días, ordenados por fecha

## Notas
1. Reemplaza `YOUR_TOKEN_HERE` con el token JWT obtenido en el login
2. El dashboard usa el mes/año actual por defecto si no se especifican parámetros
3. Los datos se filtran automáticamente por el usuario autenticado
4. Los montos están en la moneda configurada en el sistema
