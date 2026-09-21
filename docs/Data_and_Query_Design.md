# Data and Query Design Assignment

## Internship Management Platform - Team 17

**Database:** Supabase PostgreSQL  
---

## Executive Summary

The Internship Management Platform gives students one place to browse placements, apply, follow approval status, and submit weekly progress. Advisors review applications, while administrators manage placements. The database is implemented as a normalized PostgreSQL schema for Supabase, linked to Supabase Auth and protected by Row Level Security (RLS).

The design contains five domain tables - `user_profiles`, `placements`, `applications`, `approvals`, and `progress_updates` - plus `application_status_history` for auditability and `outbox_events` for reliable `internship.status_changed` events. An executable migration is included at `supabase/migrations/202609200001_initial_internship_schema.sql`.

## 1. Requirements Used for the Design

The design comes from the project PRD and supports these core requirements:

1. Students browse published internship placements and filter by keyword, skill, or availability.
2. An authenticated student applies once to a placement.
3. Students can see only their own applications and progress updates.
4. Advisors review pending applications and approve or reject them.
5. An approved student submits weekly progress updates.
6. Administrators create, edit, publish, archive, and delete placements.
7. Every application status change is timestamped and emits an `internship.status_changed` outbox event.
8. Authentication uses Supabase Auth; application tables do not store passwords.

## 2. Why Supabase Was Chosen

Supabase is a strong fit because the data is relational. Students apply to placements, advisors decide applications, and progress updates belong to approved applications. PostgreSQL foreign keys, unique constraints, transactions, and check constraints enforce these relationships more reliably than application code alone.

The platform also matches the project's constraints:

| Requirement | Supabase capability | Benefit to this project |
|---|---|---|
| 0 THB student-project budget | Free-tier project | Supports development and classroom demonstration |
| Authentication | Supabase Auth | Avoids storing passwords in application tables |
| Role and ownership security | PostgreSQL RLS | Enforces student, advisor, and admin access close to the data |
| CRUD APIs | Auto-generated PostgREST API | Tables are accessible through REST without building a second CRUD service |
| Data integrity | Constraints and transactions | Prevents duplicate applications and inconsistent decisions |
| Search and matching | Arrays, GIN indexes, SQL filters | Supports skill-tag matching and can grow into semantic matching later |
| Audit/event integration | Triggers and outbox table | Records status history and safely queues downstream events |

Firestore was not selected because the workflow has several related entities and cross-record rules that fit SQL joins and constraints naturally. Cloudflare D1 would also support relational data, but Supabase supplies Auth, RLS, hosted PostgreSQL, and generated REST APIs together, reducing semester-project setup work.

## 3. Database Design

### 3.1 Design Principles

- UUID primary keys make client-generated identifiers difficult to guess and work well with Supabase Auth.
- Foreign keys preserve referential integrity.
- Enumerated types restrict workflow states to known values.
- A unique `(student_id, placement_id)` constraint prevents duplicate applications.
- A unique `(application_id, week_number)` constraint prevents duplicate weekly reports.
- Status history is append-only from the client perspective.
- The event outbox is readable only by trusted server code using the service role.
- Timestamps use `timestamptz`; deadlines use `date` because they are calendar dates.

### 3.2 ER Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| USER_PROFILES : "has profile"
    USER_PROFILES ||--o{ PLACEMENTS : "admin creates"
    USER_PROFILES ||--o{ APPLICATIONS : "student submits"
    PLACEMENTS ||--o{ APPLICATIONS : "receives"
    APPLICATIONS ||--o| APPROVALS : "has final decision"
    USER_PROFILES ||--o{ APPROVALS : "advisor decides"
    APPLICATIONS ||--o{ PROGRESS_UPDATES : "has weekly updates"
    USER_PROFILES ||--o{ PROGRESS_UPDATES : "student writes"
    APPLICATIONS ||--o{ APPLICATION_STATUS_HISTORY : "records transitions"

    USER_PROFILES {
      uuid id PK_FK
      text full_name
      text email UK
      user_role role
      text department
      text_array skill_tags
    }
    PLACEMENTS {
      uuid id PK
      text title
      text organization_name
      text description
      text_array required_skills
      text location
      date application_deadline
      placement_status status
      uuid created_by FK
    }
    APPLICATIONS {
      uuid id PK
      uuid student_id FK
      uuid placement_id FK
      application_status status
      text statement
      timestamptz submitted_at
    }
    APPROVALS {
      uuid id PK
      uuid application_id FK_UK
      uuid advisor_id FK
      approval_decision decision
      text comment
      timestamptz decided_at
    }
    PROGRESS_UPDATES {
      uuid id PK
      uuid application_id FK
      uuid student_id FK
      int week_number
      text summary
      progress_status status
    }
    APPLICATION_STATUS_HISTORY {
      bigint id PK
      uuid application_id FK
      application_status old_status
      application_status new_status
      uuid changed_by FK
      timestamptz changed_at
    }
```

`outbox_events` is an integration table rather than a business entity, so it is not connected with a database foreign key. Its `aggregate_id` can identify different aggregate types while preserving an immutable event payload.

### 3.3 Schema Dictionary

#### `user_profiles`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| `id` | `uuid` | PK, FK to `auth.users.id` | Same identity as the authenticated user |
| `full_name` | `text` | Required, 2-120 characters | Display name |
| `email` | `text` | Required, case-insensitive unique index | Contact and display email |
| `role` | `user_role` | Required, default `student` | `student`, `advisor`, or `admin` |
| `department` | `text` | Optional | Academic department |
| `skill_tags` | `text[]` | Default empty | Student skill matching |
| `created_at`, `updated_at` | `timestamptz` | Required | Record timestamps |

Profiles are created automatically after a Supabase Auth user is created. The trigger always assigns the safe default role `student`; it does not trust user-editable metadata to grant staff access.

#### `placements`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| `id` | `uuid` | PK | Placement identifier |
| `title` | `text` | Required, 3-160 characters | Internship title |
| `organization_name` | `text` | Required | Host organization |
| `description` | `text` | Required, at least 20 characters | Full opportunity description |
| `required_skills` | `text[]` | Default empty, GIN indexed | Required skill tags |
| `location` | `text` | Required | Work location or remote |
| `application_deadline` | `date` | Required | Last application day |
| `status` | `placement_status` | Default `draft` | `draft`, `published`, `closed`, `archived` |
| `created_by` | `uuid` | FK to profile | Administrator who created it |
| `created_at`, `updated_at` | `timestamptz` | Required | Record timestamps |

#### `applications`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| `id` | `uuid` | PK | Application identifier |
| `student_id` | `uuid` | FK to profile | Applicant |
| `placement_id` | `uuid` | FK to placement | Target placement |
| `status` | `application_status` | Default `submitted` | Workflow state |
| `statement` | `text` | Required, 20-4000 characters | Student motivation |
| `submitted_at`, `updated_at` | `timestamptz` | Required | Submission timestamps |

The pair `(student_id, placement_id)` is unique. A trigger also rejects applications when the placement is not published, the deadline has passed, or a client attempts to supply any initial status other than `submitted`.

#### `approvals`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| `id` | `uuid` | PK | Decision identifier |
| `application_id` | `uuid` | FK, unique | One final MVP decision per application |
| `advisor_id` | `uuid` | FK to profile | Reviewer |
| `decision` | `approval_decision` | Required | `approved` or `rejected` |
| `comment` | `text` | Optional, at most 2000 characters | Reviewer feedback |
| `decided_at` | `timestamptz` | Required | Decision time |

The transactional `review_application` database function locks the application, verifies that it is reviewable, inserts the decision, and updates application status atomically.

#### `progress_updates`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| `id` | `uuid` | PK | Update identifier |
| `application_id` | `uuid` | FK to application | Approved internship |
| `student_id` | `uuid` | FK to profile | Author |
| `week_number` | `integer` | 1-52, unique per application | Internship week |
| `summary` | `text` | Required, 20-5000 characters | Work and learning summary |
| `status` | `progress_status` | Default `submitted` | `draft`, `submitted`, or `reviewed` |
| `submitted_at`, `updated_at` | `timestamptz` | Required | Record timestamps |

An insert/update trigger verifies that the authenticated student owns an approved or completed application. It also prevents clients from changing the application, student, or week of an existing report and limits student-written status values to `draft` or `submitted`.

#### Audit and integration tables

`application_status_history` stores the old status, new status, actor, and time. `outbox_events` stores an `internship.status_changed` JSON payload within the same transaction as the status update. A server process can deliver unpublished events and then set `published_at`.

### 3.4 Relationship and Integrity Rules

| Rule | Database enforcement |
|---|---|
| One profile per authenticated user | Profile PK is also FK to `auth.users.id` |
| One application per student and placement | Unique constraint on `(student_id, placement_id)` |
| Applications only to open placements | `applications_validate_insert` trigger |
| One final MVP decision | Unique `approvals.application_id` |
| Progress only after approval | `progress_updates_validate_insert` trigger |
| One update for each internship week | Unique `(application_id, week_number)` |
| Known statuses only | PostgreSQL enum types |
| Statuses are auditable | `applications_record_status_change` trigger |
| Concurrent reviews cannot both succeed | Row lock plus unique decision constraint |

### 3.5 Index Strategy

- `(status, application_deadline)` accelerates published-placement browsing.
- GIN on `required_skills` supports array containment and overlap filters.
- `(student_id, status)` accelerates a student's application tracker.
- `(placement_id, status)` accelerates the advisor queue.
- `(application_id, week_number desc)` accelerates progress timelines.
- A partial outbox index covers only unpublished events.

## 4. Security and Row Level Security

Authentication and authorization have different responsibilities. Supabase Auth proves the identity and supplies `auth.uid()`. RLS policies decide which database rows that identity may access.

| Table | Student | Advisor | Administrator | Anonymous |
|---|---|---|---|---|
| `user_profiles` | Read/update own safe fields | Read profiles | Read/update profiles and roles | None |
| `placements` | Read published and placements linked to own applications | Read published and non-public | Full CRUD | Read published |
| `applications` | Insert and read own | Read review queue; decide by RPC | Read/delete; decide by RPC | None |
| `approvals` | Read decision for own application | Read own decisions | Read all | None |
| `progress_updates` | Insert/read own; edit own draft | Read all | Read/delete | None |
| status history | Read own history | Read all | Read all | None |
| outbox | None | None | No browser access | None |

Application approval is exposed through a controlled RPC rather than a general client update. This prevents a student from changing their own application to `approved`. The Supabase service-role key must never be put in browser code because it bypasses RLS.

## 5. Migration and Remote Deployment

### 5.1 Included Deliverables

- Migration: `supabase/migrations/202609200001_initial_internship_schema.sql`
- Verification queries: `supabase/verification.sql`
- Assignment report: `Data_and_Query_Design.md`

### 5.2 Deploy with Supabase CLI

```bash
# Install and authenticate once.
npm install --global supabase
supabase login

# From the project directory, link the remote project.
supabase link --project-ref YOUR_PROJECT_REF

# Review the SQL that will be applied, then deploy.
supabase db push --dry-run
supabase db push
```

Alternatively, paste the migration into Supabase Dashboard > SQL Editor and run it once. After deployment, run `supabase/verification.sql` in the SQL Editor and capture the result for submission evidence.

### 5.3 Deployment Status

The migration is deployment-ready, but this workspace does not contain a Supabase project reference or credentials. Therefore, remote deployment is **not claimed in this report**. Before final submission, the team should deploy it and replace this paragraph with the deployment date, project reference (non-secret), migration success screenshot, and verification output. Never include the database password or service-role key.

## 6. API Design

Supabase generates REST endpoints under:

```text
https://YOUR_PROJECT_REF.supabase.co/rest/v1
```

Clients send the public anon key and, for signed-in operations, the user's access token:

```http
apikey: SUPABASE_ANON_KEY
Authorization: Bearer USER_ACCESS_TOKEN
Content-Type: application/json
```

RLS is evaluated for every request. The following operations demonstrate Create, Read, Update, and Delete using the generated API.

### 6.1 Create a Placement - Administrator

```http
POST /rest/v1/placements
Prefer: return=representation

{
  "title": "Software Engineering Intern",
  "organization_name": "Acme Digital",
  "description": "Build and test web features with the product engineering team.",
  "required_skills": ["TypeScript", "React", "SQL"],
  "location": "Bangkok / Hybrid",
  "application_deadline": "2026-11-30",
  "status": "published",
  "created_by": "11111111-1111-1111-1111-111111111111"
}
```

Successful response - `201 Created`:

```json
[
  {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "title": "Software Engineering Intern",
    "organization_name": "Acme Digital",
    "required_skills": ["TypeScript", "React", "SQL"],
    "location": "Bangkok / Hybrid",
    "application_deadline": "2026-11-30",
    "status": "published",
    "created_by": "11111111-1111-1111-1111-111111111111"
  }
]
```

### 6.2 Read Published Placements - Public or Authenticated

```http
GET /rest/v1/placements?select=id,title,organization_name,required_skills,location,application_deadline&status=eq.published&required_skills=ov.{React,TypeScript}&order=application_deadline.asc
```

Successful response - `200 OK`:

```json
[
  {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "title": "Software Engineering Intern",
    "organization_name": "Acme Digital",
    "required_skills": ["TypeScript", "React", "SQL"],
    "location": "Bangkok / Hybrid",
    "application_deadline": "2026-11-30"
  }
]
```

### 6.3 Update a Placement - Administrator

```http
PATCH /rest/v1/placements?id=eq.aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
Prefer: return=representation

{
  "location": "Bangkok / On-site",
  "application_deadline": "2026-12-15"
}
```

Successful response - `200 OK`: the updated placement is returned. A non-admin user receives no modifiable row because the update RLS policy fails.

### 6.4 Delete a Draft Placement - Administrator

```http
DELETE /rest/v1/placements?id=eq.bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
Prefer: return=representation
```

Successful response - `200 OK`:

```json
[
  {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "status": "draft"
  }
]
```

Deletion fails with `409 Conflict` when applications already reference the placement (`ON DELETE RESTRICT`). In normal operation, an administrator should archive such a placement rather than delete it.

### 6.5 Submit an Application - Student

```http
POST /rest/v1/applications
Prefer: return=representation

{
  "student_id": "22222222-2222-2222-2222-222222222222",
  "placement_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "statement": "I want to apply my TypeScript and SQL skills to a production web project."
}
```

Successful response - `201 Created`:

```json
[
  {
    "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "student_id": "22222222-2222-2222-2222-222222222222",
    "placement_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "status": "submitted",
    "statement": "I want to apply my TypeScript and SQL skills to a production web project."
  }
]
```

Submitting the same student-placement pair again returns `409 Conflict` because of the unique constraint.

### 6.6 Read My Applications - Student

```http
GET /rest/v1/applications?select=id,status,statement,submitted_at,placements(title,organization_name)&order=submitted_at.desc
```

Successful response - `200 OK`:

```json
[
  {
    "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "status": "submitted",
    "statement": "I want to apply my TypeScript and SQL skills to a production web project.",
    "submitted_at": "2026-09-20T08:30:00Z",
    "placements": {
      "title": "Software Engineering Intern",
      "organization_name": "Acme Digital"
    }
  }
]
```

No `student_id` filter is required for security: RLS restricts students to their own rows. The client may still add filters for presentation.

### 6.7 Approve or Reject an Application - Advisor

```http
POST /rest/v1/rpc/review_application

{
  "target_application_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "review_decision": "approved",
  "review_comment": "The student's skills match the placement requirements."
}
```

Successful response - `200 OK`:

```json
{
  "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "student_id": "22222222-2222-2222-2222-222222222222",
  "placement_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "status": "approved",
  "statement": "I want to apply my TypeScript and SQL skills to a production web project."
}
```

The function inserts the approval and changes the application status in one transaction. The status trigger then writes an audit record and an outbox event.

### 6.8 Submit a Progress Update - Approved Student

```http
POST /rest/v1/progress_updates
Prefer: return=representation

{
  "application_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "student_id": "22222222-2222-2222-2222-222222222222",
  "week_number": 1,
  "summary": "Configured the project and completed the first authenticated dashboard page.",
  "status": "submitted"
}
```

Successful response - `201 Created`:

```json
[
  {
    "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "application_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "student_id": "22222222-2222-2222-2222-222222222222",
    "week_number": 1,
    "summary": "Configured the project and completed the first authenticated dashboard page.",
    "status": "submitted"
  }
]
```

If the application is not approved or does not belong to the authenticated user, the database rejects the insert.

### 6.9 Runnable cURL Examples

```bash
# Public read
curl "$SUPABASE_URL/rest/v1/placements?select=*&status=eq.published" \
  -H "apikey: $SUPABASE_ANON_KEY"

# Authenticated student application
curl -X POST "$SUPABASE_URL/rest/v1/applications" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $STUDENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "student_id":"22222222-2222-2222-2222-222222222222",
    "placement_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "statement":"I want to apply my TypeScript and SQL skills to a production web project."
  }'

# Advisor review RPC
curl -X POST "$SUPABASE_URL/rest/v1/rpc/review_application" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ADVISOR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_application_id":"cccccccc-cccc-cccc-cccc-cccccccccccc",
    "review_decision":"approved",
    "review_comment":"Skills match the placement."
  }'
```

## 7. Important Queries

### 7.1 Opportunity Explorer with Skill Matching

```sql
select id, title, organization_name, location,
       application_deadline, required_skills
from public.placements
where status = 'published'
  and application_deadline >= current_date
  and (
    title ilike '%' || :keyword || '%'
    or organization_name ilike '%' || :keyword || '%'
  )
  and required_skills && :student_skills::text[]
order by application_deadline asc;
```

The `&&` operator finds overlapping skill arrays and uses the GIN index.

### 7.2 Advisor Approval Queue

```sql
select a.id, a.submitted_at, a.statement,
       p.full_name as student_name,
       pl.title as placement_title,
       pl.organization_name
from public.applications a
join public.user_profiles p on p.id = a.student_id
join public.placements pl on pl.id = a.placement_id
where a.status in ('submitted', 'under_review')
order by a.submitted_at asc;
```

### 7.3 Student Application Timeline

```sql
select a.id, pl.title, a.status, a.submitted_at,
       h.old_status, h.new_status, h.changed_at
from public.applications a
join public.placements pl on pl.id = a.placement_id
left join public.application_status_history h on h.application_id = a.id
where a.student_id = auth.uid()
order by a.submitted_at desc, h.changed_at asc;
```

## 8. Error Responses

Supabase/PostgREST returns standardized JSON. Client applications should map database details to friendly messages and avoid displaying internal schema information.

| Situation | Expected HTTP result | Friendly message |
|---|---|---|
| Missing or expired token | `401 Unauthorized` | Please sign in again. |
| Role not allowed by policy | `403 Forbidden` or no affected row | You do not have permission for this action. |
| Duplicate application/week | `409 Conflict` | This record already exists. |
| Referenced placement not found | `409 Conflict` | The selected placement is unavailable. |
| Check/trigger validation fails | `400 Bad Request` | Review the submitted values and workflow state. |
| Review target already decided | `400 Bad Request` | This application has already been reviewed. |

Example duplicate response shape:

```json
{
  "code": "23505",
  "details": "Key (student_id, placement_id) already exists.",
  "hint": null,
  "message": "duplicate key value violates unique constraint"
}
```

## 9. Verification and Test Plan

| Test | Action | Expected result |
|---|---|---|
| Browse | Anonymous user reads placements | Only `published` placements appear |
| Apply | Student applies to open placement | `201`, status `submitted`, history/event created |
| Duplicate | Same student applies again | `409`; only one application remains |
| Ownership | Student A reads applications | Student B's rows are not returned |
| Approval | Advisor calls review RPC | Approval inserted and status becomes decision |
| Concurrent approval | Two reviews target one application | One succeeds; the other fails safely |
| Progress | Approved student submits week 1 | `201` and row is visible to its owner |
| Invalid progress | Unapproved student submits update | Insert rejected |
| Admin CRUD | Admin creates, reads, updates, deletes draft | All four operations succeed |
| Role escalation | Student patches own role to admin | Trigger rejects change |
| Outbox privacy | Browser tries to read events | No rows accessible |

After testing, execute `supabase/verification.sql`. Confirm seven tables, RLS enabled on all seven, expected policies and indexes, and audit/outbox rows for application changes.

## 10. Limitations and Future Improvements

- The MVP allows one final approval record per application. A later version could model multiple review rounds explicitly.
- Advisors currently see the full review queue. Department or advisor assignment can be added with an `advisor_assignments` table and narrower RLS.
- Skill matching uses exact tags. A future version could normalize skills into reference tables or add vector embeddings.
- Outbox delivery requires an Edge Function or trusted worker with retry and idempotency logic.
- Hard deletion should be rare. Production operations should prefer `archived` or `withdrawn` states to preserve history.
- Before production use, the team should add automated database tests and configure point-in-time recovery according to service requirements.

## 11. Requirement Traceability

| Assignment instruction | Evidence in this submission |
|---|---|
| Design the database using Supabase | Sections 2-4 and the SQL migration |
| Explain the database choice | Section 2 |
| Create schema and migrate/deploy | Executable migration and Section 5 deployment procedure/status |
| Show ER diagram and schema | Sections 3.2-3.4 |
| Provide CRUD APIs | Section 6.1-6.4; additional workflow APIs in 6.5-6.8 |
| Demonstrate requests and responses | Section 6 with HTTP, JSON, and cURL examples |

## 12. Submission Checklist

| Completed in this package | Required before final submission |
|---|---|
| [x] Markdown report prepared | [ ] Add student names, IDs, course, and section |
| [x] PDF report prepared | [ ] Deploy migration to the team's remote Supabase project |
| [x] SQL migration prepared | [ ] Add remote verification output and screenshots |
| [x] ER diagram included | |
| [x] CRUD examples included | |
| [x] Request and response examples included | |
