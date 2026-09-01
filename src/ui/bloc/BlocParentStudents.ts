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
}
