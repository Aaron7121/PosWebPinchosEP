CREATE TABLE test_connection (
                                 id SERIAL PRIMARY KEY,
                                 mensaje VARCHAR(255) NOT NULL,
                                 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_connection (mensaje) VALUES ('¡Conexión a PostgreSQL y Flyway exitosa!');