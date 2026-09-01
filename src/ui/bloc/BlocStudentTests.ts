import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentAttemptApi, QuizStudentPracticeGenerateRequest } from "../../api/QuizStudentAttemptApi";

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

    // Gọi lại nhiều lần = tạo lại nhiều lần, mỗi lần server random 1 bộ câu hỏi MỚI, không giới
    // hạn số lần làm lại (xem StudentPracticeGenerateRequest.java's javadoc).
    generatePractice(request: QuizStudentPracticeGenerateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.generatePractice(request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }
}
