import { QuizRequestBase } from "../quiz-net/QuizRequestBase";

// Client cho API dịch ngôn ngữ có sẵn trong module base (2026-09-04, phần 4/4 - Admin sửa bản dịch
// UI mà không cần deploy lại code) - xem base/i18n/LanguageApi.java + PublicLanguageAdminGuardFilter.java
// bên backend (filter mới CHỈ gác các method ghi POST/PUT/DELETE bằng token ADMIN, GET vẫn mở cho
// mọi người - xem filter's javadoc). "/public/language" là path THẬT của LanguageApi.java (base
// module tự @RequestMapping vậy, KHÔNG có tiền tố /api - khác PUBLIC constant trong
// base/PrefixService.ts vốn là "/api/public", không dùng được ở đây) nên hằng số prefix được khai
// báo thẳng trong file này thay vì tái dùng PrefixService.ts.
const LANGUAGE_PREFIX = "/public/language";

// Khớp 1 dòng trong Language#loadList (base module) - {langKey, vi, en, ...} - mỗi ngôn ngữ hệ
// thống đang hỗ trợ (vi/en, xem public/languages/) là 1 field động. Dùng index signature vì
// LanguageApi.java không cố định số ngôn ngữ (loadList tự liệt kê MỌI lang có ít nhất 1 giá trị).
export interface QuizAdminTranslationRow {
    langKey: string;
    [lang: string]: string;
}

export class QuizLanguageApi {
    // Danh sách toàn bộ key dịch, optionally lọc theo keyword (khớp key HOẶC bất kỳ giá trị ngôn
    // ngữ nào chứa keyword - xem Language#loadList bên backend). Method GET - không cần token
    // (PublicLanguageAdminGuardFilter chỉ gác method ghi), nhưng trang Admin vẫn chỉ gọi được sau
    // khi đăng nhập Admin (route /app/admin/translations đã có RequireQuizRole role="admin" chặn
    // ở tầng UI - xem AppShell.tsx).
    static list(keyword?: string) {
        return QuizRequestBase.get(`${LANGUAGE_PREFIX}/list`, keyword ? { params: { keyword } } : undefined);
    }

    // Thêm mới HOẶC cập nhật 1 key (langKey trùng key có sẵn = cập nhật giá trị, key mới = thêm) -
    // đúng "Cho phép thêm/xóa key tự do" anh đã chọn (không chỉ sửa giá trị key có sẵn). Khớp
    // LanguageRequest.java: {langKey, mapValues: {vi: "...", en: "..."}}. Cần token ADMIN (POST -
    // PublicLanguageAdminGuardFilter gác).
    static upsert(langKey: string, mapValues: Record<string, string>) {
        return QuizRequestBase.post(LANGUAGE_PREFIX, { langKey, mapValues });
    }

    // Xoá 1 key khỏi TẤT CẢ ngôn ngữ. LanguageApi.java's delete(@RequestBody String langKey) nhận
    // body là 1 chuỗi JSON TRẦN (vd "quiz-question-video", có dấu ngoặc kép), không phải object -
    // nên phải JSON.stringify(langKey) rồi truyền qua deleteWithBody (xem QuizRequestBase.ts's
    // comment cho lý do cần method riêng này). Cần token ADMIN.
    static deleteOne(langKey: string) {
        return QuizRequestBase.deleteWithBody(LANGUAGE_PREFIX, JSON.stringify(langKey));
    }

    // Xoá nhiều key cùng lúc - body là mảng JSON các langKey (LanguageApi.java's deletes(@RequestBody
    // List<String> langKeys)), khác endpoint xoá 1 key ở trên (body không phải chuỗi trần nữa mà
    // là mảng, nên JSON.stringify(langKeys) ra đúng hình dạng mảng JSON cần thiết). Cần token ADMIN.
    static deleteMany(langKeys: string[]) {
        return QuizRequestBase.deleteWithBody(`${LANGUAGE_PREFIX}/deletes`, JSON.stringify(langKeys));
    }

    // Toàn bộ bản dịch Admin đã lưu đè cho 1 ngôn ngữ, dạng {langKey: value} - dùng để LỚP ĐÈ lên
    // bundle tĩnh vi.json/en.json lúc runtime (xem IBlocUI.loadLang/BlocApplication.loadInit) chứ
    // KHÔNG dùng cho trang quản trị (trang đó dùng list() ở trên, đã có sẵn cột theo từng ngôn
    // ngữ). Method GET - không cần token, gọi được TRƯỚC khi đăng nhập (đúng như bundle tĩnh).
    static overrides(lang: string) {
        return QuizRequestBase.get(`${LANGUAGE_PREFIX}/${lang}`);
    }
}
