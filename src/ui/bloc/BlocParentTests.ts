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
}
