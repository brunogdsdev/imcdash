# Usar imagem oficial do Eclipse Temurin com JDK 25
FROM eclipse-temurin:25-jdk-alpine

# Informar quem mantém a imagem
LABEL maintainer="icestonebruno@gmail;.com"

# Criar diretório da aplicação no container
WORKDIR /app

# Copiar o jar construído para dentro do container
COPY target/imcdash-0.0.1-SNAPSHOT.jar app.jar

# Expõe a porta que o Spring Boot vai usar
EXPOSE 8080

# Comando para rodar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]
