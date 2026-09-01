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

    // Dialog form (2026-09-01, xem BlocParentStudents.ts's comment cho lý do chi tiết) - cùng
    // pattern form_view/req/submitting.
    openNew() {
        this.setField('req', { name: '' })
        this.setStream('form_view', { isShow: true, id: 0 })
    }

    openEdit(row: QuizClassroom) {
        this.setField('req', { name: row.name })
        this.setStream('form_view', { isShow: true, id: row.id })
    }

    closeForm() {
        this.setStream('form_view', { isShow: false, id: 0 })
        this.setStream('submitting', false)
    }

    save(onComplete: () => void, onError: (error: any) => void) {
        const view = this.getField('form_view') ?? {}
        const req = this.getField('req') ?? {}
        if (!req.name) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        const done = () => { this.setStream('submitting', false); onComplete() }
        const fail = (error: any) => { this.setStream('submitting', false); onError(error) }
        const isEditing = (view.id ?? 0) > 0
        if (isEditing) {
            this.update(view.id, { name: req.name }, done, fail)
        } else {
            this.create({ name: req.name }, done, fail)
        }
    }
}
