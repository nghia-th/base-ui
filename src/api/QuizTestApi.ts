import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khớp TestCreateRequest.java - tạo Test = giao đề luôn, không có bước "giao" riêng (xem TestApi.java).
export interface QuizTestCreateRequest {
    studentId: number;
    name: string;
    questionIds: number[];
}

export class QuizTestApi {
    static list(studentId?: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/tests`, { params: studentId ? { studentId } : {} });
    }

    static create(request: QuizTestCreateRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/tests`, request);
    }

    static get(id: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/tests/${id}`);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/tests/${id}`);
    }
}
