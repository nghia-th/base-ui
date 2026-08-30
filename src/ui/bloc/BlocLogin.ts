import { UserApi } from "../../api/UserApi";
import { IBlocUI } from "../../base/IBlocUI";
import LocalStorage from "../../base/LocalStorage";

// Pattern giống hệt module-ui/src/ui/bloc/BlocLogin.ts: Login.tsx gọi loginBloc.login(...),
// bloc gọi apiRequest() -> CallApiComponent -> ApiService (axios) -> auth-service thật.
export class BlocLogin extends IBlocUI {
    public login(onComplete: { (res: any): void }, onError: { (error: any): void }) {
        // ---- Pattern thật (giống module-ui) - bật lại khi đã nối auth-service thật ----
        // this.apiRequest(
        //     UserApi.login(this.getField('loginInfo')),
        //     (res) => onComplete(res),
        //     { onError }
        // )
        // ---------------------------------------------------------------------------

        // ---- DEV DEMO: base-ui chưa gắn backend nên tạm mock để xem toàn bộ layout/demo.
        // Xoá khối này khi đã bật khối apiRequest ở trên. ----
        void UserApi // giữ import để không bị lint cảnh báo "unused" khi bật lại API thật
        const info = this.getField('loginInfo')
        setTimeout(() => {
            if (!info?.username || !info?.password) {
                onError({ code: 400, messageKey: 'please-enter-username-password' })
                return
            }
            LocalStorage.setItem('token', 'DEV-DEMO-TOKEN')
            onComplete({
                code: 100,
                messageKey: 'login-success',
                data: {
                    fullName: info.username,
                    userId: info.username,
                    lang: LocalStorage.getItem('i18nextLng') ?? 'vi',
                    avatar: ''
                }
            })
        }, 400)
    }
}
