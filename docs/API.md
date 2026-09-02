# API Contract for quiz-ui

Base API role boundaries:

- Parent APIs: `/api/parent/**`
- Student APIs: `/api/student/**`
- Authentication endpoints are under `/api/auth/**`

Authentication uses the access token returned by login/registration. The frontend sends the authenticated token with subsequent protected API calls.

## Auth

### Parent register

`POST /api/auth/parent/register`

Request:
```json
{
  "fullName": "...",
  "email": "...",
  "password": "...",
  "phone": "..."
}
```

Response includes Parent information and, per MVP decision, can auto-login by returning a token.

Important errors:
- duplicate email → `EMAIL_TAKEN`
- validation errors → HTTP 400

### Parent login

`POST /api/auth/parent/login`

Request:
```json
{
  "email": "...",
  "password": "..."
}
```

Response:
```json
{
  "token": "...",
  "parent": {}
}
```

Invalid email/password uses one generic invalid-credentials business error.

### Student login

`POST /api/auth/student/login`

Request:
```json
{
  "username": "...",
  "password": "..."
}
```

Response:
```json
{
  "token": "...",
  "student": {}
}
```

Invalid credentials use one generic invalid-credentials business error.

## Students — Parent

Base: `/api/parent/students`

- `POST /api/parent/students`
- `PUT /api/parent/students/{id}`
- `GET /api/parent/students`
- `GET /api/parent/students/{id}`
- `DELETE /api/parent/students/{id}`

Create:
```json
{
  "fullName": "...",
  "grade": "...",
  "username": "...",
  "password": "..."
}
```

Update is partial:
```json
{
  "fullName": "...",
  "grade": "...",
  "username": "...",
  "password": "..."
}
```

Do not send `parentId`; backend derives ownership from the authenticated Parent.

Duplicate username is a business error.

## Subjects — Parent

Base: `/api/parent/subjects`

- `POST /api/parent/subjects` — `{ "name": "..." }`
- `PUT /api/parent/subjects/{id}` — `{ "name": "..." }`
- `GET /api/parent/subjects`
- `GET /api/parent/subjects/{id}`
- `DELETE /api/parent/subjects/{id}`

Delete is rejected when the Subject still has Lessons.

## Lessons — Parent

Base: `/api/parent/lessons`

- `POST /api/parent/lessons` — `{ "subjectId": 1, "name": "..." }`
- `PUT /api/parent/lessons/{id}` — `{ "name": "..." }`
- `GET /api/parent/lessons?subjectId={id}`
- `GET /api/parent/lessons/{id}`
- `DELETE /api/parent/lessons/{id}`

`subjectId` is required when listing Lessons.

Delete is rejected when the Lesson still has Questions.

## Questions — Parent

Base: `/api/parent/questions`

- `POST /api/parent/questions`
- `PUT /api/parent/questions/{id}`
- `GET /api/parent/questions?lessonId={id}`
- `GET /api/parent/questions/{id}`
- `DELETE /api/parent/questions/{id}`
- `GET /api/parent/questions/import-template?format=xlsx`
- `POST /api/parent/questions/import`

Manual create/update shape:
```json
{
  "lessonId": 1,
  "content": "...",
  "knowledgeTag": "Do/Does",
  "choices": [
    { "content": "A", "correct": false },
    { "content": "B", "correct": true }
  ]
}
```

Rules:
- at least 2 choices;
- exactly 1 correct choice;
- `knowledgeTag` is optional;
- Question must belong to the authenticated Parent.

Parent GET question responses may include `correct`.

## Question import

Import request is `multipart/form-data`:
- `file`
- `lessonId`

Supported:
- `.xlsx`
- `.csv`

Response concept:
```json
{
  "totalRows": 10,
  "successCount": 8,
  "errors": [
    {
      "rowNumber": 4,
      "reason": "..."
    }
  ]
}
```

Import is best-effort by row.

## Tests — Parent

Base: `/api/parent/tests`

### Create

`POST /api/parent/tests`

```json
{
  "studentId": 1,
  "name": "Unit 1 Test",
  "questionIds": [10, 12, 11]
}
```

Question ID order is the display order.

At least one Question is required.

Creating the Test assigns it immediately.

### List

`GET /api/parent/tests`

Optional:
`?studentId={id}`

### Detail

`GET /api/parent/tests/{id}`

Returns Test details and selected Questions in order.

### Delete

`DELETE /api/parent/tests/{id}`

Rejected if the Test already has an Attempt.

## Student tests and attempts

Base: `/api/student`

### Assigned tests

`GET /api/student/tests`

Returns tests belonging to the current Student.

### Start

`POST /api/student/tests/{testId}/start`

If no Attempt exists, creates one.

If an Attempt already exists, returns the existing Attempt.

Student start response concept:
```json
{
  "attemptId": 123,
  "questions": [
    {
      "questionId": 10,
      "content": "...",
      "choices": [
        { "choiceId": 1, "content": "A" },
        { "choiceId": 2, "content": "B" }
      ]
    }
  ]
}
```

**Never expect `correct` in Student choice data. Do not add it to the Student UI model.**

### Save answers

`POST /api/student/attempts/{attemptId}/answers`

```json
{
  "answers": [
    {
      "questionId": 10,
      "choiceId": 2
    }
  ]
}
```

Can be called incrementally or with multiple answers.

Blocked after submission.

### Submit

`POST /api/student/attempts/{attemptId}/submit`

On success:
- Attempt is submitted;
- score is calculated;
- Test becomes `COMPLETED`.

Submit cannot be repeated.

## Parent reports

### Attempt report

`GET /api/parent/attempts/{id}`

Returns detailed submitted result including:
- score;
- per-question result;
- chosen answer;
- correct answer;
- knowledge tag;
- breakdown by knowledge tag.

An unsubmitted Attempt is rejected.

### Student history

`GET /api/parent/students/{studentId}/attempts`

Returns submitted test history, newest first, in summary form.

## Important frontend error behavior

Backend owns final authorization and business validation.

Frontend should:
- show validation/business messages returned by the API;
- handle 401 as an authentication/session problem;
- handle 403 as forbidden access;
- avoid displaying raw backend internals;
- not infer success from HTTP request completion alone when the API returns a business failure.

Do not invent response fields that are not documented here. When integrating against the actual backend, inspect the existing API response envelope used by the project.
