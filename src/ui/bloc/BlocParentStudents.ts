import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentApi, QuizStudentCreateRequest, QuizStudentUpdateRequest } from "../../api/QuizStudentApi";
import { QuizClassroomApi } from "../../api/QuizClassroomApi";

// Khớp StudentResponse.java (không có password). classroomId thay cho field "grade" tự do cũ -
// mỗi Học sinh giờ thuộc đúng 1 Lớp học đã tạo sẵn (xem QuizClassroomApi.ts).
export interface QuizStudent {
    id: number;
    parentId: number;
    fullName: string;
    classroomId: number;
    username: string;
}

// Chỉ lấy 2 field cần cho dropdown/hiển thị tên - tránh phụ thuộc kiểu QuizClassroom của bloc
// khác (mỗi Bloc "content" tự khai báo shape dữ liệu nó cần, xem BlocParentTests.ts/QuizStudentLite).
export interface QuizClassroomLite {
    id: number;
    name: string;
}

// Bloc trang "Quản lý học sinh" (khu vực Phụ huynh, /app/parent/students) - list/create/update/
// delete Student con của Parent đang đăng nhập qua /api/parent/students (StudentApi.java, task 2
// backend). Là bloc "content" (dùng reUseBlocContent trong Students.tsx, sống theo trang) - giống
// hệt pattern BlocDashboard.ts. Tự tải thêm Lớp học (cho dropdown chọn lớp khi tạo/sửa Học sinh -
// xem BlocParentTests.ts cho cùng pattern tải kèm dữ liệu dropdown).
export class BlocParentStudents extends IBlocUI {
    async initData() {
        this.apiRequest(QuizClassroomApi.list(), (res) => {
            this.setStream('classrooms', res.data as QuizClassroomLite[])
        })
        this.reload()
    }

    reload() {
        this.apiRequest(QuizStudentApi.list(), (res) => {
            this.setStream('students', res.data as QuizStudent[])
        })
    }

    create(request: QuizStudentCreateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentApi.create(request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    update(id: number, request: QuizStudentUpdateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentApi.update(id, request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    remove(id: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizStudentApi.remove(id), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    // Dialog form (2026-09-01, xem claude/ui-base-status.md "Quy ước state mới") - dời khỏi
    // useState của Students.tsx, đúng pattern BlocCamera#dialogAdd/onAdd của project mẫu module-ui:
    // 'form_view' stream {isShow, id} quyết định Dialog mở/đóng VÀ đang sửa (id>0) hay tạo mới
    // (id=0); 'req' là object field group (fullName/classroomId/username/password) - field nào cần
    // hiển thị PHẢN ỨNG lại trong UI (ví dụ classroomId cho Select) đọc qua UIStream riêng của
    // đúng field đó, còn lại (fullName/username/password) là TextField không controlled.
    openNew() {
        this.setField('req', { fullName: '', classroomId: '', username: '', password: '' })
        this.setStream('form_view', { isShow: true, id: 0 })
    }

    openEdit(row: QuizStudent) {
        this.setField('req', { fullName: row.fullName, classroomId: row.classroomId, username: row.username, password: '' })
        this.setStream('classroomId', row.classroomId, 'req')
        this.setStream('form_view', { isShow: true, id: row.id })
    }

    closeForm() {
        this.setStream('form_view', { isShow: false, id: 0 })
        this.setStream('submitting', false)
    }

    // Validate + submit dời hẳn vào đây - component không còn tự tính isValid từ state cục bộ,
    // chỉ gọi save() lúc bấm nút. Lưu ý: nút Lưu KHÔNG còn tự disable theo field hợp lệ hay không
    // (đúng cách sample project làm - BlocCamera#onAdd cũng vậy) vì field giờ uncontrolled nên
    // component không có giá trị "sống" từng phím gõ để tính disabled= - validate chạy lúc bấm,
    // báo lỗi qua onError nếu thiếu.
    save(onComplete: () => void, onError: (error: any) => void) {
        const view = this.getField('form_view') ?? {}
        const req = this.getField('req') ?? {}
        const isEditing = (view.id ?? 0) > 0
        if (!req.fullName || req.classroomId === '' || req.classroomId == null || !req.username || (!isEditing && !req.password)) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        const done = () => { this.setStream('submitting', false); onComplete() }
        const fail = (error: any) => { this.setStream('submitting', false); onError(error) }
        if (isEditing) {
            this.update(view.id, {
                fullName: req.fullName,
                classroomId: req.classroomId,
                username: req.username,
                // Để trống = giữ nguyên mật khẩu cũ (StudentUpdateRequest.java).
                password: req.password ? req.password : undefined
            }, done, fail)
        } else {
            this.create({
                fullName: req.fullName,
                classroomId: req.classroomId,
                username: req.username,
                password: req.password
            }, done, fail)
        }
    }
}
