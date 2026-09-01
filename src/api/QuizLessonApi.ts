import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import QUIZ_API from "../quiz-net/QuizApiService";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khớp LessonCreateRequest.java (cần subjectId) - LessonUpdateRequest.java chỉ có "name" + 3 field
// nội dung (không đổi được subjectId của 1 lesson đã tạo), nên tách riêng 2 interface. summary/
// content/textbookPage đều optional/nullable ở backend (xem Lesson.java's javadoc, 2026-09-01) -
// Phụ huynh có thể tạo Lesson chỉ với "name" rồi bổ sung sau.
export interface QuizLessonCreateRequest {
    subjectId: number;
    name: string;
    summary?: string;
    content?: string;
    textbookPage?: number;
}

export interface QuizLessonUpdateRequest {
    name: string;
    summary?: string;
    content?: string;
    textbookPage?: number;
}

export class QuizLessonApi {
    static list(subjectId: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/lessons`, { params: { subjectId } });
    }

    static create(request: QuizLessonCreateRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/lessons`, request);
    }

    static update(id: number, request: QuizLessonUpdateRequest) {
        return QuizRequestBase.put(`${QUIZ_PARENT_PREFIX}/lessons/${id}`, request);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/lessons/${id}`);
    }

    // Tải ảnh minh hoạ về dạng blob để hiển thị <img> (không dùng thẳng <img src="<url>"> vì
    // endpoint cần header Authorization: Bearer <token> - <img> không tự gắn header được). responseType
    // 'blob' -> QuizApiService.ts's response interceptor để nguyên response.data, không dịch envelope,
    // giống hệt QuizQuestionApi.downloadTemplate.
    static getImage(id: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/lessons/${id}/image`, { responseType: 'blob' });
    }

    static removeImage(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/lessons/${id}/image`);
    }
}

// Upload ảnh minh hoạ (multipart/form-data) - gọi thẳng QUIZ_API thay vì qua QuizRequestBase/
// CallApi.ts, giống hệt lý do + cách sửa của quizImportQuestions bên QuizQuestionApi.ts (bug axios
// FormData -> JSON đã sửa 2026-09-01, xem comment đầy đủ ở đó): QUIZ_API có default header
// Content-Type: application/json nên PHẢI ghi đè headers:{'Content-Type': undefined} cho riêng
// request này để axios không tự convert FormData thành JSON. KHÔNG set cứng 'multipart/form-data'
// (thiếu boundary, Spring không parse được part).
export async function quizUploadLessonImage(lessonId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_PARENT_PREFIX}/lessons/${lessonId}/image`, formData, {
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}
