import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khop TimetableEntryResponse.java / TimetableDayRequest.java (2026-09-05, tinh nang "thoi khoa
// bieu" - phan 1: CRUD cho Phu huynh). dayOfWeek: 1=Thu Hai..7=Chu Nhat (khop
// java.time.DayOfWeek#getValue(), ISO-8601) - dung chung o ca frontend lan backend, khong dich
// nguoc lai kieu 0-based/Chu Nhat dau tuan.
//
// Doi tu gan Lesson cu the sang chi gan Subject (2026-09-06, sau khi anh test ban dau va yeu cau
// "thoi khoa bieu la: toan, anh van, hoa") - khong con lessonId/lessonName nua, xem
// TimetableEntry.java's javadoc ben backend.
export interface QuizTimetableEntry {
    id: number;
    dayOfWeek: number;
    subjectId: number;
    subjectName: string;
    orderIndex: number;
}

export interface QuizTimetableDayRequest {
    subjectIds: number[];
}

// Khop LessonPreparationStatus.java (dot 11 yeu cau, item 10 - "phu huynh xem duoc con da chuan
// bi bai cho ngay mai hay chua"). Y het QuizLessonPreparationStatus ben QuizStudentPreparationApi
// (cung 1 DTO backend tra ve cho ca 2 phia) - khai bao rieng o day theo dung convention "moi file
// API tu khai bao interface rieng, khong import cheo" cua du an nay. Doi sang subjectId/subjectName
// (2026-09-06, cung revision voi QuizTimetableEntry o tren).
export interface QuizTimetableLessonPreparation {
    subjectId: number;
    subjectName: string;
    orderIndex: number;
    prepared: boolean;
}

export class QuizTimetableApi {
    // Danh sach phang ca tuan (moi dayOfWeek tron lan nhau, da sap xep san theo dayOfWeek roi
    // orderIndex o backend) - frontend tu group lai theo dayOfWeek, dung convention "flat list,
    // group tren client" nhu StudentTestSummaryResponse.
    static getWeek(classroomId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/classrooms/${classroomId}/timetable`);
    }

    // THAY TOAN BO danh sach mon hoc cua 1 ngay trong 1 lan goi (khong phai them/xoa tung dong) -
    // subjectIds rong = xoa trong ngay do. Xem TimetableService#setDay's javadoc ben backend.
    static setDay(classroomId: number, dayOfWeek: number, request: QuizTimetableDayRequest) {
        return QuizRequestBase.put(`${QUIZ_PARENT_PREFIX}/classrooms/${classroomId}/timetable/${dayOfWeek}`, request);
    }

    // Item 10 (dot 11 yeu cau, 2026-09-05) - checklist "chuan bi bai cho ngay mai" cua 1 hoc sinh,
    // doc-only (Phu huynh khong danh dau/bo danh dau thay con duoc - chi Hoc sinh moi lam duoc,
    // xem QuizStudentPreparationApi.ts).
    static getStudentTomorrowPreparation(studentId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/students/${studentId}/preparation/tomorrow`);
    }
}
