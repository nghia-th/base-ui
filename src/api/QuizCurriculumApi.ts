import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_ADMIN_PREFIX } from "../base/PrefixService";

// Matches AdminCurriculumApi.java (2026-09-05) - Admin CRUD for the "bo sach" (curriculum) lookup
// list that replaces the previous hardcoded 3-value list used by the Textbook library feature
// (QuizLibraryApi.ts's "curriculum" field). Same single-field request-body reuse pattern as
// QuizClassroomApi.ts (name used for both create/update).
export interface QuizCurriculumRequest {
    name: string;
}

// Matches CurriculumResponse.java.
export interface QuizCurriculum {
    id: number;
    name: string;
}

export class QuizCurriculumApi {
    static list() {
        return QuizRequestBase.get(`${QUIZ_ADMIN_PREFIX}/curricula`);
    }

    static create(request: QuizCurriculumRequest) {
        return QuizRequestBase.post(`${QUIZ_ADMIN_PREFIX}/curricula`, request);
    }

    static update(id: number, request: QuizCurriculumRequest) {
        return QuizRequestBase.put(`${QUIZ_ADMIN_PREFIX}/curricula/${id}`, request);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_ADMIN_PREFIX}/curricula/${id}`);
    }
}
