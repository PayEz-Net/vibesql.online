# VibeSQL Technical Reference

## Endpoint

```
POST /v1/query
Content-Type: application/json
```

Micro default: `http://127.0.0.1:5173/v1/query`
Server default: `http://your-server:5432/v1/query`

## Request

```json
{"sql": "SELECT * FROM users WHERE id = 1"}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| sql | string | yes | Max 10,240 bytes (10 KB). Must start with: SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, or TRUNCATE |

## Response — Success (200)

```json
{
  "success": true,
  "rows": [{"id": 1, "name": "Alice"}],
  "rowCount": 1,
  "executionTime": 0.42
}
```

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Always true |
| rows | array or null | Row objects (column→value). null for non-SELECT without RETURNING |
| rowCount | integer | Rows returned or affected |
| executionTime | float | Milliseconds |

## Response — Error (4xx/5xx)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SQL",
    "message": "Invalid SQL syntax",
    "detail": "relation \"nonexistent\" does not exist"
  }
}
```

## Value Encoding

- SQL NULL → JSON null
- JSONB columns → JSON objects/arrays (not strings)
- TIMESTAMP → ISO 8601 strings
- NUMERIC → JSON numbers
- BOOLEAN → JSON true/false

## Safety Rules

UPDATE and DELETE REQUIRE a WHERE clause. Omitting WHERE returns UNSAFE_QUERY (400).
To intentionally affect all rows, use `WHERE 1=1`.

## Supported Statements

| Statement | WHERE Required |
|-----------|---------------|
| SELECT | no |
| INSERT | no |
| UPDATE | YES |
| DELETE | YES |
| CREATE | no |
| DROP | no |
| ALTER | no |
| TRUNCATE | no |

## Data Types

| Type | Size / Range |
|------|-------------|
| TEXT | Up to 1 GB |
| VARCHAR(n) | Max n characters |
| CHAR(n) | Fixed n characters, space-padded |
| INTEGER / INT | -2,147,483,648 to 2,147,483,647 (4 bytes) |
| BIGINT | -9.2e18 to 9.2e18 (8 bytes) |
| SMALLINT | -32,768 to 32,767 (2 bytes) |
| SERIAL | Auto-increment 1 to 2,147,483,647 |
| BIGSERIAL | Auto-increment 1 to 9.2e18 |
| NUMERIC(p,s) | p total digits, s after decimal. Max 131,072 before, 16,383 after |
| REAL | 6 decimal digits precision (4 bytes) |
| DOUBLE PRECISION | 15 decimal digits precision (8 bytes) |
| BOOLEAN | TRUE, FALSE, NULL |
| DATE | 4713 BC to 5874897 AD (4 bytes) |
| TIME | 00:00:00 to 24:00:00 (8 bytes) |
| TIMESTAMP | Date+time, no timezone (8 bytes) |
| TIMESTAMPTZ | Date+time with timezone (8 bytes) |
| UUID | 128-bit RFC 4122 (16 bytes) |
| JSONB | Binary JSON, up to 255 MB |
| JSON | Text JSON, up to 255 MB (prefer JSONB) |
| TEXT[] | Array of text |
| INTEGER[] | Array of integers |
| UUID[] | Array of UUIDs |
| BYTEA | Binary data, up to 1 GB |

## SQL Examples

### CREATE TABLE

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL,
  tags TEXT[],
  price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true
);
```

### SELECT

```sql
SELECT * FROM users WHERE age > 21 AND is_active = true;
SELECT * FROM users ORDER BY name ASC LIMIT 10 OFFSET 20;
SELECT role, COUNT(*) AS count FROM users GROUP BY role HAVING COUNT(*) > 5;
SELECT u.name, m.content FROM users u JOIN messages m ON u.id = m.user_id;
```

### INSERT

```sql
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com') RETURNING id, name;
INSERT INTO users (email, name) VALUES ('alice@example.com', 'Alice Updated')
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
```

### UPDATE (WHERE required)

```sql
UPDATE users SET email = 'new@example.com' WHERE id = 1;
UPDATE users SET is_active = false WHERE 1=1;  -- all rows, explicit
UPDATE documents SET data = jsonb_set(data, '{status}', '"completed"') WHERE id = 1;
```

### DELETE (WHERE required)

```sql
DELETE FROM users WHERE id = 1;
DELETE FROM temp_data WHERE 1=1;  -- all rows, explicit
```

### ALTER TABLE

```sql
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users ALTER COLUMN age TYPE BIGINT;
```

### DROP TABLE

```sql
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS users CASCADE;
```

### TRUNCATE

```sql
TRUNCATE TABLE users;
TRUNCATE TABLE users RESTART IDENTITY;
```

## JSONB Operators

VibeSQL supports all 9 PostgreSQL JSONB operators.

| Operator | Returns | Description |
|----------|---------|-------------|
| -> | JSONB | Get field by key or index as JSON |
| ->> | text | Get field by key as text |
| #> | JSONB | Get nested path as JSON |
| #>> | text | Get nested path as text |
| @> | boolean | Left contains right |
| <@ | boolean | Left contained by right |
| ? | boolean | Key exists |
| ?&#124; | boolean | Any key exists |
| ?& | boolean | All keys exist |

### JSONB Examples

```sql
-- Get as JSON (with quotes) vs text (no quotes)
SELECT data->'name' FROM documents;     -- "Alice"
SELECT data->>'name' FROM documents;    -- Alice

-- Nested access
SELECT data->'address'->>'city' FROM documents;  -- Portland

-- Path access
SELECT data #>> '{address,city}' FROM documents;  -- Portland

-- Contains filter
SELECT * FROM documents WHERE data @> '{"role": "admin"}';
SELECT * FROM documents WHERE data @> '{"tags": ["manager"]}';

-- Key exists
SELECT * FROM documents WHERE data ? 'name';
SELECT * FROM documents WHERE data ?| array['phone', 'email', 'name'];
SELECT * FROM documents WHERE data ?& array['name', 'age', 'role'];

-- Array element contains
SELECT * FROM documents WHERE data->'tags' @> '"manager"';
```

### JSONB Type Casting

```sql
(data->>'age')::int              -- to integer
(data->>'price')::numeric        -- to decimal
(data->>'active')::boolean       -- to boolean
(data->>'created')::timestamp    -- to timestamp
```

### Common JSONB Patterns

```sql
-- Filter by nested value
SELECT data->>'name' FROM documents WHERE data->'address'->>'city' = 'Portland';

-- Sort by JSONB field
SELECT data->>'name', (data->>'age')::int AS age FROM documents ORDER BY (data->>'age')::int DESC;

-- Count by JSONB field
SELECT data->>'role' AS role, COUNT(*) FROM documents GROUP BY data->>'role';

-- Multiple conditions
SELECT data->>'name' FROM documents
  WHERE data @> '{"role": "admin"}' AND data ? 'address' AND (data->>'age')::int > 25;
```

## Query Limits — Micro (Fixed)

| Limit | Value | Error Code |
|-------|-------|------------|
| Max query size | 10 KB (10,240 bytes) | QUERY_TOO_LARGE (413) |
| Max result rows | 1,000 | RESULT_TOO_LARGE (413) |
| Query timeout | 5 seconds | QUERY_TIMEOUT (408) |
| Max concurrent connections | 2 | — |
| Connection pool max | 5 | — |
| Idle connections | 2 | — |
| Connection max lifetime | 1 hour | — |
| HTTP read timeout | 10 seconds | — |
| HTTP write timeout | 10 seconds | — |
| HTTP header timeout | 5 seconds | — |

## Query Limits — Server (Tier-Based)

| Tier | Timeout | Config Key |
|------|---------|------------|
| free | 2 seconds | VibeQueryTimeouts:FreeSeconds |
| starter | 5 seconds | VibeQueryTimeouts:StarterSeconds |
| pro | 10 seconds | VibeQueryTimeouts:ProSeconds |
| enterprise | 30 seconds | VibeQueryTimeouts:EnterpriseSeconds |
| (default) | 5 seconds | VibeQueryTimeouts:DefaultSeconds |

Max result rows: 1,000 (configurable via `VibeQueryLimits:MaxResultRows`)

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_SQL | 400 | Syntax error, undefined table/column/function, bad keyword |
| MISSING_REQUIRED_FIELD | 400 | The `sql` field is missing or empty |
| UNSAFE_QUERY | 400 | UPDATE or DELETE without WHERE clause |
| QUERY_TIMEOUT | 408 | Exceeded execution time limit |
| QUERY_TOO_LARGE | 413 | SQL query exceeds 10 KB |
| RESULT_TOO_LARGE | 413 | Result exceeds 1,000 rows |
| DOCUMENT_TOO_LARGE | 413 | JSONB document exceeds PostgreSQL limits |
| INTERNAL_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | Server not ready |
| DATABASE_UNAVAILABLE | 503 | PostgreSQL unreachable |

## PostgreSQL SQLSTATE Mapping

| SQLSTATE | VibeSQL Code |
|----------|-------------|
| 42601 | INVALID_SQL (syntax_error) |
| 42703 | INVALID_SQL (undefined_column) |
| 42P01 | INVALID_SQL (undefined_table) |
| 42P02 | INVALID_SQL (undefined_parameter) |
| 42883 | INVALID_SQL (undefined_function) |
| 42804 | INVALID_SQL (datatype_mismatch) |
| 57014 | QUERY_TIMEOUT (query_canceled) |
| 53000 | DATABASE_UNAVAILABLE (insufficient_resources) |
| 53100 | DATABASE_UNAVAILABLE (disk_full) |
| 53200 | DATABASE_UNAVAILABLE (out_of_memory) |
| 53300 | DATABASE_UNAVAILABLE (too_many_connections) |
| 53400 | DATABASE_UNAVAILABLE (configuration_limit_exceeded) |
| 08000 | DATABASE_UNAVAILABLE (connection_exception) |
| 08003 | DATABASE_UNAVAILABLE (connection_does_not_exist) |
| 08006 | DATABASE_UNAVAILABLE (connection_failure) |
| 08001 | DATABASE_UNAVAILABLE (sqlclient_unable_to_establish) |
| 08004 | DATABASE_UNAVAILABLE (sqlserver_rejected_establishment) |
| 54000 | DOCUMENT_TOO_LARGE (program_limit_exceeded) |
| 54001 | DOCUMENT_TOO_LARGE (statement_too_complex) |

## Configuration — Micro

| Variable | Default | Description |
|----------|---------|-------------|
| VIBE_BIND_HOST | 127.0.0.1 | HTTP bind address. Set 0.0.0.0 for external. |
| POSTGRES_BIN | (embedded) | Path to external PostgreSQL binaries |

Ports: 5173 (HTTP API), 5433 (internal PostgreSQL)
Data: `./vibe-data/` relative to working directory

## Configuration — Server

| Key | Default | Description |
|-----|---------|-------------|
| VibeQueryTimeouts:DefaultSeconds | 5 | Default query timeout |
| VibeQueryTimeouts:FreeSeconds | 2 | Free tier timeout |
| VibeQueryTimeouts:StarterSeconds | 5 | Starter tier timeout |
| VibeQueryTimeouts:ProSeconds | 10 | Pro tier timeout |
| VibeQueryTimeouts:EnterpriseSeconds | 30 | Enterprise tier timeout |
| VibeQueryLimits:MaxResultRows | 1000 | Max rows per result |
| VibeSQL:DevBypassHmac | false | Bypass HMAC in development |

## HMAC Authentication (Server Only)

Micro does not require authentication (localhost only).

### Required Headers

| Header | Value |
|--------|-------|
| X-Vibe-Timestamp | Unix epoch seconds. Must be within 5 minutes of server time. |
| X-Vibe-Signature | Base64-encoded HMAC-SHA256 signature |

### Optional Headers

| Header | Description |
|--------|-------------|
| X-Vibe-Service | Service identifier for logging |
| X-Vibe-Client-Tier | Tier for timeout config (free, starter, pro, enterprise) |
| X-Vibe-Tier-Claims | Comma-separated tier claims |

### Signature Computation

String to sign: `{timestamp}|{method}|{path}`
Example: `1706745600|POST|/v1/query`

```
key = base64Decode(signingKey)
signature = base64Encode(hmacSHA256(key, stringToSign))
```

### Timing

| Constraint | Value | Error |
|------------|-------|-------|
| Max timestamp age | 5 minutes | TIMESTAMP_EXPIRED (401) |
| Max clock skew | 1 minute | TIMESTAMP_FUTURE (401) |

### Auth Errors

| Code | HTTP | Description |
|------|------|-------------|
| HMAC_REQUIRED | 401 | Missing timestamp or signature headers |
| INVALID_TIMESTAMP | 401 | Timestamp not a valid number |
| TIMESTAMP_EXPIRED | 401 | Request older than 5 minutes |
| TIMESTAMP_FUTURE | 401 | Request more than 1 minute in future |
| SIGNATURE_MISMATCH | 401 | Signature verification failed |

### Public Endpoints (No Auth)

/health, /v1/health, /swagger, /swagger/index.html, /swagger/v1/swagger.json

## Schema Evolution (Server Only)

### Schema Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| CollectionSchemaId | int | — | Primary key |
| ClientId | int | — | Tenant identifier |
| Collection | string | "" | Collection name |
| JsonSchema | string? | null | JSON Schema definition |
| Version | int | 1 | Incremented on updates |
| IsActive | bool | true | Active schema version |
| IsSystem | bool | false | Exempt from tier limits |
| IsLocked | bool | false | Prevents structural changes (CRUD still allowed) |

### Migration Transforms

Defined in JSON Schema under `x-vibe-migrations` with key pattern `{from}_to_{to}`:

```json
{
  "x-vibe-migrations": {
    "1_to_2": [
      {"field": "price", "transform": "multiply", "args": 100, "reason": "Convert to cents"}
    ]
  }
}
```

| Transform | Args | Description |
|-----------|------|-------------|
| multiply | number | Multiply numeric field |
| divide | number | Divide numeric field (zero check) |
| map | object | Map string values {old: new} |
| default | any | Set value if null/missing |
| cast | string | Cast type: "int", "integer", "double", "number", "string", "bool", "boolean" |
| rename | string | Rename field |

### Compatibility Levels

| Level | Description |
|-------|-------------|
| FullyCompatible | No breaking changes |
| ForwardCompatible | Changes with migrations available |
| Breaking | Removed fields or type changes without migrations |

## SDK — @vibe/client

```
npm install @vibe/client
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| VIBE_API_URL or NEXT_PUBLIC_VIBE_API_URL | Direct API URL |
| IDP_URL or NEXT_PUBLIC_IDP_URL | IDP proxy URL (enables proxy mode) |
| VIBE_CLIENT_ID | Client ID for multi-tenant |
| VIBE_HMAC_KEY | HMAC signing key (Base64) |
| VIBE_COLLECTION | Default collection (default: vibe_app) |

### Client Setup

```typescript
import { createVibeClient } from '@vibe/client';

// Direct mode (Micro or direct Server)
const client = createVibeClient({
  apiUrl: 'http://127.0.0.1:5173',
});

// Proxy mode (through IDP)
const client = createVibeClient({
  idpUrl: 'https://your-idp.example.com',
  clientId: 'your-client-id',
  signingKey: 'your-hmac-key-base64',
});

// Singleton (uses env vars)
import { getVibeClient } from '@vibe/client';
const client = getVibeClient();
```

### Config Options

| Property | Type | Default |
|----------|------|---------|
| apiUrl | string? | env var |
| idpUrl | string? | env var |
| clientId | string? | env var |
| signingKey | string? | env var |
| defaultCollection | string? | "vibe_app" |
| getAccessToken | () => Promise<string&#124;null> | — |
| timeout | number? | 30000 ms |
| debug | boolean? | false |

### Collection CRUD

```typescript
const users = client.collection<User>('users');

// List
const result = await users.list({ limit: 20, offset: 0, orderBy: 'created_at', orderDir: 'desc', filter: { role: 'admin' } });
// result.data: User[], result.pagination: { total, limit, offset, hasMore }

// Get
const user = await users.get(1);        // User | null

// Create
const newUser = await users.create({ name: 'Alice', email: 'alice@example.com' });

// Update (PATCH)
const updated = await users.update(1, { name: 'Alice Smith' });

// Delete
await users.delete(1);
```

### Filter Format

```typescript
{ role: 'admin' }                              // simple equality
{ age: { operator: 'gt', value: 21 } }         // explicit operator
// Converted to: [{ field, operator, value }]
```

### Admin API

```typescript
const admin = client.admin;

// Roles
await admin.roles.list({ limit: 50 });
await admin.roles.get(1);
await admin.roles.create({ name: 'editor', description: 'Can edit' });
await admin.roles.update(1, { description: 'Updated' });
await admin.roles.delete(1);

// Users
await admin.users.list({ limit: 50 });
await admin.users.get('user-uuid');
await admin.users.getRoles('user-uuid');

// Tenant
await admin.tenant.getConfig();
// { client_id, site_name, branding?: { logo_url?, primary_color? } }
```

### Auth Utilities

```typescript
import { hasRole, isAdmin, isPlatformAdmin, isClientAdmin, getHighestRoleLevel, meetsRoleLevel, VibeRoles, ROLE_HIERARCHY } from '@vibe/client';
```

| Role Constant | Value | Level |
|---------------|-------|-------|
| VibeRoles.PAYEZ_ADMIN | payez_admin | 4 |
| VibeRoles.VIBE_APP_ADMIN | vibe_app_admin | 3 |
| VibeRoles.VIBE_CLIENT_ADMIN | vibe_client_admin | 2 |
| VibeRoles.IDP_CLIENT_ADMIN | idp_client_admin | 2 |
| VibeRoles.VIBE_APP_USER | vibe_app_user | 1 |

| Function | Description |
|----------|-------------|
| hasRole(roles, role) | Check specific role |
| hasAnyRole(roles, roles[]) | Check any match |
| hasAllRoles(roles, roles[]) | Check all match |
| isAdmin(roles) | Has any admin role |
| isPlatformAdmin(roles) | payez_admin or vibe_app_admin |
| isClientAdmin(roles) | Client admin (not platform) |
| getHighestRoleLevel(roles) | Highest numeric level (0 if none) |
| meetsRoleLevel(roles, level) | Meets minimum level |

### Error Handling

```typescript
import { VibeError } from '@vibe/client';

try {
  await users.get(999);
} catch (error) {
  if (error instanceof VibeError) {
    error.code;          // 'NOT_FOUND'
    error.status;        // 404
    error.isRetryable(); // false
  }
}
```

| SDK Error Code | HTTP | Retryable |
|----------------|------|-----------|
| NETWORK_ERROR | — | yes |
| UNAUTHORIZED | 401 | no |
| FORBIDDEN | 403 | no |
| NOT_FOUND | 404 | no |
| VALIDATION_ERROR | 422 | no |
| CONFLICT | 409 | no |
| RATE_LIMITED | 429 | yes |
| SERVER_ERROR | 500+ | yes |
| UNKNOWN_ERROR | other | no |

### Type Generation

```
npm install @vibe/next-plugin
```

| Option | Env Var |
|--------|---------|
| idpUrl | IDP_URL, NEXT_PUBLIC_IDP_URL |
| clientId | VIBE_CLIENT_ID, NEXT_PUBLIC_VIBE_CLIENT_ID |
| signingKey | VIBE_HMAC_KEY, IDP_SIGNING_KEY |
| outputDir | (default: node_modules/.vibe/types) |

Generates .d.ts files per collection + VibeCollections interface for type-safe `client.collection('name')`.

## Editions

| Feature | Micro | Server | Cloud |
|---------|-------|--------|-------|
| License | Apache 2.0 | Apache 2.0 | Managed |
| Deployment | Single binary (~77 MB) | Docker/K8s/bare metal | Fully managed |
| PostgreSQL | Embedded 16.1 | External 16+ | Managed |
| Multi-tenant | No | Yes | Yes |
| Auth | None (localhost) | HMAC-SHA256 | Token-based |
| Encryption governance | No | Yes | Yes |
| Schema evolution | No | Yes | Yes |
| Tier limits | Fixed | Configurable | Plan-based |
| Platforms | Windows, macOS, Linux | Any (.NET 9) | N/A |
