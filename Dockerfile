# Stage 1: Build
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Copiar arquivos do projeto
COPY pom.xml .
COPY src ./src

# Buildar o JAR
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:25-jdk-alpine
WORKDIR /app

# Copiar o JAR do stage anterior
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
