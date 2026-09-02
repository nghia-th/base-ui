# UI Workflows — quiz-ui

These workflows describe the user-visible state transitions for MVP v1.

## Parent workflow

```text
Register/Login
   ↓
Parent Home
   ├── Children
   ├── Subjects → Lessons → Question Bank
   ├── Tests
   └── Reports
```

## Child management

```text
Children
  ↓
Create Child
  ├── Full name
  ├── Grade
  ├── Username
  └── Password
       ↓
Save
       ↓
Child list
```

Editing is partial. Password is only changed when the Parent intends to reset it.

## Subject / Lesson workflow

```text
Subjects
  ↓
Select Subject
  ↓
Lessons
  ↓
Select Lesson
  ↓
Question Bank
```

Lesson selection is important because Question creation/import requires a Lesson.

## Question creation workflow

```text
Question Bank
  ↓
Create Question
  ├── Question content
  ├── Knowledge tag (optional)
  └── 2+ choices
       └── exactly 1 correct
            ↓
Save
```

The UI should make the exactly-one-correct rule obvious before submitting.

## Question import workflow

```text
Question Bank
  ↓
Select Lesson
  ↓
Download template
  ↓
Fill Excel/CSV
  ↓
Upload
  ↓
Import result
  ├── total rows
  ├── successful rows
  └── row-level errors
```

Do not pretend that a partially successful import is a total failure.

## Test creation workflow

```text
Tests
  ↓
Create Test
  ├── Test name
  ├── Select child
  └── Select/reorder questions
       ↓
Create
       ↓
Test is immediately ASSIGNED
```

There is no separate Assign button in MVP v1.

## Student workflow

```text
Student Login
   ↓
Assigned Tests
   ↓
Open Test
   ↓
Start
   ↓
Attempt
   ├── Question 1
   ├── Question 2
   └── ...
        ↓
Submit
        ↓
Result
```

Starting an already-started Test must restore/use the same Attempt.

## Answering workflow

Before submit:
- Student can choose answers.
- Answers may be saved incrementally.
- Unanswered questions remain unanswered.

After submit:
- choices are read-only;
- answer-saving is disabled;
- submit is disabled;
- Test is completed.

The UI must never display which answer is correct before submission.

## Parent report workflow

```text
Reports / Child
   ↓
Test History
   ↓
Select submitted test
   ↓
Detailed Report
   ├── Overall score
   ├── Question-by-question result
   └── Knowledge-tag breakdown
          ↓
       Review / reteach areas
```

A score alone is not the main product goal. The report should help the Parent identify weak knowledge areas.

## Loading / error / empty states

Every data-driven screen should account for:
- loading;
- successful data;
- empty data;
- validation error;
- business-rule error;
- unauthorized/forbidden response.

Examples:
- no children yet;
- no Lessons in a Subject;
- no Questions in a Lesson;
- no assigned Tests for Student;
- no submitted history;
- deletion blocked because child data exists;
- deletion blocked because a Question/Test is already referenced.

Do not invent additional business states without evidence from the product/backend documentation.
