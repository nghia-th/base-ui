import { IBlocUI } from "../../base/IBlocUI";
import { QuizAdminApi, QuizAdminCreateRequest } from "../../api/QuizAdminApi";

// Khớp AdminSummary.java (list()) - root/createdAt CHỈ trang này cần (khác AdminResponse thường
// dùng ở login, xem AdminSummary.java's javadoc).
export interface QuizAdminAdmin {
    id: number;
    fullName: string;
    email: string;
    root: boolean;
    createdAt: string;
}

// Bloc trang "Quản lý Admin" (khu vực Admin, /app/admin/admins, 2026-09-05) - list/create/delete
// tài khoản Admin KHÁC qua /api/admin/admins (AdminManageApi.java). Trang này (và cả bloc này)
// CHỈ tài khoản root mới vào được - xem AppShell.tsx's RequireAdminRoot + AppMenuData.ts's
// adminSidebarMenu (ẩn mục menu cho Admin thường). Cùng shape "content" bloc như
// BlocAdminParents.ts (xem đó cho comment đầy đủ) - khác ở chỗ không có setActive()/
// resetPassword() (Admin không tự khoá/mở hay đặt lại mật khẩu cho Admin khác trong v1, chỉ
// tạo/xoá) và không có update() (giống BlocAdminParents.ts).
export class BlocAdminAdmins extends IBlocUI {
    reload() {
        this.apiRequest(QuizAdminApi.listAdmins(), (res) => {
            this.setStream('admins', res.data as QuizAdminAdmin[])
        })
    }

    create(request: QuizAdminCreateRequest, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizAdminApi.createAdmin(request), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    // Xoá vĩnh viễn - backend luôn từ chối (QUIZ_031) nếu row này là root, xem
    // AdminManageService#delete's javadoc - Admins.tsx cũng ẩn sẵn nút xoá cho row root nên
    // trường hợp này chỉ có thể xảy ra qua gọi API trực tiếp, không phải luồng UI bình thường.
    remove(id: number, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizAdminApi.deleteAdmin(id), () => {
            onComplete()
            this.reload()
        }, { onError })
    }

    openNew() {
        this.setField('req', { fullName: '', email: '', password: '' })
        this.setStream('form_view', { isShow: true })
    }

    closeForm() {
        this.setStream('form_view', { isShow: false })
        this.setStream('submitting', false)
    }

    // Chỉ có tạo mới (không update()) - đúng field AdminCreateRequest.java, password luôn bắt
    // buộc, cùng shape validate như BlocAdminParents.ts's save().
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
            password: req.password
        }, done, fail)
    }
}
