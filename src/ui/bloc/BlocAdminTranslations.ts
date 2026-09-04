import { IBlocUI } from "../../base/IBlocUI";
import { QuizLanguageApi, QuizAdminTranslationRow } from "../../api/QuizLanguageApi";

// Bloc trang "Quản lý bản dịch" (khu vực Admin, /app/admin/translations, 2026-09-04 - phần 4/4)
// - list/thêm/sửa/xoá key dịch qua base module's /public/language/** (LanguageApi.java) đã có
// sẵn, chỉ ghi (POST/PUT/DELETE) mới cần token ADMIN (xem PublicLanguageAdminGuardFilter.java bên
// backend). Cùng shape "content" bloc như BlocAdminParents.ts (dialog form qua form_view/req, xem
// đó cho comment đầy đủ) - khác ở chỗ langKey là khoá chính tự nhập (không phải id tự sinh) và có
// 1 request phụ setActive-tương-đương là save() dùng CHUNG cho cả thêm mới VÀ sửa (LanguageApi.java's
// addOrUpdate xử lý cả 2 trong 1 endpoint, không tách create()/update() riêng như hầu hết bloc
// khác trong app).
//
// v1 CHỈ hỗ trợ đúng 2 ngôn ngữ hệ thống đang có (vi/en, khớp public/languages/{vi,en}.json) -
// LỰA CHỌN CỐ Ý đơn giản hoá, KHÔNG đọc động danh sách ngôn ngữ từ dữ liệu trả về (dù
// LanguageApi.java bản thân không giới hạn số ngôn ngữ) - nếu sau này app hỗ trợ thêm ngôn ngữ thứ
// 3, sửa hằng số LANGS dưới đây là đủ, không cần đổi API.
export const ADMIN_TRANSLATION_LANGS = ['vi', 'en'] as const;

export class BlocAdminTranslations extends IBlocUI {
    reload(keyword?: string) {
        this.apiRequest(QuizLanguageApi.list(keyword), (res) => {
            this.setStream('rows', res.data as QuizAdminTranslationRow[])
        })
    }

    search(keyword: string) {
        this.setStream('keyword', keyword)
        this.reload(keyword || undefined)
    }

    remove(langKey: string, onComplete: () => void, onError: (error: any) => void) {
        this.apiRequest(QuizLanguageApi.deleteOne(langKey), () => {
            onComplete()
            this.reload(this.getField('keyword') || undefined)
        }, { onError })
    }

    openNew() {
        this.setField('req', { langKey: '', values: {} })
        this.setStream('isEditingKey', false)
        this.setStream('form_view', { isShow: true })
    }

    openEdit(row: QuizAdminTranslationRow) {
        const values: Record<string, string> = {}
        ADMIN_TRANSLATION_LANGS.forEach((lang) => { values[lang] = row[lang] ?? '' })
        this.setField('req', { langKey: row.langKey, values })
        this.setStream('isEditingKey', true)
        this.setStream('form_view', { isShow: true })
    }

    closeForm() {
        this.setStream('form_view', { isShow: false })
        this.setStream('submitting', false)
    }

    setValue(lang: string, value: string) {
        const req = this.getField('req') ?? { langKey: '', values: {} }
        this.setField('req', { ...req, values: { ...req.values, [lang]: value } })
    }

    // Thêm mới HOẶC cập nhật - đúng "Cho phép thêm/xóa key tự do" anh đã chọn: langKey rỗng/mới
    // đơn thuần tạo 1 dòng mới, LanguageApi.java's addOrUpdate không phân biệt 2 trường hợp (chỉ
    // upsert theo primary key (lang_key, lang) - xem V1__init.sql's translate table).
    save(onComplete: () => void, onError: (error: any) => void) {
        const req = this.getField('req') ?? {}
        if (!req.langKey || !req.langKey.trim()) {
            onError({ messageKey: 'required-field' })
            return
        }
        this.setStream('submitting', true)
        const done = () => { this.setStream('submitting', false); onComplete() }
        const fail = (error: any) => { this.setStream('submitting', false); onError(error) }
        this.apiRequest(QuizLanguageApi.upsert(req.langKey.trim(), req.values ?? {}), () => {
            done()
            this.reload(this.getField('keyword') || undefined)
        }, { onError: fail })
    }
}
