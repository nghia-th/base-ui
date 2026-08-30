import IBloc from "../../base/IBloc";
import LocalStorage from "../../base/LocalStorage";
import { MultiRequest } from "../../base/CallApi";
import { ApiLanguage } from "../../api/ApiLanguage";
import i18n from "../i18next/i18next";

export interface UIState {
    menuMode: string
    colorScheme: 'light' | 'dark'
    menuTheme: string
    componentTheme: string
    visualStyle: 'a' | 'b' | 'c'
    // true: nền/viền/trạng thái active của sidebar tự "hoà" theo màu accent (componentTheme)
    // đang chọn (xem harmonizeSidebarTone trong theme/muiTheme.ts). false: giữ nguyên bảng màu
    // tĩnh riêng của từng visual style, không phụ thuộc accent (hành vi trước khi có tính năng này).
    sidebarSyncAccent: boolean
    // Màu nền sidebar do người dùng tự chọn (hex) - null/undefined nghĩa là dùng màu mặc định của
    // visual style đang chọn. Khi có giá trị, nó thay cho màu nền mặc định rồi (nếu
    // sidebarSyncAccent bật) vẫn được hoà thêm với accent - xem createAppTheme trong theme/muiTheme.ts.
    sidebarColor: string | null
}

const DEFAULT_UI: UIState = {
    menuMode: 'static',
    colorScheme: 'light',
    menuTheme: 'dark',
    componentTheme: 'blue',
    visualStyle: 'a',
    sidebarSyncAccent: true,
    sidebarColor: null
}

// BlocApplication là Bloc cấp cao nhất của toàn app (1 instance sống suốt vòng đời app),
// giữ blocCurrent (Bloc của trang/shell hiện tại) và phát các stream dùng chung:
// "loadInit" (trạng thái khởi tạo + yêu cầu đăng nhập), "dialogAlert", "dialogConfirm", "ui".
// Pattern giống hệt module-ui/src/ui/bloc/BlocApplication.ts.
//
// "ui" (theme/màu/layout) được giữ Ở ĐÂY thay vì ở BlocApp (bloc riêng của khung sau đăng nhập) vì
// AlertDialog/ConfirmDialog (AppWrapper.tsx) được render SONG SONG với AppShell, không nằm trong
// cây con của AppShell - nếu theme chỉ tồn tại trong ThemeProvider riêng của AppShell, dialog sẽ
// KHÔNG BAO GIỜ thấy được màu component/chế độ sáng-tối người dùng đã chọn (bug thật đã gặp: dialog
// luôn hiện màu xanh dương mặc định dù đã đổi accent + dark mode). Đặt "ui" ở cấp BlocApplication
// (1 instance sống suốt app, có trước cả lúc đăng nhập) để AppWrapper.tsx bọc 1 ThemeProvider DUY
// NHẤT cho toàn bộ cây (Routes + dialogs), ai cũng thấy đúng theme hiện tại.
export class BlocApplication extends IBloc {
    blocCurrent: any | null = null

    // "ui" (tên bloc, dùng làm tiền tố key localStorage "base-ui-ui") phải là getter chứ KHÔNG
    // phải field initializer thường (`ui = 'base-ui'`) - lý do giống hệt BlocApp.ts trước đây: field
    // initializer của class con chỉ chạy SAU KHI constructor của class cha (IBloc) chạy xong, mà
    // IBloc's constructor lại gọi this.init() ngay bên trong nó. init() ở dưới cần đọc this.ui NGAY
    // LÚC ĐÓ để biết key localStorage cần đọc - nếu là field thường, this.ui vẫn undefined tại thời
    // điểm này (đọc/ghi nhầm key "undefined-ui" thay vì "base-ui-ui", cài đặt giao diện không bao
    // giờ được khôi phục đúng sau khi tải lại trang). Getter nằm trên prototype ngay từ lúc định
    // nghĩa class nên đọc được bất kể thứ tự khởi tạo field.
    get ui() { return 'base-ui' }

    init() {
        LocalStorage.delete('undefined-ui')
        this._blocData['UI'] = { ...DEFAULT_UI }
        const saved = LocalStorage.getItem(`${this.ui}-ui`)
        if (saved) {
            try {
                this._blocData['UI'] = { ...this._blocData['UI'], ...JSON.parse(saved) }
            } catch (e) {
            }
        } else {
            LocalStorage.setItem(`${this.ui}-ui`, JSON.stringify(this._blocData['UI']))
        }
    }

    getUI(): UIState {
        return this.getField('UI')
    }

    saveUI(patch: Partial<UIState>) {
        this._blocData['UI'] = { ...this._blocData['UI'], ...patch }
        LocalStorage.setItem(`${this.ui}-ui`, JSON.stringify(this._blocData['UI']))
        this.setStream('ui', this._blocData['UI'])
    }

    async loadInit(url: string) {
        this.log('BlocApplication.loadInit')
        const langKey = LocalStorage.getItem('i18nextLng') ?? 'vi'
        const requests: MultiRequest[] = []
        requests.push(new MultiRequest('lang', ApiLanguage.lang(langKey)))
        await this.apiSyncMultiRequest(requests, {
            onData: (key, res) => {
                switch (key) {
                    case 'lang':
                        i18n.removeResourceBundle(langKey, 'translations')
                        i18n.addResourceBundle(langKey, 'translations', res.data)
                        LocalStorage.setItem('i18nextLng', langKey)
                        break
                }
            }
        }, () => {
            if (!LocalStorage.getToken()) {
                this.setStream('loadInit', { loginRequire: { status: 1, url: url }, finish: true })
                return
            }
            this.setStream('loadInit', { loginRequire: { status: 0, url: '' }, finish: true })
        }, { isShowLoading: false })
    }

    showAlert(info: AlertProps, onCallBack?: { (action: any): void } | null, onHideCallBack?: { (): void } | null) {
        info.label = info.label ?? 'close'
        info.title = info.title ?? 'notification'
        info.message = info.message ?? 'message'
        info.type = info?.type ?? 0
        info.dismissableMask = info?.dismissableMask ?? true
        if (!info.onHide) {
            info.onHide = (action) => this.onHide(action)
        }
        info.isShow = true
        info.onCallBack = onCallBack
        info.onHideCallBack = onHideCallBack
        this.setStream('dialogAlert', info)
    }

    showAlertApi(message: string, onCallBack?: { (action: any): void } | null, onHideCallBack?: { (): void } | null) {
        const info: AlertProps = { title: 'error', label: 'close' }
        info.message = message
        info.type = 0
        info.dismissableMask = true
        info.onHide = (action) => this.onHide(action)
        info.isShow = true
        info.onCallBack = onCallBack
        info.onHideCallBack = onHideCallBack
        this.setStream('dialogAlert', info)
    }

    showConfirm(info: ConfirmProps, onCallBack?: { (action: any): void } | null, onHideCallBack?: { (): void } | null) {
        info.labelNo = info.labelNo ?? 'no'
        info.labelYes = info.labelYes ?? 'yes'
        info.title = info.title ?? 'title'
        info.message = info.message ?? 'message'
        info.type = info.type ?? 1
        info.dismissableMask = info.dismissableMask ?? false
        if (!info.onHide) {
            info.onHide = (action) => this.onHide(action)
        }
        info.isShow = true
        info.onCallBack = onCallBack
        info.onHideCallBack = onHideCallBack
        this.setStream('dialogConfirm', info)
    }

    private onHide(action: DialogBase) {
        if (action) {
            action.isShow = false
            switch (action.type) {
                case 1:
                    this.setStream('dialogConfirm', action)
                    break
                case 0:
                    this.setStream('dialogAlert', action)
                    break
                default:
                    this.setStream('dialogAlert', action)
            }
            action.onHideCallBack?.()
        }
    }
}

// Sắc thái màu của dialog (AlertDialog/ConfirmDialog) - quyết định màu header + nút chính + icon
// minh hoạ. Trùng tên với các màu palette chuẩn của MUI (primary/info/success/warning/error) nên
// dùng thẳng làm giá trị cho prop "color" của Button/Chip... - "primary" (mặc định) chính là màu
// component/accent người dùng đang chọn ở AppConfigDrawer (xem createAppTheme trong
// theme/muiTheme.ts), nên đổi accent ở đó thì dialog cũng đổi màu theo tự động.
export type DialogTone = 'primary' | 'info' | 'success' | 'warning' | 'error'

export interface DialogBase {
    type?: number
    title?: string
    message?: string
    // Không set = 'primary' (ăn theo màu component/accent hiện tại). Set 'error' cho hành động
    // nguy hiểm (xoá...), 'warning' cảnh báo, 'success' xác nhận việc đã thành công, 'info' thông
    // tin trung tính. Alert vẫn tương thích ngược: type===2 (cũ) tự suy ra tone='error' nếu không
    // set tone tường minh - xem AlertDialog.tsx.
    tone?: DialogTone
    onCallBack?: { (action: any): void } | null
    onHideCallBack?: { (): void } | null
    onHide?: { (action: any): void }
    dismissableMask?: boolean
    isShow?: boolean
}

export interface AlertProps extends DialogBase {
    label?: string
}

export interface ConfirmProps extends DialogBase {
    labelNo?: string
    labelYes?: string
}
