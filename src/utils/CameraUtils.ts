// Mirrors the backend Camera.camKey() formula exactly (see
// docs/access-control/dev/01-camera-management.md mục 2 and
// vn.org.cv.service.detect.entity.CameraExt.kt on the backend). Door.cameraKey stores this same
// value, so the FE needs to compute it client-side to join a Door back to its Camera row(s).
export default class CameraUtils {
    static camKey(camera: any): string {
        if (!camera) return '';
        if (camera.asNvr) {
            return camera.preview ?? '';
        }
        if (camera.camGroup) {
            return camera.camGroup;
        }
        return (camera.ipAddress ?? '').split('.').join('');
    }

    // every camera row whose computed camKey matches the given Door.cameraKey
    // (camGroup can be shared by several camera rows, see the doc note above)
    static findByCamKey(cameras: any[], camKey?: string | null): any[] {
        if (!camKey) return [];
        return (cameras ?? []).filter((c) => CameraUtils.camKey(c) === camKey);
    }

    static label(camera: any): string {
        if (!camera) return '';
        const name = camera.name && camera.name.trim().length > 0 ? camera.name : camera.ipAddress;
        return `${name} (${camera.ipAddress}/${camera.profile})`;
    }
}
