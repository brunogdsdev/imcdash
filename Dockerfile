# Stage 1: Build
FROM maven:3.9.1-eclipse-temurin-17 AS build
WORKDIR /app

# Copiar arquivos do projeto
COPY pom.xml .
COPY src ./src

# Buildar o JAR usando Maven do container
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:25-jdk-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
