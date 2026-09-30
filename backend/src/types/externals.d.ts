/** ffprobe-static ships no type declarations; it exports the resolved binary path. */
declare module 'ffprobe-static' {
  const ffprobe: { path: string; version: string }
  export = ffprobe
}
