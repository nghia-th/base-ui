import { IBlocUI } from "../../base/IBlocUI";
import { QuizQuestionApi, QuizQuestionRequest, quizImportQuestions } from "../../api/QuizQuestionApi";
import { QuizSubjectApi } from "../../api/QuizSubjectApi";
import { QuizLessonApi } from "../../api/QuizLessonApi";

// Khớp ChoiceResponse.java / QuestionResponse.java (view Phụ huynh - CÓ field "correct", khác
// view Học sinh ở task 6 - xem BlocStudentAttempt.ts).
export interface QuizChoice {
    id: number;
    content: string;
    correct: boolean;
}

export interface QuizQuestion {
    id: number;
    lessonId: number;
    content: string;
    knowledgeTag?: string;
    choices: QuizChoice[];
}

// Khớp ImportRowError.java / QuestionImportResponse.java.
export interface QuizImportRowError {
    rowNumber: number;
    reason: string;
}

export interface QuizImportResult {
    totalRows: number;
    successCount: number;
    errors: QuizImportRowError[];
}

// Bloc trang "Ngân hàng câu hỏi" (khu vực Phụ huynh, /app/parent/questions - Task 4 backend). Tự
// tải luôn danh sách Subject/Lesson (không dùng lại BlocParentSubjects của trang khác - mỗi Bloc
// "content" sống theo trang riêng, xem AppContext.ts's reUseBlocContent) để phục vụ 2 dropdown lọc
// theo Subject -> Lesson trước khi hiện Question.
export class BlocParentQuestions extends IBlocUI {
    async initData() {
        this.apiRequest(QuizSubjectApi.list(), (res) => {
            this.setStream('subjects', res.data)
        })
    }

    loadLessons(subjectId: number) {
        this.apiRequest(QuizLessonApi.list(subjectId), (res) => {
            this.setStream('lessons', res.data)
        })
    }

    loadQuestions(lessonId: number) {
        this.apiRequest(QuizQuestionApi.list(lessonId), (res) => {
            this.setStream('questions', res.data as QuizQuestion[])
        })
    }

    create(request: QuizQuestionRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizQuestionApi.create(request), () => {
            onComplete()
            this.loadQuestions(request.lessonId)
        }, { onError })
    }

    update(id: number, request: QuizQuestionRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizQuestionApi.update(id, request), () => {
            onComplete()
            this.loadQuestions(request.lessonId)
        }, { onError })
    }

    remove(id: number, lessonId: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizQuestionApi.remove(id), () => {
            onComplete()
            this.loadQuestions(lessonId)
        }, { onError })
    }

    // res (tham số onData của apiRequest, gọi từ CallApi.ts's nhánh blob) có dạng
    // {data: Blob, disposition: string} - KHÔNG phải {code,message,...} như mọi response khác,
    // vì đây là request responseType:'blob' (xem QuizQuestionApi.downloadTemplate).
    downloadTemplate(format: 'xlsx' | 'csv', onError: (error: any) => void) {
        this.apiRequest(QuizQuestionApi.downloadTemplate(format), (res: any) => {
            const blob: Blob = res.data
            const disposition: string | undefined = res.disposition
            const match = disposition?.match(/filename="?([^"]+)"?/)
            const filename = match?.[1] ?? `question-import-template.${format}`
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        }, { onError })
    }

    // Không đi qua apiRequest/CallApi.ts (xem quizImportQuestions - lý do cần FormData riêng) nên
    // tự xử lý code===100/lỗi ở đây thay vì để CallApi.ts lo, cùng shape onComplete/onError như
    // mọi method khác trong Bloc để Questions.tsx gọi nhất quán.
    async importFile(lessonId: number, file: File, onComplete: (result: QuizImportResult) => void, onError: (error: any) => void) {
        try {
            const res = await quizImportQuestions(lessonId, file)
            if (res.code === 100) {
                onComplete(res.data as QuizImportResult)
                this.loadQuestions(lessonId)
            } else {
                onError(res)
            }
        } catch (e) {
            onError(e)
        }
    }
}
