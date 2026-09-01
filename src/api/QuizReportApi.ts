import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khớp SpeakingGradeRequest.java (câu hỏi dạng tự luận/thu âm, 2026-09-01) - null = "chưa chấm"
// (đưa về trạng thái ban đầu), true/false = Đúng/Sai. Chỉ là ghi chú tham khảo cho Phụ huynh, KHÔNG
// ảnh hưởng correctCount/scorePercent (xem QuestionType.java's javadoc phía backend).
export interface QuizSpeakingGradeRequest {
    correct: boolean | null;
}

// ReportApi.java mount thẳng ở "/api/parent" (không có "/reports" trong path) - đọc kết quả con làm
// bài (Task 7 backend) + nghe/chấm câu trả lời dạng tự luận/thu âm (2026-09-01).
export class QuizReportApi {
    static getAttemptReport(attemptId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/attempts/${attemptId}`);
    }

    static getStudentAttemptHistory(studentId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/students/${studentId}/attempts`);
    }

    // Nghe lại câu trả lời con đã ghi âm - responseType:'blob', cùng lý do/cách dùng như
    // QuizStudentAttemptApi.getSpeakingAnswer (endpoint cần JWT nên không dùng thẳng <audio src=...>).
    static getSpeakingAnswer(attemptId: number, questionId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/attempts/${attemptId}/questions/${questionId}/speaking-answer`, { responseType: 'blob' });
    }

    // Đánh dấu Đúng/Sai (hoặc null để bỏ đánh dấu) cho câu trả lời dạng tự luận/thu âm - chỉ ghi chú
    // tham khảo, xem comment QuizSpeakingGradeRequest ở trên.
    static gradeSpeakingAnswer(attemptId: number, questionId: number, correct: boolean | null) {
        return QuizRequestBase.put(`${QUIZ_PARENT_PREFIX}/attempts/${attemptId}/questions/${questionId}/grade`, { correct } as QuizSpeakingGradeRequest);
    }
}
