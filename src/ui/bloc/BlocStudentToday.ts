import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentTimetableApi, QuizStudentTimetableEntry } from "../../api/QuizStudentTimetableApi";
import { QuizStudentPreparationApi, QuizLessonPreparationStatus } from "../../api/QuizStudentPreparationApi";
import { QuizStudentLessonReportApi, QuizSubjectLessonReportStatus } from "../../api/QuizStudentLessonReportApi";

// Bloc trang "Hom nay hoc gi" (khu vuc Hoc sinh, /app/student/today - MOI, 2026-09-05, item 5
// trong dot 11 yeu cau, phan 2 cua tinh nang "thoi khoa bieu"). "today" van doc tu
// QuizStudentTimetableApi (chi xem, khong danh dau chuan bi bai cho HOM NAY - yeu cau chi noi ve
// "ngay mai"). "tomorrow" (them 2026-09-05, item 9) doi sang doc tu QuizStudentPreparationApi
// thay vi QuizStudentTimetableApi - DTO LessonPreparationStatus co du moi field cua
// TimetableEntryResponse CONG THEM "prepared", nen khong can goi 2 API rieng cho cung 1 danh sach
// mon ngay mai.
//
// Revision 2026-09-06: danh dau/bo danh dau theo subjectId, khong con lessonId - xem
// QuizStudentPreparationApi.ts's comment.
//
// Them "lessonReport" (2026-09-06, tinh nang "bao bai") - rieng biet voi "tomorrow"/chuan bi bai:
// day la bao Bai CU THE da hoc HOM NAY (khong phai ngay mai), theo tung Mon co trong thoi khoa
// bieu hom nay - xem QuizStudentLessonReportApi.ts's comment.
export class BlocStudentToday extends IBlocUI {
    async initData() {
        this.loadToday();
        this.loadTomorrow();
        this.loadLessonReport();
    }

    loadToday() {
        this.apiRequest(QuizStudentTimetableApi.getToday(), (res) => {
            this.setStream('today', res.data as QuizStudentTimetableEntry[]);
        });
    }

    loadTomorrow() {
        this.apiRequest(QuizStudentPreparationApi.getTomorrowStatus(), (res) => {
            this.setStream('tomorrow', res.data as QuizLessonPreparationStatus[]);
        });
    }

    // Item 9 - bam checkbox 1 mon trong the "Ngay mai" -> danh dau/bo danh dau da chuan bi bai.
    // Ca 2 API deu tra ve luon ca checklist moi (xem QuizStudentPreparationApi.ts's comment) nen
    // set thang vao stream 'tomorrow' o day, khong can loadTomorrow() lai rieng.
    togglePrepared(subjectId: number, currentlyPrepared: boolean, onError: (error: any) => void) {
        const api = currentlyPrepared
            ? QuizStudentPreparationApi.unmarkPrepared(subjectId)
            : QuizStudentPreparationApi.markPrepared(subjectId);
        this.apiRequest(api, (res) => {
            this.setStream('tomorrow', res.data as QuizLessonPreparationStatus[]);
        }, { onError });
    }

    loadLessonReport() {
        this.apiRequest(QuizStudentLessonReportApi.getTodayStatus(), (res) => {
            this.setStream('lessonReport', res.data as QuizSubjectLessonReportStatus[]);
        });
    }

    // Con chon 1 Bai trong danh sach "available" cua 1 Mon (dropdown rieng theo tung the Mon,
    // xem Today.tsx) -> bao ngay, khong can nut "Luu" rieng (giong pattern togglePrepared o tren).
    reportLesson(lessonId: number, onError: (error: any) => void) {
        this.apiRequest(QuizStudentLessonReportApi.reportLesson(lessonId), (res) => {
            this.setStream('lessonReport', res.data as QuizSubjectLessonReportStatus[]);
        }, { onError });
    }

    // Bo bao 1 Bai da bao HOM NAY (lo chon nham) - QUIZ_042 neu co gang bo bao Bai cua ngay truoc,
    // nhung UI chi cho bam nut nay tren cac Bai nam trong "reportedToday" nen thuc te khong xay ra.
    unreportLesson(lessonId: number, onError: (error: any) => void) {
        this.apiRequest(QuizStudentLessonReportApi.unreportLesson(lessonId), (res) => {
            this.setStream('lessonReport', res.data as QuizSubjectLessonReportStatus[]);
        }, { onError });
    }
}
