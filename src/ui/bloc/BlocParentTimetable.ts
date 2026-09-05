import { IBlocUI } from "../../base/IBlocUI";
import { QuizClassroomApi } from "../../api/QuizClassroomApi";
import { QuizSubjectApi } from "../../api/QuizSubjectApi";
import { QuizTimetableApi, QuizTimetableEntry } from "../../api/QuizTimetableApi";

// Chi lay field can dung o trang nay - moi Bloc "content" tu khai bao shape rieng, khong import
// cheo interface cua Bloc khac (xem QuizClassroomLite trong BlocParentSubjects.ts, cung ly do).
export interface QuizClassroomLite {
    id: number;
    name: string;
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
// Luong: chon 1 Lop (classroomId) -> tai ca tuan (getWeek, flat list) + tai Subject cua lop do de
// lam nguon chon trong Dialog sua tung ngay -> bam "Sua" 1 ngay mo Dialog voi danh sach nhap nhap
// (draftSubjects, mang OrderED, KHONG phai bloc stream rieng tung dong) -> Luu goi
// setDay(classroomId, dayOfWeek, {subjectIds: draftSubjects.map(...)}) THAY TOAN BO ngay do, roi
// tai lai ca tuan tu response tra ve (khong can goi getWeek rieng, xem QuizTimetableApi#setDay tra
// ve luon ca tuan da cap nhat, giong AdminCurriculumApi's tra ve luon list moi sau create/update).
//
// Revision 2026-09-06: bo han khai niem chon Bai hoc (Lesson) trong Dialog nay - sau khi anh test
// ban dau va yeu cau "thoi khoa bieu la: toan, anh van, hoa", 1 ngay chi con la danh sach Mon hoc
// theo thu tu, khong gan Bai hoc cu the nua (xem BlocParentTimetable.ts's cac ham
// loadSubjectsAndLessons/addDraftLesson cu, gio da doi thanh loadSubjects/addDraftSubject).
export class BlocParentTimetable extends IBlocUI {
    async initData() {
        this.loadClassrooms();
    }

    loadClassrooms() {
        this.apiRequest(QuizClassroomApi.list(), (res) => {
            const classrooms = res.data as QuizClassroomLite[];
            this.setStream('classrooms', classrooms);
            if (classrooms.length > 0) {
                this.selectClassroom(classrooms[0].id);
            } else {
                this.setStream('week', []);
            }
        });
    }

    selectClassroom(classroomId: number) {
        this.setStream('selectedClassroomId', classroomId);
        this.setStream('week', null);
        this.setStream('subjects', []);
        this.loadWeek(classroomId);
        this.loadSubjects(classroomId);
    }

    loadWeek(classroomId: number) {
        this.apiRequest(QuizTimetableApi.getWeek(classroomId), (res) => {
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
        const classroomId: number | null = this.getField('selectedClassroomId') ?? null;
        const draft: QuizTimetableDraftSubject[] = this.getField('draftSubjects') ?? [];
        if (classroomId == null) return;

        this.setStream('savingDay', true);
        const request = { subjectIds: draft.map((d) => d.subjectId) };
        this.apiRequest(QuizTimetableApi.setDay(classroomId, view.dayOfWeek, request), (res) => {
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
