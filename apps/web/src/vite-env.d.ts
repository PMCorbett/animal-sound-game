/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@assets/profiles/*.json" {
  import type { ScoringProfile } from "./types";
  const profile: ScoringProfile;
  export default profile;
}

declare module "@assets/sounds/*" {
  const url: string;
  export default url;
}
