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
// base/CallApi.ts, mọi trang khác) chỉ để phục vụ 1 endpoint này. Response vẫn đi qua response
// interceptor của QuizApiService.ts như bình thường (không phải blob) nên trả về đúng
// {code,message,messageKey,data}.
//
// BUG ĐÃ SỬA (2026-09-01, xác nhận qua log lỗi thật anh gửi - "Content-Type 'application/json' is
// not supported", body log ra "{"file":{}}"): comment cũ ở đây từng khẳng định "axios tự bỏ header
// Content-Type mặc định khi data là FormData" - SAI trong trường hợp cụ thể này. axios (>=1.x)'s
// default transformRequest có 1 nhánh: nếu header Content-Type ĐANG LÀ 'application/json' (đúng
// default của QUIZ_API, xem QuizApiService.ts) VÀ data là FormData, nó coi đây là "muốn gửi FormData
// dưới dạng JSON" nên tự động convert FormData -> plain object (formDataToJSON, 1 File chuyển thành
// "{}" vì không có property tự liệt kê được) rồi JSON.stringify - KHÔNG gửi multipart/form-data
// thật, khớp chính xác body lỗi "{"file":{}}" đã thấy. Chỉ đúng là "tự bỏ Content-Type" khi KHÔNG
// có Content-Type default nào set sẵn - QUIZ_API lại có set sẵn 'application/json' nên rơi vào nhánh
// convert-sang-JSON thay vì nhánh mong muốn. Cách sửa: ghi đè Content-Type = undefined CHỈ cho
// request này - axios đọc `headers.getContentType() || ''` ra rỗng nên bỏ qua nhánh JSON, để
// FormData đi qua nguyên bản và trình duyệt tự gắn đúng `multipart/form-data; boundary=...` (không
// được set cứng 'multipart/form-data' vì thiếu boundary, Spring sẽ không parse được các part).
export async function quizImportQuestions(lessonId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_PARENT_PREFIX}/questions/import`, formData, {
        params: { lessonId },
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}
