import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentAttemptApi, QuizStudentPracticeGenerateRequest } from "../../api/QuizStudentAttemptApi";

// Khớp StudentAttemptAnswerDetail.java (mới, 2026-09-02) - CÙNG HÌNH DẠNG QuizAttemptAnswerDetail
// bên BlocParentReports.ts (Phụ huynh) NHƯNG không có field 'referenceAnswer' (ghi chú riêng của
// Phụ huynh, backend cố ý không trả cho Học sinh - xem StudentAttemptAnswerDetail.java's javadoc).
export interface QuizStudentAttemptAnswerDetail {
    questionId: number;
    questionContent: string;
    chosenChoiceContent: string | null;
    correctChoiceContent: string | null;
    correct: boolean;
    knowledgeTag: string;
    questionType: 'MULTIPLE_CHOICE' | 'SPEAKING';
    hasSpeakingAnswer: boolean;
    parentMarkedCorrect: boolean | null;
    answerText: string | null;
    answerMode: 'AUDIO' | 'TEXT' | 'BOTH' | null;
}

// Khớp StudentAttemptReportResponse.java (mới, 2026-09-02) - "Xem lại đáp án" phía Học sinh.
export interface QuizStudentAttemptReport {
    attemptId: number;
    testName: string;
    testType: string;
    correctCount: number;
    totalQuestions: number;
    scorePercent: number;
    submittedAt: string;
    answers: QuizStudentAttemptAnswerDetail[];
    byKnowledgeTag: { knowledgeTag: string; correctCount: number; totalCount: number }[];
}

// Khớp StudentTestSummaryResponse.java.
export interface QuizStudentTestSummary {
    id: number;
    name: string;
    status: string;
    testType: string;
}

// Khớp SubjectResponse.java - chỉ lấy 2 field cần cho dropdown "chọn Môn" khi tự tạo đề Ôn tập.
export interface QuizStudentSubjectLite {
    id: number;
    name: string;
}

// Bloc trang "Đề của tôi" (khu vực Học sinh, /app/student/tests - Task 6 backend, danh sách).
// Thêm subjects + generatePractice cho tính năng "Ôn tập kiến thức" học sinh tự tạo (2026-09-01).
export class BlocStudentTests extends IBlocUI {
    async initData() {
        this.reload()
        this.apiRequest(QuizStudentAttemptApi.listSubjects(), (res) => {
            this.setStream('subjects', res.data as QuizStudentSubjectLite[])
        })
    }

    reload() {
        this.apiRequest(QuizStudentAttemptApi.listTests(), (res) => {
            this.setStream('tests', res.data as QuizStudentTestSummary[])
        })
    }

    // "Xem lại đáp án" (mới, 2026-09-02, theo yêu cầu của anh) - Dialog đọc-only cho 1 đề đã nộp,
    // cùng pattern openReport/closeReport bên BlocParentReports.ts (Phụ huynh), scoped theo testId
    // (không phải attemptId - Tests.tsx chỉ có sẵn testId trong danh sách, backend tự tra attempt
    // của đúng học sinh đang đăng nhập, xem StudentAttemptApi.java).
    openAnswerReview(testId: number, onError: (error: any) => void) {
        this.revokeSpeakingAudioUrls()
        this.setStream('speakingAudioUrls', {})
        this.setStream('speakingLoadingIds', {})
        this.apiRequest(QuizStudentAttemptApi.getOwnAttemptReport(testId), (res) => {
            this.setStream('answerReview', res.data as QuizStudentAttemptReport)
        }, { onError })
    }

    closeAnswerReview() {
        this.setStream('answerReview', null)
        this.revokeSpeakingAudioUrls()
        this.setStream('speakingAudioUrls', {})
    }

    private revokeSpeakingAudioUrls() {
        const urls: Record<number, string> = this.getField('speakingAudioUrls') ?? {}
        Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    }

    // Nghe lại bản ghi âm CỦA CHÍNH học sinh cho 1 câu SPEAKING trong đề đang xem lại - cùng
    // pattern loadSpeakingAnswer bên BlocParentReports.ts, chỉ khác endpoint gọi
    // (QuizStudentAttemptApi.getSpeakingAnswer, đã hoạt động cả lúc làm bài lẫn sau khi nộp).
    loadSpeakingAnswer(attemptId: number, questionId: number, onError: (error: any) => void) {
        if ((this.getField('speakingAudioUrls') ?? {})[questionId]) return
        this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: true })
        this.apiRequest(QuizStudentAttemptApi.getSpeakingAnswer(attemptId, questionId), (res: any) => {
            this.setStream('speakingAudioUrls', { ...(this.getField('speakingAudioUrls') ?? {}), [questionId]: URL.createObjectURL(res.data as Blob) })
            this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
        }, {
            onError: (error: any) => {
                this.setStream('speakingLoadingIds', { ...(this.getField('speakingLoadingIds') ?? {}), [questionId]: false })
                onError(error)
            }
        })
    }

    // Gọi lại nhiều lần = tạo lại nhiều lần, mỗi lần server random 1 bộ câu hỏi MỚI, không giới
    // hạn số lần làm lại (xem StudentPracticeGenerateRequest.java's javadoc).
    generatePractice(request: QuizStudentPracticeGenerateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.generatePractice(request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    // Dialog "Tạo đề ôn tập" (2026-09-01, xem BlocParentStudents.ts's comment cho lý do chung).
    openPractice() {
        this.setStream('pSubjectId', '')
        this.setField('practiceReq', {})
        this.setStream('practice_view', { isShow: true })
    }

    closePractice() {
        this.setStream('practice_view', { isShow: false })
        this.setStream('practiceSubmitting', false)
    }

    submitPractice(onComplete: () => void, onError: (error: any) => void) {
        const subjectId = this.getField('pSubjectId')
        if (subjectId === '' || subjectId == null) {
            onError({ messageKey: 'required-field' })
            return
        }
        const req = this.getField('practiceReq') ?? {}
        this.setStream('practiceSubmitting', true)
        const request: QuizStudentPracticeGenerateRequest = {
            subjectId,
            name: (req.pName ?? '').trim() === '' ? undefined : req.pName,
            questionCount: (req.pQuestionCount ?? '').trim() === '' ? undefined : Number(req.pQuestionCount)
        }
        this.generatePractice(request, () => { this.setStream('practiceSubmitting', false); onComplete() },
            (error: any) => { this.setStream('practiceSubmitting', false); onError(error) })
    }
}
