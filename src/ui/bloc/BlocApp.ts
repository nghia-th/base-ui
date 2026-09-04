import { IBlocUI } from "../../base/IBlocUI";
import { MENU_DATA, BREADCRUMB_DATA, MenuItem, BreadcrumbItem } from "../AppMenuData";
import { QuizAuthApi } from "../../api/QuizAuthApi";
import LocalStorage from "../../base/LocalStorage";

// BlocApp là Bloc của "shell" đã đăng nhập (topbar/sidebar/footer) - tương đương BlocApp bên
// module-ui. Nó giữ menu/breadcrumb, phát qua "loadInitStream".
// Lưu ý: state UI (theme sáng/tối, màu component, menu mode...) trước đây được giữ ở đây, nhưng đã
// chuyển lên BlocApplication (xem ui/bloc/BlocApplication.ts) - vì BlocApp chỉ tồn tại SAU khi vào
// khung AppShell, trong khi AlertDialog/ConfirmDialog (AppWrapper.tsx) render song song với
// AppShell chứ không phải con của nó, nên cần 1 nơi giữ theme sống suốt vòng đời app để cả hai phía
// cùng thấy đúng theme hiện tại.
export class BlocApp extends IBlocUI {
    init() {
        super.init()
        this._blocData['viewMain'] = { menu: MENU_DATA as MenuItem[], breadcrumb: BREADCRUMB_DATA as BreadcrumbItem[] }
    }

    async initData() {
        // module-ui build menu động ở đây bằng cách gọi UserApi.myPermission()/module() qua
        // this.apiSyncMultiRequest(...) rồi map quyền -> menu (xem BlocApp.ts bên module-ui).
        // base-ui dùng menu tĩnh (AppMenuData.ts) để không phụ thuộc backend; khi có backend thật,
        // thay thân hàm này bằng apiSyncMultiRequest giống module-ui rồi build lại
        // this._blocData['viewMain'].menu/breadcrumb từ dữ liệu trả về.
        this.setStream('loadInitStream', this._blocData['viewMain'])
    }

    meta(location: { pathname: string }) {
        return (this._blocData['viewMain'].breadcrumb as BreadcrumbItem[]).find(o => o.path === location.pathname)
    }

    // 2026-09-04 - đổi mật khẩu tự phục vụ (self-service, cả 3 role), xem QuizAuthApi.ts's
    // changePassword() và AuthService.java's javadoc. Đặt ở BlocApp (không phải bloc riêng) vì
    // AppShell.tsx đã sẵn có blocApp cho mọi trang đã đăng nhập - ChangePasswordDialog.tsx (nơi
    // hiện dialog này) dùng lại đúng bloc đó, giống cách AppTopbar.tsx đã dùng blocApp cho
    // loadLang() ở trên.
    openChangePassword() {
        this.setField('oldPassword', '', 'req_change_password')
        this.setField('newPassword', '', 'req_change_password')
        this.setStream('change_password_view', { isShow: true })
    }

    closeChangePassword() {
        this.setStream('change_password_view', { isShow: false })
        this.setStream('change_password_submitting', false)
    }

    // Thành công = đổi mật khẩu XONG VÀ đăng xuất NGAY mọi phiên (kể cả phiên hiện tại, xem
    // AuthService#changePassword's javadoc) - onComplete ở ChangePasswordDialog.tsx phải điều
    // hướng /login giống hệt AppShell.tsx's handleLogout, KHÔNG chỉ đóng dialog lại.
    saveChangePassword(onComplete: () => void, onError: (error: any) => void) {
        const oldPassword = this.getField('oldPassword', 'req_change_password')
        const newPassword = this.getField('newPassword', 'req_change_password')
        if (!oldPassword || !newPassword) {
            onError({ messageKey: 'required-field' })
            return
        }
        const role = (LocalStorage.getItem('quizRole') ?? 'parent') as 'parent' | 'student' | 'admin'
        this.setStream('change_password_submitting', true)
        const done = () => { this.setStream('change_password_submitting', false); onComplete() }
        const fail = (error: any) => { this.setStream('change_password_submitting', false); onError(error) }
        this.apiRequest(QuizAuthApi.changePassword(role, oldPassword, newPassword), () => {
            done()
        }, { onError: fail })
    }
}
