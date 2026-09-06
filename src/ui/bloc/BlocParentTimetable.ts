import { IBlocUI } from "../../base/IBlocUI";
import { QuizStudentApi } from "../../api/QuizStudentApi";
import { QuizSubjectApi } from "../../api/QuizSubjectApi";
import { QuizTimetableApi, QuizTimetableEntry } from "../../api/QuizTimetableApi";

// Chi lay field can dung o trang nay - moi Bloc "content" tu khai bao shape rieng, khong import
// cheo interface cua Bloc khac (xem QuizClassroomLite trong BlocParentSubjects.ts, cung ly do).
// classroomId duoc giu lai o day (khac voi truoc kia chi co id/name) vi can no de tai Subject cua
// dung Lop cua Hoc sinh dang chon (xem loadSubjects/selectStudent ben duoi) - tranh phai goi them
// 1 API rieng chi de lay classroomId cua 1 Hoc sinh.
export interface QuizStudentLite {
    id: number;
    fullName: string;
    classroomId: number;
}

export interface QuizSubjectLite {
    id: number;
    name: string;
}

// 1 dong dang soan trong Dialog sua 1 ngay - giu ca subjectName de hien thi ngay, khoi phai tra
// cuu nguoc lai danh sach Subject moi lan render danh sach.
export interface QuizTimetableDraftSubject {
    subjectId: number;
    subjectName: string;
}

// Bloc trang "Thoi khoa bieu" (khu vuc Phu huynh, /app/parent/timetable - MOI, 2026-09-05, phan 1
// cua tinh nang - CRUD cho Phu huynh, theo dung yeu cau "tao chuc nang thoi khoa bieu trong 1 tuan
// cua con"). La bloc "content" (dung reUseBlocContent trong Timetable.tsx).
//
// Luong: chon 1 Hoc sinh (studentId) -> tai ca tuan (getWeek, flat list) + tai Subject cua Lop
// cua Hoc sinh do de lam nguon chon trong Dialog sua tung ngay -> bam "Sua" 1 ngay mo Dialog voi
// danh sach nhap nhap (draftSubjects, mang OrderED, KHONG phai bloc stream rieng tung dong) ->
// Luu goi setDay(studentId, dayOfWeek, {subjectIds: draftSubjects.map(...)}) THAY TOAN BO ngay
// do, roi tai lai ca tuan tu response tra ve (khong can goi getWeek rieng, xem
// QuizTimetableApi#setDay tra ve luon ca tuan da cap nhat, giong AdminCurriculumApi's tra ve luon
// list moi sau create/update).
//
// Revision 2026-09-06 (a): bo han khai niem chon Bai hoc (Lesson) trong Dialog nay - sau khi anh
// test ban dau va yeu cau "thoi khoa bieu la: toan, anh van, hoa", 1 ngay chi con la danh sach
// Mon hoc theo thu tu, khong gan Bai hoc cu the nua (xem BlocParentTimetable.ts's cac ham
// loadSubjectsAndLessons/addDraftLesson cu, gio da doi thanh loadSubjects/addDraftSubject).
//
// Revision 2026-09-06 (b): doi tu chon theo Lop (classroomId) sang chon theo Hoc sinh (studentId)
// - theo yeu cau "hien tai tao thoi khoa bieu theo lop dung ra la thoi khoa bieu theo hoc sinh
// boi vi phu huynh co 2 con cung hoc mot lop nhung thoi khoa bieu khac nhau". loadClassrooms/
// selectClassroom doi thanh loadStudents/selectStudent; classrooms/selectedClassroomId streams
// doi thanh students/selectedStudentId. loadSubjects van can 1 classroomId (Subject van gan theo
// Lop, khong doi) - lay tu chinh field classroomId cua Hoc sinh dang chon trong danh sach students
// da tai san, khong goi them API rieng.
export class BlocParentTimetable extends IBlocUI {
    async initData() {
        this.loadStudents();
    }

    loadStudents() {
        this.apiRequest(QuizStudentApi.list(), (res) => {
            const students = res.data as QuizStudentLite[];
            this.setStream('students', students);
            if (students.length > 0) {
                this.selectStudent(students[0].id);
            } else {
                this.setStream('week', []);
            }
        });
    }

    selectStudent(studentId: number) {
        const students: QuizStudentLite[] = this.getField('students') ?? [];
        const student = students.find((s) => s.id === studentId);

        this.setStream('selectedStudentId', studentId);
        this.setStream('week', null);
        this.setStream('subjects', []);
        this.loadWeek(studentId);
        if (student) {
            this.loadSubjects(student.classroomId);
        }
    }

    loadWeek(studentId: number) {
        this.apiRequest(QuizTimetableApi.getWeek(studentId), (res) => {
            this.setStream('week', res.data as QuizTimetableEntry[]);
        });
    }

    loadSubjects(classroomId: number) {
        this.apiRequest(QuizSubjectApi.list(classroomId), (res) => {
            this.setStream('subjects', res.data as QuizSubjectLite[]);
        });
    }

    openDayEditor(dayOfWeek: number) {
        const week: QuizTimetableEntry[] = this.getField('week') ?? [];
        const draft: QuizTimetableDraftSubject[] = week
            .filter((entry) => entry.dayOfWeek === dayOfWeek)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((entry) => ({ subjectId: entry.subjectId, subjectName: entry.subjectName }));
        this.setStream('draftSubjects', draft);
        this.setStream('day_dialog_view', { isShow: true, dayOfWeek });
    }

    closeDayEditor() {
        this.setStream('day_dialog_view', { isShow: false, dayOfWeek: 0 });
    }

    addDraftSubject(subject: QuizTimetableDraftSubject) {
        const draft: QuizTimetableDraftSubject[] = this.getField('draftSubjects') ?? [];
        // Bo qua neu da co san (1 Mon hoc khong nen xuat hien 2 lan trong cung 1 ngay).
        if (draft.some((d) => d.subjectId === subject.subjectId)) return;
        this.setStream('draftSubjects', [...draft, subject]);
    }

    removeDraftSubject(index: number) {
        const draft: QuizTimetableDraftSubject[] = [...(this.getField('draftSubjects') ?? [])];
        draft.splice(index, 1);
        this.setStream('draftSubjects', draft);
    }

    moveDraftSubject(index: number, direction: -1 | 1) {
        const draft: QuizTimetableDraftSubject[] = [...(this.getField('draftSubjects') ?? [])];
        const target = index + direction;
        if (target < 0 || target >= draft.length) return;
        [draft[index], draft[target]] = [draft[target], draft[index]];
        this.setStream('draftSubjects', draft);
    }

    saveDay(onComplete: () => void, onError: (error: any) => void) {
        const view = this.getField('day_dialog_view') ?? {};
        const studentId: number | null = this.getField('selectedStudentId') ?? null;
        const draft: QuizTimetableDraftSubject[] = this.getField('draftSubjects') ?? [];
        if (studentId == null) return;

        this.setStream('savingDay', true);
        const request = { subjectIds: draft.map((d) => d.subjectId) };
        this.apiRequest(QuizTimetableApi.setDay(studentId, view.dayOfWeek, request), (res) => {
            this.setStream('week', res.data as QuizTimetableEntry[]);
            this.setStream('savingDay', false);
            onComplete();
        }, {
            onError: (error) => {
                this.setStream('savingDay', false);
                onError(error);
            }
        });
    }
}
