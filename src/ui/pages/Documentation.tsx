import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";

const CODE_SX = {
    fontFamily: 'monospace',
    bgcolor: 'action.hover',
    p: 2,
    borderRadius: 1,
    overflowX: 'auto',
    fontSize: 13,
    whiteSpace: 'pre'
} as const;

// Trang tài liệu kiến trúc base-ui - tương đương Documentation.js bên template-ui,
// nhưng viết lại nội dung mô tả đúng kiến trúc Bloc/AppContext/UIStream của base-ui.
export default function Documentation() {
    const { t } = useTranslation();
    return (
        <Paper sx={{ p: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Box sx={{
                    width: 44, height: 44, borderRadius: 2, bgcolor: "#00968822",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                    <MenuBookOutlined sx={{ color: "#009688" }} />
                </Box>
                <Typography variant="h5" fontWeight={700}>{t('documentation')}</Typography>
            </Box>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                base-ui = layout Material (MUI) + kiến trúc quản lý state Bloc/RxJS lấy từ module-ui.
            </Typography>

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>1. Bloc</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
                Mỗi trang/nghiệp vụ có 1 class Bloc kế thừa IBloc/IBlocUI (base/IBloc.ts, base/IBlocUI.ts).
                Bloc giữ state trong _blocData (qua setField/getField) và phát dữ liệu qua RxJS Subject
                (qua setStream/getStream) - giống pattern BLoC của Flutter.
            </Typography>
            <Box sx={CODE_SX}>{`export class BlocDashboard extends IBlocUI {
  async initData() {
    this.apiRequest(DashboardApi.stats(), (res) => {
      this.setStream('stats', res.data)
    })
  }
}`}</Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>2. AppContext + reUseBloc</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
                AppContext (base/AppContext.ts) truyền BlocApplication (app) + apiHandler + translate
                xuống toàn bộ cây component. reUseBloc lấy/khởi tạo Bloc cấp shell (BlocApp), còn
                reUseBlocContent lấy/khởi tạo Bloc riêng cho từng trang - tự dispose Bloc cũ khi đổi route.
            </Typography>
            <Box sx={CODE_SX}>{`const appContext = useContext(AppContext)
const bloc = reUseBlocContent(appContext, BlocDashboard)`}</Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>3. UIStream</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
                UIStream (ui/components/common/UIStream.ts) là 1 component kiểu "StreamBuilder"
                (giống Flutter): subscribe 1 RxJS Subject rồi render lại builder() mỗi khi có data mới.
            </Typography>
            <Box sx={CODE_SX}>{`<UIStream
  initialData={null}
  stream={bloc.getStream('stats')}
  builder={(snapshot) => <div>{snapshot.data?.orders}</div>}
/>`}</Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>4. Gọi API</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
                api/*.ts định nghĩa các RequestBase (base/RequestBase.ts). Bloc gọi qua
                this.apiRequest(...)/apiRequestAwait(...) (base/IBloc.ts) - tự xử lý loading, lỗi,
                và bắt buộc đăng nhập lại (401/999) thông qua apiHandler được AppWrapper cung cấp.
                Tầng axios (base/ApiService.ts) tự refresh token khi gặp mã 998/403.
            </Typography>

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>5. Thêm 1 trang mới</Typography>
            <Typography color="text.secondary" component="div">
                (1) Thêm API vào src/api • (2) Tạo Bloc trong src/ui/bloc kế thừa IBlocUI • (3) Tạo
                component trong src/ui/pages hoặc src/ui/components, dùng reUseBlocContent +
                UIStream • (4) Thêm route + icon vào src/ui/AppMenuData.ts và src/ui/AppShell.tsx •
                (5) Thêm key dịch vào public/languages/vi.json và en.json.
            </Typography>
        </Paper>
    );
}
