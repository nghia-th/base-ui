import IBloc from "./IBloc";
import {BlocApplication} from "../ui/bloc/BlocApplication";
import  {TFunction} from "i18next";
import {ApiLanguage} from "../api/ApiLanguage";
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