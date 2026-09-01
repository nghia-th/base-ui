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
// sinh ở task 6).
export interface QuizAttemptAnswerDetail {
    questionId: number;
    questionContent: string;
    chosenChoiceContent: string | null;
    correctChoiceContent: string;
    correct: boolean;
    knowledgeTag: string;
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

// Bloc trang "Báo cáo" (khu vực Phụ huynh, /app/parent/reports - Task 7 backend, đọc-only).
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
}
