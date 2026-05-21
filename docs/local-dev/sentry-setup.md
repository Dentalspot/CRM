# Sentry — setup inicial (5 min de tu parte)

Sentry ya está integrado en código (`src/lib/sentry.js` + `main.jsx` + `ErrorBoundary` + `AuthContext`). **No capturará nada hasta que setees `VITE_SENTRY_DSN`** en env vars.

---

## Paso 1 — Crear cuenta Sentry (gratis)

1. Ir a https://sentry.io/signup/
2. Registrarse con tu email
3. Crear una **Organization** (ej: "DentalSpot" o "Communicare")
4. Crear un **Project**:
   - Platform: **React**
   - Project name: `dentalspot-web`
5. En la pantalla de "Installation", copiar el **DSN** (se ve algo así:
   `https://abc123@o456.ingest.sentry.io/789`)

**Free tier incluye**: 5K errores/mes + 10K performance events + 50 replays. Más que suficiente para beta.

---

## Paso 2 — Setear DSN en Vercel (producción)

1. Ir al dashboard de Vercel → proyecto DentalSpot → **Settings → Environment Variables**
2. Crear nueva variable:
   - Name: `VITE_SENTRY_DSN`
   - Value: el DSN copiado del paso 1
   - Environments: marcar **Production** (y Preview si quieres staging tracking)
3. Opcional pero recomendado:
   - Name: `VITE_SENTRY_ENVIRONMENT`  
     Value: `production`
   - Name: `VITE_SENTRY_RELEASE`  
     Value: commit SHA (se puede automatizar en `vercel.json` con `${VERCEL_GIT_COMMIT_SHA}`)
4. **Redeploy** el proyecto (Deployments → latest → Redeploy). Sin redeploy, Vercel no inyecta la env nueva.

---

## Paso 3 — Verificar que funciona

1. Abrir la app en producción (`dentalspot.cl` o la URL de Vercel)
2. Abrir DevTools → Console
3. Ejecutar manualmente:
   ```js
   throw new Error('Sentry smoke test — ' + new Date().toISOString())
   ```
4. Ir a Sentry dashboard → Issues → debería aparecer el error en <1min

Si NO aparece:
- Verificar DSN en Vercel (no dentro de comillas)
- Verificar que hiciste redeploy
- En DevTools Console buscar mensaje `[Sentry] Inicializado...` al cargar la página
- Si ves `[Sentry] VITE_SENTRY_DSN no configurado`, la env no llegó al build

---

## Setup local (dev) — opcional

Si quieres que Sentry capture errores en `npm run dev` también:

1. Crear `.env.local` en la raíz del repo (gitignored, NO commitear):
   ```
   VITE_SENTRY_DSN=https://...tu_dsn...
   VITE_SENTRY_ENVIRONMENT=development
   ```
2. Reiniciar `npm run dev`

**Recomendación**: dejarlo DESHABILITADO en dev local para no llenar la cuota con bugs tuyos mientras desarrollas. Solo activarlo en producción + staging.

---

## Qué se captura

Automático:
- Errores que llegan a `ErrorBoundary` (render crashes)
- Unhandled promise rejections (ej. un `await supabase...` que falla silencioso)

Manual (opcional, si quieres reportar algo específico):
```js
import { captureException } from '@/lib/sentry';

try { ... } catch (err) {
  captureException(err, { tags: { feature: 'checkout' }, extra: { planId } });
}
```

---

## Qué NO se captura (por diseño)

Defensas contra PHI leak (Ley 21.719):
- `user.email` se strippa del user context — solo mandamos `id`
- Breadcrumbs con mención de tablas clínicas se filtran (`patients`, `clinical_records`, `odontogram`, `legal_signatures`)
- Query params sensibles (`email`, `token`, `code`, `access_token`) se redactan en URLs

Ruido ignorado:
- `ResizeObserver loop limit exceeded` (típico, no es bug real)
- `Failed to fetch` / `NetworkError` (transient network, no accionable)
- `Non-Error promise rejection captured`

Si ves algún patrón de noise nuevo en producción, agrégalo a `ignoreErrors` en `src/lib/sentry.js`.

---

## Costo-control

Con free tier 5K errors/mes, si hay un error repetido (ej. un componente renderiza 100 veces por user) podrías quemar la cuota rápido. Sentry tiene auto-grouping pero igual vigilar:

- Dashboard → Usage → quota consumida este mes
- Si >50% consumido y estamos mid-mes, investigar qué issue está dominando

**Upgrade**: si la cuenta se queda corta, plan Team $26/mes (50K errores).

---

## Integración con edge functions (futuro)

Sentry Deno SDK existe pero es más engorroso. Para MVP:
- Los edge functions críticos (`create-mp-checkout`, `mercadopago-webhook`) ya logean a `console.error`
- Esos logs se ven en Supabase Dashboard → Edge Functions → Logs
- Si quieres integrar Sentry en edge functions, es spec separado (~2-3h)

---

## Checklist de setup completado

- [ ] Cuenta Sentry creada
- [ ] DSN copiado
- [ ] `VITE_SENTRY_DSN` seteado en Vercel
- [ ] Redeploy ejecutado
- [ ] Smoke test ejecutado, error visible en dashboard
- [ ] (opcional) Alert rule configurado: notificar email si ≥5 errors/hora
