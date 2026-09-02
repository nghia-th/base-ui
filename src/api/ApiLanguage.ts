import { RequestBase } from "../base/RequestBase";
import { BASE_URL } from "../base/PrefixService";
// import process from "process";

// Giống module-ui: load file ngôn ngữ tĩnh dạng {"data": {...key-value...}}.
// base-ui đọc trực tiếp từ public/languages (không cần backend) - khi có backend thật,
// đổi sang gọi API kiểu DETECT_PREFIX+"/public/language/"+lang như module-ui đang làm.
export class ApiLanguage {
    static lang(lang: string | null = 'vi'): RequestBase {
        // return RequestBase.get(`/languages/${lang}.json`)
        // if(process.env!.NODE_ENV === "development"){
        //     return RequestBase.get(BASE_URL+"/public/language/"+lang)
        // }
        return RequestBase.get(`http://localhost:3000/languages/${lang}.json`)
    }
    static list(): RequestBase {
        return RequestBase.get(`/languages/listDataLanguages.json`)
    }
}
