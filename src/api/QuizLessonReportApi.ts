import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khop LessonReportHistoryItem.java / LessonReportApi.java (2026-09-06, phia Phu huynh cua tinh
// nang "bao bai" - xem lai Hoc sinh da bao hoc Bai nao vao 1 ngay bat ky, mac dinh la hom nay,
// loc duoc theo Mon hoc).
export interface QuizLessonReportHistoryItem {
    subjectId: number;
    subjectName: string;
    lessonId: number;
    lessonName: string;
    reportDate: string;
}

export class QuizLessonReportApi {
    // date (yyyy-MM-dd) va subjectId deu optional - bo qua date de lay hom nay, bo qua subjectId
    // de lay tat ca mon.
    static getStudentHistory(studentId: number, date?: string, subjectId?: number) {
        const params: Record<string, any> = {};
        if (date) params.date = date;
        if (subjectId != null) params.subjectId = subjectId;
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/students/${studentId}/lesson-reports`, { params });
    }
}
