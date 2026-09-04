import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import QUIZ_API from "../quiz-net/QuizApiService";
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

    // Xem lại đáp án của 1 đề ĐÃ NỘP (mới, 2026-09-02, theo yêu cầu "xem lại đáp án những đề đã
    // làm") - trả về chi tiết từng câu (đã chọn gì so với đáp án đúng) + phân tích theo chủ đề kiến
    // thức, cùng hình dạng dữ liệu với báo cáo bên Phụ huynh (QuizReportApi.getAttemptReport) nhưng
    // scoped theo testId của CHÍNH học sinh đang đăng nhập, không có field 'referenceAnswer' (ghi
    // chú riêng của Phụ huynh - xem StudentAttemptAnswerDetail.java's javadoc). Backend chặn 409 nếu
    // đề CHƯA nộp bài (QUIZ_013 ATTEMPT_NOT_SUBMITTED).
    static getOwnAttemptReport(testId: number) {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/tests/${testId}/answers`);
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

    // Tải audio câu hỏi (tính năng "Câu hỏi dạng âm thanh", 2026-09-01) về dạng blob để phát
    // <audio> - cùng lý do cần responseType:'blob' + header Authorization như getImage bên
    // QuizStudentLessonApi.ts (endpoint cần JWT nên không dùng thẳng <audio src="<url>">).
    static getQuestionAudio(questionId: number) {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/questions/${questionId}/audio`, { responseType: 'blob' });
    }

    // Tải video câu hỏi (tính năng "Câu hỏi dạng video", 2026-09-04 phần 3/4) - y hệt getQuestionAudio ở trên.
    static getQuestionVideo(questionId: number) {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/questions/${questionId}/video`, { responseType: 'blob' });
    }

    // Câu hỏi dạng tự luận/thu âm (2026-09-01) - phát lại câu trả lời ĐÃ ghi âm của chính học sinh,
    // cùng lý do responseType:'blob' như getQuestionAudio ở trên. Hoạt động cả lúc đang làm bài lẫn
    // sau khi đã nộp (xem StudentAttemptApi.java's javadoc).
    static getSpeakingAnswer(attemptId: number, questionId: number) {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/attempts/${attemptId}/questions/${questionId}/speaking-answer`, { responseType: 'blob' });
    }

    // Xoá bản ghi âm hiện tại để ghi lại từ đầu - chặn ở backend nếu attempt đã nộp
    // (QUIZ_010 ATTEMPT_ALREADY_SUBMITTED).
    static removeSpeakingAnswer(attemptId: number, questionId: number) {
        return QuizRequestBase.delete(`${QUIZ_STUDENT_PREFIX}/attempts/${attemptId}/questions/${questionId}/speaking-answer`);
    }

    // Lưu câu trả lời gõ chữ (tự luận) cho câu SPEAKING dạng TEXT/BOTH (thêm 2026-09-01, theo góp ý
    // anh sau khi test bản v1 chỉ ghi âm) - text rỗng/null xoá về chưa trả lời. Chặn ở backend nếu
    // attempt đã nộp, giống hệt speaking-answer (audio).
    static saveSpeakingTextAnswer(attemptId: number, questionId: number, text: string) {
        return QuizRequestBase.put(`${QUIZ_STUDENT_PREFIX}/attempts/${attemptId}/questions/${questionId}/speaking-answer/text`, { text });
    }
}

// Upload bản ghi âm câu trả lời (multipart/form-data, tính năng "Câu hỏi dạng tự luận/thu âm",
// 2026-09-01) - gọi thẳng QUIZ_API, cùng lý do + cách sửa hệt quizUploadQuestionAudio bên
// QuizQuestionApi.ts (bug axios FormData->JSON, xem comment đầy đủ ở đó): PHẢI ghi đè
// headers:{'Content-Type': undefined} để axios không tự convert FormData thành JSON.
export async function quizUploadSpeakingAnswer(attemptId: number, questionId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(
        `${QUIZ_STUDENT_PREFIX}/attempts/${attemptId}/questions/${questionId}/speaking-answer`,
        formData,
        { headers: { 'Content-Type': undefined } }
    );
    return res.data;
}
