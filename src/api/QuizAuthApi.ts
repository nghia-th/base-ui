import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_AUTH_PREFIX } from "../base/PrefixService";

// API đăng nhập/đăng ký thật cho Hiểu Bài (quiz-service) - xem AuthApi.java bên backend.
// quiz-service tách RIÊNG 2 endpoint login theo role (khác UserApi.login() ở base/demo, 1 endpoint
// dùng chung cho mọi role) vì Parent và Student là 2 loại tài khoản khác nhau: Parent đăng nhập
// bằng email (ParentLoginRequest.java), Student đăng nhập bằng username do Parent tạo ra
// (StudentLoginRequest.java) - không có username/password chung một bảng user.
export class QuizAuthApi {
    // 2026-09-05: identifier accepts email, username, OR phone (AuthService#loginParent tries
    // all 3 columns) - renamed from `email` to reflect that, BlocQuizLogin.ts already used the
    // generic field name `identifier` at the UI layer before this change.
    static loginParent(identifier: string, password: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/parent/login`, { identifier, password });
    }

    static loginStudent(username: string, password: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/student/login`, { username, password });
    }

    // 2026-09-04 - đăng nhập quản trị viên (Admin, xem entity/Admin.java's javadoc: không có
    // đăng ký, chỉ 1 tài khoản đầu tiên được tạo sẵn lúc backend khởi động qua
    // AdminBootstrapRunner). Dùng lại đúng field email/password như loginParent - AdminLogin.tsx
    // là trang RIÊNG (không nằm trong ToggleButtonGroup Phụ huynh/Học sinh của Login.tsx), xem
    // BlocQuizLogin.ts's QuizLoginRole.
    // 2026-09-05: same identifier (email/username/phone) change as loginParent above.
    static loginAdmin(identifier: string, password: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/admin/login`, { identifier, password });
    }

    // Register.tsx (BlocQuizLogin.ts's register()) gọi hàm này - registerParent tự đăng nhập
    // luôn (trả về ParentAuthResponse giống hệt loginParent), xem AuthApi.java's Javadoc.
    // 2026-09-05: optional `username`, added last - keep the positional order backward-compatible
    // with the existing call sites that pass exactly 4 args.
    static registerParent(fullName: string, email: string, password: string, phone?: string, username?: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/parent/register`, { fullName, email, password, phone, username });
    }

    // 2026-09-04 (refresh token + force-logout, xem AuthService.java's javadoc):
    // logout() thu hồi refresh token của THIẾT BỊ NÀY - gọi lúc bấm nút "Đăng xuất" thường
    // (AppShell.tsx's handleLogout), fire-and-forget trước khi xoá LocalStorage + điều hướng
    // /login (không có refresh token đó nữa thì kể cả có ai đó cũ giữ được nó cũng không refresh
    // được access token mới nữa).
    static logout(refreshToken: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/logout`, { refreshToken });
    }

    // logoutAll() = "Đăng xuất khỏi mọi thiết bị" - thu hồi TẤT CẢ refresh token + tăng
    // tokenVersion (mọi access token đang có, kể cả thiết bị khác, hỏng ngay lần gọi API tiếp
    // theo) - cần token hợp lệ (khác logout() ở trên, endpoint này nằm sau JwtAuthFilter nên
    // KHÔNG dùng QUIZ_AUTH_PREFIX). role lấy từ LocalStorage.getItem('quizRole') vì 2 route khác
    // nhau theo prefix /api/parent hoặc /api/student (SessionApi.java bên backend).
    static logoutAll(role: 'parent' | 'student' | 'admin') {
        return QuizRequestBase.post(`/api/${role}/logout-all`, {});
    }

    // 2026-09-04 - đổi mật khẩu tự phục vụ (self-service), cho cả 3 role, theo đúng yêu cầu của
    // anh. Cần token hợp lệ (giống logoutAll ở trên, KHÔNG dùng QUIZ_AUTH_PREFIX) - AuthService's
    // changePassword() đọc CurrentUser.get() để biết đang đổi mật khẩu của ai, xác thực
    // oldPassword trước rồi mới lưu newPassword + đăng xuất NGAY mọi phiên (kể cả phiên hiện tại)
    // - xem AuthService.java's javadoc. ChangePasswordDialog.tsx (nơi gọi hàm này) phải điều
    // hướng về /login giống hệt handleLogout khi gọi thành công, xem đó cho luồng đầy đủ.
    static changePassword(role: 'parent' | 'student' | 'admin', oldPassword: string, newPassword: string) {
        return QuizRequestBase.post(`/api/${role}/change-password`, { oldPassword, newPassword });
    }

    // 2026-09-05: self-service set/change username (Parent or Admin only, see AuthService#setUsername)
    // - unlike changePassword, this does NOT force-logout, so no redirect handling is needed after it.
    static setUsername(role: 'parent' | 'admin', username: string) {
        return QuizRequestBase.post(`/api/${role}/set-username`, { username });
    }
}
