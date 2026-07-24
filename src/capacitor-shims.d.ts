// Type shims for @capacitor packages that lack an `exports` field,
// required for TypeScript bundler moduleResolution compatibility.

declare module '@capacitor/core' {
  export { Capacitor, registerPlugin } from '../../node_modules/@capacitor/core/types/index';
  export type { PluginListenerHandle, Plugin, PermissionState } from '../../node_modules/@capacitor/core/types/index';
}

declare module '@capacitor/network' {
  export { Network } from '../../node_modules/@capacitor/network/dist/esm/index';
  export type { NetworkStatus, NetworkStatusChangeListener } from '../../node_modules/@capacitor/network/dist/esm/index';
}

declare module '@capacitor/geolocation' {
  export { Geolocation } from '../../node_modules/@capacitor/geolocation/dist/esm/index';
  export type { Position, GeolocationOptions, PositionOptions, WatchPositionCallback } from '../../node_modules/@capacitor/geolocation/dist/esm/index';
}

declare module '@capacitor/filesystem' {
  export { Filesystem, Directory, Encoding } from '../../node_modules/@capacitor/filesystem/dist/esm/index';
  export type { ReadFileResult, WriteFileResult, GetUriResult, ReaddirResult, FileInfo, ReadFileOptions, WriteFileOptions, DeleteFileOptions, CopyOptions, MkdirOptions, RmdirOptions, ReaddirOptions, GetUriOptions, StatOptions, StatResult, CopyResult, RenameOptions } from '../../node_modules/@capacitor/filesystem/dist/esm/index';
}

declare module '@capacitor/share' {
  export { Share } from '../../node_modules/@capacitor/share/dist/esm/index';
  export type { ShareOptions, ShareResult } from '../../node_modules/@capacitor/share/dist/esm/index';
}
