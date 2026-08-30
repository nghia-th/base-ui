import { RequestBase } from "../base/RequestBase";
import { AUTH_PREFIX, USERS_PREFIX } from "../base/PrefixService";

// Định nghĩa API theo đúng pattern module-ui: mỗi method trả về 1 RequestBase,
// Bloc sẽ gọi qua this.apiRequest(...)/apiRequestAwait(...).
export class UserApi {
    static login(data: any): RequestBase {
        return RequestBase.post(AUTH_PREFIX + "/login", data)
    }
    static logout(): RequestBase {
        return RequestBase.post(AUTH_PREFIX + "/logout", null)
    }
    static myPermission(): RequestBase {
        return RequestBase.get(USERS_PREFIX + "/my_permission")
    }
    static module(moduleId?: string): RequestBase {
        return RequestBase.get(USERS_PREFIX + "/module", { params: { moduleId } })
    }
}
