import axios, {AxiosRequestConfig, CreateAxiosDefaults} from "axios";
import qs from "qs";
import LocalStorage from "../base/LocalStorage";
import {QUIZ_AUTH_PREFIX} from "../base/PrefixService";

// ---------------------------------------------------------------------------------------------
// Adapter mạng riêng cho quiz-service - KHÔNG đụng tới base/ApiService.ts hay base/CallApi.ts
// (quyết định #1 trong claude/ui-base-status.md, phương án C anh đã chọn: giữ base/ 100% nguyên
// bản để còn đồng bộ lại với template base-ui gốc sau này).
//
// Lý do phải có 1 axios instance RIÊNG (không đăng ký thêm interceptor lên chung 1 instance `API`
// của base/ApiService.ts): base/ApiService.ts's error-interceptor CHỈ đọc error.response.status/
// statusText rồi RESOLVE promise luôn (không reject nữa) - nghĩa là response.data GỐC của backend
// (chứa message/code thật của quiz-service, vd "Subject still has lessons...", "QUIZ_005") đã bị
// vứt bỏ trước khi tới bất kỳ interceptor nào đăng ký SAU nó. Muốn giữ được message thật, interceptor
// của mình phải là interceptor ĐẦU TIÊN thấy raw response/error - chỉ làm được bằng 1 instance riêng.
//
// 2 việc instance này làm mà base/ApiService.ts không làm đúng cho quiz-service thật:
// 1) Gửi token qua header chuẩn `Authorization: Bearer <token>` (base/ApiService.ts gửi header
//    tuỳ biến `token`, JwtAuthFilter.java bên backend không đọc header đó - xem ui-base-status.md).
// 2) Dịch envelope thật của quiz-service ({success, code:"COMMON_000"/"QUIZ_004", message, data,
//    timestamp} - xem base/response/ApiResponse.java) sang đúng hình dạng base/CallApi.ts đang
//    hardcode kỳ vọng ({code:100, message, messageKey, data} khi thành công; code=401/999 khi cần
//    onUnAuth) - CallApi.ts so sánh `res.data.code === 100`/`997`/`998`/`999` là SỐ, không phải
//    chuỗi, nên nếu không dịch thì MỌI response thành công của quiz-service sẽ bị hiểu nhầm là lỗi.
//
// quiz-service KHÔNG có endpoint refresh-token (task 1 không yêu cầu, chưa code) - khác hẳn
// base/ApiService.ts's cơ chế tự refresh khi gặp mã 998/403. Instance này CHỦ ĐỘNG không làm theo
// cơ chế đó: token hết hạn/sai sẽ trả thẳng code=401 -> base/CallApi.ts tự gọi onUnAuth() (đăng xuất
// + về /login), đúng hành vi thật duy nhất quiz-service hỗ trợ. Nếu sau này quiz-service có thêm
// refresh-token thật, sửa lại đúng 1 chỗ này (response error-interceptor bên dưới), không phải sửa
// base/ApiService.ts.
// ---------------------------------------------------------------------------------------------

const QUIZ_API = axios.create({
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
    paramsSerializer: (params) => qs.stringify(params, {encode: true})
} as CreateAxiosDefaults);

function getToken(): string {
    return LocalStorage.getToken() ?? ''
}

// Không gắn Authorization cho 3 endpoint đăng ký/đăng nhập (QUIZ_AUTH_PREFIX = "/api/auth") -
// đúng như JwtAuthFilter.java: filter chỉ áp cho /api/parent/**, /api/student/**, /api/auth/**
// luôn mở, gắn token thừa vào đó vô hại nhưng không cần thiết.
QUIZ_API.interceptors.request.use((request) => {
    const token = getToken()
    if (token && !request.url?.startsWith(QUIZ_AUTH_PREFIX)) {
        request.headers['Authorization'] = `Bearer ${token}`
    }
    return request
})

// Response 2xx: quiz-service's BaseCtl.ok(...) luôn trả { success:true, code:"COMMON_000",
// message, data, timestamp } khi request tới được đây (mọi lỗi nghiệp vụ đều throw exception ->
// GlobalExceptionHandler -> HTTP status khác 2xx, xử lý ở nhánh error bên dưới, KHÔNG rơi vào đây
// với success:false) - nên chỉ cần dịch thẳng sang code=100 (thành công) mà không cần kiểm tra lại
// `success`. Vẫn phòng thủ thêm 1 dòng cho trường hợp hiếm gặp/tương lai (1 endpoint nào đó lỡ trả
// success:false kèm 2xx) để không hiểu nhầm thành thành công.
QUIZ_API.interceptors.response.use((response) => {
    // Tải file (template import Excel/CSV, task 4 - GET .../import-template với config
    // {responseType:'blob'}) trả thẳng byte[] chứ không phải JSON envelope {success,code,...} -
    // KHÔNG dịch response.data trong trường hợp này, để nguyên Blob thật cho CallApi.ts's nhánh
    // `res?.config.responseType==='blob'` (base/CallApi.ts, không đổi) đọc đúng.
    if (response.config.responseType === 'blob') {
        return response
    }
    const body = response.data ?? {}
    if (body.success === false) {
        // Phòng thủ - không nên xảy ra thật (mọi lỗi nghiệp vụ throw exception nên đi thẳng ra
        // HTTP status khác 2xx, xử lý ở nhánh error bên dưới). Nếu có 1 endpoint nào đó lỡ trả
        // success:false kèm 2xx, dịch sang 1 mã KHÁC 100/401/998/999 (base/CallApi.ts coi đây là
        // lỗi thường qua onError, không đăng xuất) thay vì để lọt qua như thành công.
        response.data = {
            code: -1,
            message: body.message,
            messageKey: body.code,
            httpError: false,
            data: null
        }
        return response
    }
    response.data = {
        code: 100,
        message: body.message,
        messageKey: body.code,
        data: body.data
    }
    return response
}, (error) => {
    // Bắt lỗi ở ĐÂY (trước khi bất kỳ ai khác kịp vứt bỏ error.response.data) để giữ được đúng
    // message/code thật quiz-service trả về (vd "Subject still has lessons - delete its lessons
    // first" / "QUIZ_005"), thay vì chỉ có statusText chung chung ("Conflict").
    try {
        const status: number | undefined = error?.response?.status
        const body = error?.response?.data // ApiResponse.error(...): { success:false, code, message, timestamp }
        if (status && body) {
            return Promise.resolve({
                data: {
                    code: status, // base/CallApi.ts: code===401 -> onUnAuth() (đúng, JwtAuthFilter trả 401 khi thiếu/sai/hết hạn token)
                    message: body.message,
                    messageKey: body.code, // vd "QUIZ_005" - dùng làm key tra cứu bản dịch lỗi cụ thể nếu cần, xem public/languages
                    httpError: true,
                    data: null
                }
            })
        }
        // Không có error.response (mất mạng, CORS, timeout...) - không có body để đọc.
        return Promise.resolve({
            data: {code: status ?? 0, message: error?.message ?? 'error', messageKey: 'error', httpError: true, data: null}
        })
    } catch (e) {
        return Promise.resolve({data: {code: 0, message: 'error', messageKey: 'error', httpError: true, data: null}})
    }
})

export async function quizGet(url: string, config?: AxiosRequestConfig) {
    return await QUIZ_API.get(url, config)
}
export async function quizPost(url: string, data?: any, config?: AxiosRequestConfig) {
    return await QUIZ_API.post(url, data, config)
}
export async function quizPut(url: string, data?: any, config?: AxiosRequestConfig) {
    return await QUIZ_API.put(url, data, config)
}
export async function quizPatch(url: string, data?: any, config?: AxiosRequestConfig) {
    return await QUIZ_API.patch(url, data, config)
}
export async function quizDelete(url: string, config?: AxiosRequestConfig) {
    return await QUIZ_API.delete(url, config)
}
export default QUIZ_API
