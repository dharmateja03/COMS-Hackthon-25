# Database Migrations

This directory contains SQL migration scripts for updating the database schema.

## Running Migrations

### For existing databases:
Run the SQL files in order using psql:

```bash
# Connect to your database
psql -U your_username -d your_database_name -f migrations/001_add_standard_course_code.sql
```

Or use docker if your database is in a container:

```bash
docker exec -i your_postgres_container psql -U your_username -d your_database_name < migrations/001_add_standard_course_code.sql
```

### For new deployments:
No migration needed! Just run:

```bash
python init_db.py
```

This will create all tables with the latest schema automatically.

## Migration Files

- `001_add_standard_course_code.sql` - Adds `standard_course_code` column to courses table for shared embeddings feature
