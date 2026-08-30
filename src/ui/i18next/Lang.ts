import LocalStorage from "../../base/LocalStorage";

class Languages {
    async loadLang(l: string, i18n: { changeLanguage: (arg0: any) => any }) {
        try {
            LocalStorage.setItem('i18nextLng', l)
            await i18n?.changeLanguage(l)
        } catch (e) {
        }
    }
}

export let lang = new Languages()
