import { IBlocUI } from "../../base/IBlocUI";
import { QuizClassroomApi } from "../../api/QuizClassroomApi";
import { QuizSubjectApi } from "../../api/QuizSubjectApi";
import { QuizLessonApi } from "../../api/QuizLessonApi";
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

export interface QuizLessonLite {
    id: number;
    subjectId: number;
    name: string;
}

// 1 dong dang soan trong Dialog sua 1 ngay - giu ca lessonName/subjectName de hien thi ngay,
// khong can tra cuu nguoc lai lessonsBySubject moi lan render danh sach.
export interface QuizTimetableDraftLesson {
    lessonId: number;
    lessonName: string;
    subjectName: string;
}

// Bloc trang "Thoi khoa bieu" (khu vuc Phu huynh, /app/parent/timetable - MOI, 2026-09-05, phan 1
// cua tinh nang - CRUD cho Phu huynh, theo dung yeu cau "tao chuc nang thoi khoa bieu trong 1 tuan
// cua con"). La bloc "content" (dung reUseBlocContent trong Timetable.tsx).
//
// Luong: chon 1 Lop (classroomId) -> tai ca tuan (getWeek, flat list) + tai Subject/Lesson cua lop
// do de lam nguon chon trong Dialog sua tung ngay -> bam "Sua" 1 ngay mo Dialog voi danh sach nhap
// nhap (draftLessons, mang OrderED, KHONG phai bloc stream rieng tung dong) -> Luu goi
// setDay(classroomId, dayOfWeek, {lessonIds: draftLessons.map(...)}) THAY TOAN BO ngay do, roi tai
// lai ca tuan tu response tra ve (khong can goi getWeek rieng, xem QuizTimetableApi#setDay tra ve
// luon ca tuan da cap nhat, giong AdminCurriculumApi's tra ve luon list moi sau create/update).
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
        this.setStream('lessonsBySubject', {});
        this.loadWeek(classroomId);
        this.loadSubjectsAndLessons(classroomId);
    }

    loadWeek(classroomId: number) {
        this.apiRequest(QuizTimetableApi.getWeek(classroomId), (res) => {
            this.setStream('week', res.data as QuizTimetableEntry[]);
        });
    }

    loadSubjectsAndLessons(classroomId: number) {
        this.apiRequest(QuizSubjectApi.list(classroomId), (res) => {
            const subjects = res.data as QuizSubjectLite[];
            this.setStream('subjects', subjects);
            // Tai Lesson cua tung Subject song song - moi request tra ve tu cap nhat 1 nhanh cua
            // lessonsBySubject (khong cho het ca tuan roi moi hien, danh sach Subject/Lesson nay
            // chi phuc vu Dialog chon, khong chan hien thi bang tuan chinh).
            subjects.forEach((subject) => {
                this.apiRequest(QuizLessonApi.list(subject.id), (lessonRes) => {
                    const current = this.getField('lessonsBySubject') ?? {};
                    this.setStream('lessonsBySubject', { ...current, [subject.id]: lessonRes.data as QuizLessonLite[] });
                });
            });
        });
    }

    openDayEditor(dayOfWeek: number) {
        const week: QuizTimetableEntry[] = this.getField('week') ?? [];
        const draft: QuizTimetableDraftLesson[] = week
            .filter((entry) => entry.dayOfWeek === dayOfWeek)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((entry) => ({ lessonId: entry.lessonId, lessonName: entry.lessonName, subjectName: entry.subjectName }));
        this.setStream('draftLessons', draft);
        this.setStream('day_dialog_view', { isShow: true, dayOfWeek });
    }

    closeDayEditor() {
        this.setStream('day_dialog_view', { isShow: false, dayOfWeek: 0 });
    }

    addDraftLesson(lesson: QuizTimetableDraftLesson) {
        const draft: QuizTimetableDraftLesson[] = this.getField('draftLessons') ?? [];
        // Bo qua neu da co san (1 Lesson khong nen xuat hien 2 lan trong cung 1 ngay).
        if (draft.some((d) => d.lessonId === lesson.lessonId)) return;
        this.setStream('draftLessons', [...draft, lesson]);
    }

    removeDraftLesson(index: number) {
        const draft: QuizTimetableDraftLesson[] = [...(this.getField('draftLessons') ?? [])];
        draft.splice(index, 1);
        this.setStream('draftLessons', draft);
    }

    moveDraftLesson(index: number, direction: -1 | 1) {
        const draft: QuizTimetableDraftLesson[] = [...(this.getField('draftLessons') ?? [])];
        const target = index + direction;
        if (target < 0 || target >= draft.length) return;
        [draft[index], draft[target]] = [draft[target], draft[index]];
        this.setStream('draftLessons', draft);
    }

    saveDay(onComplete: () => void, onError: (error: any) => void) {
        const view = this.getField('day_dialog_view') ?? {};
        const classroomId: number | null = this.getField('selectedClassroomId') ?? null;
        const draft: QuizTimetableDraftLesson[] = this.getField('draftLessons') ?? [];
        if (classroomId == null) return;

        this.setStream('savingDay', true);
        const request = { lessonIds: draft.map((d) => d.lessonId) };
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
