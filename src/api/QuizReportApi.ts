import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// ReportApi.java mount thẳng ở "/api/parent" (không có "/reports" trong path) - 2 endpoint đọc-
// only cho Phụ huynh xem kết quả con làm bài (Task 7 backend).
export class QuizReportApi {
    static getAttemptReport(attemptId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/attempts/${attemptId}`);
    }

    static getStudentAttemptHistory(studentId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/students/${studentId}/attempts`);
    }
}
