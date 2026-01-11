# Módulo de Proyecciones de Créditos

## 📊 Guía de Uso del Sistema de Créditos

### Crear un Crédito

```bash
curl -X POST http://localhost:3000/api/credits \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Crédito Hipotecario",
    "valorInicial": 100000000,
    "tasaInteresAnual": 12.5,
    "plazoMeses": 240,
    "subsidioPorcentaje": 30,
    "fechaInicio": "2026-01-01",
    "tipoPago": "MENSUAL"
  }'
```

**Respuesta:**
```json
{
  "id": "677abcd1234567890abcdef1",
  "userId": "507f1f77bcf86cd799439011",
  "nombre": "Crédito Hipotecario",
  "valorInicial": 100000000,
  "saldoActual": 100000000,
  "tasaInteresAnual": 12.5,
  "plazoMeses": 240,
  "cuotaMensual": 1161082.38,
  "subsidioPorcentaje": 30,
  "fechaInicio": "2026-01-01T00:00:00.000Z",
  "estado": "ACTIVO",
  "tipoPago": "MENSUAL"
}
```

### Obtener Proyección Completa

```bash
curl -X GET http://localhost:3000/api/credits/677abcd1234567890abcdef1/proyeccion \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta:**
```json
{
  "creditoId": "677abcd1234567890abcdef1",
  "nombreCredito": "Crédito Hipotecario",
  "resumen": {
    "valorInicial": 100000000,
    "saldoActual": 100000000,
    "tasaInteresAnual": 12.5,
    "tasaInteresMensual": 1.042,
    "plazoMeses": 240,
    "cuotaMensual": 1161082.38,
    "subsidioPorcentaje": 30,
    "subsidioMensual": 348324.71,
    "cuotaConSubsidio": 812757.67,
    "totalAPagar": 278659771.2,
    "totalIntereses": 178659771.2,
    "totalSubsidios": 83597930.4,
    "ahorroTotalPorSubsidio": 83597930.4,
    "cuotasPagadas": 0,
    "cuotasPendientes": 240,
    "fechaInicio": "2026-01-01T00:00:00.000Z",
    "fechaEstimadaFin": "2046-01-01T00:00:00.000Z"
  },
  "cuotas": [
    {
      "numeroCuota": 1,
      "fechaPago": "2026-01-01T00:00:00.000Z",
      "cuotaTotal": 1161082.38,
      "cuotaSinSubsidio": 1161082.38,
      "subsidio": 348324.71,
      "capital": 119582.38,
      "interes": 1041500,
      "saldoRestante": 99880417.62
    },
    {
      "numeroCuota": 2,
      "fechaPago": "2026-02-01T00:00:00.000Z",
      "cuotaTotal": 1161082.38,
      "cuotaSinSubsidio": 1161082.38,
      "subsidio": 348324.71,
      "capital": 120830.53,
      "interes": 1040251.85,
      "saldoRestante": 99759587.09
    }
    // ... 238 cuotas más
  ],
  "abonos": []
}
```

### Simular un Abono a Capital

```bash
curl -X POST http://localhost:3000/api/credits/677abcd1234567890abcdef1/simular-abono \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "montoAbono": 10000000
  }'
```

**Respuesta:**
```json
{
  "creditoActual": {
    "saldoActual": 100000000,
    "cuotaMensual": 1161082.38,
    "plazoRestante": 240,
    "totalAPagarSinAbono": 278659771.2,
    "totalInteresesSinAbono": 178659771.2
  },
  "conAbono": {
    "montoAbono": 10000000,
    "nuevoSaldo": 90000000,
    "nuevaCuotaMensual": 1044974.14,
    "nuevosPlazoMeses": 240,
    "totalAPagarConAbono": 250793793.6,
    "totalInteresesConAbono": 160793793.6,
    "fechaEstimadaFin": "2046-01-01T00:00:00.000Z"
  },
  "beneficios": {
    "ahorroIntereses": 17865977.6,
    "ahorroTotal": 7865977.6,
    "mesesAhorrados": 0,
    "reduccionCuota": 116108.24,
    "porcentajeAhorro": 10
  }
}
```

### Registrar un Abono Real

```bash
curl -X POST http://localhost:3000/api/credits/677abcd1234567890abcdef1/abonos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monto": 5000000,
    "fecha": "2026-01-11"
  }'
```

**Respuesta:**
```json
{
  "id": "677xyz1234567890abcdef2",
  "creditId": "677abcd1234567890abcdef1",
  "monto": 5000000,
  "fecha": "2026-01-11T00:00:00.000Z",
  "saldoAnterior": 100000000,
  "saldoNuevo": 95000000,
  "cuotaAnterior": 1161082.38,
  "cuotaNueva": 1102987.26,
  "plazoAnterior": 240,
  "plazoNuevo": 240,
  "createdAt": "2026-01-11T15:30:00.000Z"
}
```

### Listar Todos los Créditos

```bash
curl -X GET http://localhost:3000/api/credits \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener Historial de Abonos

```bash
curl -X GET http://localhost:3000/api/credits/677abcd1234567890abcdef1/abonos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📐 Fórmulas Utilizadas

### Cuota Mensual (Sistema Francés)
```
Cuota = P × [i(1+i)^n] / [(1+i)^n - 1]

Donde:
P = Principal (saldo del crédito)
i = tasa de interés mensual (tasa anual / 12 / 100)
n = número de meses
```

### Cálculo de Intereses por Cuota
```
Interés = Saldo Restante × Tasa Mensual
Capital = Cuota - Interés
Nuevo Saldo = Saldo Anterior - Capital
```

### Subsidio
```
Subsidio Mensual = Cuota × (Porcentaje Subsidio / 100)
Cuota con Subsidio = Cuota - Subsidio
```

## 💡 Casos de Uso

### 1. Crédito Hipotecario con Subsidio
- **Valor**: $100,000,000
- **Tasa**: 12.5% anual
- **Plazo**: 20 años (240 meses)
- **Subsidio**: 30%
- **Cuota sin subsidio**: $1,161,082
- **Cuota con subsidio**: $812,757
- **Ahorro mensual**: $348,324

### 2. Crédito de Vehículo
- **Valor**: $30,000,000
- **Tasa**: 18% anual
- **Plazo**: 5 años (60 meses)
- **Sin subsidio**
- **Cuota**: $761,122

### 3. Crédito Personal
- **Valor**: $5,000,000
- **Tasa**: 24% anual
- **Plazo**: 2 años (24 meses)
- **Cuota**: $264,989

## 🎯 Características Principales

### ✅ Gestión de Créditos
- Crear créditos con diferentes tasas y plazos
- Calcular cuotas automáticamente
- Aplicar subsidios porcentuales
- Múltiples tipos de pago (Mensual, Quincenal, Semanal)

### ✅ Proyecciones Detalladas
- Tabla de amortización completa
- Desglose de capital e intereses por cuota
- Cálculo de subsidios por período
- Fechas estimadas de pago

### ✅ Simulación de Abonos
- Simular abonos antes de realizarlos
- Ver beneficios exactos (ahorro de intereses)
- Comparar escenarios con/sin abono
- Calcular reducción de cuota

### ✅ Registro de Abonos Reales
- Registrar pagos extraordinarios a capital
- Actualización automática del crédito
- Recalculo de cuotas
- Historial completo de abonos

### ✅ Seguridad
- Autenticación JWT requerida
- Cada usuario solo ve sus créditos
- Validaciones de montos y datos

## 📊 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/credits` | Crear crédito |
| GET | `/api/credits` | Listar créditos del usuario |
| GET | `/api/credits/:id` | Obtener crédito por ID |
| GET | `/api/credits/:id/proyeccion` | Proyección completa |
| POST | `/api/credits/:id/simular-abono` | Simular abono |
| POST | `/api/credits/:id/abonos` | Registrar abono |
| GET | `/api/credits/:id/abonos` | Historial de abonos |
| DELETE | `/api/credits/:id` | Eliminar crédito |

## 🧮 Ejemplo de Análisis

### Crédito: $50,000,000 al 15% anual por 10 años

**Sin abonos adicionales:**
- Cuota mensual: $806,830
- Total a pagar: $96,819,600
- Total intereses: $46,819,600

**Con abono de $5,000,000 al inicio:**
- Nueva cuota: $726,147
- Total a pagar: $87,137,640
- Total intereses: $42,137,640
- **Ahorro: $4,681,960**

## 🚀 Integración con Frontend

### Gráficos Recomendados
1. **Gráfico de barras**: Capital vs Interés por cuota
2. **Gráfico circular**: Distribución total (Capital + Intereses + Subsidios)
3. **Gráfico de línea**: Evolución del saldo en el tiempo
4. **Comparativa**: Escenario con/sin abonos

### Widgets Sugeridos
- Resumen del crédito (saldo, cuota, próximo pago)
- Calculadora de simulación de abonos
- Alertas de próximos pagos
- Indicadores de ahorro por subsidios
