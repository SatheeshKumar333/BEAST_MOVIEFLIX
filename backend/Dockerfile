# ---------- Stage 1: Build ----------
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom and download dependencies first (for caching)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy full source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests


# ---------- Stage 2: Run ----------
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose dynamic port
EXPOSE 8080

# Start application
ENTRYPOINT ["java","-jar","app.jar"]
