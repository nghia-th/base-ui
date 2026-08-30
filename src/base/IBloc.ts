import {Subject} from "rxjs";
import {CallApiComponent, CallApiSyncComponent, CallMultiApiComponent, MultiRequest} from "./CallApi";
import {RequestBase} from "./RequestBase";
import {ApiHandler, AppShare} from "./AppContext";
import Utils from "../utils/Utils";

type HandleRequestOptions = {
    isShowLoading?: boolean
    onError?: (error: any) => void
}
const DEFAULT_HANDLE_REQUEST: Required<HandleRequestOptions> = {
    isShowLoading: true,
    onError: () => {}
}
type MultiResponseHandler = {
    onData: (key: string, res: any) => void
    onAllData?: (allRes: any) => void
}

type MultiHandleRequestOptions = {
    isShowLoading?: boolean
    skipError?: boolean
    receiveResponseEachRequest?: boolean
    onError?: (error: any) => void
    apiHandler?: any
}

const DEFAULT_MULTI_HANDLE_REQUEST: Required<Omit<MultiHandleRequestOptions, 'apiHandler'>> & {
    apiHandler?: any
} = {
    isShowLoading: true,
    skipError: true,
    receiveResponseEachRequest: true,
    onError: () => {},
    apiHandler: undefined
}

abstract class IBloc {

    readonly moduleId:string = "detect-service";
    protected _blocData: any = {}
    private _stream = new Map<string, Subject<any>>();
    path? :string
    apiHandler?:ApiHandler
    constructor() {
        this.path = document.location.pathname
        this.log("path:"+this.path)
        this.init()
    }

    init() {
    }
    receiver(event:string,message:any){}
    public setStream(key: string, value: any,objectKey :any|null = null ) {
        if (!this._stream.has(key)) {
            this._stream.set(key, new Subject())
        }
        this._stream.get(key)?.next(value)
        this.setField(key,value,objectKey)
    }
    public getStream(key: string) {
        if (!this._stream.has(key)) {
            this._stream.set(key, new Subject())
        }
        return this._stream.get(key)!
    }
    public setField(field: string, value: any,objectKey :any|null = null ) {
        if (objectKey != null) {
            if (!this._blocData[objectKey]) {
                this._blocData[objectKey] = {}
            }
            this._blocData[objectKey][field] = value
        }else {
            this._blocData[field] = value
        }
    }

    public getField(field: string,objectKey :any|null = null) {
        if (objectKey != null) {
            try {
                if (!this._blocData[objectKey]) {
                    return null
                }
                return this._blocData[objectKey][field]
            } catch (e) {
                return null
            }
        }else {
            return this._blocData[field]
        }

    }
    public log(log: any) {
        Utils.debug(log)
    }

    public updateBloc(appShare:AppShare,t:any){
        // appShare.app.blocChild=this
        // this._appShare = appShare
        // this.t = t

    }
    public dispose(){
        this.log('dispose')
        // this._stream.clear()
        // this._blocData={}
    }
    public apiMultiRequest(requests: Array<MultiRequest>,
                           onResponse?: MultiResponseHandler,
                           onComplete?: () => void,
                           handleRequest?: MultiHandleRequestOptions) {
        const options = {
            ...DEFAULT_MULTI_HANDLE_REQUEST,
            ...handleRequest??this.apiHandler
        }

        const apiHandler = options.apiHandler ?? this.apiHandler!
        setTimeout(async () => {
            await CallMultiApiComponent(requests, apiHandler, onResponse?.onData,
                onResponse?.onAllData, onComplete, handleRequest?.skipError, options.receiveResponseEachRequest, options.onError, options.isShowLoading)
        })

    }

    public async apiSyncMultiRequest(requests: Array<MultiRequest>,
                                     onResponse?: MultiResponseHandler,
                                     onComplete?: () => void,
                                     handleRequest?: MultiHandleRequestOptions) {
        const options = {
            ...DEFAULT_MULTI_HANDLE_REQUEST,
            ...handleRequest??this.apiHandler
        }

        const apiHandler = options.apiHandler ?? this.apiHandler!
        await CallMultiApiComponent(requests, apiHandler, onResponse?.onData, onResponse?.onAllData, onComplete, options.skipError, options.receiveResponseEachRequest, options.onError, options.isShowLoading)

    }
    public apiRequest(api: RequestBase,onData: { (res?: any): void },
                      handleRequest?: HandleRequestOptions) {
        const options = {
            ...DEFAULT_HANDLE_REQUEST,
            ...handleRequest??this.apiRequest
        }

        CallApiComponent(api, onData, this.apiHandler!, options.onError, options.isShowLoading)
    }
    public async apiRequestAwait(request: RequestBase,onData: { (res?: any): void },
                                 handleRequest?: HandleRequestOptions) {
        const options = {
            ...DEFAULT_HANDLE_REQUEST,
            ...handleRequest??this.apiRequest
        }
        await CallApiSyncComponent(request, onData, this.apiHandler!, options.onError, options.isShowLoading!)
    }
}
export default IBloc