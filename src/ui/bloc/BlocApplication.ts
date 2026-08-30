import IBloc from "../../base/IBloc";
import LocalStorage from "../../base/LocalStorage";
import { MultiRequest } from "../../base/CallApi";
import { ApiLanguage } from "../../api/ApiLanguage";
import i18n from "../i18next/i18next";

// BlocApplication là Bloc cấp cao nhất của toàn app (1 instance sống suốt vòng đời app),
// giữ blocCurrent (Bloc của trang/shell hiện tại) và phát các stream dùng chung:
// "loadInit" (trạng thái khởi tạo + yêu cầu đăng nhập), "dialogAlert", "dialogConfirm".
// Pattern giống hệt module-ui/src/ui/bloc/BlocApplication.ts.
export class BlocApplication extends IBloc {
    blocCurrent: any | null = null

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

export interface DialogBase {
    type?: number
    title?: string
    message?: string
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
