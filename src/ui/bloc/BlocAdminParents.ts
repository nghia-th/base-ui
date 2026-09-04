import { IBlocUI } from "../../base/IBlocUI";
import { QuizAdminApi, QuizAdminParentCreateRequest } from "../../api/QuizAdminApi";

// Khớp AdminParentSummary.java (list()) - active/createdAt CHỈ Admin thấy được (khác
// ParentResponse.java thường, xem AdminParentSummary.java's javadoc).
export interface QuizAdminParent {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
    active: boolean;
    createdAt: string;
}

// Bloc trang "Quản lý phụ huynh" (khu vực Admin, /app/admin/parents) - list/create/activate-
// deactivate/delete Parent qua /api/admin/parents (AdminParentApi.java). Cùng shape "content"
// bloc như BlocParentStudents.ts (dialog form qua form_view/req, xem đó cho comment đầy đủ) -
// khác ở chỗ không có update() (Admin không sửa thông tin Parent, chỉ tạo/khoá-mở/xoá, xem
// AdminParentApi.java's javadoc - không có PUT) và có thêm setActive() thay cho update().
export class BlocAdminParents extends IBlocUI {
    reload() {
        this.apiRequest(QuizAdminApi.listParents(), (res) => {
            this.setStream('parents', res.data as QuizAdminParent[])
        })
    }

    create(request: QuizAdminParentCreateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizAdminApi.createParent(request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    // Khoá (active=false) đăng xuất NGAY LẬP TỨC Parent này + mọi Student của họ ở phía backend
    // (xem AdminParentService#setActive's javadoc) - reload() ở đây chỉ để làm mới cột
    // active/status trên bảng, không có gì thêm cần làm ở phía client.
    setActive(id: number, active: boolean, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizAdminApi.setParentActive(id, active), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    remove(id: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizAdminApi.deleteParent(id), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    openNew() {
        this.setField('req', { fullName: '', email: '', phone: '', password: '' })
        this.setStream('form_view', { isShow: true })
    }

    closeForm() {
        this.setStream('form_view', { isShow: false })
        this.setStream('submitting', false)
    }

    // Chỉ có tạo mới (không update()) - đúng field ParentRegisterRequest.java, password luôn bắt
    // buộc (khác BlocParentStudents.ts's save(), không có nhánh "để trống = giữ nguyên" vì đây
    // luôn là tạo mới).
    save(onComplete: () => void, onError: (error: any) => void) {
        const req = this.getField('req') ?? {}
        if (!req.fullName || !req.email || !req.password) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        const done = () => { this.setStream('submitting', false); onComplete() }
        const fail = (error: any) => { this.setStream('submitting', false); onError(error) }
        this.create({
            fullName: req.fullName,
            email: req.email,
            password: req.password,
            phone: req.phone || undefined
        }, done, fail)
    }
}
