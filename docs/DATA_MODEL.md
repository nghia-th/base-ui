# Frontend Data Model — quiz-ui

This is the frontend-facing view of the MVP data model. It describes concepts and fields needed by UI/API integration, not backend entity implementation.

## Relationships

```text
Parent
├── Student
├── Subject
│   └── Lesson
│       └── Question
│           └── Choice
└── Test
    └── TestQuestion
        └── Question

Test
└── Attempt
    └── AttemptAnswer
```

## Parent

Relevant fields:
- `id`
- `fullName`
- `email`
- `phone`

Never expose or store the password as normal profile data.

## Student

Relevant fields:
- `id`
- `parentId` (backend ownership field; normally not a form field)
- `fullName`
- `grade`
- `username`

Password is managed by the Parent and must not be displayed.

## Subject

Fields:
- `id`
- `parentId` (ownership)
- `name`

## Lesson

Fields:
- `id`
- `subjectId`
- `name`

Lesson ownership is resolved through its Subject.

## Question

Fields:
- `id`
- `lessonId`
- `content`
- `knowledgeTag` (optional)
- `choices[]` for Parent question-bank views

## Choice — Parent view

Fields:
- `id`
- `questionId`
- `content`
- `correct`

The `correct` field may be shown to Parent.

## Choice — Student view

Student-facing choices contain:
- `choiceId`
- `content`

Do not expect or render `correct` in Student test-taking data.

## Test

Fields:
- `id`
- `parentId`
- `studentId`
- `name`
- `status`

Known statuses:
- `ASSIGNED`
- `COMPLETED`

A Test also has an ordered list of Questions in detailed Parent views.

## Attempt

Fields:
- `attemptId` / `id`
- `testId`
- `studentId`
- `startedAt`
- `submittedAt`
- `correctCount`
- `totalQuestions`

`submittedAt = null` means the Attempt has not been submitted.

MVP: one Attempt per Test.

## AttemptAnswer

Conceptually contains:
- `attemptId`
- `questionId`
- `choiceId` (nullable for unanswered)
- `correct`

The correct flag is a result of scoring and is relevant after submission.

## Report

The Parent report adds presentation-oriented data:

```text
AttemptReport
├── attemptId
├── testName
├── studentName
├── correctCount
├── totalQuestions
├── scorePercent
├── submittedAt
├── answers[]
│   ├── questionId
│   ├── questionContent
│   ├── chosenChoiceContent
│   ├── correctChoiceContent
│   ├── correct
│   └── knowledgeTag
└── byKnowledgeTag[]
    ├── knowledgeTag
    ├── correctCount
    └── totalCount
```

For report rendering, a null/missing knowledge tag is displayed as `Chưa phân loại`.
