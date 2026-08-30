// Quy ước prefix theo từng microservice backend (giống module-ui: mỗi service có 1 prefix riêng).
// base-ui là project khung (boilerplate) nên các prefix dưới đây chỉ là placeholder - đổi lại
// theo backend thật khi dùng cho dự án cụ thể, hoặc thêm PREFIX mới cho service mới.
export const API_PREFIX = "/api"

export const AUTH_PREFIX = "/auth-service" + API_PREFIX
export const USERS_PREFIX = "/users-service" + API_PREFIX
export const UTILITIES_PREFIX = "/utilities-service" + API_PREFIX
export const PUBLIC = API_PREFIX + "/public"

// BASE_URL dùng để build route/asset (giống module-ui dùng "/detect").
// base-ui mặc định chạy ở root nên để rỗng; đổi thành "/ten-app" nếu deploy dưới sub-path.
export const BASE_URL = ""

export const SERVICE_NAME = ""
export const WEB_SOCKET_PREFIX = "/utilities-service" + API_PREFIX
