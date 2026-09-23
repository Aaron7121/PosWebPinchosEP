# ETAPA 1: Compilación (El "constructor")
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Descargamos dependencias primero para usar el caché de Docker
RUN mvn dependency:go-offline
# Copiamos el código fuente y compilamos
COPY src ./src
RUN mvn clean package -DskipTests

# ETAPA 2: Ejecución (El "corredor" súper ligero)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Quarkus genera una carpeta especial llamada 'quarkus-app' cuando compila.
# Copiamos solo esa carpeta de la Etapa 1 a esta nueva imagen limpia.
COPY --from=build /app/target/quarkus-app/lib/ /app/lib/
COPY --from=build /app/target/quarkus-app/*.jar /app/
COPY --from=build /app/target/quarkus-app/app/ /app/app/
COPY --from=build /app/target/quarkus-app/quarkus/ /app/quarkus/

# El backend siempre escucha en el puerto 8080
EXPOSE 8080

# Comando para encender el servidor
CMD ["java", "-jar", "quarkus-run.jar"]