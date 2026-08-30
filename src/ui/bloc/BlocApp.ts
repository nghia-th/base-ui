import { IBlocUI } from "../../base/IBlocUI";
import LocalStorage from "../../base/LocalStorage";
import { MENU_DATA, BREADCRUMB_DATA, MenuItem, BreadcrumbItem } from "../AppMenuData";

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

// BlocApp là Bloc của "shell" đã đăng nhập (topbar/sidebar/footer) - tương đương BlocApp bên
// module-ui. Nó giữ state UI (theme/menu mode) + menu/breadcrumb, phát qua "ui" và "loadInitStream".
export class BlocApp extends IBlocUI {
    ui = 'base-ui'

    init() {
        super.init()
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
        this._blocData['viewMain'] = { menu: MENU_DATA as MenuItem[], breadcrumb: BREADCRUMB_DATA as BreadcrumbItem[] }
    }

    async initData() {
        // module-ui build menu động ở đây bằng cách gọi UserApi.myPermission()/module() qua
        // this.apiSyncMultiRequest(...) rồi map quyền -> menu (xem BlocApp.ts bên module-ui).
        // base-ui dùng menu tĩnh (AppMenuData.ts) để không phụ thuộc backend; khi có backend thật,
        // thay thân hàm này bằng apiSyncMultiRequest giống module-ui rồi build lại
        // this._blocData['viewMain'].menu/breadcrumb từ dữ liệu trả về.
        this.setStream('loadInitStream', this._blocData['viewMain'])
    }

    getUI(): UIState {
        return this.getField('UI')
    }

    saveUI(patch: Partial<UIState>) {
        this._blocData['UI'] = { ...this._blocData['UI'], ...patch }
        LocalStorage.setItem(`${this.ui}-ui`, JSON.stringify(this._blocData['UI']))
        this.setStream('ui', this._blocData['UI'])
    }

    meta(location: { pathname: string }) {
        return (this._blocData['viewMain'].breadcrumb as BreadcrumbItem[]).find(o => o.path === location.pathname)
    }
}
