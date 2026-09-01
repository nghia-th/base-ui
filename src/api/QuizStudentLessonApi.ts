import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_STUDENT_PREFIX } from "../base/PrefixService";

// Khớp StudentLessonApi.java (task "Backend: Student xem lai noi dung bai hoc", 2026-09-01) - học
// sinh xem lại nội dung 1 Bài học (chỉ những bài thuộc câu hỏi trong 1 đề đã giao cho mình, backend
// tự kiểm tra qua StudentLessonService, không lọc gì thêm ở đây).
export class QuizStudentLessonApi {
    static get(lessonId: number) {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/lessons/${lessonId}`);
    }

    // responseType 'blob' - cùng lý do/pattern QuizLessonApi.getImage (ảnh cần header Authorization
    // nên không dùng thẳng <img src="<url>">).
    static getImage(lessonId: number) {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/lessons/${lessonId}/image`, { responseType: 'blob' });
    }
}
