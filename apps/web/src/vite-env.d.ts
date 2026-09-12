/// <reference types="vite/client" />

declare module "@assets/profiles/*.json" {
  import type { ScoringProfile } from "./types";
  const profile: ScoringProfile;
  export default profile;
}
