import { IBlocUI } from "../../base/IBlocUI";
import { QuizSubjectApi, QuizSubjectRequest } from "../../api/QuizSubjectApi";
import { QuizLessonApi, QuizLessonCreateRequest, QuizLessonUpdateRequest, quizUploadLessonImage, quizImportLessons } from "../../api/QuizLessonApi";
import { QuizClassroomApi } from "../../api/QuizClassroomApi";

// Khớp SubjectResponse.java / LessonResponse.java. classroomId thay cho parentId cũ - Subject giờ
// là con của Classroom (không còn gán trực tiếp vào Parent nữa), xem ClassroomApi.ts.
export interface QuizSubject {
    id: number;
    classroomId: number;
    name: string;
}

// Khớp LessonResponse.java (2026-09-01) - hasImage suy ra từ imagePath có/không ở backend, KHÔNG
// tự trả về đường dẫn file thật (ảnh lấy riêng qua QuizLessonApi.getImage, xem Subjects.tsx).
export interface QuizLesson {
    id: number;
    subjectId: number;
    name: string;
    summary?: string;
    content?: string;
    textbookPage?: number;
    hasImage: boolean;
}

// Chỉ lấy 2 field cần cho dropdown/hiển thị tên - tránh phụ thuộc kiểu QuizClassroom của bloc
// khác (mỗi Bloc "content" tự khai báo shape dữ liệu nó cần, xem BlocParentTests.ts/QuizStudentLite).
export interface QuizClassroomLite {
    id: number;
    name: string;
}

// Khớp ImportRowError.java / LessonImportResponse.java (2026-09-01) - cùng shape hệt
// BlocParentQuestions.QuizImportRowError/QuizImportResult, tách riêng interface (không import
// chéo Bloc khác) theo đúng convention "mỗi Bloc content tự khai báo shape riêng" của file này.
export interface QuizLessonImportRowError {
    rowNumber: number;
    reason: string;
}

export interface QuizLessonImportResult {
    totalRows: number;
    successCount: number;
    errors: QuizLessonImportRowError[];
}

// Bloc trang "Môn học/Bài học" (khu vực Phụ huynh, /app/parent/subjects - Task 3 backend). Quản lý
// CẢ 2 stream 'subjects' và 'lessons' trong cùng 1 Bloc vì trang là 1 màn hình master-detail duy
// nhất (chọn 1 Subject bên trái -> xem/sửa Lesson của nó bên phải), không tách trang riêng. Tự tải
// thêm Lớp học (cho dropdown lọc + bắt buộc chọn khi tạo/sửa Subject - Subject giờ là con của
// Classroom, xem QuizSubject.classroomId).
export class BlocParentSubjects extends IBlocUI {
    async initData() {
        this.apiRequest(QuizClassroomApi.list(), (res) => {
            this.setStream('classrooms', res.data as QuizClassroomLite[])
        })
        this.reloadSubjects()
    }

    reloadSubjects(classroomId?: number) {
        this.apiRequest(QuizSubjectApi.list(classroomId), (res) => {
            this.setStream('subjects', res.data as QuizSubject[])
        })
    }

    createSubject(request: QuizSubjectRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizSubjectApi.create(request), () => {
            onComplete()
            this.reloadSubjects()
        }, { onError })
    }

    updateSubject(id: number, request: QuizSubjectRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizSubjectApi.update(id, request), () => {
            onComplete()
            this.reloadSubjects()
        }, { onError })
    }

    // Xoá xong thì tự dọn stream 'lessons' về [] - subject đang chọn (nếu vừa bị xoá) không còn
    // Lesson nào để hiện nữa, tránh trang giữ lại danh sách Lesson của 1 Subject đã biến mất.
    removeSubject(id: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizSubjectApi.remove(id), () => {
            onComplete()
            this.reloadSubjects()
            this.setStream('lessons', [])
        }, { onError })
    }

    loadLessons(subjectId: number) {
        this.apiRequest(QuizLessonApi.list(subjectId), (res) => {
            this.setStream('lessons', res.data as QuizLesson[])
        })
    }

    createLesson(request: QuizLessonCreateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLessonApi.create(request), () => {
            onComplete()
            this.loadLessons(request.subjectId)
        }, { onError })
    }

    updateLesson(id: number, subjectId: number, request: QuizLessonUpdateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLessonApi.update(id, request), () => {
            onComplete()
            this.loadLessons(subjectId)
        }, { onError })
    }

    removeLesson(id: number, subjectId: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLessonApi.remove(id), () => {
            onComplete()
            this.loadLessons(subjectId)
        }, { onError })
    }

    // Không qua apiRequest (không phải QuizRequestBase call) vì quizUploadLessonImage gọi thẳng
    // QUIZ_API (xem comment trong QuizLessonApi.ts) - tự check res.code===100 giống hệt cách
    // BlocParentQuestions.importFile xử lý quizImportQuestions.
    async uploadLessonImage(id: number, subjectId: number, file: File, onComplete: () => void, onError: (error: any) => void) {
        try {
            const res = await quizUploadLessonImage(id, file)
            if (res.code === 100) {
                onComplete()
                this.loadLessons(subjectId)
            } else {
                onError(res)
            }
        } catch (e) {
            onError(e)
        }
    }

    removeLessonImage(id: number, subjectId: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLessonApi.removeImage(id), () => {
            onComplete()
            this.loadLessons(subjectId)
        }, { onError })
    }

    // responseType:'blob' -> CallApi.ts's nhánh blob trả {data,disposition} thay vì {code,message,data}
    // thường - xem BlocParentQuestions.downloadTemplate cho pattern gốc.
    loadLessonImage(id: number, onData: (blob: Blob) => void, onError: (error: any) => void) {
        this.apiRequest(QuizLessonApi.getImage(id), (res: any) => {
            onData(res.data as Blob)
        }, { onError })
    }

    // ================= State giao diện dời từ useState vào đây (2026-09-01) =================
    // Xem claude/ui-base-status.md "Quy ước state mới" + comment ở BlocParentStudents.ts cho lý do
    // chung. Trang này master-detail phức tạp hơn nên tách rõ 3 nhóm: chọn Subject/lọc Lớp, form
    // Subject, form Lesson (kể cả preview/upload ảnh) - mỗi nhóm 1 vài stream RIÊNG TÊN (setStream
    // dùng chung 1 Map cho mọi field của Bloc - 2 field trùng tên ở 2 chỗ khác nhau sẽ vô tình
    // dùng chung 1 Subject RxJS, đè state lên nhau - nên đặt tên field/stream KHÔNG trùng nhau
    // trong cùng 1 Bloc, kể cả khác objectKey).

    // --- Chọn Subject / lọc Lớp ---
    selectSubject(subject: QuizSubject | null) {
        this.setStream('selectedSubject', subject)
        if (subject) this.loadLessons(subject.id)
    }

    changeFilterClassroom(value: number | '') {
        this.setStream('filterClassroomId', value)
        this.reloadSubjects(value === '' ? undefined : value)
        this.selectSubject(null)
    }

    // --- Subject form ---
    openNewSubject() {
        const filterClassroomId = this.getField('filterClassroomId') ?? ''
        this.setField('subjectReq', {})
        this.setStream('subjectFormClassroomId', filterClassroomId, 'subjectReq')
        this.setStream('subjectFormName', '', 'subjectReq')
        this.setStream('subject_form_view', { isShow: true, id: 0 })
    }

    openEditSubject(subject: QuizSubject) {
        this.setField('subjectReq', {})
        this.setStream('subjectFormClassroomId', subject.classroomId, 'subjectReq')
        this.setStream('subjectFormName', subject.name, 'subjectReq')
        this.setStream('subject_form_view', { isShow: true, id: subject.id })
    }

    closeSubjectForm() {
        this.setStream('subject_form_view', { isShow: false, id: 0 })
        this.setStream('submitting', false)
    }

    saveSubject(onComplete: () => void, onError: (error: any) => void) {
        const view = this.getField('subject_form_view') ?? {}
        const req = this.getField('subjectReq') ?? {}
        const classroomId = req.subjectFormClassroomId
        if (!req.subjectFormName || classroomId === '' || classroomId == null) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        const done = () => { this.setStream('submitting', false); onComplete() }
        const fail = (error: any) => { this.setStream('submitting', false); onError(error) }
        const request = { name: req.subjectFormName, classroomId }
        if ((view.id ?? 0) > 0) {
            this.updateSubject(view.id, request, done, fail)
        } else {
            this.createSubject(request, done, fail)
        }
    }

    askRemoveSubjectCleanup(removedId: number) {
        if (this.getField('selectedSubject')?.id === removedId) this.selectSubject(null)
    }

    // --- Lesson form (kể cả ảnh minh hoạ) ---
    openNewLesson() {
        this.setField('lessonReq', {})
        this.setStream('lessonHasImage', false)
        this.setStream('lessonImagePreviewUrl', null)
        this.setStream('lessonImageLoading', false)
        this.setStream('lessonImageUploading', false)
        this.setStream('lesson_form_view', { isShow: true, id: 0 })
    }

    openEditLesson(lesson: QuizLesson) {
        this.setField('lessonReq', {})
        this.setStream('lessonName', lesson.name, 'lessonReq')
        this.setStream('lessonSummary', lesson.summary ?? '', 'lessonReq')
        this.setStream('lessonContent', lesson.content ?? '', 'lessonReq')
        this.setStream('lessonTextbookPage', lesson.textbookPage ?? '', 'lessonReq')
        this.setStream('lessonHasImage', lesson.hasImage)
        this.setStream('lessonImagePreviewUrl', null)
        this.setStream('lessonImageLoading', false)
        this.setStream('lessonImageUploading', false)
        this.setStream('lesson_form_view', { isShow: true, id: lesson.id })
        if (lesson.hasImage) this.loadLessonImagePreview(lesson.id)
    }

    closeLessonForm() {
        this.setStream('lesson_form_view', { isShow: false, id: 0 })
        this.setStream('submitting', false)
        this.revokeLessonImagePreview()
    }

    private revokeLessonImagePreview() {
        const old = this.getField('lessonImagePreviewUrl')
        if (old) URL.revokeObjectURL(old)
        this.setStream('lessonImagePreviewUrl', null)
    }

    loadLessonImagePreview(id: number) {
        this.setStream('lessonImageLoading', true)
        this.loadLessonImage(id, (blob) => {
            this.setStream('lessonImageLoading', false)
            const old = this.getField('lessonImagePreviewUrl')
            if (old) URL.revokeObjectURL(old)
            this.setStream('lessonImagePreviewUrl', URL.createObjectURL(blob))
        }, () => { this.setStream('lessonImageLoading', false) })
    }

    saveLesson(subjectId: number, onComplete: () => void, onError: (error: any) => void) {
        const view = this.getField('lesson_form_view') ?? {}
        const req = this.getField('lessonReq') ?? {}
        if (!req.lessonName) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        const done = () => { this.setStream('submitting', false); onComplete() }
        const fail = (error: any) => { this.setStream('submitting', false); onError(error) }
        const request = {
            name: req.lessonName,
            summary: req.lessonSummary || undefined,
            content: req.lessonContent || undefined,
            textbookPage: (req.lessonTextbookPage === '' || req.lessonTextbookPage == null) ? undefined : req.lessonTextbookPage
        }
        if ((view.id ?? 0) > 0) {
            this.updateLesson(view.id, subjectId, request, done, fail)
        } else {
            this.createLesson({ subjectId, ...request }, done, fail)
        }
    }

    uploadImageForCurrentLesson(subjectId: number, file: File, onError: (error: any) => void) {
        const view = this.getField('lesson_form_view') ?? {}
        if ((view.id ?? 0) <= 0) return
        this.setStream('lessonImageUploading', true)
        this.uploadLessonImage(view.id, subjectId, file, () => {
            this.setStream('lessonImageUploading', false)
            this.setStream('lessonHasImage', true)
            this.loadLessonImagePreview(view.id)
        }, (error) => { this.setStream('lessonImageUploading', false); onError(error) })
    }

    removeImageForCurrentLesson(subjectId: number, onError: (error: any) => void) {
        const view = this.getField('lesson_form_view') ?? {}
        if ((view.id ?? 0) <= 0) return
        this.removeLessonImage(view.id, subjectId, () => {
            this.setStream('lessonHasImage', false)
            this.revokeLessonImagePreview()
        }, onError)
    }

    // --- Dialog "Nhập bài học từ file" (2026-09-01, "phần bài học cho phép import bằng file") ---
    // Cùng shape hệt Dialog "Nhập từ file" của BlocParentQuestions.ts (openImport/closeImport/
    // runImport/downloadTemplate/importFile) - xem comment ở đó cho lý do responseType:'blob' và
    // vì sao quizImportLessons đi thẳng QUIZ_API thay vì qua apiRequest.
    openLessonImport() {
        this.setStream('lessonImportResult', null)
        this.setStream('lesson_import_view', { isShow: true })
    }

    closeLessonImport() {
        this.setStream('lesson_import_view', { isShow: false })
        this.setStream('lessonImporting', false)
        this.setStream('lessonImportResult', null)
    }

    downloadLessonImportTemplate(format: 'xlsx' | 'csv', onError: (error: any) => void) {
        this.apiRequest(QuizLessonApi.downloadImportTemplate(format), (res: any) => {
            const blob: Blob = res.data
            const disposition: string | undefined = res.disposition
            const match = disposition?.match(/filename="?([^"]+)"?/)
            const filename = match?.[1] ?? `lesson-import-template.${format}`
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        }, { onError })
    }

    async importLessonsFile(subjectId: number, file: File, onComplete: (result: QuizLessonImportResult) => void, onError: (error: any) => void) {
        try {
            const res = await quizImportLessons(subjectId, file)
            if (res.code === 100) {
                onComplete(res.data as QuizLessonImportResult)
                this.loadLessons(subjectId)
            } else {
                onError(res)
            }
        } catch (e) {
            onError(e)
        }
    }

    runLessonImport(subjectId: number, file: File, onError: (error: any) => void) {
        this.setStream('lessonImporting', true)
        this.importLessonsFile(subjectId, file, (result) => {
            this.setStream('lessonImporting', false)
            this.setStream('lessonImportResult', result)
        }, (error) => { this.setStream('lessonImporting', false); onError(error) })
    }
}
