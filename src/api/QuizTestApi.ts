import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import QUIZ_API from "../quiz-net/QuizApiService";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khớp TestCreateRequest.java - tạo Test = giao đề luôn, không có bước "giao" riêng (xem TestApi.java).
export interface QuizTestCreateRequest {
    studentId: number;
    name: string;
    questionIds: number[];
}

// Khớp PracticeGenerateRequest.java - tạo đề "Ôn tập" ngẫu nhiên theo Môn học, KHÔNG có questionIds
// (server tự chọn ngẫu nhiên) - xem TestService#generatePractice. name/questionCount đều tuỳ chọn.
export interface QuizPracticeGenerateRequest {
    studentId: number;
    subjectId: number;
    name?: string;
    questionCount?: number;
}

export class QuizTestApi {
    static list(studentId?: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/tests`, { params: studentId ? { studentId } : {} });
    }

    static create(request: QuizTestCreateRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/tests`, request);
    }

    // Gọi lại nhiều lần = tạo lại nhiều lần, mỗi lần server random 1 bộ câu hỏi MỚI (không giới
    // hạn số lần làm lại - xem PracticeGenerateRequest.java's javadoc).
    static generatePractice(request: QuizPracticeGenerateRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/tests/practice`, request);
    }

    static get(id: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/tests/${id}`);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/tests/${id}`);
    }

    // Import hàng loạt đề ôn tập bằng file (2026-09-04) - responseType 'blob' + cách gọi giống hệt
    // QuizLessonApi.downloadImportTemplate, chỉ khác endpoint. KHÔNG có subjectId param như
    // Lesson/Question import - mỗi dòng trong file tự nêu Học sinh/Môn học riêng (xem
    // PracticeImportService.java's javadoc), không có 1 subjectId chung cho cả file.
    static downloadPracticeImportTemplate(format: 'xlsx' | 'csv') {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/tests/practice/import-template`, { params: { format }, responseType: 'blob' });
    }
}

// Import Excel/CSV đề ôn tập hàng loạt (2026-09-04) - cùng bug FormData->JSON + cách sửa hệt
// quizImportLessons bên QuizLessonApi.ts (xem comment đầy đủ ở đó), không có param thứ 2 ngoài
// file - mỗi dòng tự nêu Học sinh (tên đăng nhập) + Môn học (tên) riêng.
export async function quizImportPracticeTests(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_PARENT_PREFIX}/tests/practice/import`, formData, {
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}
