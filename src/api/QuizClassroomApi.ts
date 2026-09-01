import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khớp ClassroomRequest.java (dùng chung cho create/update, chỉ 1 field "name") - Task "Lớp học"
// (mới), đứng đầu chuỗi Lớp -> Môn học -> Bài học -> Câu hỏi, và là nơi mỗi Học sinh được set 1
// lớp (thay cho field "grade" tự do cũ, xem QuizStudentApi.ts).
export interface QuizClassroomRequest {
    name: string;
}

export class QuizClassroomApi {
    static list() {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/classrooms`);
    }

    static create(request: QuizClassroomRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/classrooms`, request);
    }

    static update(id: number, request: QuizClassroomRequest) {
        return QuizRequestBase.put(`${QUIZ_PARENT_PREFIX}/classrooms/${id}`, request);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/classrooms/${id}`);
    }
}
