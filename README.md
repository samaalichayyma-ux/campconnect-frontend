# CampConnect Frontend

Frontend du projet **CampConnect** développé avec **Angular**.  
Cette application couvre la partie publique, l’authentification, ainsi que l’espace d’administration, avec une architecture modulaire et maintenable.

## Objectif du projet

CampConnect est une plateforme de gestion orientée camping / services / assurances, permettant :

- la consultation publique de contenus
- l’inscription et la connexion des utilisateurs
- la gestion du profil utilisateur
- l’administration des modules via un dashboard admin
- la communication avec le backend via API REST

---

## Technologies utilisées

- **Angular**
- **TypeScript**
- **HTML / CSS**
- **Angular Router**
- **HttpClient**
- **Reactive Forms**
- **Guards**
- **Interceptors**
- **JWT Authentication** (prévu / intégré selon l’avancement)
- **Spring Boot Backend** (API)

---

##Lien de client
http://localhost:4200/public

##lien de admin
http://localhost:4200/admin


## Structure du projet

```bash
app/
 ├── core/
 │   ├── services/
 │   │   ├── auth.service.ts
 │   │   ├── assurance.service.ts
 │   │   ├── user.service.ts
 │   ├── guards/
 │   │   ├── auth.guard.ts
 │   ├── interceptors/
 │   │   ├── token.interceptor.ts
 │   └── models/
 │       ├── user.model.ts
 │       └── assurance.model.ts
 │
 ├── features/
 │   ├── admin/
 │   ├── public/
 │   └── auth/
 │
 ├── shared/
 │   ├── components/
 │   ├── pipes/
 │   └── directives/

 
