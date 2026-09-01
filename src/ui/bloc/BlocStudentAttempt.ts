import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentAttemptApi } from "../../api/QuizStudentAttemptApi";

// Khớp StudentChoiceResponse.java - CỐ Ý không có field "correct" (khác ChoiceResponse.java bên
// Phụ huynh, task 4) - học sinh không được biết đáp án đúng trước khi nộp bài.
export interface QuizStudentChoice {
    choiceId: number;
    content: string;
}

// Khớp StudentQuestionResponse.java.
export interface QuizStudentQuestion {
    questionId: number;
    content: string;
    choices: QuizStudentChoice[];
}

// Khớp SubmitAttemptResponse.java.
export interface QuizSubmitResult {
    attemptId: number;
    correctCount: number;
    totalQuestions: number;
    scorePercent: number;
}

// Bloc trang "Làm bài" (khu vực Học sinh, /app/student/tests/:testId/take - Task 6 backend, luồng
// bắt đầu/lưu đáp án/nộp bài). Không dùng stream/UIStream cho câu hỏi - TakeTest.tsx giữ state
// (attemptId, questions, answers) bằng React state cục bộ vì luồng làm bài tuyến tính theo 1
// component duy nhất, không cần re-render từ nhiều nơi khác nhau như các trang danh sách/CRUD.
export class BlocStudentAttempt extends IBlocUI {
    start(testId: number, onComplete: (attemptId: number, questions: QuizStudentQuestion[]) => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.start(testId), (res) => {
            onComplete(res.data.attemptId, res.data.questions as QuizStudentQuestion[])
        }, { onError })
    }

    // Lưu ngay khi học sinh chọn 1 đáp án (progressive save, đúng như API cho phép gọi lặp lại
    // nhiều lần trước khi nộp - xem AnswerRequest.java) - không hiện loading spinner cho thao tác
    // nền này, tránh giật màn hình mỗi lần bấm chọn đáp án.
    saveAnswer(attemptId: number, questionId: number, choiceId: number, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.saveAnswers(attemptId, [{ questionId, choiceId }]), () => {}, { onError, isShowLoading: false })
    }

    submit(attemptId: number, onComplete: (result: QuizSubmitResult) => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.submit(attemptId), (res) => {
            onComplete(res.data as QuizSubmitResult)
        }, { onError })
    }
}
