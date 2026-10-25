# Cuenta demo pública

La app tiene un botón **“Explorar la demo”** en `/login`. Entra sin credenciales a una
cuenta de ejemplo, **de solo lectura**, para que cualquiera pueda ver cómo funciona
FinanzApp sin registrarse.

## Cómo funciona

| Pieza | Dónde está |
| --- | --- |
| Endpoint de acceso | `POST /api/auth/demo` → `AuthService.demoLogin()` |
| Bloqueo de escritura | `src/presentation/middleware/demo.middleware.ts` (`DemoReadOnly`) |
| Botón del login | `finanzapp-front/app/login/page.tsx` + `app/actions/demo.actions.ts` |
| Datos de ejemplo | `scripts/seed-demo.js` (mongosh) |
| Badge “Demo · solo lectura” | `finanzapp-front/components/navBar.tsx` |

- El token de la demo dura **8 horas** y no requiere contraseña.
- El usuario demo es `demo@finanzapp.com` (configurable con `DEMO_USER_EMAIL`).
- `DemoReadOnly` responde `403` con `code: DEMO_READ_ONLY` a cualquier escritura
  (`POST`/`PUT`/`PATCH`/`DELETE`), salvo las rutas de consulta a la IA:
  `/api/chat`, `/api/chat/stream`, `/api/comparison` y `/api/import/analyze`.
- En el chat, la demo **no recibe la herramienta `create_services`**, así que no puede
  crear servicios ni siquiera a través del asistente.

## Volver a sembrar los datos

El seed es idempotente: borra y recrea todo lo del usuario demo.

```bash
docker cp scripts/seed-demo.js finanzapp-mongodb:/tmp/seed-demo.js
docker exec finanzapp-mongodb sh -lc \
  'mongosh "mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@localhost:27017/$MONGO_INITDB_DATABASE?authSource=admin" \
   --quiet --file /tmp/seed-demo.js'
```

Genera: 8 categorías, 17 servicios, ~200 pagos de los últimos 12 meses
(con un mes con anomalía de energía, un servicio vencido y dos pendientes)
y un crédito hipotecario con 3 abonos.

## IA: Gemini / Vertex AI

`AI_PROVIDER=gemini` activa `GeminiService`, que implementa el mismo contrato que
`OllamaService` (respuestas, conversación con tools y streaming SSE).

```
AI_PROVIDER=gemini
GEMINI_PROVIDER=vertex          # vertex | studio
GEMINI_MODEL=gemini-3.5-flash-lite
GOOGLE_CLOUD_PROJECT=gen-lang-client-0913583676
GEMINI_LOCATION=global          # los modelos 3.x/4 solo existen en "global"
GOOGLE_SERVICE_ACCOUNT_JSON=... # JSON en base64 del service account
```

Detalles que importan:

1. **La región tiene que ser `global`.** Con `us-central1` Vertex devuelve `404`
   para todos los modelos Gemini 3.x/4.
2. El service account necesita **dos roles**: `roles/aiplatform.user` y
   `roles/serviceusage.serviceUsageConsumer`. Sin el segundo, la API responde
   `403 aiplatform.endpoints.predict denied`.
3. Las respuestas de los modelos 3.x/4 traen `thoughtSignature`. `GeminiService`
   la conserva y la reenvía en el turno siguiente; si se descarta, el segundo
   paso del function calling falla.
4. `functionResponse.response` tiene que ser un **objeto**: si un tool devuelve
   un array, se envuelve en `{ result: [...] }`.

Para volver a Ollama: `AI_PROVIDER=ollama`.
