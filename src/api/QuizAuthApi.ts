import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import { QUIZ_AUTH_PREFIX } from "../base/PrefixService";

// API đăng nhập/đăng ký thật cho Hiểu Bài (quiz-service) - xem AuthApi.java bên backend.
// quiz-service tách RIÊNG 2 endpoint login theo role (khác UserApi.login() ở base/demo, 1 endpoint
// dùng chung cho mọi role) vì Parent và Student là 2 loại tài khoản khác nhau: Parent đăng nhập
// bằng email (ParentLoginRequest.java), Student đăng nhập bằng username do Parent tạo ra
// (StudentLoginRequest.java) - không có username/password chung một bảng user.
export class QuizAuthApi {
    static loginParent(email: string, password: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/parent/login`, { email, password });
    }

    static loginStudent(username: string, password: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/student/login`, { username, password });
    }

    // 2026-09-04 - đăng nhập quản trị viên (Admin, xem entity/Admin.java's javadoc: không có
    // đăng ký, chỉ 1 tài khoản đầu tiên được tạo sẵn lúc backend khởi động qua
    // AdminBootstrapRunner). Dùng lại đúng field email/password như loginParent - AdminLogin.tsx
    // là trang RIÊNG (không nằm trong ToggleButtonGroup Phụ huynh/Học sinh của Login.tsx), xem
    // BlocQuizLogin.ts's QuizLoginRole.
    static loginAdmin(email: string, password: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/admin/login`, { email, password });
    }

    // Register.tsx (BlocQuizLogin.ts's register()) gọi hàm này - registerParent tự đăng nhập
    // luôn (trả về ParentAuthResponse giống hệt loginParent), xem AuthApi.java's Javadoc.
    static registerParent(fullName: string, email: string, password: string, phone?: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/parent/register`, { fullName, email, password, phone });
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
}
