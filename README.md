# Skarbona

Aplikacja dla skarbników klasowych do prowadzenia zbiórek, listy uczniów i rozliczeń klasy.

## Stack

- `apps/web`: React + Vite + Lucide
- `apps/api`: Express + Prisma
- PostgreSQL
- Docker Compose

## Uruchomienie lokalne

```bash
cp .env.example .env
npm install
npm run dev
```

Frontend jest dostępny pod `http://localhost:5173`, a API pod `http://localhost:3000`.

Aby uruchomić bazę i usługi w Dockerze:

```bash
docker compose up --build
```

Aplikacja webowa będzie pod `http://localhost:8080`. Po uruchomieniu bazy wykonaj migrację schematu:

```bash
npm run db:push
```

## Obrazy Docker na serwerze

Workflow `.github/workflows/docker-publish.yml` buduje i publikuje obrazy do GitHub Container Registry po pushu do `master`:

- `ghcr.io/<github-user>/skarbona:latest`

Pakiet znajdziesz w GitHub Packages: https://github.com/dominikszewczyk/Skarbona/pkgs/container/skarbona

Na serwerze ustaw w `.env`:

```dotenv
GHCR_NAMESPACE=github-user
IMAGE_TAG=latest
DB_USER=skarbona
DB_PASSWORD=strong-server-password
DB_HOST=postgres
DB_PORT=5432
DB_NAME=skarbona
DB_SCHEMA=skarbona
DB_NETWORK=database_network
```

Przy osobnym kontenerze PostgreSQL oba kontenery muszą być w tej samej sieci Docker. `DB_HOST` to nazwa kontenera/usługi PostgreSQL w tej sieci, np. `postgres`, a `DB_NETWORK` to nazwa tej sieci. Nie używaj `localhost`, bo wewnątrz kontenera oznacza on kontener aplikacji. Plik `.env` na serwerze pozostaje lokalny i nie powinien być commitowany.

Następnie uruchom:

```bash
docker login ghcr.io
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

Aplikacja będzie dostępna pod `http://<adres-serwera>:8080`. Jeden kontener zawiera frontend oraz API i łączy się z istniejącą bazą. Schemat Prisma możesz zaktualizować poleceniem:

```bash
docker compose -f docker-compose.server.yml run --rm app npx prisma db push --schema apps/api/prisma/schema.prisma
```

Jeśli obrazy są prywatne, `docker login ghcr.io` musi używać tokenu GitHub z uprawnieniem `read:packages`.

## API

- `POST /api/auth/register` rejestruje użytkownika
- `POST /api/classes` tworzy klasę z wychowawcą oraz użytkownikami przewodniczącego i zastępcy
- `POST /api/classes/:classId/members` przypisuje użytkownika do klasy z rolą `SKARBNIK`, `RODZIC`, `NAUCZYCIEL`, `PRZEWODNICZACY` lub `ZASTEPCA`
- `POST /api/classes/:classId/students` dodaje ucznia
- `POST /api/classes/:classId/collections` tworzy zbiórkę i przypisuje uczniów
- `POST /api/collections/:collectionId/contributions` zapisuje wpłatę wraz z opcjonalnym `bankId`
- `GET /api/classes/:classId/summary` zwraca klasę wraz z podsumowaniem zbiórek
