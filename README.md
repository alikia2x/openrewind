# OpenRewind

OpenRewind is an open-source alternative to [rewind.ai](https://rewind.ai), forked from [OpenRecall](https://github.com/openrecall/openrecall).

We wanted to create an open source app that provides similar core functionality
to rewind.ai, and that app is **OpenRewind**.

## To-dos

### Update the OCR Engine

OpenRecall currently uses docTR as its OCR engine, but it performs inadequately.
On my MacBook Air M2 (2022), processing a screenshot takes around 20 seconds, with CPU usage peaking at over 400%.
During this time, screenshots cannot be captured, and the engine appears to recognize only Latin characters.

To address this, we plan to replace the OCR with a more efficient alternative that supports multiple writing systems.
We are working on [RapidOCR ONNX](https://github.com/alikia2x/RapidOCR-ONNX), a fork of a project which has same name,
developed by RapidAI.
RapidOCR ONNX uses [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) as its model architecture, and
runs on the [ONNX Runtime](https://github.com/microsoft/onnxruntime/).

### Implement a Task Queue/Scheduler

Currently, OpenRecall's OCR recognition and database operations are synchronous (blocking).
This results in increased screenshot frequency, as described in the previous section.

Our next goal is to introduce a task queue to handle high-load tasks (such as OCR, indexing, and archiving) asynchronously. This will ensure that time-sensitive tasks (like capturing screenshots) are prioritized.

### Improve the Frontend

The current frontend of OpenRecall is quite basic. Given my expertise in web development,
I will build a more elegant frontend from scratch.

We are now switched to Electron in order to deliver a native experience,
aiming to match the functionality of [rewind.ai](https://rewind.ai).

### Add More Features

We will be implementing the [feature list](https://github.com/openrecall/openrecall/discussions/9) proposed in the OpenRecall repository. Stay tuned for updates.
