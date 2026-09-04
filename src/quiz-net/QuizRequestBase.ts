import {RequestBase} from "../base/RequestBase";
import {quizDelete, quizGet, quizPatch, quizPost, quizPut} from "./QuizApiService";

// Subclass RequestBase CHỈ để override run() - dùng transport riêng (QuizApiService, Authorization
// Bearer + dịch envelope đúng, xem ui-base-status.md) thay vì transport chung base/ApiService.ts.
// Không sửa gì trong base/RequestBase.ts. Vẫn là 1 RequestBase thật (kế thừa) nên mọi *Api.ts mới
// cho Hiểu Bài dùng QuizRequestBase.get/post/put/delete(...) y hệt cú pháp RequestBase cũ, và
// IBloc.apiRequest(api: RequestBase, ...) (base/IBloc.ts, không đổi) nhận nó bình thường nhờ kế
// thừa đúng kiểu.
export class QuizRequestBase extends RequestBase {
    static get(url: string, config?: any, responseHeader = false): QuizRequestBase {
        return new QuizRequestBase(url, null, config, 'GET', responseHeader)
    }
    static post(url: string, data: any, config?: any, responseHeader = false): QuizRequestBase {
        return new QuizRequestBase(url, data, config, 'POST', responseHeader)
    }
    static put(url: string, data: any, config?: any, responseHeader = false): QuizRequestBase {
        return new QuizRequestBase(url, data, config, 'put', responseHeader)
    }
    static patch(url: string, data: any, config?: any, responseHeader = false): QuizRequestBase {
        return new QuizRequestBase(url, data, config, 'patch', responseHeader)
    }
    static delete(url: string, config?: any, responseHeader = false): QuizRequestBase {
        return new QuizRequestBase(url, null, config, 'DELETE', responseHeader)
    }

    // Thêm 2026-09-04 (phần 4/4 - Admin sửa bản dịch): base/RequestBase.ts's static delete() luôn
    // hardcode data=null vì trước giờ chưa có endpoint DELETE nào trong app cần body - nhưng
    // LanguageApi.java's "DELETE /public/language" (base module có sẵn, xem ui-base-status.md)
    // nhận thẳng "@RequestBody String langKey" (chuỗi JSON trần, KHÔNG bọc object). axios CÓ hỗ
    // trợ body cho DELETE qua config.data (xem run() bên dưới) - chỉ base/RequestBase.ts's static
    // helper là không có tham số data, nên thêm 1 static method riêng ở ĐÂY (không đụng
    // base/RequestBase.ts) thay vì sửa chữ ký delete() cũ (giữ nguyên mọi chỗ gọi
    // QuizRequestBase.delete(url) không body hiện có). Caller tự JSON.stringify(...) giá trị cần
    // gửi (vd JSON.stringify(langKey)) TRƯỚC khi truyền vào đây - xem QuizLanguageApi.ts#deleteOne
    // - vì axios không tự bọc lại 1 string đã có sẵn (chỉ JSON.stringify object thường), nên nếu
    // truyền langKey trần (không qua JSON.stringify) thì body gửi đi sẽ thiếu cặp dấu ngoặc kép,
    // Jackson phía backend đọc "@RequestBody String" sẽ lỗi vì không phải JSON hợp lệ.
    static deleteWithBody(url: string, data: any, config?: any, responseHeader = false): QuizRequestBase {
        return new QuizRequestBase(url, data, config, 'DELETE', responseHeader)
    }

    async run() {
        if (this.method === 'GET') {
            return await quizGet(this.url, this.config)
        }
        if (this.method === 'POST') {
            return await quizPost(this.url, this.data, this.config)
        }
        if (this.method === 'put') {
            return await quizPut(this.url, this.data, this.config)
        }
        if (this.method === 'patch') {
            return await quizPatch(this.url, this.data, this.config)
        }
        if (this.method === 'DELETE') {
            // this.data chỉ khác null khi tạo qua deleteWithBody() ở trên - merge vào config.data
            // để axios đính kèm body cho request DELETE (quizDelete/QUIZ_API.delete chỉ forward
            // config nguyên vẹn, không tự đọc this.data - xem QuizApiService.ts). Giữ nguyên hành
            // vi cũ (config không đổi) cho mọi lời gọi delete() thường (this.data === null).
            const config = this.data !== null ? { ...(this.config ?? {}), data: this.data } : this.config
            return await quizDelete(this.url, config)
        }
        return undefined
    }
}
