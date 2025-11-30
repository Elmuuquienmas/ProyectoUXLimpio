# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # YOTIP — Desarrollo local y Firebase

    Este README explica cómo levantar el proyecto localmente, cómo funciona la integración con Firebase (Auth + Firestore), y las reglas de seguridad de Firestore que recomendamos.

    ## Resumen rápido
    - El proyecto contiene la configuración Firebase en `src/firebaseConfig.ts` apuntando al proyecto `yotip-medina`.
    - Con esa configuración, cualquier dev que haga `git pull` podrá iniciar la app y usar autenticación (email/password) contra ese proyecto, siempre que las reglas de Firestore lo permitan.

    ## Requisitos previos
    - Node.js 18+ y npm
    - Cuenta de Firebase (solo si quieres desplegar reglas o usar un proyecto propio)

    ## Arrancar en local
    ```powershell
    cd 'c:\Users\analy\OneDrive\Desktop\ProyectoUXLimpio\YOTIP'
    npm install
    npm run dev
    ```
    Abre `http://localhost:5173/`.

    ## Flujo Auth + Firestore
    - Registro / login por correo y contraseña se hace con Firebase Authentication (email/password).
    - Los datos de usuario (monedas, objetos, tareas, tema, username) se almacenan en Firestore en `users/{uid}`.
    - Para asegurar unicidad del `username` usamos una colección `usernames/{username}` que mapea el `username` al `uid`. La app reserva un username mediante una transacción para evitar condiciones de carrera.

    ## Archivos importantes
    - `src/firebaseConfig.ts` — configuración e inicialización de Firebase (cliente).
    - `src/firebaseUtils.ts` — helpers para `getUserData`, `saveUserData`, `signInWithEmail`, `signUpWithEmail`, `registerUsername`, etc.
    - `src/types.ts` — tipos TypeScript usados en la app.
    - `src/App.tsx` — componente principal (contiene el formulario de login y el flujo de username).

    ## Firestore rules (recomendadas)
    A continuación tienes el archivo `firestore.rules` que recomendamos. Explicación detallada abajo.

    Contenido de `firestore.rules` (también en `firestore.rules` del repo):

    ```text
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {

        // Cada usuario puede leer/editar su propio documento de usuarios
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        // Colección de mapeos username -> uid
        match /usernames/{username} {
          // Permitir consultar disponibilidad a usuarios autenticados
          allow get: if request.auth != null;
          // Crear el mapping solo si:
          // - el cliente está autenticado
          // - request.resource.data.uid === request.auth.uid (no pueden crear a nombre de otro)
          // - y el documento NO existe todavía (evita sobreescrituras)
          allow create: if request.auth != null
                        && request.resource.data.uid == request.auth.uid
                        && !exists(/databases/$(database)/documents/usernames/$(username));
          // No permitimos updates/deletes desde el cliente por ahora
          allow update, delete: if false;
        }
      }
    }
    ```

    ### Explicación línea por línea (resumen)
    - `rules_version = '2';` — versión de reglas.
    - `service cloud.firestore` — bloque principal para reglas Firestore.
    - `match /databases/{database}/documents` — reglas aplicadas a la base de datos por defecto.

    `match /users/{userId}`:
    - `allow read, write: if request.auth != null && request.auth.uid == userId;`
      - Solo permite lectura y escritura si el request viene de un usuario autenticado y su `uid` coincide con el `userId` del documento. Evita que un usuario lea o escriba datos de otro.

    `match /usernames/{username}`:
    - `allow get: if request.auth != null;` — permitimos comprobar disponibilidad a usuarios autenticados.
    - `allow create: if request.auth != null && request.resource.data.uid == request.auth.uid && !exists(...);`
      - Solo quien está autenticado puede crear un mapeo.
      - El objeto que se crea debe tener `uid` igual al `request.auth.uid` (no puedes crear un username apuntando a otro uid).
      - Comprobamos que el documento no exista (evita que dos usuarios creen el mismo username). La transacción del cliente puede leer/crear atomically.
    - `allow update, delete: if false;` — no permitimos modificaciones directas desde el cliente por simplicidad y seguridad. Si necesitas cambiar username, usa una Cloud Function o una operación controlada desde backend.

    ### Por qué estas reglas
    - Evitan lecturas/escrituras públicas sobre todos los usuarios.
    - Permiten comprobar disponibilidad de username desde cliente (auth requerido).
    - Permiten crear un `username` solo si el creador es el dueño (`uid`) y el nombre no existe.

    ## Comandos útiles (Firebase CLI)
    Si quieres desplegar reglas y administrarlas desde tu máquina:

    ```powershell
    # instalar (si no lo tienes)
    npm install -g firebase-tools
    firebase login
    # inicializar (si no lo has hecho antes en esta carpeta)
    firebase init firestore
    # para desplegar solo reglas
    firebase deploy --only firestore:rules
    ```

    > Importante: el deploy requiere que tu sesión de Firebase CLI apunte al proyecto correcto (usa `firebase use` o `--project`).

    ## Variables de entorno (recomendación)
    Actualmente `src/firebaseConfig.ts` contiene la configuración del proyecto. Recomendamos cambiar eso a variables de entorno Vite para que cada dev use su propio proyecto si quiere:
    - `VITE_FIREBASE_API_KEY`
    - `VITE_FIREBASE_AUTH_DOMAIN`
    - `VITE_FIREBASE_PROJECT_ID`
    - `VITE_FIREBASE_STORAGE_BUCKET`
    - `VITE_FIREBASE_MESSAGING_SENDER_ID`
    - `VITE_FIREBASE_APP_ID`

    He incluido un `.env.example` en el repo con las variables (sin valores secretos). Si quieres, hago el cambio en `src/firebaseConfig.ts` para leer desde `import.meta.env`.

    ## Buenas prácticas y siguientes pasos
    - No dejes reglas abiertas en producción. Usa las reglas propuestas y ajústalas a tus necesidades.
    - Considera usar `onSnapshot` para sincronización en tiempo real si quieres colaboración entre dispositivos.
    - Para operaciones sensibles (cambio de username, borrado permanente, migraciones), considera usar Cloud Functions con lógica server-side.

    ---

    Si quieres que implemente la migración a variables de entorno (`.env`) y actualice `src/firebaseConfig.ts`, lo hago ahora y añado `.env.example` al repo con instrucciones. ¿Lo implemento?
