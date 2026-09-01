import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentAttemptApi } from "../../api/QuizStudentAttemptApi";
import { QuizStudentLessonApi } from "../../api/QuizStudentLessonApi";

// Khớp StudentChoiceResponse.java - CỐ Ý không có field "correct" (khác ChoiceResponse.java bên
// Phụ huynh, task 4) - học sinh không được biết đáp án đúng trước khi nộp bài.
export interface QuizStudentChoice {
    choiceId: number;
    content: string;
}

// Khớp StudentQuestionResponse.java. lessonId thêm 2026-09-01 để "xem lại bài học" (nút mở
// QuizStudentLesson của đúng bài chứa câu hỏi này, xem TakeTest.tsx).
export interface QuizStudentQuestion {
    questionId: number;
    lessonId: number;
    content: string;
    choices: QuizStudentChoice[];
}

// Khớp StudentLessonResponse.java (task "Backend: Student xem lai noi dung bai hoc", 2026-09-01).
export interface QuizStudentLesson {
    id: number;
    name: string;
    summary?: string;
    content?: string;
    textbookPage?: number;
    hasImage: boolean;
}

// Khớp SubmitAttemptResponse.java.
export interface QuizSubmitResult {
    attemptId: number;
    correctCount: number;
    totalQuestions: number;
    scorePercent: number;
}

// Bloc trang "Làm bài" (khu vực Học sinh, /app/student/tests/:testId/take - Task 6 backend, luồng
// bắt đầu/lưu đáp án/nộp bài).
//
// ĐÃ ĐỔI 2026-09-01 (xem claude/ui-base-status.md "Quy ước state mới"): trước đây cố ý dùng
// useState cục bộ ở TakeTest.tsx (attemptId/questions/answers) với lý do "luồng tuyến tính theo 1
// component, không cần re-render từ nhiều nơi khác nhau" - nhưng để THỐNG NHẤT 1 cách quản lý
// state duy nhất trong toàn app (không còn ngoại lệ), toàn bộ dời vào đây qua setStream, cùng
// pattern mọi Bloc khác.
export class BlocStudentAttempt extends IBlocUI {
    startAttempt(testId: number, onError: (error: any) => void) {
        this.setStream('questions', null)
        this.setStream('result', null)
        this.setStream('answers', {})
        this.start(testId, (attemptId, questions) => {
            this.setStream('attemptId', attemptId)
            this.setStream('questions', questions)
        }, onError)
    }

    start(testId: number, onComplete: (attemptId: number, questions: QuizStudentQuestion[]) => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentAttemptApi.start(testId), (res) => {
            onComplete(res.data.attemptId, res.data.questions as QuizStudentQuestion[])
        }, { onError })
    }

    chooseAnswer(questionId: number, choiceId: number, onError: (error: any) => void) {
        const attemptId = this.getField('attemptId')
        const answers = { ...(this.getField('answers') ?? {}), [questionId]: choiceId }
        this.setStream('answers', answers)
        if (attemptId != null) this.saveAnswer(attemptId, questionId, choiceId, onError)
    }

    doSubmit(onError: (error: any) => void) {
        const attemptId = this.getField('attemptId')
        if (attemptId == null) return
        const questions: QuizStudentQuestion[] = this.getField('questions') ?? []
        const answers = this.getField('answers') ?? {}
        const answeredCount = Object.keys(answers).length
        this.confirm({
            title: 'quiz-submit-test',
            message: answeredCount < questions.length ? 'quiz-submit-test-confirm-incomplete' : 'quiz-submit-test-confirm',
            onYes: () => {
                this.setStream('submitting', true)
                this.submit(attemptId, (res) => {
                    this.setStream('submitting', false)
                    this.setStream('result', res)
                }, (error: any) => { this.setStream('submitting', false); onError(error) })
            }
        })
    }

    // "Xem lại bài học" Dialog - dùng chung 1 bộ stream cho cả lúc làm bài lẫn sau khi nộp (xem
    // comment ở TakeTest.tsx). lessonImageUrl là 1 object URL tải riêng, phải revoke khi đóng/đổi -
    // giống hệt pattern BlocParentSubjects.ts's lessonImagePreviewUrl phía Phụ huynh.
    openLessonDialog(lessonId: number, onError: (error: any) => void) {
        this.setStream('lesson_dialog_view', { isShow: true })
        this.setStream('lessonLoading', true)
        this.setStream('lessonData', null)
        this.loadLesson(lessonId, (lesson) => {
            this.setStream('lessonLoading', false)
            this.setStream('lessonData', lesson)
            if (lesson.hasImage) {
                this.loadLessonImage(lessonId, (blob) => {
                    const old = this.getField('lessonImageUrl')
                    if (old) URL.revokeObjectURL(old)
                    this.setStream('lessonImageUrl', URL.createObjectURL(blob))
                }, () => {})
            }
        }, (error) => {
            this.setStream('lessonLoading', false)
            this.setStream('lesson_dialog_view', { isShow: false })
            onError(error)
        })
    }

    closeLessonDialog() {
        this.setStream('lesson_dialog_view', { isShow: false })
        this.setStream('lessonData', null)
        const old = this.getField('lessonImageUrl')
        if (old) URL.revokeObjectURL(old)
        this.setStream('lessonImageUrl', null)
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

    // "Xem lại bài học" (task 2026-09-01) - gọi khi học sinh bấm mở panel nội dung 1 câu hỏi, cả
    // lúc đang làm bài lẫn sau khi đã nộp (cùng 1 màn hình TakeTest.tsx, xem file đó). Không cache
    // gì ở Bloc - TakeTest.tsx tự giữ state theo questionId đang mở, load lại mỗi lần mở khác câu.
    loadLesson(lessonId: number, onComplete: (lesson: QuizStudentLesson) => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentLessonApi.get(lessonId), (res) => {
            onComplete(res.data as QuizStudentLesson)
        }, { onError })
    }

    // responseType:'blob' -> CallApi.ts's nhánh blob trả {data,disposition} - xem
    // BlocParentSubjects.loadLessonImage cho pattern gốc (phía Phụ huynh).
    loadLessonImage(lessonId: number, onData: (blob: Blob) => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentLessonApi.getImage(lessonId), (res: any) => {
            onData(res.data as Blob)
        }, { onError })
    }
}
