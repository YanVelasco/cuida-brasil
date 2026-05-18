# Dockerfile para o Spring Boot
FROM eclipse-temurin:17-jdk-jammy

# Copia o código fonte e os arquivos do maven
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
COPY src ./src

# Dar permissão de execução ao mvnw
RUN chmod +x mvnw

# Resolve dependências e compila offline se possível, depois gera o build
RUN ./mvnw clean package -DskipTests

# Expõe a porta 8081
EXPOSE 8081

# Comando de entrada usando o jar recém-gerado
ENTRYPOINT ["java", "-jar", "/app/target/cuidar-brasil-api-1.0.0.jar"]
