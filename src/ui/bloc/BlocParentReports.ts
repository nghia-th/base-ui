import { IBlocUI } from "../../base/IBlocUI";
import { QuizReportApi } from "../../api/QuizReportApi";
import { QuizStudentApi } from "../../api/QuizStudentApi";

// Khớp StudentAttemptHistoryItem.java.
export interface QuizAttemptHistoryItem {
    attemptId: number;
    testName: string;
    submittedAt: string;
    correctCount: number;
    totalQuestions: number;
    testType: string;
}

// Khớp AttemptAnswerDetail.java - Phụ huynh-facing nên CÓ correctChoiceContent (khác view học
// sinh ở task 6). questionType/hasSpeakingAnswer/parentMarkedCorrect thêm 2026-09-01 (câu hỏi dạng
// tự luận/thu âm) - correctChoiceContent là null cho câu SPEAKING (không có Choice nào), 'correct'
// vẫn luôn false cho câu SPEAKING (không được backend tự chấm, xem ReportService.java's comment) -
// KHÔNG dùng field 'correct' để hiện icon Đúng/Sai cho câu SPEAKING, dùng parentMarkedCorrect.
export interface QuizAttemptAnswerDetail {
    questionId: number;
    questionContent: string;
    chosenChoiceContent: string | null;
    correctChoiceContent: string | null;
    correct: boolean;
    knowledgeTag: string;
    questionType: 'MULTIPLE_CHOICE' | 'SPEAKING';
    hasSpeakingAnswer: boolean;
    parentMarkedCorrect: boolean | null;
}

// Khớp KnowledgeTagBreakdown.java - tính năng cốt lõi của sản phẩm (xem hieu-bai-app-phan-tich.md):
// không chỉ điểm số mà còn sai ở mảng kiến thức nào.
export interface QuizKnowledgeTagBreakdown {
    knowledgeTag: string;
    correctCount: number;
    totalCount: number;
}

// Khớp AttemptReportResponse.java.
export interface QuizAttemptReport {
    attemptId: number;
    testName: string;
    studentName: string;
    correctCount: number;
    totalQuestions: number;
    scorePercent: number;
    submittedAt: string;
    answers: QuizAttemptAnswerDetail[];
    byKnowledgeTag: QuizKnowledgeTagBreakdown[];
}

// Bloc trang "Báo cáo" (khu vực Phụ huynh, /app/parent/reports - Task 7 backend). ĐÃ THÊM 2026-
// 09-01: nghe lại + chấm Đúng/Sai câu trả lời dạng tự luận/thu âm (đọc-only mọi phần khác vẫn giữ
// nguyên, chỉ riêng thao tác chấm này là ghi - xem gradeSpeakingAnswer bên dưới).
export class BlocParentReports extends IBlocUI {
    async initData() {
        this.apiRequest(QuizStudentApi.list(), (res) => {
            this.setStream('students', res.data)
        })
    }

    loadHistory(studentId: number) {
        this.apiRequest(QuizReportApi.getStudentAttemptHistory(studentId), (res) => {
            this.setStream('history', res.data as QuizAttemptHistoryItem[])
        })
    }

    loadAttemptReport(attemptId: number, onComplete: (report: QuizAttemptReport) => void, onError: (error: any) => void) {
        this.apiRequest(QuizReportApi.getAttemptReport(attemptId), (res) => {
            onComplete(res.data as QuizAttemptReport)
        }, { onError })
    }

    // State giao diện dời từ useState vào đây (2026-09-01, xem BlocParentStudents.ts's comment).
    changeStudent(value: number) {
        this.setStream('studentId', value)
        this.loadHistory(value)
    }

    openReport(attemptId: number, onError: (error: any) => void) {
        this.revokeSpeakingAudioUrls()
        this.setStream('speakingAudioUrls', {})
        this.setStream('speakingLoadingIds', {})
        this.loadAttemptReport(attemptId, (r) => this.setStream('report', r), onError)
    }

    closeReport() {
        this.setStream('report', null)
        this.revokeSpeakingAudioUrls()
        this.setStream('speakingAudioUrls', {})
    }

    private revokeSpeakingAudioUrls() {
        const urls: Record<number, string> = this.getField('speakingAudioUrls') ?? {}
        Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    }

    // Nghe lại câu trả lời con đã ghi âm cho 1 câu hỏi SPEAKING - cache theo questionId, CÙNG
    // PATTERN loadQuestionAudio bên BlocStudentAttempt.ts (không tải lại nếu đã có url).
    loadSpeakingAnswer(attemptId: number, questionId: number, onError: (error: any) => void) {
        if ((this.getField('speakingAudioUrls') ?? {})[questionId]) return
        this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: true })
        this.apiRequest(QuizReportApi.getSpeakingAnswer(attemptId, questionId), (res: any) => {
            this.setStream('speakingAudioUrls', { ...(this.getField('speakingAudioUrls') ?? {}), [questionId]: URL.createObjectURL(res.data as Blob) })
            this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
        }, {
            onError: (error: any) => {
                this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
                onError(error)
            }
        })
    }

    // Đánh dấu Đúng/Sai/Chưa chấm cho 1 câu SPEAKING - chỉ là ghi chú tham khảo, KHÔNG gọi lại
    // loadAttemptReport (tránh mất state speakingAudioUrls đã tải + tránh nhấp nháy cả Dialog), tự
    // cập nhật report đang có trong stream để UI phản hồi ngay (xem QuestionType.java's javadoc:
    // không ảnh hưởng correctCount/scorePercent nên không cần đồng bộ lại phần điểm số).
    gradeSpeakingAnswer(attemptId: number, questionId: number, correct: boolean | null, onError: (error: any) => void) {
        this.apiRequest(QuizReportApi.gradeSpeakingAnswer(attemptId, questionId, correct), () => {
            const report: QuizAttemptReport | null = this.getField('report')
            if (!report) return
            const answers = report.answers.map((a) => a.questionId === questionId ? { ...a, parentMarkedCorrect: correct } : a)
            this.setStream('report', { ...report, answers })
        }, { onError })
    }
}
