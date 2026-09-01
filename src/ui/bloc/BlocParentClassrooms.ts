import { IBlocUI } from "../../base/IBlocUI";
import { QuizClassroomApi, QuizClassroomRequest } from "../../api/QuizClassroomApi";

// Khớp ClassroomResponse.java.
export interface QuizClassroom {
    id: number;
    parentId: number;
    name: string;
}

// Bloc trang "Lớp học" (khu vực Phụ huynh, /app/parent/classrooms - MỚI) - đứng đầu chuỗi Lớp ->
// Môn học -> Bài học -> Câu hỏi, và là nơi mỗi Học sinh được set 1 lớp (thay field "grade" tự do
// cũ). Là bloc "content" (dùng reUseBlocContent trong Classrooms.tsx), giống hệt pattern
// BlocParentStudents.ts.
export class BlocParentClassrooms extends IBlocUI {
    async initData() {
        this.reload()
    }

    reload() {
        this.apiRequest(QuizClassroomApi.list(), (res) => {
            this.setStream('classrooms', res.data as QuizClassroom[])
        })
    }

    create(request: QuizClassroomRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizClassroomApi.create(request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    update(id: number, request: QuizClassroomRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizClassroomApi.update(id, request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    remove(id: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizClassroomApi.remove(id), () => {
            onComplete()
            this.reload()
        }, { onError })
    }
}
