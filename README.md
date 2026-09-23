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

- `ghcr.io/<github-user>/skarbona-api:latest`
- `ghcr.io/<github-user>/skarbona-web:latest`

W ustawieniach repozytorium dodaj zmienną Actions `VITE_API_URL` z publicznym adresem API, np. `https://api.example.com`. Na serwerze ustaw w `.env`:

```dotenv
GHCR_NAMESPACE=github-user
IMAGE_TAG=latest
VITE_API_URL=https://api.example.com
```

Następnie uruchom:

```bash
docker login ghcr.io
docker compose pull
docker compose up -d db
docker compose run --rm api npx prisma db push
docker compose up -d api web
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
