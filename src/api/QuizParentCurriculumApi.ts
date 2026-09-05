import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Matches ParentCurriculumApi.java (2026-09-05) - read-only, reuses the same Admin-managed
// curriculum list (see QuizCurriculumApi.ts) so the Parent's "browse library" filter dropdown
// (SubjectLibraryDialog.tsx) can offer current values instead of a hardcoded array. No create/
// update/delete here - only an Admin manages the list itself.
export class QuizParentCurriculumApi {
    static list() {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/curricula`);
    }
}
