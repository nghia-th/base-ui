import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_STUDENT_PREFIX } from "../base/PrefixService";

// Khớp AnswerItem.java.
export interface QuizAnswerItem {
    questionId: number;
    choiceId: number;
}

// Task 6 backend - luồng học sinh làm bài (StudentAttemptApi.java, /api/student/**).
export class QuizStudentAttemptApi {
    static listTests() {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/tests`);
    }

    // Idempotent bên backend - gọi lại nhiều lần (vd học sinh vào lại giữa chừng) trả về đúng
    // attemptId cũ, không tạo attempt mới (v1 chỉ cho làm 1 lần/đề - xem StudentAttemptApi.java).
    static start(testId: number) {
        return QuizRequestBase.post(`${QUIZ_STUDENT_PREFIX}/tests/${testId}/start`, {});
    }

    static saveAnswers(attemptId: number, answers: QuizAnswerItem[]) {
        return QuizRequestBase.post(`${QUIZ_STUDENT_PREFIX}/attempts/${attemptId}/answers`, { answers });
    }

    static submit(attemptId: number) {
        return QuizRequestBase.post(`${QUIZ_STUDENT_PREFIX}/attempts/${attemptId}/submit`, {});
    }
}
