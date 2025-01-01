# OpenRewind

OpenRewind is an open-source alternative to [rewind.ai](https://rewind.ai), forked from [OpenRecall](https://github.com/openrecall/openrecall).

We wanted to create an open source app that provides similar core functionality
to rewind.ai, and that app is **OpenRewind**.

## Alpha Release: 0.8.0

Latest results: There is an Alpha version available! We currently only support Apple Silicon Macs.
(Of course, thanks to building on Electron, there will definitely be support for multiple platforms in the beta/stable release)

### ✨ Features

- GUI app. No terminal windows, no need to install any dependencies
- Take a screenshot of your screen every 2 seconds
- Encode screenshots to video at regular intervals
- A full screen "rewind" page similar to Rewind, with scrolling to view captured screenshots
- Screenshots can be taken excluding the "rewind" window

## To-dos

## OCR optimized for the specific platform

We will use the OCR API provided by the OS for macOS and Windows.

Reference projects:  
- [ocrit](https://github.com/insidegui/ocrit/)
    > We [forked](https://github.com/alikia2x/ocrit) this project to suit our needs
- [Windows.Media.Ocr.Cli](https://github.com/zh-h/Windows.Media.Ocr.Cli)

## Big-little architecture optimizations for Apple Silicon

We wrote a small Swift program that allows a given program to run at a selected QoS energy class. On ARM Macs, this means we can offload some work (such as video encoding) to energy-efficient cores, reducing peak CPU usage and power consumption.

> See: [Prioritize Work with Quality of Service Classes](https://developer.apple.com/library/archive/documentation/Performance/Conceptual/EnergyGuide-iOS/PrioritizeWorkWithQoS.html)

### Add More Features

We will be implementing the [feature list](https://github.com/openrecall/openrecall/discussions/9) proposed in the OpenRecall repository. Stay tuned for updates.
