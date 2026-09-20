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

## API

- `POST /api/auth/register` rejestruje skarbnika
- `POST /api/classes` tworzy klasę z wychowawcą i radą rodziców
- `POST /api/classes/:classId/students` dodaje ucznia
- `POST /api/classes/:classId/collections` tworzy zbiórkę i przypisuje uczniów
- `GET /api/classes/:classId/summary` zwraca klasę wraz z podsumowaniem zbiórek
