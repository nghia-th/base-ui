import IBloc from "./IBloc";
import {BlocApplication} from "../ui/bloc/BlocApplication";
import  {TFunction} from "i18next";
import {ApiLanguage} from "../api/ApiLanguage";
import {QuizLanguageApi} from "../api/QuizLanguageApi";
import i18n from "../ui/i18next/i18next";

export interface ConfirmOptions {
    title?: string;
    message?: string;
    onYes?: () => void;
    onNo?: () => void;
}

export class IBlocUI extends IBloc{
    public t!: TFunction<"translation", undefined>;
    app?:BlocApplication
    url:string=''
    async initData(){}
    async loadLang(l: string) {
        this.log("loadLang")
        this.log(l)
        await this.apiRequestAwait(ApiLanguage.lang(l), (res) => {
            i18n.removeResourceBundle(l,"translations")
            i18n.addResourceBundle(l, "translations", res.data)
        }, {isShowLoading: false})
        // Lớp đè bản dịch Admin đã sửa qua "/public/language/{lang}" (2026-09-04, phần 4/4) LÊN
        // TRÊN bundle tĩnh vừa nạp ở trên - deep-merge + overwrite (2 tham số `true` cuối của
        // addResourceBundle) nên chỉ những key Admin THỰC SỰ có sửa mới bị đè, mọi key khác vẫn
        // lấy nguyên từ vi.json/en.json. Cố ý KHÔNG dùng onError riêng - onError mặc định của
        // apiRequestAwait là no-op (xem IBloc.ts), tức lỗi mạng/API ở bước NÀY âm thầm bỏ qua,
        // giữ nguyên bundle tĩnh làm fallback (đổi ngôn ngữ vẫn hoạt động dù backend chưa có filter
        // này/đang down) - đúng phương án "file tĩnh vẫn là gốc, DB chỉ lưu đè" anh đã chọn.
        await this.apiRequestAwait(QuizLanguageApi.overrides(l), (res) => {
            if (res?.data) {
                i18n.addResourceBundle(l, "translations", res.data, true, true)
            }
        }, {isShowLoading: false})
        await i18n?.changeLanguage(l)

    }
    confirm({
                title = 'confirm',
                message = 'do-you-want-to-do-it',
                onYes = () => {},
                onNo = () => {},
            }: ConfirmOptions) {

        this.app!.showConfirm({ title: title, message: message },  async (action) => {
            action.action === 'yes' ? onYes() : onNo();
        });
    }

}