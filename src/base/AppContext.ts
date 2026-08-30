import {createContext, MutableRefObject} from "react";

import Utils from "../utils/Utils";
import {BlocApplication} from "../ui/bloc/BlocApplication";
import {TFunction} from "i18next";
import {IBlocUI} from "./IBlocUI";
export interface DateTimeFormat {
    dateFormat: string
    dateTimeFormat: string
    timeFormat: string
    calendarViewDate: string
    calendarViewDateTime: string
    timeDateFormat: string
}
export const DEFAULT_DATE_TIME_FORMAT: DateTimeFormat = {
    dateFormat: 'YYYY-MM-DD',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    timeFormat: 'HH:mm:ss',
    calendarViewDate: 'yy/mm/dd',
    calendarViewDateTime: 'yy/mm/dd HH:mm',
    timeDateFormat: 'HH:mm:ss YYYY-MM-DD'
}

export interface AppShare{
    apiHandler?: ApiHandler|null;
    app?: BlocApplication|null;
    currentBloc?: any|null;
    toastBR?:MutableRefObject<any>;
    translate?:TFunction<"translation", undefined>|null;
    dateTimeFormat: DateTimeFormat
}
export interface ApiHandler {
    showLoading: (isShow: boolean) => void
    onUnAuth: () => void
    onError: (error?: any) => void
}

export const DEFAULT_APP_SHARE: AppShare = {
    dateTimeFormat: DEFAULT_DATE_TIME_FORMAT
}

// export const AppContext: Context<AppShare | null> = createContext<AppShare | null>(DEFAULT_APP_SHARE);
export const AppContext = createContext<AppShare>(DEFAULT_APP_SHARE);
export function reUseBloc<T extends IBlocUI>(appContext: AppShare, blocType: { new(): T; },forcedNew:boolean =false): T {
    // Utils.debug(appContext)
    Utils.debug("reUseBloc")
    Utils.debug(document.location.pathname)
    if (appContext?.app?.blocCurrent) {
        if (appContext.app.blocCurrent.constructor.name === blocType.name) {
            Utils.debug("re use bloc blocCurrent:" + blocType.name)
            if (!forcedNew){
                return appContext.app.blocCurrent
            }else {
                appContext!.app!.blocCurrent = new blocType()
                appContext!.app!.blocCurrent.apiHandler = appContext.apiHandler
                appContext!.app!.blocCurrent.app = appContext.app
                appContext!.app!.blocCurrent.t = appContext.translate
                return appContext!.app!.blocCurrent
            }

        } else {
            try {
                Utils.debug('dispose:' + appContext.app.blocCurrent.constructor.name)
                appContext.app.blocCurrent.dispose()
                appContext.app.blocCurrent = null
            } catch (e) {

            }
            Utils.debug('new Instance blocCurrent:' + blocType.name)
            appContext!.app!.blocCurrent = new blocType()
            appContext!.app!.blocCurrent.apiHandler = appContext.apiHandler
            appContext!.app!.blocCurrent.app = appContext.app
            appContext!.app!.blocCurrent.t = appContext.translate
            return appContext!.app!.blocCurrent
        }
    }else {
        Utils.debug("new bloc" + blocType.name)
        appContext!.app!.blocCurrent = new blocType()
        appContext!.app!.blocCurrent.apiHandler = appContext.apiHandler
        appContext!.app!.blocCurrent.app = appContext.app
        appContext!.app!.blocCurrent.t = appContext.translate
    }


    return appContext!.app!.blocCurrent
}
export function reUseBlocContent<T extends IBlocUI>(appContext: AppShare, blocType: { new(): T; },forcedNew:boolean = false): T {
    // Utils.debug(appContext)
    Utils.debug('reUseBlocContent')
    const fullPath = window.location.pathname + window.location.search;
    Utils.debug(fullPath)
    //content
    if (appContext?.app?.blocCurrent) {
        if (appContext?.app?.blocCurrent.content != null) {
            if (appContext.app.blocCurrent.content.constructor.name === blocType.name && appContext.app.blocCurrent.content.url === fullPath) {
                Utils.debug("re use bloc:" + blocType.name)
                if (!forcedNew){
                    return appContext.app.blocCurrent.content
                }else {
                    appContext!.app!.blocCurrent.content = new blocType()
                    appContext!.app!.blocCurrent.content.url =fullPath
                    appContext!.app!.blocCurrent.content.app = appContext.app
                    appContext!.app!.blocCurrent.content.apiHandler = appContext.apiHandler
                    appContext!.app!.blocCurrent.content.t = appContext.translate
                    return appContext.app.blocCurrent.content
                }
            } else {
                Utils.debug('new Instance 1:' + blocType.name)
                try {
                    Utils.debug('dispose:' + appContext.app.blocCurrent.content.constructor.name)
                    appContext.app.blocCurrent.content.dispose()
                    appContext.app.blocCurrent.content = null
                } catch (e) {

                }
                appContext!.app!.blocCurrent.content = new blocType()
                appContext!.app!.blocCurrent.content.app = appContext.app
                appContext!.app!.blocCurrent.content.url =fullPath
                appContext!.app!.blocCurrent.content.apiHandler = appContext.apiHandler
                appContext!.app!.blocCurrent.content.t = appContext.translate
                // return new blocType()
            }
        }else {
            Utils.debug("new bloc " + blocType.name)
            appContext!.app!.blocCurrent.content = new blocType()
            appContext!.app!.blocCurrent.content.url =fullPath
            appContext!.app!.blocCurrent.content.app = appContext.app
            appContext!.app!.blocCurrent.content.apiHandler = appContext.apiHandler
            appContext!.app!.blocCurrent.content.t = appContext.translate
        }

    }else {
        Utils.debug("new bloc" + blocType.name)
        appContext!.app!.blocCurrent.content = new blocType()
        appContext!.app!.blocCurrent.content.url =fullPath
        appContext!.app!.blocCurrent.content.app = appContext.app
        appContext!.app!.blocCurrent.content.apiHandler = appContext.apiHandler
        appContext!.app!.blocCurrent.content.t = appContext.translate
    }


    return appContext!.app!.blocCurrent.content
}
