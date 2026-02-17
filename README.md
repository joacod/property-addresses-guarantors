# Property Addresses - Guarantors

Take-home implementation of a US-focused address validation endpoint using Express + TypeScript.

## Objective

Build `POST /validate-address` that accepts a free-form address and returns:

- normalized shape: `street`, `number`, `city`, `state`, `zip_code`
- status: `valid | corrected | unverifiable`
- supporting metadata for downstream decisions (`confidence`, `corrections`, `reason`, `source`)

## Tech choices

- `express` for minimal HTTP/middleware flow
- `typescript` for safer contracts and refactors
- `zod` for request schema validation
- `dotenv` + env parsing for runtime config
- `cors` allowlist baseline
- `swagger-ui-express` for OpenAPI docs
- `vitest` + `supertest` for unit and integration tests
- `eslint` for baseline code quality gate

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env
```

3. Run:

```bash
npm run dev
```

4. Swagger, open:

```bash
http://localhost:3000/docs
```

## Swagger test payloads

Use these JSON bodies in `/docs` for `POST /validate-address`.

Valid result:

```json
{
  "address": "123 Main St, Springfield, IL 62704"
}
```

Corrected result:

```json
{
  "address": "123 main street, springfield, illinois 62704"
}
```

Unverifiable result (non-US):

```json
{
  "address": "10 Downing St, London, UK SW1A 2AA"
}
```

Malformed payload (400):

```json
{
  "address": "   "
}
```

## Quality Commands

- Lint:

```bash
npm run lint
```

- Tests:

```bash
npm test
```

## API Contract

### Endpoint

- Method: `POST`
- Path: `/validate-address`

### Request body

```json
{
  "address": "123 main street, springfield, illinois 62704"
}
```

Validation rules:

- `address` is required
- `address` must be a string
- `address` must not be empty after trimming

### Success response shape

```json
{
  "status": "corrected",
  "is_valid": true,
  "normalized": {
    "street": "Main St",
    "number": "123",
    "city": "Springfield",
    "state": "IL",
    "zip_code": "62704"
  },
  "confidence": 0.94,
  "corrections": ["normalized state to USPS code", "normalized street suffix"],
  "reason": null,
  "source": "local-heuristic"
}
```

Field semantics:

- `status`
  - `valid`: accepted without material changes
  - `corrected`: accepted with deterministic normalization
  - `unverifiable`: cannot be reliably resolved to a US normalized address
- `is_valid`: `true` for `valid` and `corrected`; `false` for `unverifiable`
- `normalized`: normalized object when resolvable, otherwise `null`
- `confidence`: heuristic confidence (`0` to `1`)
- `corrections`: user-visible normalization notes
- `reason`: non-null for `unverifiable` outcomes
- `source`: provider identifier (`local-heuristic`)

### Error response shape

```json
{
  "code": "INVALID_REQUEST",
  "message": "Request validation failed",
  "details": [
    {
      "path": "address",
      "message": "address must not be empty"
    }
  ],
  "request_id": "ee63f972-ce06-4862-8046-cbc777a2b269"
}
```

All errors follow this shape. `request_id` is included in error payloads and echoed/generated as `x-request-id` response header for traceability.

## Project structure

```text
src/
  routes/      # HTTP route bindings
  controllers/ # transport-level request/response handling
  services/    # use-case orchestration
  providers/   # provider port + local heuristic adapter
  domain/      # contracts, normalization, status classification rules
  schemas/     # zod request schemas
  middleware/  # request id, validation, auth scaffold, error handling
  utils/       # env parsing and shared helpers
tests/
  unit/        # domain-level tests
  integration/ # endpoint-level tests
```

## Request flow

`POST /validate-address` -> route -> controller -> service -> provider -> classifier -> JSON response

Cross-cutting middleware:

- `requestIdMiddleware` logs `request.started` and `request.completed`
- `validateBodyMiddleware` enforces request contract
- `errorHandlerMiddleware` enforces consistent error shape
- optional auth scaffold is disabled by default (`AUTH_ENABLED=false`)



## Trade-offs and limitations

- Local heuristic parsing is intentionally limited compared with commercial address verification APIs.
- Confidence values are deterministic heuristics, not model-calibrated probabilities.
- Scope is US-only by design.
- Parser supports common address formats but not all edge-case variants.

## Extensibility

- Provider abstraction (`AddressProvider`) allows replacing local heuristics with an external provider without changing route/controller contracts.
- Auth boundary is already wired and can be enabled later with real JWT verification.
- CORS and env-based runtime config support production-like deployment needs.

## AI usage disclosure

I used AI coding assistants to accelerate parts of the development process while ensuring I personally understood, reviewed, and edited all the produced code.

Tools used:
- [OpenCode](https://opencode.ai/) as my coding agent tool.
- OpenAI's [GPT-5.3-Codex](https://openai.com/index/introducing-gpt-5-3-codex/) as my main model.

AI helped refine my plan and assisted in specific phases:
- Project skeleton and bootstrapping
- API foundation drafting
- Address classification logic suggestions
- Test structure and case generation

The final submission represents my personal design decisions, debugging, and optimizations.
