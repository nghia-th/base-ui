import { IBlocUI } from "../../base/IBlocUI";
import { QuizTestApi, QuizTestCreateRequest } from "../../api/QuizTestApi";
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
}

// Chỉ lấy 3 field cần cho dropdown/hiển thị tên - tránh phụ thuộc kiểu QuizStudent của bloc khác
// (mỗi Bloc "content" tự khai báo shape dữ liệu nó cần, xem BlocParentStudents.ts/BlocParentQuestions.ts).
// classroomId dùng để lọc dropdown Học sinh theo Lớp đang chọn khi tạo đề (client-side - danh
// sách Học sinh đằng nào cũng đã tải hết cho Phụ huynh, không cần thêm query param backend).
export interface QuizStudentLite {
    id: number;
    fullName: string;
    classroomId: number;
}

// Chỉ lấy 2 field cần cho dropdown/hiển thị tên - tránh phụ thuộc kiểu QuizClassroom của bloc
// khác (cùng convention QuizStudentLite ở trên).
export interface QuizClassroomLite {
    id: number;
    name: string;
}

// Bloc trang "Đề kiểm tra" (khu vực Phụ huynh, /app/parent/tests - Task 5 backend). Tự tải Học
// sinh + Lớp học (cho dropdown khi tạo đề) và danh sách Test hiện có. KHÔNG tải sẵn Môn học nữa -
// từ khi có Lớp học, tạo đề phải chọn Lớp trước (lọc cả Học sinh lẫn Môn học theo đúng lớp đó,
// xem Tests.tsx's create dialog), nên Môn học được tải theo yêu cầu qua loadSubjects(classroomId)
// khi anh chọn Lớp, giống hệt pattern loadLessons(subjectId)/loadQuestions(lessonId) bên dưới.
export class BlocParentTests extends IBlocUI {
    async initData() {
        this.apiRequest(QuizStudentApi.list(), (res) => {
            this.setStream('students', res.data as QuizStudentLite[])
        })
        this.apiRequest(QuizClassroomApi.list(), (res) => {
            this.setStream('classrooms', res.data as QuizClassroomLite[])
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
