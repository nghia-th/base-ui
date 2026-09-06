// Khớp BulkDeleteError.java / BulkDeleteResponse.java - dùng chung cho 4 bloc có nút "Xoá đã
// chọn"/"Xoá tất cả" (2026-09-06): BlocParentQuestions, BlocParentSubjects (cả Lesson lẫn Subject),
// BlocParentClassrooms. Tách file riêng (không khai báo lặp lại trong từng Bloc) vì đúng 1 shape
// dùng chung cho cả 4 nơi, khác với quy ước "mỗi Bloc content tự khai báo shape riêng" (quy ước đó
// áp dụng cho dữ liệu NGHIỆP VỤ như QuizSubject/QuizLesson - đây chỉ là 1 kiểu kết quả kỹ thuật của
// thao tác bulk-delete, không phải dữ liệu nghiệp vụ nào).
export interface QuizBulkDeleteError {
    id: number;
    reason: string;
}

export interface QuizBulkDeleteResult {
    requested: number;
    deletedCount: number;
    errors: QuizBulkDeleteError[];
}
