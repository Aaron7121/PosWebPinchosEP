# POS Web 2026 — Pinchos el Parqueadero

Sistema de punto de venta (POS) para restaurante, pensado para usarse tanto en web como en dispositivos móviles (PWA). Permite gestionar clientes, categorías y platos, pedidos y su detalle, inventario, caja y usuarios con autenticación JWT.

## Arquitectura

**Monolito modular.** Todo el backend vive en una única aplicación desplegable, pero organizado por módulos (paquetes) con responsabilidades claras:

```
com.joedev.posweb.pep
├── auth        → Login, registro, generación y validación de JWT
├── entity      → Entidades JPA (Clientes, Pedidos, Inventario, Caja, ...)
├── repository  → Acceso a datos (Hibernate + Panache)
├── services    → Lógica de negocio
├── rest        → Recursos REST (controladores / endpoints)
└── exception   → Manejo centralizado de errores y DTOs de respuesta
```

El frontend es una **aplicación client-side** (SPA + PWA) que consume la API REST del backend mediante JSON.

## Backend

Construido con [Quarkus](https://quarkus.io/) (Supersonic Subatomic Java).

- **Lenguaje:** Java 21
- **Framework:** Quarkus 3.39 (REST + Jackson, Arc/CDI)
- **Persistencia:** Hibernate ORM con Panache
- **Base de datos:** PostgreSQL
- **Migraciones:** Flyway (`src/main/resources/db/migration`)
- **Seguridad:** SmallRye JWT + jBCrypt (contraseñas hasheadas)
- **Archivos:** subida de imágenes con `resteasy-reactive-multipart`

### Configuración

El archivo `src/main/resources/application.properties` contiene la configuración de base de datos, Flyway, JWT, CORS y subida de archivos. Ajusta la conexión a PostgreSQL según tu entorno.

### Ejecución en desarrollo

```shell script
./mvnw quarkus:dev
```

API disponible en `http://localhost:8080` (Dev UI en `http://localhost:8080/q/dev/`).

### Empaquetado

```shell script
./mvnw package
```

## Frontend

Aplicación SPA/PWA client-side ubicada en `FrontEndPosWeb2026/`.

- **Lenguaje:** TypeScript
- **Framework:** React 19
- **Build:** Vite
- **Estilos:** TailwindCSS 4
- **Navegación:** React Router DOM
- **Estado:** Zustand
- **Datos/API:** TanStack React Query
- **Íconos:** lucide-react
- **PWA:** vite-plugin-pwa
- **Lint:** oxlint

### Ejecución en desarrollo

```shell script
cd FrontEndPosWeb2026
npm install
npm run dev
```

Disponible en `http://localhost:5173`. Vite hace proxy de `/api` hacia `http://localhost:8080`.

### Build

```shell script
npm run build
```

## Estructura del proyecto

```
posweb2026/
├── src/                      # Backend Quarkus
│   ├── main/java/com/joedev/posweb/pep/   # Módulos del monolito
│   └── main/resources/       # Config, migraciones y claves JWT
├── FrontEndPosWeb2026/       # Frontend React (SPA + PWA)
└── pom.xml                   # Dependencias y build del backend
```

## Autenticación y permisos

Todo `/api/*` exige token JWT, salvo `/api/auth/login` y `/api/test`. Los archivos subidos (`/uploads/*`) son públicos. El token se firma con `src/main/resources/jwt/privateKey.pem` y se verifica con la clave pública correspondiente.
