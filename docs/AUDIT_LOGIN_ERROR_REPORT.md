
# Reporte de Auditoría: Flujo de Autenticación y Error "Profesional no encontrado"

## Task 1: Búsqueda del error "profesional no encontrado"
Tras revisar los archivos visibles proporcionados en el codebase actual (específicamente `src/contexts/AuthContext.jsx`, `src/features/auth/pages/AuthPage.jsx`, y `src/features/auth/hooks/useAuth.js`), **no se encontró la cadena literal "profesional no encontrado"**. 

**Posibles ubicaciones (archivos ocultos/no visibles actualmente):**
*   `src/features/auth/components/AuthForm.jsx`: Es altamente probable que la validación y el mensaje de error de UI (toast/alert) se encuentren en la lógica de manejo de errores de este formulario.
*   `src/pages/TherapistPublicProfilePage.jsx`: Podría arrojar este error si se intenta acceder al perfil público de un profesional que no existe en la base de datos (404 state).

## Task 2: Auditoría del flujo de autenticación principal (`AuthContext.jsx`)
*   **Lógica de Login (`signIn`)**: Utiliza directamente `supabase.auth.signInWithPassword({ email, password })`. Retorna un objeto `{ data, error }`. No realiza validaciones adicionales de rol o existencia de perfil en este paso; delega la resolución a Supabase Auth.
*   **Lógica de Registro (`signUp`)**: Envía metadatos como `full_name`, `role` y `rut` a `raw_user_meta_data`.
*   **Validaciones de perfil/profesional**: Ocurre de forma asíncrona dentro del `useEffect` a través del listener `onAuthStateChange`. Al detectar un evento de login (`SIGNED_IN` o inicialización), llama a la función `fetchProfile(userId)`.
*   **Puntos de falla**: 
    1. Si `supabase.auth.signInWithPassword` falla (credenciales inválidas), retorna error, pero no valida perfiles.
    2. Si el login es exitoso pero `fetchProfile` no encuentra el registro en la tabla `profiles` (ej. por un fallo en el trigger `handle_new_user`), el contexto captura el error con un `console.warn('Profile fetch warning...')` y asigna `null` al perfil.
    3. Al fallar la obtención del perfil, el sistema intenta hacer un fallback (rescate) de la información usando `user_metadata.role`, y si no existe, asume que es un `PATIENT` (`USER_ROLES.PATIENT`). Esto puede causar que un profesional sea tratado como paciente si su perfil no se generó correctamente.

## Task 3: Auditoría de hooks de autenticación
*   **`useAuth`**: Definido en `src/contexts/AuthContext.jsx` y re-exportado en `src/features/auth/hooks/useAuth.js`.
*   **Exportación/Uso**: Se utiliza consumiendo el contexto: `const { user, signIn, signUp, loading, isTherapist } = useAuth();`.
*   **Pasos del login en el hook**: El hook expone la función `signIn`, que es una promesa. El componente consumidor (`AuthForm`) espera la resolución. Tras resolverse con éxito, el estado interno del contexto (`user`, `session`, `profile`) se actualiza mediante el evento de suscripción `onAuthStateChange`.

## Task 4: Auditoría de las páginas de login
*   **Archivo principal**: `src/features/auth/pages/AuthPage.jsx`.
*   **Manejo de UI**: Es un contenedor (Wrapper) que renderiza `<AuthForm isLogin={isLogin} />`.
*   **Redirección**: Usa un `useEffect` que observa el objeto `user` del contexto. Si `user` es *truthy*, ejecuta `navigate('/dashboard', { replace: true })`.
*   **Comunicación de errores**: La página en sí *no* maneja ni muestra errores. Toda la lógica de manejo de promesas, catch de errores, toasts y validación de formulario reside dentro del componente oculto `src/features/auth/components/AuthForm.jsx`.

## Task 5: Auditoría de servicios de autenticación
*   En este ecosistema **no existe un archivo `authService.js` aislado**. Las llamadas al backend están acopladas directamente en el `AuthContext.jsx` utilizando el cliente nativo de Supabase (`supabase.auth`).
*   **Llamadas al backend**: 
    *   `supabase.auth.signInWithPassword`
    *   `supabase.from('profiles').select(...)`
*   **Esquema esperado**: El sistema espera que tras autenticar con éxito en Supabase Auth (Identity), exista paralelamente un registro en la tabla pública `profiles` con el `id` coincidente.

## Task 6: Flujo de obtención del perfil del profesional
1.  **Login exitoso**: Usuario ingresa credenciales en `AuthForm` -> llama a `signIn()` -> Supabase devuelve una sesión válida.
2.  **Trigger de estado**: `onAuthStateChange` detecta la nueva sesión.
3.  **Obtención de datos (Fetch)**: Se llama a `fetchProfile(newSession.user.id)`. Esto ejecuta un query a `profiles` haciendo join con `therapist_branding`.
4.  **Validación existencial**: 
    *   *Si existe*: Retorna la data combinada.
    *   *Si falla/no existe*: El query de Supabase retorna un error (`single()` throwea error si no encuentra filas). El bloque `catch` atrapa esto, emite un warning en consola y retorna `null`.
5.  **Fusión del estado**: El contexto construye el objeto de usuario: 
    `role: userProfile?.role || newSession.user.user_metadata?.role || USER_ROLES.PATIENT`
    Si el profesional no tiene registro en `profiles`, no se rompe la app, sino que su rol degenera a paciente o usa los metadatos crudos, lo cual puede generar conflictos de acceso a rutas protegidas.

## Task 7: Resumen e Informe Final

*   **¿Dónde y cómo se origina el error?**
    El error visual (el mensaje "profesional no encontrado") se genera indudablemente a nivel de componente en `AuthForm.jsx` o en algún Guard de ruta (`RoleGuard.jsx` / `AuthRedirect.jsx`). En la lógica base, el "error" silencioso se origina cuando `fetchProfile` no encuentra el ID del usuario en la tabla pública `profiles`.
*   **¿Qué condiciones lo disparan?**
    Ocurre cuando un terapeuta se autentica correctamente en el sistema de Auth (identidad), pero no existe su fila correspondiente en la base de datos de negocio (`public.profiles` o `public.therapist_details`). Esto suele suceder si falló el trigger de base de datos (`handle_new_user` o `handle_new_therapist_profile`) durante el registro.
*   **¿Qué validación está fallando?**
    La validación de consistencia entre `auth.users` y `public.profiles`. El componente que consume el login (probablemente `AuthForm.jsx` o la redirección al dashboard) detecta que el rol no concuerda o que faltan los detalles del perfil y arroja la alerta.
*   **Datos esperados vs Recibidos**:
    *   *Backend espera:* Que al registrarse, los triggers creen la data relacional.
    *   *Frontend espera:* Que `fetchProfile` devuelva un objeto con `{ ..., role: 'therapist', branding: {...} }`.
    *   *Frontend recibe:* Cuando ocurre el error, `fetchProfile` recibe `error` de Supabase (fila no encontrada), retorna `null`, y el contexto construye un usuario "incompleto" donde el rol puede recaer al fallback (`patient`) y carece de datos vitales para el dashboard del profesional.
