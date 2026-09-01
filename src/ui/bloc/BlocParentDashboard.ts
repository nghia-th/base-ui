import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentApi } from "../../api/QuizStudentApi";
import { QuizSubjectApi } from "../../api/QuizSubjectApi";
import { QuizTestApi } from "../../api/QuizTestApi";
import { QuizClassroomApi } from "../../api/QuizClassroomApi";

// Chỉ lấy field cần đếm/hiển thị cho trang tổng quan - mỗi Bloc "content" tự khai báo shape riêng
// (không import type từ BlocParentStudents.ts/BlocParentTests.ts), đúng quy ước đã dùng ở
// BlocParentTests.ts's QuizStudentLite. classroomId thay cho "grade" tự do cũ (xem
// BlocParentStudents.ts) - không thật sự render ra dashboard nhưng khai báo đúng shape response
// thật để tránh gây hiểu nhầm sau này.
export interface QuizDashboardStudent {
    id: number;
    fullName: string;
    classroomId: number;
}

export interface QuizDashboardClassroom {
    id: number;
    name: string;
}

export interface QuizDashboardTest {
    id: number;
    studentId: number;
    name: string;
    status: string;
}

// Bloc trang "Tổng quan" (khu vực Phụ huynh, /app/parent). quiz-service KHÔNG có API tổng hợp
// riêng cho dashboard nên gọi song song 4 API sẵn có (Lớp học/Học sinh/Môn học/Đề kiểm tra) rồi tự
// đếm ở phía UI (ParentDashboard.tsx) - đủ nhẹ vì số lượng bản ghi của 1 Phụ huynh không lớn.
export class BlocParentDashboard extends IBlocUI {
    async initData() {
        this.reload()
    }

    reload() {
        this.apiRequest(QuizClassroomApi.list(), (res) => {
            this.setStream('classrooms', res.data as QuizDashboardClassroom[])
        })
        this.apiRequest(QuizStudentApi.list(), (res) => {
            this.setStream('students', res.data as QuizDashboardStudent[])
        })
        this.apiRequest(QuizSubjectApi.list(), (res) => {
            this.setStream('subjects', res.data)
        })
        this.apiRequest(QuizTestApi.list(), (res) => {
            this.setStream('tests', res.data as QuizDashboardTest[])
        })
    }
}
