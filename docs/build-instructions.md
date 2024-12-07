# Build Instructions

## Binaries & Libraries

### Simple

Simple is a SQLite3 FTS extension for indexing Chinese, OpenRewind use it to improve searching experience for Chinese users.

Before building, you need to download latest release of Simple at their [GitHub Release](https://github.com/wangfenjin/simple/releases),
decompress all files in the zip into `[PROJECT_ROOT]/bin/[PLATFORM]/libsimple/`, in which:

- [PROJECT_ROOT] is the root directory of OpenRewind you pulled.
- [PLATFORM] refers to the specific platform you are targeting:
    - win32: Windows
    - darwin: macOS
    - linux: Linux
