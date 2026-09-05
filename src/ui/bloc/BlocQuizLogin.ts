import { QuizAuthApi } from "../../api/QuizAuthApi";
import { IBlocUI } from "../../base/IBlocUI";
import LocalStorage from "../../base/LocalStorage";

export type QuizLoginRole = 'parent' | 'student' | 'admin';

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
//
// VALIDATE + SUBMIT DỜI VÀO ĐÂY (2026-09-01, xem claude/ui-base-status.md "Quy ước state mới") -
// đúng pattern BlocCamera#onAdd của project mẫu module-ui: Login.tsx không còn tự tính điều kiện
// hợp lệ hay tự set trạng thái "đang gửi" bằng useState nữa, gọi thẳng doLogin() và chỉ lo hiển
// thị UI theo state đọc được từ bloc qua UIStream.
export class BlocQuizLogin extends IBlocUI {
    public doLogin(onComplete: { (res: any): void }, onError: { (error: any): void }) {
        const role: QuizLoginRole = this.getField('role') ?? 'parent'
        const req = this.getField('req') ?? {}
        if (!req.identifier || !req.password) {
            onError({ messageKey: 'please-enter-login-info' })
            return
        }
        this.setStream('submitting', true)
        // 2026-09-04: thêm nhánh 'admin' (AdminLogin.tsx gọi doLogin() y hệt Login.tsx, chỉ khác
        // là tự setStream('role','admin') trước - xem AdminLogin.tsx) - dùng lại đúng field
        // identifier/password (Admin đăng nhập bằng email, giống Parent - xem
        // QuizAuthApi.ts's loginAdmin).
        const request = role === 'parent'
            ? QuizAuthApi.loginParent(req.identifier, req.password)
            : role === 'student'
                ? QuizAuthApi.loginStudent(req.identifier, req.password)
                : QuizAuthApi.loginAdmin(req.identifier, req.password)

        this.apiRequest(request, (res: any) => {
            this.setStream('submitting', false)
            this.handleAuthSuccess(role, res, onComplete)
        }, {
            onError: (error: any) => {
                this.setStream('submitting', false)
                onError(error)
            }
        })
    }

    // AuthApi.java's registerParent tự đăng nhập luôn (trả về ParentAuthResponse giống hệt
    // loginParent - {token, parent}), nên dùng chung handleAuthSuccess bên dưới thay vì phải
    // đăng nhập lại lần 2 sau khi đăng ký xong (đúng ý định của backend - xem AuthApi.java's
    // Javadoc "so no separate login call is needed after registering").
    //
    // Validate dời vào đây (2026-09-01, xem Register.tsx's comment) - đọc field từ objectKey 'req'
    // + stream 'agree' riêng, giữ đúng 3 thông báo/variant cũ (warning cho thiếu field/chưa đồng ý
    // điều khoản, error cho mật khẩu không khớp) bằng cách gắn `variant` vào error object trả về
    // qua onError, Register.tsx đọc lại `error.variant` khi hiện snackbar.
    public register(onComplete: { (res: any): void }, onError: { (error: any): void }) {
        const req = this.getField('req') ?? {}
        const agree = this.getField('agree') ?? false
        if (!req.fullName || !req.email || !req.password) {
            onError({ messageKey: 'required-field', variant: 'warning' })
            return
        }
        if (req.password !== req.confirm) {
            onError({ messageKey: 'passwords-not-match', variant: 'error' })
            return
        }
        if (!agree) {
            onError({ messageKey: 'agree-terms', variant: 'warning' })
            return
        }
        this.setStream('submitting', true)
        // 2026-09-05: optional username, added last (see QuizAuthApi.ts's registerParent).
        this.apiRequest(QuizAuthApi.registerParent(req.fullName, req.email, req.password, req.phone || undefined, req.username || undefined), (res: any) => {
            this.setStream('submitting', false)
            this.handleAuthSuccess('parent', res, onComplete)
        }, {
            onError: (error: any) => {
                this.setStream('submitting', false)
                onError(error)
            }
        })
    }

    // Lưu token thủ công (xem ghi chú ở đầu file) - dùng chung cho cả login và register vì cả 2
    // đều trả về đúng {data:{accessToken, refreshToken, parent|student}}.
    //
    // 2026-09-04: backend đổi field {token} -> {accessToken, refreshToken} (thêm refresh token,
    // xem AuthService.java's javadoc + QuizApiService.ts's error interceptor) - đổi đúng 1 chỗ
    // đọc field ở đây, không đổi gì khác trong luồng login/register.
    private handleAuthSuccess(role: QuizLoginRole, res: any, onComplete: { (res: any): void }) {
        const accessToken: string | undefined = res?.data?.accessToken
        const refreshToken: string | undefined = res?.data?.refreshToken
        // 2026-09-04: AdminAuthResponse.java trả {..., admin} (khác {..., parent}/{..., student}) -
        // thêm nhánh thứ 3 tương ứng.
        const profile = role === 'parent' ? res?.data?.parent : (role === 'student' ? res?.data?.student : res?.data?.admin)
        LocalStorage.setItem('token', accessToken ?? '')
        LocalStorage.setRefreshToken(refreshToken ?? '')
        LocalStorage.setItem('quizRole', role)
        LocalStorage.setItem('quizProfile', JSON.stringify(profile ?? {}))
        //fullName
        LocalStorage.setItem('fullName', profile.fullName ?? '')
        onComplete({ ...res, role, profile })
    }
}
