# Business Rules — quiz-ui

This document is the frontend-facing business source of truth derived from the backend MVP documentation.

## 1. Roles and access

There are exactly two application roles in MVP v1:

- `PARENT`
- `STUDENT`

Parent and Student have different application capabilities and routes.

Parent:
- manages children, subjects, lessons, questions, tests, and reports.

Student:
- views assigned tests, takes tests, submits answers, and views the basic submitted result.

A Student is created by a Parent and does not self-register.

## 2. Parent / Student ownership

A Parent can only work with their own children and data.

Frontend must never assume that an ID supplied by the UI proves ownership. Backend remains the authority for ownership checks.

Important UI behavior:
- Handle `401`/`403` responses without exposing another user's data.
- Do not build UI that depends on seeing another parent's records.
- Do not put parentId or studentId ownership into forms when the backend derives it from the authenticated user where specified.

## 3. Student profile

A Student has:
- `fullName`
- `grade`
- `username`
- password managed by the Parent

Student username is globally unique.

Student login uses:
- username
- password

Parent login uses:
- email
- password

## 4. Subject and Lesson

Hierarchy:

Subject
→ Lesson
→ Question

A Lesson belongs to exactly one Subject.

Creating a Lesson requires selecting a Subject owned by the current Parent.

Deleting:
- A Subject with Lessons must be blocked.
- A Lesson with Questions must be blocked.

The UI should display the business reason when the backend rejects such deletion.

## 5. Questions and choices

MVP supports only multiple-choice questions.

A Question has:
- `content`
- optional `knowledgeTag`
- at least 2 choices
- exactly 1 correct choice

A Question's choices are managed together with the Question; there is no independent Choice UI/API workflow.

Parent question views may show which choice is correct.

Student question views must never expose the correct-answer flag before submission.

When editing a Question, the backend treats the submitted choices as a full replacement.

Deleting a Question that has already been used in a Test is blocked.

## 6. Knowledge tags

`knowledgeTag` is optional and free-form in MVP v1.

It is not a standardized taxonomy.

Examples:
- `Do/Does`
- `Câu phủ định`

Questions without a tag must still participate in reports. They are grouped under the display label:

`Chưa phân loại`

Do not invent a standardized list of tags in the UI.

## 7. Question import

Supported MVP import formats:
- Excel (`.xlsx`)
- CSV

The import uses a fixed seven-column structure:

1. Câu hỏi
2. Lựa chọn 1
3. Lựa chọn 2
4. Lựa chọn 3
5. Lựa chọn 4
6. Đáp án đúng
7. Tag nhóm kiến thức

All imported questions in one operation belong to the same selected Lesson.

A row is invalid when:
- question content is missing;
- both required choices are not present;
- correct-answer value is not 1–4;
- correct-answer number points to an empty choice.

Import is best-effort by row:
- valid rows are created;
- invalid rows are reported individually.

A completely unreadable/invalid file is an import-level error.

The UI should show:
- total rows;
- success count;
- row number;
- human-readable reason for each failed row.

## 8. Test creation and assignment

Creating a Test also assigns it.

There is no separate publish/assign step in MVP v1.

A Test requires:
- one Student;
- a non-empty ordered list of Questions;
- a name.

The order of selected question IDs is the display order in the Test.

All selected Questions must belong to the current Parent.

A Student must also belong to the current Parent.

Initial Test status:

`ASSIGNED`

After successful submission:

`COMPLETED`

Deleting a Test that already has an Attempt is blocked.

## 9. Student test lifecycle

Student sees only tests assigned to that Student.

Starting a Test creates an Attempt if none exists.

MVP allows exactly one Attempt per Test.

Starting the same Test again must return the existing Attempt rather than create a second Attempt.

The Student test-start response contains question content and choices but must not contain the correct-answer flag.

## 10. Answers

Answers may be sent:
- one at a time;
- or in a batch.

Before submission:
- answers can be saved/updated.

After submission:
- answers cannot be changed.

An answer must belong to the Question in that Test, and the selected Choice must belong to that Question.

Unanswered Questions count as incorrect when the Test is submitted.

Scoring happens at submission.

## 11. Submission

A submitted Attempt cannot be submitted again.

On submit:
- each answer is evaluated against the correct Choice;
- unanswered questions count as incorrect;
- `correctCount` is calculated;
- `submittedAt` is set;
- Test status becomes `COMPLETED`.

## 12. Parent results

Parent can view a submitted Attempt belonging to their own child.

The detailed report contains:
- test name;
- student name;
- correct count;
- total questions;
- percentage;
- submission time;
- per-question answer details;
- knowledge-tag breakdown.

An Attempt that has not been submitted is not a completed report. The backend currently blocks the detailed report for an unsubmitted Attempt.

History is for submitted Attempts.

## 13. Result breakdown

`byKnowledgeTag` groups answers by the Question's `knowledgeTag`.

Each group contains:
- tag;
- correct count;
- total count.

Questions without a tag are grouped as:

`Chưa phân loại`

The UI should make the breakdown useful for identifying what the child should review, not only display a single score.

## 14. Frontend safety rules

Never:
- display Student correct-answer data before submission;
- assume an ID means ownership;
- invent unsupported statuses;
- invent additional question types;
- invent standardized knowledge tags;
- allow retakes in MVP;
- silently replace business rules with frontend-only assumptions.

When backend behavior and this document appear inconsistent, do not silently guess. Inspect the current API behavior or ask for clarification.
