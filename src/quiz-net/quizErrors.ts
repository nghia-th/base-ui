import { TFunction } from "i18next";

// Helper dùng chung cho MỌI trang Hiểu Bài khi hiện lỗi từ quiz-service (QuizErrorCode.java trả
// message tiếng Anh) - ưu tiên bản dịch theo messageKey (mã lỗi, vd "QUIZ_003") nếu
// public/languages/*.json đã có key đó, chưa có thì tạm hiện message gốc tiếng Anh từ backend.
// Thêm dần key dịch theo messageKey khi gặp lỗi thường xuyên (xem ui-base-status.md), không cần
// dịch hết 1 lần cho mọi mã QUIZ_xxx/COMMON_xxx.
export function quizErrorMessage(t: TFunction, error: any): string {
    const fallback = error?.message ?? (t('error') as string);
    return error?.messageKey ? (t(error.messageKey, { defaultValue: fallback }) as string) : fallback;
}
