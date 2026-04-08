# Supabase - FONOKIT Database

## Estructura

```
supabase/
├── migrations/           # Migraciones SQL versionadas
│   ├── 20260301000000_add_onboarding_completed.sql
│   ├── 20260318000000_create_adir_tables.sql
│   └── 20260401000000_baseline_schema.sql    # Schema completo (baseline)
├── functions/            # Edge Functions (Deno/TypeScript)
│   ├── chat-with-ai/
│   ├── clinic-invitations/
│   ├── create-mp-checkout/
│   ├── mercadopago-webhook/
│   ├── og-preview/
│   └── process-notiz/
├── schema.sql            # Dump completo del schema public (referencia)
├── schema_storage.sql    # Dump del schema storage (referencia)
├── policies.sql          # Todas las RLS policies (referencia)
└── tables_list.txt       # Lista de las 186 tablas
```

## Estadisticas del Schema

| Objeto | Cantidad |
|--------|----------|
| Tablas | 186 |
| Tipos (ENUMs) | 24 |
| Funciones | 186 |
| Indexes | 280 |
| RLS Policies | 347 |
| Triggers | 85 |

## Conexion

- **Proyecto:** fonokit
- **Region:** South America (Sao Paulo)
- **Reference ID:** ungjizupgostxkemilob
- **Host directo:** aws-0-sa-east-1.pooler.supabase.com:5432
- **Usuario:** postgres.ungjizupgostxkemilob
- **Database:** postgres
- **Postgres version:** 15.8

## Tipos TypeScript

Los tipos generados desde el schema estan en `src/types/database.ts`.

Para regenerar:
```bash
supabase gen types typescript --linked > src/types/database.ts
```

## Como crear nuevas migraciones

1. Crear archivo en `supabase/migrations/` con formato: `YYYYMMDDHHMMSS_descripcion.sql`
2. Escribir el SQL de la migracion
3. Aplicar en Supabase Dashboard o via CLI
4. Regenerar tipos: `supabase gen types typescript --linked > src/types/database.ts`
5. Commit ambos archivos

## Como exportar el schema actualizado

```bash
PGPASSWORD='[DB_PASSWORD]' /usr/local/opt/postgresql@15/bin/pg_dump \
  --host aws-0-sa-east-1.pooler.supabase.com \
  --port 5432 \
  --username postgres.ungjizupgostxkemilob \
  --dbname postgres \
  --schema-only \
  --no-owner \
  --no-privileges \
  --schema public \
  -f supabase/schema.sql
```

## Edge Functions

| Funcion | Proposito |
|---------|-----------|
| chat-with-ai | Chatbot via Anthropic API |
| clinic-invitations | Invitaciones de clinica via email (Resend) |
| create-mp-checkout | Checkout de MercadoPago |
| mercadopago-webhook | Webhook de pagos MercadoPago |
| og-preview | Preview de Open Graph para SEO |
| process-notiz | Transcripcion de audio + analisis |
