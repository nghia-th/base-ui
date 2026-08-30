import { IBlocUI } from "../../base/IBlocUI";
import { DashboardApi } from "../../api/DashboardApi";

// Ví dụ minh hoạ đầy đủ pattern: reUseBloc (trong Dashboard.tsx) -> apiRequest -> setStream ->
// UIStream render lại UI. Đây là bloc "content" (dùng reUseBlocContent), sống theo từng trang.
export class BlocDashboard extends IBlocUI {
    async initData() {
        this.apiRequest(DashboardApi.stats(), (res) => {
            this.setStream('stats', res.data)
        })
    }
}
