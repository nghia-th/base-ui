import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentTimetableApi, QuizStudentTimetableEntry } from "../../api/QuizStudentTimetableApi";
import { QuizStudentPreparationApi, QuizLessonPreparationStatus } from "../../api/QuizStudentPreparationApi";

// Bloc trang "Hom nay hoc gi" (khu vuc Hoc sinh, /app/student/today - MOI, 2026-09-05, item 5
// trong dot 11 yeu cau, phan 2 cua tinh nang "thoi khoa bieu"). "today" van doc tu
// QuizStudentTimetableApi (chi xem, khong danh dau chuan bi bai cho HOM NAY - yeu cau chi noi ve
// "ngay mai"). "tomorrow" (them 2026-09-05, item 9) doi sang doc tu QuizStudentPreparationApi
// thay vi QuizStudentTimetableApi - DTO LessonPreparationStatus co du moi field cua
// TimetableEntryResponse CONG THEM "prepared", nen khong can goi 2 API rieng cho cung 1 danh sach
// bai ngay mai.
export class BlocStudentToday extends IBlocUI {
    async initData() {
        this.loadToday();
        this.loadTomorrow();
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

    // Item 9 - bam checkbox 1 bai trong the "Ngay mai" -> danh dau/bo danh dau da chuan bi bai.
    // Ca 2 API deu tra ve luon ca checklist moi (xem QuizStudentPreparationApi.ts's comment) nen
    // set thang vao stream 'tomorrow' o day, khong can loadTomorrow() lai rieng.
    togglePrepared(lessonId: number, currentlyPrepared: boolean, onError: (error: any) => void) {
        const api = currentlyPrepared
            ? QuizStudentPreparationApi.unmarkPrepared(lessonId)
            : QuizStudentPreparationApi.markPrepared(lessonId);
        this.apiRequest(api, (res) => {
            this.setStream('tomorrow', res.data as QuizLessonPreparationStatus[]);
        }, { onError });
    }
}
