import { QuizAuthApi } from "../../api/QuizAuthApi";
import { BlocQuizLogin } from "./BlocQuizLogin";
import LocalStorage from "../../base/LocalStorage";

export interface QuizFamilyMember {
    id: number;
    fullName: string;
}

// Key luu trong localStorage - EXPORT ra ngoai (2026-09-06, ban sua 2) vi LoginChooser.tsx (xem
// Login.tsx) can doc/ghi CUNG 1 key nay khi hoc sinh chon phu huynh o popup, truoc khi dieu huong
// sang /student-login - tranh lap lai chuoi ky tu o 2 noi (1 nguon duy nhat).
export const STUDENT_LOGIN_PARENT_KEY = 'quizStudentLoginParentIdentifier';

// Bloc trang dang nhap danh rieng cho Hoc sinh (2026-09-06, thiet ke lai dang nhap theo yeu cau
// cua anh). Ke thua BlocQuizLogin de tai dung nguyen xi handleAuthSuccess (luu token/role/profile)
// va doLogin() role='student' cho nhanh "Dang nhap thu cong" du phong (go thang username, hanh vi
// CU).
//
// BAN SUA 2 (2026-09-06, theo de xuat moi cua anh - xem Login.tsx's comment dau file): buoc "go
// thong tin Phu huynh" KHONG con nam tren trang nay nua - da chuyen thanh 1 POPUP tren trang chon
// vai tro /login (LoginChooser). Trang nay (StudentLogin.tsx) GIO CHI con 2 buoc chinh + 1 nhanh
// du phong:
//   'picker'   - hien danh sach TEN cac con cua gia dinh da luu (localStorage) de BAM CHON (khong
//                go chu) - diem mau chot chan trinh duyet goi y nham mat khau da luu cua Phu huynh.
//                Neu KHONG co parentIdentifier nao trong localStorage khi mo trang nay (vd go
//                thang URL), StudentLogin.tsx tu dieu huong nguoc ve /login (chooser) truoc ca khi
//                goi initData() - trang nay khong con UI nhap thong tin Phu huynh nua.
//   'password' - da biet dung studentId, chi can go mat khau -> loginStudentById().
//   'manual'   - du phong: go thang username/password (hanh vi CU).
export class BlocStudentLogin extends BlocQuizLogin {
    async initData() {
        this.setStream('step', 'picker')
        this.setStream('students', [])
        this.setStream('selectedStudent', null)
        this.setStream('role', 'student')
        const saved = LocalStorage.getItem(STUDENT_LOGIN_PARENT_KEY)
        if (saved) {
            this.setField('identifier', saved, 'req')
            this.lookupFamily(saved, () => {
                // Tra cuu tu dong luc mo trang that bai (vd khong co mang) - danh sach o lai
                // rong, Hoc sinh van thay duoc nut "Dang nhap bang ten dang nhap" de di duong khac.
            })
        }
        // Khong con nhanh "else" o day nua - truong hop khong co gia dinh da luu duoc
        // StudentLogin.tsx xu ly BANG DIEU HUONG (useNavigate) TRUOC KHI goi initData(), xem do.
    }

    lookupFamily(parentIdentifier: string, onError: (error: any) => void) {
        const trimmed = (parentIdentifier ?? '').trim()
        if (!trimmed) {
            onError({ messageKey: 'please-enter-login-info' })
            return
        }
        this.setStream('submitting', true)
        this.apiRequest(QuizAuthApi.lookupStudentFamily(trimmed), (res: any) => {
            this.setStream('submitting', false)
            const students: QuizFamilyMember[] = res.data?.students ?? []
            this.setStream('students', students)
            LocalStorage.setItem(STUDENT_LOGIN_PARENT_KEY, trimmed)
            this.setStream('step', 'picker')
        }, {
            onError: (error: any) => {
                this.setStream('submitting', false)
                onError(error)
            }
        })
    }

    pickStudent(student: QuizFamilyMember) {
        this.setStream('selectedStudent', student)
        this.setField('password', '', 'req')
        this.setStream('step', 'password')
    }

    // Nut "Khong phai toi" o buoc 'password' - quay lai danh sach ten, KHONG xoa localStorage
    // (van dung gia dinh, chi chon nham nguoi).
    backToPicker() {
        this.setStream('selectedStudent', null)
        this.setStream('step', 'picker')
    }

    // Nut "Khong phai gia dinh nay?" o buoc 'picker' - xoa localStorage (de lan sau mo lai
    // /student-login se tu dieu huong ve /login chon lai) - CHI xoa du lieu, KHONG tu dieu huong o
    // day (bloc khong giu tham chieu router) - StudentLogin.tsx goi xong ham nay roi tu
    // navigate('/login') ngay sau, xem do.
    changeFamily() {
        LocalStorage.delete(STUDENT_LOGIN_PARENT_KEY)
        this.setField('identifier', '', 'req')
        this.setStream('students', [])
        this.setStream('selectedStudent', null)
    }

    // Chuyen han sang che do "Dang nhap thu cong" (go username, hanh vi CU - ke thua
    // BlocQuizLogin#doLogin's nhanh role==='student') - du phong khi tra cuu o tren khong ra ket
    // qua, hoac gia dinh co con khong hien ten trong danh sach vi ly do gi do.
    useManualLogin() {
        this.setField('identifier', '', 'req')
        this.setField('password', '', 'req')
        this.setStream('step', 'manual')
    }

    // Luon quay lai 'picker' (BAN SUA 2 - khong con buoc 'identifier' rieng tren trang nay nua de
    // ma quay ve).
    backFromManual() {
        this.setStream('step', 'picker')
    }

    loginSelected(onComplete: (res: any) => void, onError: (error: any) => void) {
        const student: QuizFamilyMember | null = this.getField('selectedStudent')
        const password = this.getField('password', 'req') ?? ''
        if (!student || !password) {
            onError({ messageKey: 'please-enter-login-info' })
            return
        }
        this.setStream('submitting', true)
        this.apiRequest(QuizAuthApi.loginStudentById(student.id, password), (res: any) => {
            this.setStream('submitting', false)
            this.handleAuthSuccess('student', res, onComplete)
        }, {
            onError: (error: any) => {
                this.setStream('submitting', false)
                onError(error)
            }
        })
    }
}
