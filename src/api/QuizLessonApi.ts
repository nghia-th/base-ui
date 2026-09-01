import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khớp LessonCreateRequest.java (cần subjectId) - LessonUpdateRequest.java chỉ có "name" (không
// đổi được subjectId của 1 lesson đã tạo), nên tách riêng 2 interface.
export interface QuizLessonCreateRequest {
    subjectId: number;
    name: string;
}

export interface QuizLessonUpdateRequest {
    name: string;
}

export class QuizLessonApi {
    static list(subjectId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/lessons`, { params: { subjectId } });
    }

    static create(request: QuizLessonCreateRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/lessons`, request);
    }

    static update(id: number, request: QuizLessonUpdateRequest) {
        return QuizRequestBase.put(`${QUIZ_PARENT_PREFIX}/lessons/${id}`, request);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/lessons/${id}`);
    }
}
