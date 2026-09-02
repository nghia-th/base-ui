# Hiểu Bài — Frontend Project Context

## Product purpose

"Hiểu Bài" helps a parent quickly create a multiple-choice test linked to a lesson, assign it to a child, let the child complete it, and review results to understand which knowledge areas need to be reviewed.

The product must answer:

1. Has the child understood the lesson?
2. Which areas are still incorrect?
3. Which areas should the parent review or reteach?

## Users

### Parent
The primary account. A parent can:
- Register and log in.
- Manage multiple child profiles.
- Create subjects and lessons.
- Create a question bank manually or import structured Excel/CSV files.
- Create and assign tests to a child.
- View submitted results and test history.

### Student
A student account is created and managed by a parent. A student can:
- Log in with username/password.
- View assigned tests.
- Start and answer a test.
- Submit a test.
- View the basic result after submission.

## MVP v1 scope

Included:
- One question type: multiple choice with exactly one correct answer.
- Manual question entry.
- Structured Excel/CSV question import.
- Free-form knowledge tags.
- Automatic scoring.
- Result breakdown by knowledge tag.
- Multiple child profiles per parent.
- One attempt per test; retakes are not supported.

Not included:
- OCR/image question extraction.
- Free-form Word/PDF extraction.
- True/False or short-answer questions.
- A built-in standardized question bank.
- Standardized knowledge taxonomy.
- Retaking the same test.

## Core flow

Parent login/register
→ create/manage child
→ create Subject
→ create Lesson
→ create Question Bank
→ create and assign Test
→ Student logs in
→ Student starts and answers Test
→ Student submits
→ Parent reviews score, incorrect answers, and knowledge-tag breakdown.

## Frontend responsibility

The frontend should implement the user experience and state transitions implied by the business rules. Backend implementation details such as Java classes, Spring configuration, database migrations, repositories, JWT implementation, and Gradle dependencies are not frontend requirements.
