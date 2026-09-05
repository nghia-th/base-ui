import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_STUDENT_PREFIX } from "../base/PrefixService";

// Khop SubjectLessonReportStatus.java / StudentLessonReportApi.java (2026-09-06, tinh nang "bao
// bai" - "hom nay con hoc gi": hom nay con hoc Toan -> con chon dung Bai da hoc, VD Bai 1, trong
// so "Bai 1".."Bai 100" cua mon Toan). Khac QuizStudentPreparationApi (checklist ngay mai, theo
// Subject) - day la NHAT KY thuc te theo Lesson, chi ap dung cho cac Subject CO trong thoi khoa
// bieu HOM NAY.
export interface QuizLessonReportCandidate {
    lessonId: number;
    lessonName: string;
}

export interface QuizSubjectLessonReportStatus {
    subjectId: number;
    subjectName: string;
    orderIndex: number;
    // Bai da bao HOM NAY cho mon nay - con bo bao (undo) duoc trong ngay.
    reportedToday: QuizLessonReportCandidate[];
    // Bai CHUA TUNG bao (o bat ky ngay nao) - danh sach de chon, tu ngan dan theo thoi gian.
    available: QuizLessonReportCandidate[];
}

export class QuizStudentLessonReportApi {
    static getTodayStatus() {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/lesson-reports/today`);
    }

    // Ca 2 API deu tra ve luon ca picker moi (cung pattern "tra ve luon du lieu moi" nhu
    // QuizStudentPreparationApi) - KHONG idempotent nhu markPrepared: bao lai 1 Bai da bao se bi
    // loi QUIZ_041 (xem LessonReportService.java's javadoc).
    static reportLesson(lessonId: number) {
        return QuizRequestBase.put(`${QUIZ_STUDENT_PREFIX}/lesson-reports/lessons/${lessonId}`, {});
    }

    // Chi huy duoc Bai da bao TRONG NGAY HOM NAY - QUIZ_042 neu Bai do la lich su ngay truoc.
    static unreportLesson(lessonId: number) {
        return QuizRequestBase.delete(`${QUIZ_STUDENT_PREFIX}/lesson-reports/lessons/${lessonId}`);
    }
}
