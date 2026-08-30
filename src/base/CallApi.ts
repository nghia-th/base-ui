import { RequestBase } from './RequestBase';
import Utils from "../utils/Utils";
export function CallApi(apiService:RequestBase, onUnAuth:{():void}, onData?:{(res:any):void}|null, showLoading?:{(isShow:boolean):void}|null, onError?:{(error:any):void}|null) {
    showLoading?.(true);
    apiService.run().then((res) => {
        const { code, message,messageKey, httpError } = res?.data;
        Utils.debug(apiService.url)
        Utils.debug(res?.data)
        try {
            if (httpError) {
                showLoading?.(false);
                if (code === 401 || code === 999 ) {
                    onUnAuth();
                } else {
                    onError?.({ 'code': code, 'message': message,'messageKey':messageKey, 'httpError': true });
                }
            } else {
                showLoading?.(false);
                if (code === 999 ){
                    onUnAuth();
                }else {

                    if (res?.config.responseType==='blob'){
                        onData?.({data:res.data,disposition:res.headers["content-disposition"]});
                    }else {
                        if (res?.data.code ===undefined){
                            onData?.(res?.data);
                        }else {
                            if (res?.data.code === 100) {
                                // res.headers
                                if (apiService.responseHeader) {
                                    res.data["headers"] = res.headers
                                }
                                onData?.(res.data);
                                //onData({data:res.data,headers:res.headers});
                            } else {
                                onError?.({ 'code': code, 'message': message, 'messageKey': messageKey, 'httpError': false });
                            }
                        }

                    }
                }

            }
        } catch (err) {
            Utils.debug(err)
            showLoading?.(false);
        } finally {

        }
    });

}
export function CallApiComponent(apiService:RequestBase, onData:{(res:any):void},handleRequest:{onUnAuth:{():void},showLoading?:{(isShow:boolean):void}|null,onError?:{(error:any):void}|null},onError?:{(error:any):void}|null,isShowLoading?:boolean|true){
    CallApi(apiService,handleRequest.onUnAuth,onData,isShowLoading?handleRequest.showLoading:null,onError==null?handleRequest.onError:onError)
}
async function CallApiSync(apiService:RequestBase, onUnAuth:{():void},onData?:{(res:any):void}|null, showLoading?:{(isShow:boolean):void}|null, onError?:{(error:any):void}|null) {
    showLoading?.(true);
    try {
        let res = await apiService.run()
        const { code, message,messageKey, httpError } = res?.data;
        Utils.debug(apiService.url)
        Utils.debug(res?.data)
        if (httpError) {
            showLoading?.(false);
            if (code === 401 || code === 999 ) {

                onUnAuth();
            } else {
                onError?.({ 'code': code, 'message': message,'messageKey':messageKey, 'httpError': true });
            }
        } else {
            showLoading?.(false);
            if (code === 999 ){
                onUnAuth();
            }else {
                onData?.(res?.data);
            }
        }
    } catch (err) {
        Utils.debug(err)
        showLoading?.(false);
    } finally {
        showLoading?.(false);
    }
}
export async function CallApiSyncComponent(apiService: RequestBase, onData: { (res: any): void }, handleRequest:{onUnAuth:{():void},showLoading?:{(isShow:boolean):void}|null,onError?:{(error:any):void}|null},onError?:{(error:any):void}|null,isShowLoading?:boolean|true) {
    await CallApiSync(apiService,handleRequest.onUnAuth,onData,isShowLoading?handleRequest.showLoading:null,onError==null?handleRequest.onError:onError)
}
async function CallMultiApi(requests:Array<MultiRequest>, onData?:{(key:string,res:any):void},onAllData?:{(allRes:any):void}|null,onComplete?:{():void}, onUnAuth?:{():void}, skipError?:boolean | true,receiveResponseEachRequest=true, showLoading?:{(isShow:boolean):void}|null,  onError?:{(error:any):void}|null) {
    showLoading?.(true);
    let unAuth=false
    try {
        let result:any = {};
        for(let i=0; i<requests.length; i++){
            const tmp = requests[i]
            const key = tmp.key
            const apiService=tmp.api
            const res = await apiService.run()
            const { code, message,messageKey, httpError } = res?.data;
            Utils.debug(tmp.api.url)
            Utils.debug(res?.data)
            if (httpError) {

                if (code === 401 || code === 999 ) {
                    unAuth=true
                    onUnAuth?.();
                    break;
                }else {
                    onError?.({ 'code': code, 'message': message,'messageKey':messageKey, 'httpError': true });
                    if (!skipError){
                        break
                    }
                }
            }else {

                if (code === 999 ){
                    unAuth=true
                    onUnAuth?.();
                    break
                }else {
                    result[key] = res?.data
                    //
                    // if (apiService.url){
                    //     Utils.debug(res?.data.code)
                    // }
                    if (tmp.api.url.includes("languages")){
                        onData?.(key,res?.data)
                        break
                    }
                    if (res?.data.code!==100){
                        onError?.({ 'code': code, 'message': message,'messageKey':messageKey, 'httpError': false });
                        break
                    }

                    if (receiveResponseEachRequest && code===100){
                        onData?.(key,res?.data)
                    }
                    if (!message){
                        onData?.(key,res)
                        continue
                    }
                    if (!skipError && code!==100){
                        break
                    }
                }
            }
        }
        if (!unAuth){
            if (!receiveResponseEachRequest){
                onAllData?.(result)
            }

        }
        onComplete?.()
        showLoading?.(false);
    }catch (e) {
        showLoading?.(false);
        Utils.debug(e)
    }finally {
    }

}
export async function CallMultiApiComponent(requests :Array<MultiRequest>, handleRequest:{onUnAuth:{():void},showLoading?:{(isShow:boolean):void}|null,onError?:{(error:any):void}|null},onData?:{(key:string,res:any):void},onAllData?:{(allRes:any):void}|null,onComplete?:{():void}, skipError?:boolean | false,receiveResponseEachRequest?:boolean|true,onError?:{(error:any):void}|null,isShowLoading?:boolean|true) {
    await CallMultiApi(requests, onData,onAllData,onComplete, handleRequest.onUnAuth, skipError,receiveResponseEachRequest, isShowLoading?handleRequest.showLoading:null, onError==null? handleRequest.onError:onError)
}
export class MultiRequest{
    key=''
    api:RequestBase
    constructor(key: string, request: RequestBase) {
        this.key=key
        this.api=request
    }
}