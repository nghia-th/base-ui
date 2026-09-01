import { IBlocUI } from "../../base/IBlocUI";
import { QuizSubjectApi, QuizSubjectRequest } from "../../api/QuizSubjectApi";
import { QuizLessonApi, QuizLessonCreateRequest, QuizLessonUpdateRequest } from "../../api/QuizLessonApi";
import { QuizClassroomApi } from "../../api/QuizClassroomApi";

// Khớp SubjectResponse.java / LessonResponse.java. classroomId thay cho parentId cũ - Subject giờ
// là con của Classroom (không còn gán trực tiếp vào Parent nữa), xem ClassroomApi.ts.
export interface QuizSubject {
    id: number;
    classroomId: number;
    name: string;
}

export interface QuizLesson {
    id: number;
    subjectId: number;
    name: string;
}

// Chỉ lấy 2 field cần cho dropdown/hiển thị tên - tránh phụ thuộc kiểu QuizClassroom của bloc
// khác (mỗi Bloc "content" tự khai báo shape dữ liệu nó cần, xem BlocParentTests.ts/QuizStudentLite).
export interface QuizClassroomLite {
    id: number;
    name: string;
}

// Bloc trang "Môn học/Bài học" (khu vực Phụ huynh, /app/parent/subjects - Task 3 backend). Quản lý
// CẢ 2 stream 'subjects' và 'lessons' trong cùng 1 Bloc vì trang là 1 màn hình master-detail duy
// nhất (chọn 1 Subject bên trái -> xem/sửa Lesson của nó bên phải), không tách trang riêng. Tự tải
// thêm Lớp học (cho dropdown lọc + bắt buộc chọn khi tạo/sửa Subject - Subject giờ là con của
// Classroom, xem QuizSubject.classroomId).
export class BlocParentSubjects extends IBlocUI {
    async initData() {
        this.apiRequest(QuizClassroomApi.list(), (res) => {
            this.setStream('classrooms', res.data as QuizClassroomLite[])
        })
        this.reloadSubjects()
    }

    reloadSubjects(classroomId?: number) {
        this.apiRequest(QuizSubjectApi.list(classroomId), (res) => {
            this.setStream('subjects', res.data as QuizSubject[])
        })
    }

    createSubject(request: QuizSubjectRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizSubjectApi.create(request), () => {
            onComplete()
            this.reloadSubjects()
        }, { onError })
    }

    updateSubject(id: number, request: QuizSubjectRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizSubjectApi.update(id, request), () => {
            onComplete()
            this.reloadSubjects()
        }, { onError })
    }

    // Xoá xong thì tự dọn stream 'lessons' về [] - subject đang chọn (nếu vừa bị xoá) không còn
    // Lesson nào để hiện nữa, tránh trang giữ lại danh sách Lesson của 1 Subject đã biến mất.
    removeSubject(id: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizSubjectApi.remove(id), () => {
            onComplete()
            this.reloadSubjects()
            this.setStream('lessons', [])
        }, { onError })
    }

    loadLessons(subjectId: number) {
        this.apiRequest(QuizLessonApi.list(subjectId), (res) => {
            this.setStream('lessons', res.data as QuizLesson[])
        })
    }

    createLesson(request: QuizLessonCreateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLessonApi.create(request), () => {
            onComplete()
            this.loadLessons(request.subjectId)
        }, { onError })
    }

    updateLesson(id: number, subjectId: number, request: QuizLessonUpdateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLessonApi.update(id, request), () => {
            onComplete()
            this.loadLessons(subjectId)
        }, { onError })
    }

    removeLesson(id: number, subjectId: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLessonApi.remove(id), () => {
            onComplete()
            this.loadLessons(subjectId)
        }, { onError })
    }
}
