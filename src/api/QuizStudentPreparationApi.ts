import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_STUDENT_PREFIX } from "../base/PrefixService";

// Khop LessonPreparationStatus.java / StudentPreparationApi.java (2026-09-05, item 9 trong dot 11
// yeu cau - "hoc sinh chuan bi bai cho ngay mai theo thoi khoa bieu bang cach danh dau da chuan bi
// bai"). Luon la NGAY MAI - khong co tham so ngay o day (xem LessonPreparationService.java's
// javadoc phia backend ve ly do). "prepared" chi la co/khong 1 dong LessonPreparation ton tai,
// khong phai field boolean rieng trong DB - nhung frontend van coi no nhu 1 flag binh thuong.
//
// Doi tu lessonId sang subjectId (2026-09-06, xem LessonPreparation.java's javadoc ben backend) -
// URL cung doi tu .../tomorrow/lessons/{lessonId} sang .../tomorrow/subjects/{subjectId}.
export interface QuizLessonPreparationStatus {
    subjectId: number;
    subjectName: string;
    orderIndex: number;
    prepared: boolean;
}

export class QuizStudentPreparationApi {
    static getTomorrowStatus() {
        return QuizRequestBase.get(`${QUIZ_STUDENT_PREFIX}/preparation/tomorrow`);
    }

    // Ca 2 API deu idempotent (danh dau lai mon da danh dau / bo danh dau mon chua danh dau deu
    // khong loi) va deu tra ve luon ca checklist da cap nhat - khoi phai goi getTomorrowStatus
    // rieng lan nua, cung pattern "tra ve luon du lieu moi" nhu QuizTimetableApi#setDay.
    static markPrepared(subjectId: number) {
        return QuizRequestBase.put(`${QUIZ_STUDENT_PREFIX}/preparation/tomorrow/subjects/${subjectId}`, {});
    }

    static unmarkPrepared(subjectId: number) {
        return QuizRequestBase.delete(`${QUIZ_STUDENT_PREFIX}/preparation/tomorrow/subjects/${subjectId}`);
    }
}
