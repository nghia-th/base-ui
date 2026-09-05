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

    // Import hàng loạt đề ôn tập bằng file - responseType 'blob' + cách gọi giống hệt
    // QuizLessonApi.downloadImportTemplate, chỉ khác endpoint. Template không phụ thuộc
    // subjectId (chỉ 2 cột Học sinh/Số câu hỏi, xem PracticeImportService.java's javadoc) nên
    // hàm tải template này không cần tham số đó - subjectId chỉ cần khi GỌI import thật (xem
    // quizImportPracticeTests bên dưới).
    static downloadPracticeImportTemplate(format: 'xlsx' | 'csv') {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/tests/practice/import-template`, { params: { format }, responseType: 'blob' });
    }
}

// Import Excel/CSV đề ôn tập hàng loạt - cùng bug FormData->JSON + cách sửa hệt
// quizImportLessons bên QuizLessonApi.ts (xem comment đầy đủ ở đó). 2026-09-05: thêm tham số
// subjectId (giống quizImportLessons) - Môn học giờ chọn 1 LẦN cho cả file (per "mỗi lần import
// một đề ôn theo môn" - anh xác nhận), không còn tự nêu theo từng dòng như thiết kế 2026-09-04
// ban đầu (xem PracticeImportService.java's javadoc, phần "Row shape" đã sửa lại).
export async function quizImportPracticeTests(subjectId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_PARENT_PREFIX}/tests/practice/import`, formData, {
        params: { subjectId },
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}
