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
            return await quizDelete(this.url, this.config)
        }
        return undefined
    }
}
