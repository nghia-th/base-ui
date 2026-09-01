import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentAttemptApi } from "../../api/QuizStudentAttemptApi";

// Khớp StudentTestSummaryResponse.java.
export interface QuizStudentTestSummary {
    id: number;
    name: string;
    status: string;
}

// Bloc trang "Đề của tôi" (khu vực Học sinh, /app/student/tests - Task 6 backend, danh sách).
export class BlocStudentTests extends IBlocUI {
    async initData() {
        this.reload()
    }

    reload() {
        this.apiRequest(QuizStudentAttemptApi.listTests(), (res) => {
            this.setStream('tests', res.data as QuizStudentTestSummary[])
        })
    }
}
