import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_STUDENT_PREFIX } from "../base/PrefixService";

// Khớp AnswerItem.java.
export interface QuizAnswerItem {
    questionId: number;
    choiceId: number;
}

// Khớp StudentPracticeGenerateRequest.java - tự tạo đề "Ôn tập" (không có studentId, luôn là học
// sinh đang đăng nhập - xem StudentAttemptApi.java).
export interface QuizStudentPracticeGenerateRequest {
    subjectId: number;
    name?: string;
    questionCount?: number;
}

// Task 6 backend - luồng học sinh làm bài (StudentAttemptApi.java, /api/student/**). Thêm
// listSubjects()/generatePractice() cho tính năng "Ôn tập kiến thức" tự học sinh tạo (2026-09-01).
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

    // Môn học của LỚP CỦA CHÍNH học sinh đang đăng nhập - dùng cho dropdown "chọn Môn" khi tự tạo
    // đề Ôn tập, học sinh không có khái niệm "chọn Lớp" (chỉ thuộc đúng 1 lớp).
    static listSubjects() {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/subjects`);
    }

    // Gọi lại nhiều lần = tạo lại nhiều lần, mỗi lần server random 1 bộ câu hỏi MỚI, không giới
    // hạn số lần làm lại - xem StudentPracticeGenerateRequest.java's javadoc.
    static generatePractice(request: QuizStudentPracticeGenerateRequest) {
        return QuizRequestBase.post(`${QUIZ_STUDENT_PREFIX}/tests/practice`, request);
    }
}
