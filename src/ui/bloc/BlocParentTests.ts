import { IBlocUI } from "../../base/IBlocUI";
import { QuizTestApi, QuizTestCreateRequest, QuizPracticeGenerateRequest } from "../../api/QuizTestApi";
import { QuizStudentApi } from "../../api/QuizStudentApi";
import { QuizSubjectApi } from "../../api/QuizSubjectApi";
import { QuizLessonApi } from "../../api/QuizLessonApi";
import { QuizQuestionApi } from "../../api/QuizQuestionApi";

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
    openCreate() {
        this.setStream('formStudentId', '')
        this.setStream('formSubjectId', '')
        this.setStream('formLessonId', '')
        this.setStream('formQuestionIds', [])
        this.setField('createReq', { name: '' })
        this.setStream('create_view', { isShow: true })
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
        const students: QuizStudentLite[] = this.getField('students') ?? []
        const classroomId = value === '' ? undefined : students.find((s) => s.id === value)?.classroomId
        if (classroomId != null) this.loadSubjects(classroomId)
    }

    changeFormSubject(value: number) {
        this.setStream('formSubjectId', value)
        this.setStream('formLessonId', '')
        this.setStream('formQuestionIds', [])
        this.loadLessons(value)
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
        const questionIds: number[] = this.getField('formQuestionIds') ?? []
        if (studentId === '' || studentId == null || !name.trim() || questionIds.length === 0) {
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
}
