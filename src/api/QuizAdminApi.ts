import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_ADMIN_PREFIX } from "../base/PrefixService";

// API quản trị Phụ huynh cho Admin (2026-09-04) - xem AdminParentApi.java/AdminParentService.java
// bên backend. Khớp ParentRegisterRequest.java (create dùng LẠI đúng DTO này - AdminParentApi.java
// nhận thẳng ParentRegisterRequest, không có DTO riêng) - khác QuizStudentApi.ts (Parent tự quản
// lý Student CON của mình) ở chỗ Admin quản lý MỌI Parent trong hệ thống, không giới hạn theo
// CurrentUser.get().userId() (xem AdminParentApi.java's javadoc).
export interface QuizAdminParentCreateRequest {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}

// Khớp AdminCreateRequest.java (2026-09-05, tính năng "Admin quản lý Admin") - không có "phone"
// (khác QuizAdminParentCreateRequest ở trên) vì tài khoản Admin không dùng field này.
export interface QuizAdminCreateRequest {
    fullName: string;
    email: string;
    password: string;
}

export class QuizAdminApi {
    static listParents() {
        return QuizRequestBase.get(`${QUIZ_ADMIN_PREFIX}/parents`);
    }

    static createParent(request: QuizAdminParentCreateRequest) {
        return QuizRequestBase.post(`${QUIZ_ADMIN_PREFIX}/parents`, request);
    }

    // Bật/khoá tài khoản - khoá (active=false) đăng xuất NGAY LẬP TỨC Parent này + mọi Student của
    // họ (xem AdminParentService#setActive's javadoc), không chỉ chặn lần đăng nhập kế tiếp.
    static setParentActive(id: number, active: boolean) {
        return QuizRequestBase.patch(`${QUIZ_ADMIN_PREFIX}/parents/${id}/active`, { active });
    }

    // 2026-09-04 - Admin tự nhập mật khẩu mới trực tiếp cho Parent (cùng UX với tạo Parent, xem
    // AdminResetPasswordRequest.java's javadoc) - chỉ đăng xuất NGAY các phiên của CHÍNH Parent
    // này (không đăng xuất Student của họ - đổi mật khẩu Parent không đụng tới tài khoản Student),
    // xem AdminParentService#resetPassword's javadoc.
    static resetParentPassword(id: number, newPassword: string) {
        return QuizRequestBase.post(`${QUIZ_ADMIN_PREFIX}/parents/${id}/reset-password`, { newPassword });
    }

    // Xoá VĨNH VIỄN, cascade toàn bộ dữ liệu của Parent này - không có rule chặn nào (theo đúng
    // quyết định của anh khi scope tính năng này: "Xoá hẳn toàn bộ (cascade) - không chặn"), xem
    // AdminParentService#deleteCascade's javadoc. Không thể hoàn tác.
    static deleteParent(id: number) {
        return QuizRequestBase.delete(`${QUIZ_ADMIN_PREFIX}/parents/${id}`);
    }

    // 2026-09-05 - "Admin quản lý Admin" (tạo/xoá tài khoản Admin khác), xem AdminManageApi.java.
    // TOÀN BỘ 3 hàm dưới đây chỉ tài khoản root gọi được - Admin thường gọi vẫn nhận lỗi 403
    // COMMON_004 FORBIDDEN từ backend (AdminManageService#requireRoot), cho dù trang/menu phía
    // frontend đã ẩn sẵn (xem AppMenuData.ts's adminSidebarMenu + AppShell.tsx's RequireAdminRoot).
    static listAdmins() {
        return QuizRequestBase.get(`${QUIZ_ADMIN_PREFIX}/admins`);
    }

    static createAdmin(request: QuizAdminCreateRequest) {
        return QuizRequestBase.post(`${QUIZ_ADMIN_PREFIX}/admins`, request);
    }

    // Xoá vĩnh viễn - luôn thất bại (QUIZ_031 ROOT_ADMIN_CANNOT_BE_DELETED) nếu id là chính tài
    // khoản root, xem AdminManageService#delete's javadoc. Admin không sở hữu dữ liệu Parent/
    // Student nào nên không có gì để cascade, khác AdminParentApi.deleteParent ở trên.
    static deleteAdmin(id: number) {
        return QuizRequestBase.delete(`${QUIZ_ADMIN_PREFIX}/admins/${id}`);
    }
}
