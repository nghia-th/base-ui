import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_STUDENT_PREFIX } from "../base/PrefixService";

// Khop StudentTimetableApi.java (2026-09-05, item 5 trong dot 11 yeu cau - phan 2 cua tinh nang
// "thoi khoa bieu"). Hoc sinh chi xem duoc dung Lop hoc cua minh nen khong co classroomId o day
// (khac QuizTimetableApi.ts ben Phu huynh) - backend tu resolve tu Student dang dang nhap.
export interface QuizStudentTimetableEntry {
    id: number;
    dayOfWeek: number;
    lessonId: number;
    lessonName: string;
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
}
