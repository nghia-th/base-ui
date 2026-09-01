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

// ---- Hiểu Bài (quiz-service) - prefix thật, thêm mới bên cạnh các PREFIX placeholder ở trên,
// không sửa/xoá gì đã có (giữ nguyên cho /demo/* dùng UserApi/DashboardApi cũ). quiz-service là
// 1 monolith (không tách microservice như module-ui), nên không có prefix riêng theo từng service -
// chỉ có 2 vùng route: /api/auth/** (không cần token) và /api/parent/**, /api/student/** (cần
// token, phân theo role - xem security/JwtAuthFilter.java bên backend). Các hằng số này được dùng
// bởi src/quiz-net/ (adapter mạng riêng cho quiz-service, xem QuizApiService.ts) và các *Api.ts
// mới thêm cho Hiểu Bài trong src/api/, KHÔNG dùng bởi base/ApiService.ts (file đó vẫn chỉ biết
// AUTH_PREFIX/USERS_PREFIX/UTILITIES_PREFIX ở trên, phục vụ riêng /demo/*).
export const QUIZ_AUTH_PREFIX = "/api/auth"
export const QUIZ_PARENT_PREFIX = "/api/parent"
export const QUIZ_STUDENT_PREFIX = "/api/student"
