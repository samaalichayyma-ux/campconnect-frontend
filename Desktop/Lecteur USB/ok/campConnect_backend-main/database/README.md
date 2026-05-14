# Database Scripts

The current schema source of truth is the Spring Boot app itself:

- JPA entities under `src/main/java`
- `spring.jpa.hibernate.ddl-auto=update` in `src/main/resources/application.properties`

That means teammates should usually let the backend create or update the schema first, then run one of the seed scripts below.

## Recommended Team Workflow

1. Start MySQL.
2. Start the backend once so Hibernate creates or updates the schema.
3. Load one shared seed script into the `campconnect` database.

Recommended shared dataset:

- `database/seeds/seed_tunisia_events_reservations.sql`

Alternative broader test dataset:

- `database/seeds/seed_test_data.sql`

Cleanup script for removing demo/test accounts:

- `database/maintenance/cleanup_test_users.sql`

## Example Commands

Local MySQL:

```powershell
mysql -u root -p campconnect < database/seeds/seed_tunisia_events_reservations.sql
```

Docker MySQL from this repo:

```powershell
Get-Content database/seeds/seed_tunisia_events_reservations.sql | docker exec -i campconnect-mysql mysql -uroot -proot campconnect
```

## Archive Folder

Files in `database/archive` are old manual migrations, dumps, and one-off image backfill scripts.

They are kept for reference, but they are not the recommended way for teammates to sync a fresh database.

## Advice For Team Merges

If you want database work to merge cleanly between teammates, the next upgrade should be adopting versioned migrations such as Flyway or Liquibase.

For now, the safest team habit is:

- keep schema changes in code/entities
- keep shared seed data in one main script
- avoid adding new loose SQL files to the repo root
