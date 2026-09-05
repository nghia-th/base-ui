import { IBlocUI } from "../../base/IBlocUI";
import { QuizCurriculumApi, QuizCurriculumRequest, QuizCurriculum } from "../../api/QuizCurriculumApi";

// Bloc trang "Quản lý Bộ sách" (khu vực Admin, /app/admin/curricula - MỚI, 2026-09-05) - CRUD đơn
// giản 1 cấp (chỉ field "name") cho danh sách Bộ sách dùng ở tính năng Thư viện sách giáo khoa,
// thay cho danh sách 3 giá trị cứng cũ (xem CURRICULA cũ ở admin/Library.tsx). Cùng khuôn hệt
// BlocParentClassrooms.ts (content bloc + form_view/req/submitting cho Dialog thêm/sửa).
export class BlocAdminCurricula extends IBlocUI {
    async initData() {
        this.reload()
    }

    reload() {
        this.apiRequest(QuizCurriculumApi.list(), (res) => {
            this.setStream('curricula', res.data as QuizCurriculum[])
        })
    }

    create(request: QuizCurriculumRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizCurriculumApi.create(request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    update(id: number, request: QuizCurriculumRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizCurriculumApi.update(id, request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    remove(id: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizCurriculumApi.remove(id), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    openNew() {
        this.setField('req', { name: '' })
        this.setStream('form_view', { isShow: true, id: 0 })
    }

    openEdit(row: QuizCurriculum) {
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
