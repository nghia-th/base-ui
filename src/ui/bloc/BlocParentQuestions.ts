import { IBlocUI } from "../../base/IBlocUI";
import { QuizQuestionApi, QuizQuestionRequest, quizImportQuestions, quizUploadQuestionAudio, quizUploadQuestionVideo } from "../../api/QuizQuestionApi";
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

// hasAudio/hideContentInTest khớp QuestionResponse.java (2026-09-01, tính năng "Câu hỏi dạng âm
// thanh") - hasAudio suy ra từ audioPath có/không ở backend, giống hệt QuizLesson.hasImage (ảnh lấy
// riêng qua QuizQuestionApi.getAudio, xem Questions.tsx).
export interface QuizQuestion {
    id: number;
    lessonId: number;
    content: string;
    knowledgeTag?: string;
    choices: QuizChoice[];
    hasAudio: boolean;
    hasVideo: boolean;
    hideContentInTest: boolean;
    // Khớp QuestionResponse.java's questionType (2026-09-01, "Câu hỏi dạng tự luận/thu âm") -
    // "MULTIPLE_CHOICE" (câu trắc nghiệm như cũ, choices luôn có) hoặc "SPEAKING" (học sinh trả
    // lời bằng ghi âm, choices luôn rỗng).
    questionType: 'MULTIPLE_CHOICE' | 'SPEAKING';
    // Cách Học sinh được trả lời câu SPEAKING (thêm 2026-09-01) - chỉ có ý nghĩa khi questionType
    // là SPEAKING. Backend luôn trả về (mặc định AUDIO nếu chưa từng đặt).
    answerMode?: 'AUDIO' | 'TEXT' | 'BOTH';
    // Đáp án tham khảo Phụ huynh tự go (thêm 2026-09-01, không bắt buộc) - null/undefined nếu chưa nhập.
    referenceAnswer?: string;
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

    // ================= State giao diện dời từ useState vào đây (2026-09-01) =================
    // Xem claude/ui-base-status.md "Quy ước state mới" + BlocParentStudents.ts's comment cho lý do
    // chung. 3 dropdown lọc tầng Lớp->Môn->Bài dùng tên KHÔNG trùng với field nào khác trong Bloc
    // này (setStream chia sẻ 1 Map theo tên, xem BlocParentSubjects.ts's comment).

    // --- Lọc Lớp -> Môn -> Bài (cascade, đổi tầng cha thì xoá tầng con) ---
    changeFilterClassroom(value: number | '') {
        this.setStream('filterClassroomId', value)
        this.setStream('filterSubjectId', '')
        this.setStream('filterLessonId', '')
        this.loadSubjects(value === '' ? undefined : value)
    }

    changeFilterSubject(value: number) {
        this.setStream('filterSubjectId', value)
        this.setStream('filterLessonId', '')
        this.loadLessons(value)
    }

    changeFilterLesson(value: number) {
        this.setStream('filterLessonId', value)
        this.loadQuestions(value)
    }

    // --- Question form (nội dung câu hỏi + knowledgeTag uncontrolled qua objectKey 'req';
    // choices là mảng ĐỘNG - giữ nguyên reference trong field 'choicesReq', chỉ setStream lúc CẤU
    // TRÚC đổi (thêm/bớt dòng, đổi đáp án đúng) để re-render đúng lúc cần; gõ nội dung 1 lựa chọn
    // chỉ mutate trực tiếp phần tử mảng, KHÔNG setStream, nên không re-render trang - đọc lại đúng
    // giá trị mới nhất lúc Lưu qua getField). ---
    openNewQuestion() {
        this.setField('req', { content: '', knowledgeTag: '', referenceAnswer: '' })
        const choices = [{ content: '', correct: false }, { content: '', correct: false }]
        this.setField('choicesReq', choices)
        this.setStream('choicesMeta', choices)
        this.setStream('hideContentInTest', false)
        this.setStream('questionType', 'MULTIPLE_CHOICE')
        this.setStream('answerMode', 'AUDIO')
        this.setStream('questionHasAudio', false)
        this.setStream('questionAudioPreviewUrl', null)
        this.setStream('questionAudioLoading', false)
        this.setStream('questionAudioUploading', false)
        this.setStream('questionHasVideo', false)
        this.setStream('questionVideoPreviewUrl', null)
        this.setStream('questionVideoLoading', false)
        this.setStream('questionVideoUploading', false)
        this.setStream('question_form_view', { isShow: true, id: 0 })
    }

    openEditQuestion(q: QuizQuestion) {
        this.setField('req', { content: q.content, knowledgeTag: q.knowledgeTag ?? '', referenceAnswer: q.referenceAnswer ?? '' })
        const choices = q.choices.map((c) => ({ content: c.content, correct: c.correct }))
        this.setField('choicesReq', choices)
        this.setStream('choicesMeta', choices)
        this.setStream('hideContentInTest', q.hideContentInTest)
        this.setStream('questionType', q.questionType ?? 'MULTIPLE_CHOICE')
        this.setStream('answerMode', q.answerMode ?? 'AUDIO')
        this.setStream('questionHasAudio', q.hasAudio)
        this.setStream('questionAudioPreviewUrl', null)
        this.setStream('questionAudioLoading', false)
        this.setStream('questionAudioUploading', false)
        this.setStream('questionHasVideo', q.hasVideo)
        this.setStream('questionVideoPreviewUrl', null)
        this.setStream('questionVideoLoading', false)
        this.setStream('questionVideoUploading', false)
        this.setStream('question_form_view', { isShow: true, id: q.id })
        if (q.hasAudio) this.loadQuestionAudioPreview(q.id)
        if (q.hasVideo) this.loadQuestionVideoPreview(q.id)
    }

    // Đổi "Loại trả lời" (thu âm/tự luận/cả 2) trong Dialog câu SPEAKING (thêm 2026-09-01, theo
    // góp ý anh sau khi test bản v1 chỉ ghi âm) - chỉ đơn giản đổi stream, không cần dọn dẹp gì
    // thêm (khác changeQuestionType phải tự điền lại choices trống).
    changeAnswerMode(mode: 'AUDIO' | 'TEXT' | 'BOTH') {
        this.setStream('answerMode', mode)
    }

    // Đổi loại câu hỏi trong Dialog (2026-09-01) - chuyển sang MULTIPLE_CHOICE mà đang có < 2 lựa
    // chọn (ví dụ vừa mới ở SPEAKING ra, hoặc câu cũ trước đây chưa từng có choices) thì tự điền
    // lại 2 dòng trống, để Lưu không báo lỗi thiếu lựa chọn ngay lập tức.
    changeQuestionType(type: 'MULTIPLE_CHOICE' | 'SPEAKING') {
        this.setStream('questionType', type)
        if (type === 'MULTIPLE_CHOICE') {
            const choices: any[] = this.getField('choicesReq') ?? []
            if (choices.length < 2) {
                const filled = [...choices]
                while (filled.length < 2) filled.push({ content: '', correct: false })
                this.setField('choicesReq', filled)
                this.setStream('choicesMeta', filled)
            }
        }
    }

    closeQuestionForm() {
        this.setStream('question_form_view', { isShow: false, id: 0 })
        this.setStream('submitting', false)
        this.revokeQuestionAudioPreview()
        this.revokeQuestionVideoPreview()
    }

    private revokeQuestionAudioPreview() {
        const old = this.getField('questionAudioPreviewUrl')
        if (old) URL.revokeObjectURL(old)
        this.setStream('questionAudioPreviewUrl', null)
    }

    private revokeQuestionVideoPreview() {
        const old = this.getField('questionVideoPreviewUrl')
        if (old) URL.revokeObjectURL(old)
        this.setStream('questionVideoPreviewUrl', null)
    }

    // responseType:'blob' -> CallApi.ts's nhánh blob trả {data,disposition} - xem
    // BlocParentSubjects.loadLessonImage cho pattern gốc.
    loadQuestionAudio(id: number, onData: (blob: Blob) => void, onError: (error: any) => void) {
        this.apiRequest(QuizQuestionApi.getAudio(id), (res: any) => {
            onData(res.data as Blob)
        }, { onError })
    }

    loadQuestionAudioPreview(id: number) {
        this.setStream('questionAudioLoading', true)
        this.loadQuestionAudio(id, (blob) => {
            this.setStream('questionAudioLoading', false)
            const old = this.getField('questionAudioPreviewUrl')
            if (old) URL.revokeObjectURL(old)
            this.setStream('questionAudioPreviewUrl', URL.createObjectURL(blob))
        }, () => { this.setStream('questionAudioLoading', false) })
    }

    // Không qua apiRequest (không phải QuizRequestBase call) vì quizUploadQuestionAudio gọi thẳng
    // QUIZ_API - tự check res.code===100 giống hệt BlocParentSubjects.uploadLessonImage.
    async uploadQuestionAudio(id: number, file: File, onComplete: () => void, onError: (error: any) => void) {
        try {
            const res = await quizUploadQuestionAudio(id, file)
            if (res.code === 100) {
                onComplete()
            } else {
                onError(res)
            }
        } catch (e) {
            onError(e)
        }
    }

    // Sau khi upload/xoá audio, tự loadQuestions(filterLessonId) lại - đọc filterLessonId từ chính
    // stream lọc của Bloc này (không cần Questions.tsx truyền vào), để Accordion danh sách ngoài
    // Dialog cập nhật đúng hasAudio mới nhất mà không phải đóng/mở lại Dialog - giống hệt
    // BlocParentSubjects.uploadLessonImage tự loadLessons(subjectId) lại.
    uploadAudioForCurrentQuestion(file: File, onError: (error: any) => void) {
        const view = this.getField('question_form_view') ?? {}
        if ((view.id ?? 0) <= 0) return
        this.setStream('questionAudioUploading', true)
        this.uploadQuestionAudio(view.id, file, () => {
            this.setStream('questionAudioUploading', false)
            this.setStream('questionHasAudio', true)
            this.loadQuestionAudioPreview(view.id)
            const lessonId = this.getField('filterLessonId')
            if (lessonId) this.loadQuestions(lessonId)
        }, (error) => { this.setStream('questionAudioUploading', false); onError(error) })
    }

    removeAudioForCurrentQuestion(onError: (error: any) => void) {
        const view = this.getField('question_form_view') ?? {}
        if ((view.id ?? 0) <= 0) return
        this.apiRequest(QuizQuestionApi.removeAudio(view.id), () => {
            this.setStream('questionHasAudio', false)
            this.revokeQuestionAudioPreview()
            const lessonId = this.getField('filterLessonId')
            if (lessonId) this.loadQuestions(lessonId)
        }, { onError })
    }

    // ================= Video câu hỏi (2026-09-04, phần 3/4) - y hệt khối audio ở trên =================

    loadQuestionVideo(id: number, onData: (blob: Blob) => void, onError: (error: any) => void) {
        this.apiRequest(QuizQuestionApi.getVideo(id), (res: any) => {
            onData(res.data as Blob)
        }, { onError })
    }

    loadQuestionVideoPreview(id: number) {
        this.setStream('questionVideoLoading', true)
        this.loadQuestionVideo(id, (blob) => {
            this.setStream('questionVideoLoading', false)
            const old = this.getField('questionVideoPreviewUrl')
            if (old) URL.revokeObjectURL(old)
            this.setStream('questionVideoPreviewUrl', URL.createObjectURL(blob))
        }, () => { this.setStream('questionVideoLoading', false) })
    }

    async uploadQuestionVideo(id: number, file: File, onComplete: () => void, onError: (error: any) => void) {
        try {
            const res = await quizUploadQuestionVideo(id, file)
            if (res.code === 100) {
                onComplete()
            } else {
                onError(res)
            }
        } catch (e) {
            onError(e)
        }
    }

    uploadVideoForCurrentQuestion(file: File, onError: (error: any) => void) {
        const view = this.getField('question_form_view') ?? {}
        if ((view.id ?? 0) <= 0) return
        this.setStream('questionVideoUploading', true)
        this.uploadQuestionVideo(view.id, file, () => {
            this.setStream('questionVideoUploading', false)
            this.setStream('questionHasVideo', true)
            this.loadQuestionVideoPreview(view.id)
            const lessonId = this.getField('filterLessonId')
            if (lessonId) this.loadQuestions(lessonId)
        }, (error) => { this.setStream('questionVideoUploading', false); onError(error) })
    }

    removeVideoForCurrentQuestion(onError: (error: any) => void) {
        const view = this.getField('question_form_view') ?? {}
        if ((view.id ?? 0) <= 0) return
        this.apiRequest(QuizQuestionApi.removeVideo(view.id), () => {
            this.setStream('questionHasVideo', false)
            this.revokeQuestionVideoPreview()
            const lessonId = this.getField('filterLessonId')
            if (lessonId) this.loadQuestions(lessonId)
        }, { onError })
    }

    setChoiceContent(index: number, value: string) {
        const choices: any[] = this.getField('choicesReq') ?? []
        if (choices[index]) choices[index].content = value
    }

    setChoiceCorrect(index: number) {
        const choices: any[] = (this.getField('choicesReq') ?? []).map((c: any, i: number) => ({ ...c, correct: i === index }))
        this.setField('choicesReq', choices)
        this.setStream('choicesMeta', choices)
    }

    addChoice() {
        const choices: any[] = [...(this.getField('choicesReq') ?? []), { content: '', correct: false }]
        this.setField('choicesReq', choices)
        this.setStream('choicesMeta', choices)
    }

    removeChoice(index: number) {
        const choices: any[] = (this.getField('choicesReq') ?? []).filter((_: any, i: number) => i !== index)
        this.setField('choicesReq', choices)
        this.setStream('choicesMeta', choices)
    }

    saveQuestion(lessonId: number, onComplete: () => void, onError: (error: any) => void) {
        const view = this.getField('question_form_view') ?? {}
        const req = this.getField('req') ?? {}
        const questionType: 'MULTIPLE_CHOICE' | 'SPEAKING' = this.getField('questionType') ?? 'MULTIPLE_CHOICE'
        const choices: { content: string; correct: boolean }[] = this.getField('choicesReq') ?? []
        // SPEAKING không cần choices - chỉ bắt buộc content. MULTIPLE_CHOICE giữ nguyên validate cũ
        // (>=2 lựa chọn, không lựa chọn nào rỗng, có đúng 1 đáp án đúng).
        const isValid = questionType === 'SPEAKING'
            ? !!req.content?.trim()
            : !!req.content?.trim() && choices.length >= 2 &&
                choices.every((c) => c.content?.trim() !== '') && choices.some((c) => c.correct)
        if (!isValid) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        const done = () => { this.setStream('submitting', false); onComplete() }
        const fail = (error: any) => { this.setStream('submitting', false); onError(error) }
        const answerMode: 'AUDIO' | 'TEXT' | 'BOTH' = this.getField('answerMode') ?? 'AUDIO'
        const request: QuizQuestionRequest = {
            lessonId,
            content: req.content,
            knowledgeTag: req.knowledgeTag || undefined,
            choices: questionType === 'SPEAKING' ? [] : choices.map((c) => ({ content: c.content, correct: c.correct })),
            hideContentInTest: this.getField('hideContentInTest') ?? false,
            questionType,
            answerMode: questionType === 'SPEAKING' ? answerMode : undefined,
            referenceAnswer: questionType === 'SPEAKING' ? (req.referenceAnswer || undefined) : undefined
        }
        if ((view.id ?? 0) > 0) {
            this.update(view.id, request, done, fail)
        } else {
            this.create(request, done, fail)
        }
    }

    // --- Dialog "Nhập từ file" ---
    openImport() {
        this.setStream('importResult', null)
        this.setStream('import_view', { isShow: true })
    }

    closeImport() {
        this.setStream('import_view', { isShow: false })
        this.setStream('importing', false)
        this.setStream('importResult', null)
    }

    runImport(lessonId: number, file: File, onError: (error: any) => void) {
        this.setStream('importing', true)
        this.importFile(lessonId, file, (result) => {
            this.setStream('importing', false)
            this.setStream('importResult', result)
        }, (error) => { this.setStream('importing', false); onError(error) })
    }
}
