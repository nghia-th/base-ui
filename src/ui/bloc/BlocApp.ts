import { IBlocUI } from "../../base/IBlocUI";
import { MENU_DATA, BREADCRUMB_DATA, MenuItem, BreadcrumbItem } from "../AppMenuData";

// BlocApp là Bloc của "shell" đã đăng nhập (topbar/sidebar/footer) - tương đương BlocApp bên
// module-ui. Nó giữ menu/breadcrumb, phát qua "loadInitStream".
// Lưu ý: state UI (theme sáng/tối, màu component, menu mode...) trước đây được giữ ở đây, nhưng đã
// chuyển lên BlocApplication (xem ui/bloc/BlocApplication.ts) - vì BlocApp chỉ tồn tại SAU khi vào
// khung AppShell, trong khi AlertDialog/ConfirmDialog (AppWrapper.tsx) render song song với
// AppShell chứ không phải con của nó, nên cần 1 nơi giữ theme sống suốt vòng đời app để cả hai phía
// cùng thấy đúng theme hiện tại.
export class BlocApp extends IBlocUI {
    init() {
        super.init()
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

    meta(location: { pathname: string }) {
        return (this._blocData['viewMain'].breadcrumb as BreadcrumbItem[]).find(o => o.path === location.pathname)
    }
}
