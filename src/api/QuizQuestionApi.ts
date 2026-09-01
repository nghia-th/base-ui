import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import QUIZ_API from "../quiz-net/QuizApiService";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khớp ChoiceRequest.java / QuestionRequest.java - dùng chung cho create/update (PUT là full
// replace toàn bộ choices, không diff - xem QuestionApi.java).
export interface QuizChoiceRequest {
    content: string;
    correct: boolean;
}

export interface QuizQuestionRequest {
    lessonId: number;
    content: string;
    knowledgeTag?: string;
    choices: QuizChoiceRequest[];
}

export class QuizQuestionApi {
    static list(lessonId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/questions`, { params: { lessonId } });
    }

    static create(request: QuizQuestionRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/questions`, request);
    }

    static update(id: number, request: QuizQuestionRequest) {
        return QuizRequestBase.put(`${QUIZ_PARENT_PREFIX}/questions/${id}`, request);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/questions/${id}`);
    }

    // responseType:'blob' - QuizApiService.ts's response interceptor để nguyên response.data (byte[]
    // thật) trong trường hợp này, không dịch envelope - xem QuizApiService.ts.
    static downloadTemplate(format: 'xlsx' | 'csv') {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/questions/import-template`, { params: { format }, responseType: 'blob' });
    }
}

// Import Excel/CSV (multipart/form-data) - gọi thẳng QUIZ_API (axios instance của QuizApiService.ts)
// thay vì qua QuizRequestBase/CallApi.ts, vì đây là request DUY NHẤT trong cả app cần gửi FormData
// (mọi request khác đều JSON) - không đáng để nới rộng QuizRequestBase/RequestBase (dùng chung với
// base/CallApi.ts, mọi trang khác) chỉ để phục vụ 1 endpoint này. axios (bản >=1.x) tự bỏ header
// Content-Type mặc định 'application/json' của QUIZ_API khi data là FormData, để trình duyệt tự
// gắn đúng boundary - không cần set header thủ công. Response vẫn đi qua response interceptor của
// QuizApiService.ts như bình thường (không phải blob) nên trả về đúng {code,message,messageKey,data}.
export async function quizImportQuestions(lessonId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_PARENT_PREFIX}/questions/import`, formData, { params: { lessonId } });
    return res.data;
}
