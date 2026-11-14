# Copiloto de IA de GeoQocha

Este módulo implementa un RAG ligero sobre el dataset procesado. La IA **no calcula** índices, tendencias, hotspots ni cifras: recibe hechos precalculados, los explica y los cita. Si no hay proveedor o la respuesta no pasa los guardrails, usa el fallback por reglas.

## Módulos

| Archivo | Responsabilidad |
|---|---|
| `config.ts` | Lee variables de entorno, timeout, tokens y rate limit. |
| `retrieval.ts` | Indexa hechos por distrito, año y métrica; recupera contexto acotado y arma evidencia. |
| `context.ts` | Serializa el contexto y aplica el presupuesto de caracteres/tokens. |
| `prompts.ts` | Prompt de sistema con reglas y prompt de usuario sin datos sensibles. |
| `provider.ts` | Cliente Gemini/OpenAI en el servidor, con timeout y reintento. |
| `guardrails.ts` | Valida consistencia numérica, evidencia, citas y contenido prohibido. |
| `fallback.ts` | Respuestas determinísticas por reglas en español. |
| `rate-limit.ts` | Límite en memoria por cliente. |
| `service.ts` | Orquesta recuperación, proveedor, guardrails y respuesta final. |

## Variables de entorno

Todas viven solo en el servidor. Nunca uses prefijos `VITE_` ni valores en el repositorio.

| Variable | Default | Uso |
|---|---|---|
| `AI_PROVIDER` | `gemini` | `gemini` u `openai`. |
| `AI_API_KEY` | vacío | Clave del proveedor; si falta, se usa fallback. |
| `AI_MODEL` | según proveedor | Modelo configurado fuera del código. |
| `AI_TIMEOUT_MS` | `20000` | Tiempo máximo por intento. |
| `AI_MAX_OUTPUT_TOKENS` | `800` | Límite de salida. |
| `AI_CONTEXT_MAX_CHARS` | `9000` | Presupuesto del contexto enviado. |
| `AI_RATE_LIMIT_MAX` | `20` | Consultas por ventana y cliente. |
| `AI_RATE_LIMIT_WINDOW_MS` | `60000` | Duración de la ventana. |

## Límites y costos

- El contexto se estima con `caracteres / 4`; se recorta primero la serie histórica más antigua y se conservan los hechos del año solicitado.
- Cada solicitud hace como máximo dos intentos al proveedor y nunca envía el dataset completo.
- El costo por consulta depende del precio vigente del modelo y de `tokens de entrada + tokens de salida`. Para estimarlo, usa los tokens del contexto acotado más `AI_MAX_OUTPUT_TOKENS`; revisa la tarifa del proveedor antes de la demo.
- El rate limit es en memoria y se reinicia al reiniciar el proceso. No hay persistencia de conversaciones ni datos personales.
- No se registran claves, prompts completos ni preguntas del usuario en logs.

## Guardrails

1. `null` se mantiene como «no disponible»; nunca se convierte en cero.
2. Todo número de la respuesta debe existir en el contexto recuperado.
3. Cada insight exige evidencia con `field`, `year` y `source_ref`.
4. La respuesta siempre incluye al menos una cita y el disclaimer de no causalidad.
5. Se rechazan frases que intenten revelar claves, cambiar el rol o mostrar el prompt.
6. Si el proveedor falla, responde 200 con `fallback_used: true` y `model: null`.
7. `data_status` distingue datos ilustrativos de reales.

## Errores

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `INVALID_AI_REQUEST` | Modo, distrito, año o pregunta inválidos. |
| 404 | `CONTEXT_NOT_FOUND` | No hay datos suficientes para responder con citas. |
| 429 | `RATE_LIMITED` | Se superó el límite por cliente. |

Los errores del proveedor (`502`/`504`) se resuelven con fallback cuando este puede construir una respuesta válida.

## Pruebas

```powershell
cd backend
npm run typecheck
npm test
```

Las pruebas cubren endpoints de datos, contrato de IA, fallback, rate limit, guardrails numéricos, citas, presupuesto de contexto e intentos de inyección.
