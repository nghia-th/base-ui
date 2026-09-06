import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_STUDENT_PREFIX } from "../base/PrefixService";

// Khop StudentTimetableApi.java (2026-09-05, item 5 trong dot 11 yeu cau - phan 2 cua tinh nang
// "thoi khoa bieu"). Hoc sinh chi xem duoc dung Lop hoc cua minh nen khong co classroomId o day
// (khac QuizTimetableApi.ts ben Phu huynh) - backend tu resolve tu Student dang dang nhap.
//
// Doi tu gan Lesson cu the sang chi gan Subject (2026-09-06 revision a) - khong con
// lessonId/lessonName nua, xem TimetableEntry.java's javadoc ben backend.
//
// getWeek/addSubject (2026-09-06 revision c, MOI) - theo yeu cau "hoc sinh cho phep hoc sinh tao
// thoi khoa bieu khong cho xoa, update - viec xoa hoac update thi phu huynh lam". Hoc sinh CHI
// duoc THEM (khong bao gio xoa/sua/doi thu tu - do van la viec cua Phu huynh qua
// QuizTimetableApi#setDay) - vi vay o day CHI CO addSubject, khong co remove/reorder nao ca.
export interface QuizStudentTimetableEntry {
    id: number;
    dayOfWeek: number;
    subjectId: number;
    subjectName: string;
    orderIndex: number;
}

export class QuizStudentTimetableApi {
    static getToday() {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/timetable/today`);
    }

    static getTomorrow() {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/timetable/tomorrow`);
    }

    // Ca tuan, doc-only tu API nay - dung cho trang moi "Thoi khoa bieu cua con" (Hoc sinh tu them
    // mon, 2026-09-06). Cung dang phang giong QuizTimetableApi#getWeek ben Phu huynh.
    static getWeek() {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/timetable/week`);
    }

    // THEM 1 Mon vao cuoi danh sach cua 1 ngay - subjectId la path variable (giong quy uoc
    // QuizStudentPreparationApi's markPrepared/unmarkPrepared), khong can body rieng. Idempotent -
    // goi lai voi Mon da co san khong bao loi, chi tra ve nguyen ca tuan hien tai. KHONG CO
    // remove/update tuong ung - xoa/sua 1 ngay van la viec cua Phu huynh (QuizTimetableApi#setDay).
    static addSubject(dayOfWeek: number, subjectId: number) {
        return QuizRequestBase.post(`${QUIZ_STUDENT_PREFIX}/timetable/${dayOfWeek}/subjects/${subjectId}`, {});
    }
}
