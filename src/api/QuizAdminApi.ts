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
}
