# CampConnect Backend

Spring Boot 3 + MySQL + Docker

---

## Stack

- Java 17
- Spring Boot 3.4.12
- Spring Data JPA
- MySQL 8
- Docker & Docker Compose
- Swagger (OpenAPI)

---

# 1. Run Application Locally (Without Docker)

## Requirements

- Java 17
- Maven
- MySQL installed locally

---

## Check application.properties

Make sure it contains:

```
spring.datasource.url=jdbc:mysql://localhost:3306/campconnect?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
```
Run the Application

Using Maven:
```
mvn spring-boot:run
```
Or from IDE:
Run `CampConnectApplication`

## Access the Application

### Backend:
```
http://localhost:8082/api
```
### Swagger UI:
```
http://localhost:8082/api/swagger-ui.html
```
# 2. Run Application With Docker
## Requirements

- Docker

- Docker Compose

## Step 1: Build and Start Containers

From project root (where `docker-compose.yml` exists):
```
docker compose up --build -d
```
### What This Starts

- MySQL container (port 3307)

- Spring Boot container (port 8082)
### Access Services

### Backend:
```
http://localhost:8082/api
```

### Swagger:
```
http://localhost:8082/api/swagger-ui.html
```

### MySQL:
```
Host: localhost
Port: 3307
Username: root
Password: root
Database: campconnect
```
### phpMyAdmin Login (Docker)

Open:
```
http://localhost:8081
```
Login:
```
Username: root

Password: root
```
Server/Host: leave empty OR put `mysql`
### Stop Containers
```
docker compose down
```

If you want to delete database volume:

```
docker compose down -v
```

# Recommended package structure

```
com.esprit.campconnect
├─ InscriptionSite
│  ├─ controller
│  │  └─ InscriptionSiteController
│  ├─ entity
│  │  ├─ InscriptionSite
│  │  └─ StatutInscription
│  ├─ repository
│  │  └─ InscriptionSiteRepository
│  └─ service
│     ├─ IInscriptionSiteService
│     └─ InscriptionSiteServiceImp
└─ CampConnectApplication
```
