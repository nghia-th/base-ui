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

    // Register.tsx (BlocQuizLogin.ts's register()) gọi hàm này - registerParent tự đăng nhập
    // luôn (trả về ParentAuthResponse giống hệt loginParent), xem AuthApi.java's Javadoc.
    static registerParent(fullName: string, email: string, password: string, phone?: string) {
        return QuizRequestBase.post(`${QUIZ_AUTH_PREFIX}/parent/register`, { fullName, email, password, phone });
    }
}
