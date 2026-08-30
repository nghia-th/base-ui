import { RequestBase } from "../base/RequestBase";
import { BASE_URL } from "../base/PrefixService";

// Demo: base-ui chưa có backend thật nên đọc dữ liệu mẫu tĩnh trong public/mock.
// Khi có backend, đổi URL này thành endpoint thật (ví dụ UTILITIES_PREFIX + "/dashboard/stats").
export class DashboardApi {
    static stats(): RequestBase {
        return RequestBase.get(`${BASE_URL}/mock/dashboard-stats.json`);
    }
}
