import { QuizRequestBase } from "../quiz-net/QuizRequestBase";
import QUIZ_API from "../quiz-net/QuizApiService";
import { QUIZ_PARENT_PREFIX } from "../base/PrefixService";

// Khớp SubjectRequest.java (dùng chung cho create/update) - từ khi thêm "Lớp học", mỗi Môn học
// giờ thuộc về 1 Lớp cụ thể (classroomId bắt buộc, có thể đổi lớp qua update bình thường - xem
// SubjectRequest.java's javadoc bên backend), không còn thuộc thẳng về Phụ huynh như trước.
export interface QuizSubjectRequest {
    classroomId: number;
    name: string;
}

export class QuizSubjectApi {
    // classroomId bỏ trống = lấy MỌI môn học của Phụ huynh (mọi lớp) - dùng cho Tổng quan/Ngân
    // hàng câu hỏi; truyền vào = chỉ môn học của 1 lớp - dùng cho trang Môn học/Đề kiểm tra khi đã
    // lọc theo lớp. Cùng convention query-param với QuizTestApi.list(studentId?).
    static list(classroomId?: number) {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/subjects`, { params: classroomId ? { classroomId } : {} });
    }

    static create(request: QuizSubjectRequest) {
        return QuizRequestBase.post(`${QUIZ_PARENT_PREFIX}/subjects`, request);
    }

    static update(id: number, request: QuizSubjectRequest) {
        return QuizRequestBase.put(`${QUIZ_PARENT_PREFIX}/subjects/${id}`, request);
    }

    static remove(id: number) {
        return QuizRequestBase.delete(`${QUIZ_PARENT_PREFIX}/subjects/${id}`);
    }

    // Import môn học bằng file (2026-09-05, mục 2/11) - responseType 'blob' + cách gọi giống hệt
    // QuizLessonApi.downloadImportTemplate, chỉ khác endpoint.
    static downloadImportTemplate(format: 'xlsx' | 'csv') {
        return QuizRequestBase.get(`${QUIZ_PARENT_PREFIX}/subjects/import-template`, { params: { format }, responseType: 'blob' });
    }
}

// Import Excel/CSV môn học (2026-09-05, mục 2/11 - "Phu huynh bulk-tao Mon hoc qua import file") -
// cùng bug FormData->JSON + cách sửa hệt quizImportLessons/quizImportQuestions (xem comment đầy đủ
// ở QuizQuestionApi.ts's quizImportQuestions), chỉ khác endpoint + param (classroomId, vì Subject
// là con của Classroom).
export async function quizImportSubjects(classroomId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await QUIZ_API.post(`${QUIZ_PARENT_PREFIX}/subjects/import`, formData, {
        params: { classroomId },
        headers: { 'Content-Type': undefined }
    });
    return res.data;
}
