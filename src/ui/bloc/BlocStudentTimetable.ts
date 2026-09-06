import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentTimetableApi, QuizStudentTimetableEntry } from "../../api/QuizStudentTimetableApi";
import { QuizStudentAttemptApi } from "../../api/QuizStudentAttemptApi";

// Chi lay field can dung o trang nay - dung lai SubjectResponse.java qua QuizStudentAttemptApi's
// listSubjects (da co san cho tinh nang "On tap kien thuc", cung tra ve Subject cua dung Lop cua
// Hoc sinh dang dang nhap - khong can goi API rieng).
export interface QuizStudentSubjectLite {
    id: number;
    name: string;
}

// Bloc trang "Thoi khoa bieu" (khu vuc Hoc sinh, /app/student/timetable - MOI, 2026-09-06, theo
// yeu cau "hoc sinh cho phep hoc sinh tao thoi khoa bieu khong cho xoa, update - viec xoa hoac
// update thi phu huynh lam, sau khi hoc sinh them thoi khoa bieu thi phu huynh se thay"). Hoc sinh
// xem duoc CA TUAN (AskUserQuestion 2026-09-06: "Ca tuan (Recommended)") va CHI duoc THEM 1 Mon
// vao 1 ngay - KHONG CO xoa/sua/doi thu tu o day (khac han BlocParentTimetable ben Phu huynh, van
// la noi duy nhat lam duoc viec do qua setDay full-replace). Sau khi them, Phu huynh thay ngay lan
// sau tai lai trang Thoi khoa bieu cua ho - khong can buoc "gui/duyet" rieng.
export class BlocStudentTimetable extends IBlocUI {
    async initData() {
        this.loadWeek();
        this.apiRequest(QuizStudentAttemptApi.listSubjects(), (res) => {
            this.setStream('subjects', res.data as QuizStudentSubjectLite[]);
        });
    }

    loadWeek() {
        this.apiRequest(QuizStudentTimetableApi.getWeek(), (res) => {
            this.setStream('week', res.data as QuizStudentTimetableEntry[]);
        });
    }

    openDayAdd(dayOfWeek: number) {
        this.setStream('add_dialog_view', { isShow: true, dayOfWeek });
    }

    closeDayAdd() {
        this.setStream('add_dialog_view', { isShow: false, dayOfWeek: 0 });
    }

    // Chi THEM - idempotent o backend (goi lai voi Mon da co san khong bao loi), nen khong can tu
    // FE kiem tra trung truoc khi goi. Tai lai ca tuan tu chinh response tra ve (khong goi getWeek
    // rieng), giong quy uoc setDay/markPrepared da dung xuyen suot du an nay.
    addSubject(dayOfWeek: number, subjectId: number, onComplete: () => void, onError: (error: any) => void) {
        this.setStream('adding', true);
        this.apiRequest(QuizStudentTimetableApi.addSubject(dayOfWeek, subjectId), (res) => {
            this.setStream('week', res.data as QuizStudentTimetableEntry[]);
            this.setStream('adding', false);
            onComplete();
        }, {
            onError: (error) => {
                this.setStream('adding', false);
                onError(error);
            }
        });
    }
}
