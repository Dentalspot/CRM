# Email Templates — Supabase Auth

Templates HTML para los correos transaccionales que Supabase Auth envía vía SMTP custom (Resend, dominio `dentalspot.cl`).

**Convención**: cada archivo `.html` corresponde a un template del Dashboard de Supabase Auth. El nombre del archivo coincide (en minúsculas, con guiones).

## Cómo actualizar un template

1. Editá el archivo HTML acá (versionado en git)
2. Andá a https://supabase.com/dashboard/project/tomremkbuxvedliyywbo/auth/templates
3. Seleccioná el template correspondiente del dropdown
4. **Subject line**: pegá el valor del comentario `<!-- SUBJECT: ... -->` que está al inicio del HTML
5. **Body**: copiás TODO el HTML (sin la línea del comentario SUBJECT) y lo pegás en el editor del body
6. Click "Save changes"

## Lista de templates

| Template Supabase | Archivo | Cuándo se dispara |
|---|---|---|
| Confirm signup | `confirm-signup.html` | Usuario se registra y hay que verificar email |
| Reset Password | `reset-password.html` | Usuario solicita "olvidé mi contraseña" |
| Magic Link | `magic-link.html` | Login passwordless (hoy no usado, dejado por consistencia) |
| Change Email Address | `change-email.html` | Usuario quiere cambiar su email de cuenta |
| Invite user | `invite-user.html` | Admin invita usuario desde Dashboard de Supabase (raro) |

## Variables disponibles (Supabase Auth)

| Variable | Qué es |
|---|---|
| `{{ .ConfirmationURL }}` | Link único de un solo uso. Es el CTA principal |
| `{{ .Email }}` | Email del destinatario |
| `{{ .Token }}` | Código corto de 6 dígitos (alternativa al link) |
| `{{ .TokenHash }}` | Hash largo del token (uso interno) |
| `{{ .SiteURL }}` | URL del sitio configurada en Supabase (debe ser `https://dentalspot.cl`) |

## Notas de diseño

- **Encoding UTF-8** obligatorio (la `ñ` y tildes deben verse, no `n` ni `?`)
- **Inline CSS only** — Gmail strippa `<style>` blocks. Mientras menos `<style>`, mejor compat
- **Imagen del logo** sirve hotlinked desde `https://dentalspot.cl/logo-dentalspot-full.png` (logo horizontal completo, alto 40px, max-width 240px)
- **Color primario**: `#14B8A6` (teal-500 Tailwind, alineado con la paleta del frontend)
- **Tuteo informal chileno** — alineado con la chilenización de todo el repo
- **Sin emojis** — feedback de Danissa (perfil user)
- **Footer legal mínimo** — DentalSpot, dirección, link a privacidad
