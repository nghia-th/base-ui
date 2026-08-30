import { RequestBase } from "../base/RequestBase";
import { BASE_URL } from "../base/PrefixService";

// Giống module-ui: load file ngôn ngữ tĩnh dạng {"data": {...key-value...}}.
// base-ui đọc trực tiếp từ public/languages (không cần backend) - khi có backend thật,
// đổi sang gọi API kiểu DETECT_PREFIX+"/public/language/"+lang như module-ui đang làm.
export class ApiLanguage {
    static lang(lang: string | null = 'vi'): RequestBase {
        return RequestBase.get(`${BASE_URL}/languages/${lang}.json`)
    }
    static list(): RequestBase {
        return RequestBase.get(`${BASE_URL}/languages/listDataLanguages.json`)
    }
}
