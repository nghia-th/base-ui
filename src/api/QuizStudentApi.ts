import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// DTO khớp StudentCreateRequest.java/StudentUpdateRequest.java bên backend (task 2 - CRUD Student
// của Parent đang đăng nhập, xem StudentApi.java: /api/parent/students). classroomId thay cho
// field "grade" tự do cũ - mỗi Học sinh giờ thuộc đúng 1 Lớp học đã tạo sẵn (xem QuizClassroomApi.ts).
export interface QuizStudentCreateRequest {
    fullName: string;
    classroomId: number;
    username: string;
    password: string;
}

// Mọi field đều optional - null/undefined nghĩa là "giữ nguyên", xem StudentUpdateRequest.java.
export interface QuizStudentUpdateRequest {
    fullName?: string;
    classroomId?: number;
    username?: string;
    password?: string;
}

export class QuizStudentApi {
    static list() {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/students`);
    }

    static create(request: QuizStudentCreateRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/students`, request);
    }

    static update(id: number, request: QuizStudentUpdateRequest) {
        return QuizRequestBase.put(`${QUIZ_PARENT_PREFIX}/students/${id}`, request);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/students/${id}`);
    }
}
