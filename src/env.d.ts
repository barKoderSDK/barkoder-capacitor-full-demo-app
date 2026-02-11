/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BARKODER_LICENSE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}