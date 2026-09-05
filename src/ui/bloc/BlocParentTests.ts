import { IBlocUI } from "../../base/IBlocUI";
import { QuizTestApi, QuizTestCreateRequest, QuizTestCreateFromLessonsRequest, QuizPracticeGenerateRequest, quizImportPracticeTests } from "../../api/QuizTestApi";
import { QuizStudentApi } from "../../api/QuizStudentApi";
import { QuizSubjectApi } from "../../api/QuizSubjectApi";
import { QuizLessonApi } from "../../api/QuizLessonApi";
import { QuizQuestionApi } from "../../api/QuizQuestionApi";
import { QuizClassroomApi } from "../../api/QuizClassroomApi";

// Khớp TestResponse.java (view danh sách - KHÔNG có questions, xem QuizTestDetail cho chi tiết).
export interface QuizTest {
    id: number;
    parentId: number;
    studentId: number;
    name: string;
    status: string;
    testType: string;
}

// Chỉ lấy 3 field cần cho dropdown/hiển thị tên - tránh phụ thuộc kiểu QuizStudent của bloc khác
// (mỗi Bloc "content" tự khai báo shape dữ liệu nó cần, xem BlocParentStudents.ts/BlocParentQuestions.ts).
// classroomId GIỮ LẠI (không phải để lọc dropdown Học sinh nữa - đã bỏ bước "Chọn Lớp" theo góp ý
// anh 2026-09-01: "chỉ cần chọn học sinh, không cần chọn lớp vì học sinh đã gán với lớp") mà để tự
// suy ra đúng Lớp của Học sinh VỪA CHỌN, dùng gọi thẳng loadSubjects(classroomId) - xem
// Tests.tsx's onFormStudentChange.
export interface QuizStudentLite {
    id: number;
    fullName: string;
    classroomId: number;
}

// Chỉ lấy 2 field cần cho dropdown Lớp học ở Dialog "Nhập đề ôn tập từ file" (2026-09-05) - Lớp
// được chọn TRƯỚC Môn học ở dialog đó (khác Dialog "Tạo đề ôn tập" chọn Học sinh trước rồi tự suy
// ra Lớp, xem QuizStudentLite ở trên) vì import không có 1 Học sinh cố định để suy ra Lớp từ đó -
// một file có thể nhắm tới nhiều Học sinh khác nhau, miễn cùng 1 Môn học (xem "mỗi lần import một
// đề ôn theo môn" - anh xác nhận).
export interface QuizClassroomLite {
    id: number;
    name: string;
}

// Khớp ImportRowError.java / PracticeImportResponse.java (2026-09-04) - cùng shape hệt
// BlocParentSubjects.QuizLessonImportRowError/QuizLessonImportResult, tách riêng interface theo
// đúng convention "mỗi Bloc content tự khai báo shape nó cần" của file này.
export interface QuizPracticeImportRowError {
    rowNumber: number;
    reason: string;
}

export interface QuizPracticeImportResult {
    totalRows: number;
    successCount: number;
    errors: QuizPracticeImportRowError[];
}

// Bloc trang "Đề kiểm tra" (khu vực Phụ huynh, /app/parent/tests - Task 5 backend). Tự tải Học
// sinh + danh sách Test hiện có. KHÔNG tải sẵn Môn học nữa - chọn Học sinh xong là biết ngay
// classroomId của học sinh đó (đã có sẵn trong QuizStudentLite, không cần Phụ huynh tự chọn Lớp
// riêng - bỏ bước "Chọn Lớp" ở đợt 2026-09-01, xem Tests.tsx), Môn học được tải theo yêu cầu qua
// loadSubjects(classroomId) ngay khi chọn Học sinh, giống hệt pattern
// loadLessons(subjectId)/loadQuestions(lessonId) bên dưới.
export class BlocParentTests extends IBlocUI {
    async initData() {
        this.apiRequest(QuizStudentApi.list(), (res) => {
            this.setStream('students', res.data as QuizStudentLite[])
        })
        this.reloadTests()
    }

    reloadTests(studentId?: number) {
        this.apiRequest(QuizTestApi.list(studentId), (res) => {
            this.setStream('tests', res.data as QuizTest[])
        })
    }

    loadSubjects(classroomId: number) {
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
            this.setStream('questions', res.data)
        })
    }

    create(request: QuizTestCreateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizTestApi.create(request), () => {
            onComplete()
            this.reloadTests()
        }, { onError })
    }

    // Chế độ tạo đề theo Bài học (2026-09-05, mục 3/11) - song song với create() ở trên.
    createFromLessons(request: QuizTestCreateFromLessonsRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizTestApi.createFromLessons(request), () => {
            onComplete()
            this.reloadTests()
        }, { onError })
    }

    // "Ôn tập kiến thức" (2026-09-01) - gọi lại nhiều lần vẫn OK, mỗi lần tạo 1 Test PRACTICE mới
    // với bộ câu hỏi random khác (xem QuizTestApi.generatePractice's comment).
    generatePractice(request: QuizPracticeGenerateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizTestApi.generatePractice(request), () => {
            onComplete()
            this.reloadTests()
        }, { onError })
    }

    remove(id: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizTestApi.remove(id), () => {
            onComplete()
            this.reloadTests()
        }, { onError })
    }

    loadDetail(id: number, onComplete: (detail: any) => void, onError: (error: any) => void) {
        this.apiRequest(QuizTestApi.get(id), (res) => {
            onComplete(res.data)
        }, { onError })
    }

    // ================= State giao diện dời từ useState vào đây (2026-09-01) =================
    // Xem claude/ui-base-status.md "Quy ước state mới" + BlocParentStudents.ts's comment cho lý do
    // chung. 2 Dialog (Tạo đề thường / Tạo đề ôn tập) vẫn dùng CHUNG stream 'subjects'/'lessons'/
    // 'questions' như trước (chỉ 1 Dialog mở tại 1 thời điểm nên không xung đột) - chỉ đổi cách
    // lưu field riêng của TỪNG Dialog.

    changeFilterStudent(value: number | '') {
        this.setStream('filterStudentId', value)
        this.reloadTests(value === '' ? undefined : value)
    }

    viewDetail(id: number, onError: (error: any) => void) {
        this.loadDetail(id, (d) => this.setStream('detail_view', d), onError)
    }

    closeDetail() {
        this.setStream('detail_view', null)
    }

    // --- Dialog "Tạo đề kiểm tra" ---
    // 'formMode' (2026-09-05, mục 3/11) - 'question' (mặc định, hành vi cũ: chọn 1 Bài rồi tick
    // từng Câu hỏi) hoặc 'lesson' (MỚI, song song - AskUserQuestion "them lua chon song song":
    // tick nhiều Bài học cùng lúc, server tự lấy TẤT CẢ câu hỏi trong các bài đó rồi xáo trộn).
    openCreate() {
        this.setStream('formMode', 'question')
        this.setStream('formStudentId', '')
        this.setStream('formSubjectId', '')
        this.setStream('formLessonId', '')
        this.setStream('formQuestionIds', [])
        this.setStream('formLessonIds', [])
        this.setStream('formLessonQuestions', [])
        this.setStream('formLessonSelectedQuestionIds', [])
        this.setField('createReq', { name: '' })
        this.setStream('create_view', { isShow: true })
    }

    changeFormMode(mode: 'question' | 'lesson') {
        this.setStream('formMode', mode)
        this.setStream('formLessonId', '')
        this.setStream('formQuestionIds', [])
        this.setStream('formLessonIds', [])
        this.setStream('formLessonQuestions', [])
        this.setStream('formLessonSelectedQuestionIds', [])
    }

    closeCreate() {
        this.setStream('create_view', { isShow: false })
        this.setStream('submitting', false)
    }

    // Chọn Học sinh là bước đầu tiên - tự suy ra classroomId của học sinh đó (đã có sẵn trong
    // QuizStudentLite - xem comment ở đầu file) để tải đúng Môn học của lớp đó ngay, không cần
    // chọn Lớp riêng (bỏ 2026-09-01). Đổi Học sinh reset hết tầng con (Môn/Bài/Câu hỏi cũ không
    // còn hợp lệ).
    changeFormStudent(value: number | '') {
        this.setStream('formStudentId', value)
        this.setStream('formSubjectId', '')
        this.setStream('formLessonId', '')
        this.setStream('formQuestionIds', [])
        this.setStream('formLessonIds', [])
        this.setStream('formLessonQuestions', [])
        this.setStream('formLessonSelectedQuestionIds', [])
        const students: QuizStudentLite[] = this.getField('students') ?? []
        const classroomId = value === '' ? undefined : students.find((s) => s.id === value)?.classroomId
        if (classroomId != null) this.loadSubjects(classroomId)
    }

    changeFormSubject(value: number) {
        this.setStream('formSubjectId', value)
        this.setStream('formLessonId', '')
        this.setStream('formQuestionIds', [])
        this.setStream('formLessonIds', [])
        this.setStream('formLessonQuestions', [])
        this.setStream('formLessonSelectedQuestionIds', [])
        this.loadLessons(value)
    }

    // Chế độ 'lesson' (2026-09-05, mục 3/11) - tick/bỏ tick nhiều Bài học cùng lúc, cùng shape
    // toggle hệt toggleFormQuestion bên dưới.
    //
    // 2026-09-06 revision: tick/bỏ tick 1 Bài giờ còn phải cập nhật 'formLessonQuestions' (pool
    // câu hỏi gộp của MỌI Bài đang được tick, mỗi câu tự gắn thêm lessonId/lessonName để hiện
    // nhóm theo Bài ở Tests.tsx) - theo đúng quyết định anh chọn "giữ nguyên câu đã tick, chỉ
    // thêm/bớt theo Bài thay đổi": bỏ tick 1 Bài thì CHỈ loại câu hỏi của bài đó khỏi pool (và bỏ
    // luôn khỏi 'formLessonSelectedQuestionIds' nếu đang được tick - không còn hợp lệ), câu hỏi
    // của các Bài khác đã tick trước đó giữ nguyên; tick thêm 1 Bài mới thì tải câu hỏi của bài đó
    // rồi GỘP vào pool hiện có, KHÔNG tự tick sẵn (Phụ huynh tự chọn tiếp, xem selectAllFormLessonQuestions
    // cho lối tắt "chọn hết" nếu muốn).
    toggleFormLessonId(id: number) {
        const ids: number[] = this.getField('formLessonIds') ?? []
        const wasSelected = ids.includes(id)
        const next = wasSelected ? ids.filter((x) => x !== id) : [...ids, id]
        this.setStream('formLessonIds', next)

        if (wasSelected) {
            const pool: any[] = this.getField('formLessonQuestions') ?? []
            const nextPool = pool.filter((q) => q.lessonId !== id)
            this.setStream('formLessonQuestions', nextPool)
            const selected: number[] = this.getField('formLessonSelectedQuestionIds') ?? []
            this.setStream('formLessonSelectedQuestionIds', selected.filter((qid) => nextPool.some((q) => q.id === qid)))
        } else {
            this.apiRequest(QuizQuestionApi.list(id), (res) => {
                const lessons: any[] = this.getField('lessons') ?? []
                const lessonName = lessons.find((l) => l.id === id)?.name ?? ''
                const newQuestions = (res.data ?? []).map((q: any) => ({ ...q, lessonId: id, lessonName }))
                const pool: any[] = this.getField('formLessonQuestions') ?? []
                this.setStream('formLessonQuestions', [...pool, ...newQuestions])
            })
        }
    }

    // Tick/bỏ tick 1 câu hỏi cụ thể trong chế độ 'lesson' (2026-09-06) - cùng shape toggle hệt
    // toggleFormQuestion, chỉ khác tên field vì đây là pool GỘP nhiều Bài, không phải 1 Bài như
    // 'formQuestionIds' của chế độ 'question'.
    toggleFormLessonQuestion(id: number) {
        const ids: number[] = this.getField('formLessonSelectedQuestionIds') ?? []
        const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
        this.setStream('formLessonSelectedQuestionIds', next)
    }

    // Nút "Chọn tất cả" (2026-09-06, theo lựa chọn anh "Hiện list + có nút Chọn tất cả") - tick
    // hết mọi câu hỏi đang có trong pool hiện tại (không phục hồi hành vi tự động lấy hết ở
    // server - đây vẫn là 1 hành động tick tay của Phụ huynh, chỉ làm nhanh hơn).
    selectAllFormLessonQuestions() {
        const pool: any[] = this.getField('formLessonQuestions') ?? []
        this.setStream('formLessonSelectedQuestionIds', pool.map((q) => q.id))
    }

    changeFormLesson(value: number) {
        this.setStream('formLessonId', value)
        this.setStream('formQuestionIds', [])
        this.loadQuestions(value)
    }

    toggleFormQuestion(id: number) {
        const ids: number[] = this.getField('formQuestionIds') ?? []
        const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
        this.setStream('formQuestionIds', next)
    }

    submitCreate(onComplete: () => void, onError: (error: any) => void) {
        const studentId = this.getField('formStudentId')
        const name = this.getField('name', 'createReq') ?? ''
        const mode = this.getField('formMode') ?? 'question'
        if (studentId === '' || studentId == null || !name.trim()) {
            onError({ messageKey: 'required-field' })
            return
        }
        if (mode === 'lesson') {
            const lessonIds: number[] = this.getField('formLessonIds') ?? []
            // 2026-09-06: questionIds giờ bắt buộc - Phụ huynh phải tự tick câu hỏi (hoặc bấm
            // "Chọn tất cả"), không còn server tự lấy hết nữa.
            const questionIds: number[] = this.getField('formLessonSelectedQuestionIds') ?? []
            if (lessonIds.length === 0 || questionIds.length === 0) {
                onError({ messageKey: 'required-field' })
                return
            }
            this.setStream('submitting', true)
            const request: QuizTestCreateFromLessonsRequest = { studentId, name, lessonIds, questionIds }
            this.createFromLessons(request, () => { this.setStream('submitting', false); onComplete() },
                (error: any) => { this.setStream('submitting', false); onError(error) })
            return
        }
        const questionIds: number[] = this.getField('formQuestionIds') ?? []
        if (questionIds.length === 0) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        const request: QuizTestCreateRequest = { studentId, name, questionIds }
        this.create(request, () => { this.setStream('submitting', false); onComplete() },
            (error: any) => { this.setStream('submitting', false); onError(error) })
    }

    // --- Dialog "Tạo đề ôn tập" ---
    openPractice() {
        this.setStream('pStudentId', '')
        this.setStream('pSubjectId', '')
        this.setField('practiceReq', {})
        this.setStream('practice_view', { isShow: true })
    }

    closePractice() {
        this.setStream('practice_view', { isShow: false })
        this.setStream('practiceSubmitting', false)
    }

    changePracticeStudent(value: number | '') {
        this.setStream('pStudentId', value)
        this.setStream('pSubjectId', '')
        const students: QuizStudentLite[] = this.getField('students') ?? []
        const classroomId = value === '' ? undefined : students.find((s) => s.id === value)?.classroomId
        if (classroomId != null) this.loadSubjects(classroomId)
    }

    submitPractice(onComplete: () => void, onError: (error: any) => void) {
        const studentId = this.getField('pStudentId')
        const subjectId = this.getField('pSubjectId')
        if (studentId === '' || studentId == null || subjectId === '' || subjectId == null) {
            onError({ messageKey: 'required-field' })
            return
        }
        const req = this.getField('practiceReq') ?? {}
        this.setStream('practiceSubmitting', true)
        const request: QuizPracticeGenerateRequest = {
            studentId, subjectId,
            name: (req.pName ?? '').trim() === '' ? undefined : req.pName,
            questionCount: (req.pQuestionCount ?? '').trim() === '' ? undefined : Number(req.pQuestionCount)
        }
        this.generatePractice(request, () => { this.setStream('practiceSubmitting', false); onComplete() },
            (error: any) => { this.setStream('practiceSubmitting', false); onError(error) })
    }

    // --- Dialog "Nhập đề ôn tập từ file" - cùng shape hệt Dialog import bài học của
    // BlocParentSubjects.ts (openLessonImport/closeLessonImport/downloadLessonImportTemplate/
    // importLessonsFile/runLessonImport) - xem comment ở đó cho lý do responseType:'blob' và vì
    // sao quizImportPracticeTests đi thẳng QUIZ_API thay vì qua apiRequest.
    //
    // 2026-09-05 (sửa lại theo "mỗi lần import một đề ôn theo môn" - anh xác nhận): dialog này giờ
    // bắt Phụ huynh CHỌN LỚP rồi CHỌN MÔN trước khi được bấm nút chọn file - khác Dialog "Tạo đề
    // ôn tập" (chọn Học sinh trước, tự suy ra Lớp - xem changePracticeStudent), ở đây không có 1
    // Học sinh cố định nào để suy ra Lớp từ đó (file có thể nhắm nhiều Học sinh khác Lớp... không,
    // PHẢI cùng 1 Lớp vì cùng 1 Môn - Môn học luôn thuộc đúng 1 Lớp). Dùng 2 stream/field MỚI
    // (importClassroomId/importSubjectId, và importClassrooms/importSubjects cho 2 dropdown) tách
    // hẳn khỏi classroomId/subjects của các Dialog khác, để mở/đóng dialog này không ảnh hưởng
    // state của Dialog "Tạo đề ôn tập" nếu Phụ huynh mở dialog kia trước đó rồi đóng lại.
    openPracticeImport() {
        this.setStream('importClassroomId', '')
        this.setStream('importSubjectId', '')
        this.setStream('importSubjects', [])
        this.setStream('practiceImportResult', null)
        this.setStream('practice_import_view', { isShow: true })
        this.apiRequest(QuizClassroomApi.list(), (res) => {
            this.setStream('importClassrooms', res.data as QuizClassroomLite[])
        })
    }

    closePracticeImport() {
        this.setStream('practice_import_view', { isShow: false })
        this.setStream('practiceImporting', false)
        this.setStream('practiceImportResult', null)
    }

    // Chọn Lớp là bước đầu tiên của dialog import - tải lại Môn học của đúng Lớp đó vào stream
    // RIÊNG 'importSubjects' (không dùng chung 'subjects' với 2 Dialog kia, xem comment ở
    // openPracticeImport). Đổi Lớp reset luôn Môn học đã chọn trước đó (không còn hợp lệ).
    changeImportClassroom(value: number | '') {
        this.setStream('importClassroomId', value)
        this.setStream('importSubjectId', '')
        if (value === '') {
            this.setStream('importSubjects', [])
            return
        }
        this.apiRequest(QuizSubjectApi.list(value), (res) => {
            this.setStream('importSubjects', res.data)
        })
    }

    changeImportSubject(value: number) {
        this.setStream('importSubjectId', value)
    }

    downloadPracticeImportTemplate(format: 'xlsx' | 'csv', onError: (error: any) => void) {
        this.apiRequest(QuizTestApi.downloadPracticeImportTemplate(format), (res: any) => {
            const blob: Blob = res.data
            const disposition: string | undefined = res.disposition
            const match = disposition?.match(/filename="?([^"]+)"?/)
            const filename = match?.[1] ?? `practice-test-import-template.${format}`
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        }, { onError })
    }

    async importPracticeFile(subjectId: number, file: File, onComplete: (result: QuizPracticeImportResult) => void, onError: (error: any) => void) {
        try {
            const res = await quizImportPracticeTests(subjectId, file)
            if (res.code === 100) {
                onComplete(res.data as QuizPracticeImportResult)
                this.reloadTests()
            } else {
                onError(res)
            }
        } catch (e) {
            onError(e)
        }
    }

    // subjectId đọc từ field 'importSubjectId' (bắt buộc phải chọn xong Lớp+Môn trước khi dialog
    // cho bấm nút chọn file - xem Tests.tsx, nút "Chọn file" bị disable tới khi có subjectId) nên
    // validate lại 1 lần nữa ở đây cho chắc (phòng trường hợp gọi thẳng runPracticeImport mà bỏ
    // qua UI, cùng convention "Bloc content tự validate, không tin UI" của mọi submit* khác).
    runPracticeImport(file: File, onError: (error: any) => void) {
        const subjectId = this.getField('importSubjectId')
        if (subjectId === '' || subjectId == null) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('practiceImporting', true)
        this.importPracticeFile(subjectId, file, (result) => {
            this.setStream('practiceImporting', false)
            this.setStream('practiceImportResult', result)
        }, (error) => { this.setStream('practiceImporting', false); onError(error) })
    }
}
