import { QuizAuthApi } from "../../api/QuizAuthApi";
import { IBlocUI } from "../../base/IBlocUI";
import LocalStorage from "../../base/LocalStorage";

export type QuizLoginRole = 'parent' | 'student';

// Bloc đăng nhập THẬT cho Hiểu Bài (quiz-service) - khác BlocLogin.ts (giữ nguyên 100%, chỉ còn
// dùng để minh hoạ pattern cũ, không gắn vào route /login nữa - xem Login.tsx).
//
// Gọi QuizAuthApi (dựng trên QuizRequestBase/QuizApiService - adapter riêng, xem
// src/quiz-net/QuizApiService.ts) qua apiRequest() có sẵn ở IBloc - CallApi.ts (base, không đổi)
// vẫn xử lý response bình thường vì QuizApiService.ts đã dịch envelope thật của quiz-service sang
// đúng hình dạng {code:100/401/..., message, messageKey, data} mà CallApi.ts mong đợi.
//
// LƯU TOKEN THỦ CÔNG sau khi login thành công: base/ApiService.ts (bản gốc) tự lấy token từ 1
// response HEADER khi login xong, nhưng quiz-service trả token trong BODY (data.token - xem
// ParentAuthResponse.java/StudentAuthResponse.java), và QuizApiService.ts không tự làm việc đó
// (nó chỉ dịch envelope, không biết cấu trúc riêng của từng API) - nên phải set ở đây.
export class BlocQuizLogin extends IBlocUI {
    public login(role: QuizLoginRole, onComplete: { (res: any): void }, onError: { (error: any): void }) {
        const info = this.getField('loginInfo') ?? {}
        const request = role === 'parent'
            ? QuizAuthApi.loginParent(info.identifier, info.password)
            : QuizAuthApi.loginStudent(info.identifier, info.password)

        this.apiRequest(request, (res: any) => this.handleAuthSuccess(role, res, onComplete), { onError })
    }

    // AuthApi.java's registerParent tự đăng nhập luôn (trả về ParentAuthResponse giống hệt
    // loginParent - {token, parent}), nên dùng chung handleAuthSuccess bên dưới thay vì phải
    // đăng nhập lại lần 2 sau khi đăng ký xong (đúng ý định của backend - xem AuthApi.java's
    // Javadoc "so no separate login call is needed after registering").
    public register(fullName: string, email: string, password: string, phone: string | undefined,
                     onComplete: { (res: any): void }, onError: { (error: any): void }) {
        this.apiRequest(QuizAuthApi.registerParent(fullName, email, password, phone), (res: any) =>
            this.handleAuthSuccess('parent', res, onComplete), { onError })
    }

    // Lưu token thủ công (xem ghi chú ở đầu file) - dùng chung cho cả login và register vì cả 2
    // đều trả về đúng {data:{token, parent|student}}.
    private handleAuthSuccess(role: QuizLoginRole, res: any, onComplete: { (res: any): void }) {
        const token: string | undefined = res?.data?.token
        const profile = role === 'parent' ? res?.data?.parent : res?.data?.student
        LocalStorage.setItem('token', token ?? '')
        LocalStorage.setItem('quizRole', role)
        LocalStorage.setItem('quizProfile', JSON.stringify(profile ?? {}))
        onComplete({ ...res, role, profile })
    }
}
