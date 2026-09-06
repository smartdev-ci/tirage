# Tirage au Sort

Interface de tirage au sort moderne et épurée.

## Stack

- Vue 3 + TypeScript + Vite
- Supabase (base PostgreSQL + temps réel)
- Design responsive avec Inter

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Dans **SQL Editor**, exécuter le contenu de `supabase-setup.sql`
3. Copier l'**URL du projet** et la **clé anonyme** dans `.env`

```bash
cp .env.example .env.local
```

4. Mettre à jour `.env.local` :
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

## Participants

L'authentification se fait **uniquement par code secret**. Pour ajouter des participants, exécuter ce SQL dans Supabase :

```sql
INSERT INTO participants (name, email, access_code)
SELECT
  name,
  email,
  UPPER(REPLACE(name, ' ', '')) || FLOOR(RANDOM() * 4001 + 1000)::TEXT
FROM (VALUES
  ('Aristide', 'aristide@example.com'),
  ('Hermann', 'hermann@example.com'),
  ('Cinthya', 'cinthya@example.com'),
  ('Mireille', 'mireille@example.com'),
  ('Clara', 'clara@example.com'),
  ('Tonton Clovis', 'clovis@example.com'),
  ('Paulin', 'paulin@example.com'),
  ('Esdras', 'esdras@example.com')
) AS participants(name, email);
```

Les codes sont générés automatiquement sous le format : `NOM` + nombre aléatoire entre `1000` et `5000`.

Vous pouvez modifier les noms et emails selon vos besoins.

## Lancement

```bash
npm install
npm run dev
```

## Règles métier

- Un utilisateur ne peut effectuer qu'un seul tirage.
- Un utilisateur ne peut être tiré qu'une seule fois.
- Les tirages sont persistants dans Supabase et synchronisés en temps réel.
- L'accès est sécurisé par code secret : chaque participant doit saisir son code pour accéder au tirage.
- Après tirage, seul le bouton "Voir mon tirage" est accessible ; les cartes des participants ne sont plus affichées.
