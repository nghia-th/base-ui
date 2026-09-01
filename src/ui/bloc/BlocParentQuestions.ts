import { IBlocUI } from "../../base/IBlocUI";
import { QuizQuestionApi, QuizQuestionRequest, quizImportQuestions } from "../../api/QuizQuestionApi";
import { QuizSubjectApi } from "../../api/QuizSubjectApi";
import { QuizLessonApi } from "../../api/QuizLessonApi";
import { QuizClassroomApi } from "../../api/QuizClassroomApi";

// Chỉ lấy 2 field cần cho dropdown - cùng convention "mỗi Bloc content tự khai báo shape riêng"
// với BlocParentSubjects.QuizClassroomLite/BlocParentTests.QuizClassroomLite (không dùng chung 1
// type import từ Bloc khác).
export interface QuizClassroomLite {
    id: number;
    name: string;
}

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

// Bloc trang "Ngân hàng câu hỏi" (khu vực Phụ huynh, /app/parent/questions - Task 4 backend, mở
// rộng 2026-09-01 thêm bước lọc Lớp học đứng trước Môn học). Tự tải luôn danh sách Classroom/
// Subject/Lesson (không dùng lại BlocParentSubjects/BlocParentTests của trang khác - mỗi Bloc
// "content" sống theo trang riêng, xem AppContext.ts's reUseBlocContent) để phục vụ 3 dropdown lọc
// theo Lớp -> Môn học -> Bài học trước khi hiện Question - cùng shape 3 tầng BlocParentTests.ts đã
// dùng cho form tạo Đề kiểm tra (Classroom -> Subject -> Lesson), chỉ khác là ở đây dùng để LỌC
// hiển thị chứ không phải để tạo mới.
export class BlocParentQuestions extends IBlocUI {
    async initData() {
        this.apiRequest(QuizClassroomApi.list(), (res) => {
            this.setStream('classrooms', res.data as QuizClassroomLite[])
        })
        this.apiRequest(QuizSubjectApi.list(), (res) => {
            this.setStream('subjects', res.data)
        })
    }

    // classroomId undefined = mọi lớp (giữ đúng hành vi cũ trước khi có bước lọc Lớp học) - xem
    // QuizSubjectApi.list's javadoc.
    loadSubjects(classroomId?: number) {
        this.apiRequest(QuizSubjectApi.list(classroomId), (res) => {
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
