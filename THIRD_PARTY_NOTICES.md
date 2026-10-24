# Browser Processing Third-Party Notices

The exact installed versions and integrity hashes are recorded in `bun.lock`. The following
components execute locally; their authors do not receive uploaded document contents.

| Component                                   | Installed version | License / upstream source                                                                                                              |
| ------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| jSquash JPEG (MozJPEG)                      | 1.6.0             | [Apache-2.0 wrapper; bundled codec notices](https://github.com/jamsinclair/jSquash/tree/main/packages/jpeg)                            |
| jSquash WebP (libwebp)                      | 1.5.0             | [Apache-2.0 wrapper; bundled codec notices](https://github.com/jamsinclair/jSquash/tree/main/packages/webp)                            |
| jSquash AVIF (libavif/AOM)                  | 2.1.1             | [Apache-2.0 wrapper; bundled codec notices](https://github.com/jamsinclair/jSquash/tree/main/packages/avif)                            |
| jSquash OxiPNG                              | 2.3.0             | [Apache-2.0 wrapper; bundled codec notices](https://github.com/jamsinclair/jSquash/tree/main/packages/oxipng)                          |
| zxing-wasm (zxing-cpp, zint)                | 3.1.6             | [MIT wrapper; Apache-2.0 zxing-cpp; BSD-3-Clause zint](https://github.com/Sec-ant/zxing-wasm)                                          |
| brotli-wasm (Brotli)                        | 3.0.1             | [Apache-2.0](https://github.com/httptoolkit/brotli-wasm)                                                                               |
| @bokuweb/zstd-wasm (Zstandard)              | 0.0.27            | [MIT wrapper; BSD-3-Clause Zstandard](https://github.com/bokuweb/zstd-wasm)                                                            |
| Prettier (standalone formatter)             | 3.9.10            | [MIT](https://github.com/prettier/prettier)                                                                                            |
| sql-formatter                               | 15.9.0            | [MIT](https://github.com/sql-formatter-org/sql-formatter)                                                                              |
| hash-wasm                                   | 4.12.0            | [MIT](https://github.com/Daninet/hash-wasm)                                                                                            |
| Mediabunny and MP3/AAC/FLAC extensions      | 1.62.1            | [MPL-2.0 wrappers](https://github.com/Vanilagy/mediabunny); embedded LAME is LGPL, FFmpeg AAC is LGPL, libFLAC has its own notices     |
| Tesseract.js                                | 7.0.0             | [Apache-2.0](https://github.com/naptha/tesseract.js)                                                                                   |
| English and Arabic language-data packages   | 1.0.0             | [Package MIT; upstream trained-data notices](https://github.com/naptha/tessdata)                                                       |
| qpdf WASM wrapper                           | 0.3.0             | [ISC wrapper and reproducible build recipe](https://github.com/neslinesli93/qpdf-wasm)                                                 |
| qpdf, including bundled dependencies        | 12.2.0            | [Apache-2.0; zlib/libjpeg notices](https://github.com/qpdf/qpdf)                                                                       |
| FFmpeg JavaScript wrapper                   | 0.12.15           | [MIT](https://github.com/ffmpegwasm/ffmpeg.wasm)                                                                                       |
| FFmpeg single-threaded core                 | 0.12.10           | [GPL-2.0-or-later; source/build recipes and bundled codec licenses](https://github.com/ffmpegwasm/ffmpeg.wasm/tree/main/packages/core) |
| resvg-wasm SVG renderer (@resvg/resvg-wasm) | 2.6.2             | [MPL-2.0; Rust resvg engine](https://github.com/thx/resvg-js)                                                                          |
| DOMPurify (SVG sanitization)                | 3.4.17            | [Apache-2.0 / MPL-2.0](https://github.com/cure53/DOMPurify)                                                                            |
| opentype.js (glyph outlines)                | 2.0.0             | [MIT](https://github.com/opentypejs/opentype.js)                                                                                       |
| UPNG.js (raw RGBA→PNG encoder)              | 2.1.0             | [MIT; Photopea](https://github.com/photopea/UPNG.js)                                                                                   |
| lucide-static icon collection               | 1.61.0            | [ISC; Lucide contributors](https://lucide.dev)                                                                                         |
| Inter, Anton and DM Mono web fonts          | 5.3.0             | [SIL Open Font License 1.1 via @fontsource packages](https://fontsource.org)                                                           |

The asset preparation script copies available LICENSE, COPYING, and NOTICE files from distributed
packages alongside their versioned browser assets. It also publishes this notice document under
`/wasm/THIRD_PARTY_NOTICES.md`. Preserve upstream copyright and license notices when redistributing
these assets. The FFmpeg core's license is separate from the MIT JavaScript wrapper. MuPDF is not
included.

Existing components such as PDF.js, pdf-lib, Pica, heic2any, Transformers.js, model files, and fonts
retain their own licenses; see the README and their upstream distributions. Updating an engine must
also update its bundled-source links and notices.
