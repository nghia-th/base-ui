import React, { MutableRefObject, useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import LocalStorage from "./base/LocalStorage";
import Loading from "./ui/components/common/Loading";
import { AppContext } from "./base/AppContext";
import { BlocApplication } from "./ui/bloc/BlocApplication";
import UIStream from "./ui/components/common/UIStream";
import AlertDialog from "./ui/components/dialogs/AlertDialog";
import ConfirmDialog from "./ui/components/dialogs/ConfirmDialog";
import Login from "./ui/pages/Login";
import NotFound from "./ui/pages/NotFound";
import ErrorPage from "./ui/pages/ErrorPage";
import AccessDenied from "./ui/pages/AccessDenied";
import AppShell from "./ui/AppShell";

interface AppWrapperProps {
    app: BlocApplication;
}

// Thay cho AppWrapper.tsx bên module-ui: cùng 1 pattern - loadInit() qua BlocApplication,
// UIStream lắng "loadInit" để quyết định route nào cần đăng nhập, Alert/Confirm/Loading dùng chung.
export default function AppWrapper({ app }: AppWrapperProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const loadingRef: MutableRefObject<Loading | null> = useRef(null);

    const handleRequest = {
        showLoading: (isShow: boolean) => {
            loadingRef.current?.showLoading(isShow);
        },
        onUnAuth: () => {
            setTimeout(() => {
                LocalStorage.deleteToken();
                app.setStream('loadInit', { loginRequire: { status: 1, url: location.pathname }, finish: true });
            });
        },
        onError: (error?: any) => {
            enqueueSnackbar(t(error?.messageKey || error?.error || 'error') as string, { variant: 'error' });
        }
    };
    app.apiHandler = handleRequest;

    useEffect(() => {
        setTimeout(async () => {
            await app.loadInit(location.pathname);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <UIStream
                initialData={{ loginRequire: { status: 0, url: '' }, finish: false }}
                stream={app.getStream('loadInit')}
                builder={(snapshot) => (
                    <AppContext.Provider value={{
                        apiHandler: handleRequest,
                        app: app,
                        translate: t,
                        dateTimeFormat: {
                            dateFormat: 'YYYY-MM-DD',
                            dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
                            timeFormat: 'HH:mm:ss',
                            calendarViewDate: 'yy/mm/dd',
                            calendarViewDateTime: 'yy/mm/dd HH:mm',
                            timeDateFormat: 'HH:mm:ss YYYY-MM-DD'
                        }
                    }}>
                        {snapshot.data?.finish ? (
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/error" element={<ErrorPage />} />
                                <Route path="/access-denied" element={<AccessDenied />} />
                                <Route path="/notfound" element={<NotFound />} />
                                <Route
                                    path="/*"
                                    element={
                                        snapshot.data.loginRequire.status === 0
                                            ? <AppShell />
                                            : <Navigate replace to={`/login?url=${snapshot.data.loginRequire.url}`} />
                                    }
                                />
                            </Routes>
                        ) : <></>}
                    </AppContext.Provider>
                )}
            />
            <UIStream initialData={null} stream={app.getStream('dialogAlert')} builder={(snapshot) => <AlertDialog info={snapshot.data} />} />
            <UIStream initialData={null} stream={app.getStream('dialogConfirm')} builder={(snapshot) => <ConfirmDialog info={snapshot.data} />} />
            <Loading ref={loadingRef as any} />
        </>
    );
}
