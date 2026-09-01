import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khớp TestCreateRequest.java - tạo Test = giao đề luôn, không có bước "giao" riêng (xem TestApi.java).
export interface QuizTestCreateRequest {
    studentId: number;
    name: string;
    questionIds: number[];
}

// Khớp PracticeGenerateRequest.java - tạo đề "Ôn tập" ngẫu nhiên theo Môn học, KHÔNG có questionIds
// (server tự chọn ngẫu nhiên) - xem TestService#generatePractice. name/questionCount đều tuỳ chọn.
export interface QuizPracticeGenerateRequest {
    studentId: number;
    subjectId: number;
    name?: string;
    questionCount?: number;
}

export class QuizTestApi {
    static list(studentId?: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/tests`, { params: studentId ? { studentId } : {} });
    }

    static create(request: QuizTestCreateRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/tests`, request);
    }

    // Gọi lại nhiều lần = tạo lại nhiều lần, mỗi lần server random 1 bộ câu hỏi MỚI (không giới
    // hạn số lần làm lại - xem PracticeGenerateRequest.java's javadoc).
    static generatePractice(request: QuizPracticeGenerateRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/tests/practice`, request);
    }

    static get(id: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/tests/${id}`);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/tests/${id}`);
    }
}
