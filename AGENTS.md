# AGENTS.md

POS gastronómico (Pinchos el Parqueadero). Monorepo con **dos apps independientes**: backend Quarkus en `src/` y frontend React en `FrontEndPosWeb2026/`. No hay CI, ni docker-compose, ni test runner en el frontend.

## Backend (Quarkus 3.39.2 / Java 21 / PostgreSQL)

- Comandos (Windows): compilar `.\mvnw.cmd -DskipTests compile`; dev `.\mvnw.cmd quarkus:dev` (sirve en `0.0.0.0:8080`). En Linux usar `./mvnw`.
- Arquitectura por capas en `com.joedev.posweb.pep`: `entity` → `repository` (interfaces `PanacheRepositoryBase<T, Integer>`) → `services` → `rest` (resources JAX-RS). Los resources serializan **entidades directamente, sin DTOs**. Endpoint nuevo = método en resource + delegación a service + query en repository.
- Entidades con Lombok `@Getter/@Setter` (scope `provided` en pom).
- Errores: lanzar `DatoInvalidoException` (400), `EntidadNoEncontradaException` (404) o `ConflictoException` (409); `exception/ErrorHandler` los mapea.
- `/api/*` exige JWT. Roles `ADMIN` / `COLABORADOR` con `@RolesAllowed`. Solo son públicos: `/api/auth/login`, `/api/test` y `/uploads/*` (regla `permit-uploads`).
- CORS con lista fija en `application.properties` (localhost:5173 y 192.168.18.119). Si se accede desde otra IP de la red hay que agregarla.
- BD: `quarkus.hibernate-orm.database.generation=none` + Flyway. Solo existe `V1.0.0__Init.sql`; **las tablas de negocio se crean manualmente en PostgreSQL y no deben tocarse** (el cliente pidió no alterarlas). Conexión local: `jdbc:postgresql://localhost:5432/dbposweb`, user/pass `postgres`.

### Subida de imágenes (multipart)
- `POST /api/uploads` (multipart, campos `file` + opcional `tipo` = `platos`|`categorias`) → devuelve `{"path":"/uploads/{tipo}/{uuid}.ext"}`. Guarda en `pos.upload.dir` (default `uploads/`, gitignored). Se sirve de forma pública en `GET /uploads/{tipo}/{nombre}` (con anti path-traversal).
- **No hay que agregar dependencia de multipart**: viene incluido en `quarkus-rest` (`@RestForm` + `FileUpload`); los artefactos `quarkus-rest-multipart`/`quarkus-resteasy-reactive-multipart` NO están en el BOM y hacen fallar el build.
- `quarkus.http.limits.max-body-size` y `max-form-attribute-size` están en 10M a propósito (el default de 2048 B rechaza subidas con 413). No reducirlos.
- En Docker/Linux, `pos.upload.dir` es relativo al working dir: montar un volumen.

## Frontend (React 19 + Vite 8 + TypeScript + Tailwind 4)

- Comandos (desde `FrontEndPosWeb2026/`): `npm run dev` (Vite en `0.0.0.0:5173`, proxy `/api` y `/uploads` → localhost:8080), `npm run build` (`tsc -b && vite build`), `npm run lint` (oxlint). `npm run dev` + `dist` se sirven desde el backend en producción.
- TS estricto: `verbatimModuleSyntax` → obligatorio `import type`; `noUnusedLocals`/`noUnusedParameters`; `erasableSyntaxOnly` → prohibido `enum`/`namespace`.
- Estado servidor con TanStack React Query; estado global con Zustand (`useAuthStore`), token JWT persistido en localStorage bajo `pos-auth` (el backend la expira en 1800 s).
- **`api/client.ts` `request()` fuerza `Content-Type: application/json` y NO sirve para subir archivos (FormData).** Para uploads usar `fetch` directo con header `Authorization` manual.
- Los objetos relacionados se mandan al backend como `{ id }` (ej. `idCategoria: { id }`) — ver `types/catalogo.ts`.
- Rutas definidas en `App.tsx`; la sección de administración vive en `/configuracion` (perfil, platos, productos, categorias, usuarios).
- Guía de UI (paleta naranja, layout 3 columnas, mobile-first, PWA con autoUpdate): `FrontEndPosWeb2026/docs/design.md`.