# Database Schema Documentation (Version 3)

This document outlines the current structure of the database schema used in the application. It includes tables, fields, and their descriptions.

## Table: `config`

Stores configuration data.

| Column Name | Data Type | Constraints/Default | Description                                                                 |
|-------------|-----------|---------------------|-----------------------------------------------------------------------------|
| `key`       | TEXT      | PRIMARY KEY         | Unique key for configuration settings.                                      |
| `value`     | TEXT      |                     | Value associated with the key.                                              |

### Key: version

The current database schema version, represented as an integer. Since the `config` table does not exist in V1, the version must be at least 2.

## Table: `frame`

Stores information about individual frames.

| Column Name       | Data Type | Constraints/Default             | Description                                               |
|-------------------|-----------|---------------------------------|-----------------------------------------------------------|
| `id`              | INTEGER   | PRIMARY KEY, AUTOINCREMENT      | Unique identifier for each frame.                         |
| `createdAt`       | REAL      |                                 | Timestamp when the frame was created.                     |
| `imgFilename`     | TEXT      |                                 | Filename of the image associated with the frame.          |
| `segmentID`       | INTEGER   | NULL, FOREIGN KEY (segments.id) | ID of the segment to which the frame belongs.             |
| `videoPath`       | TEXT      | NULL                            | Relative path to the video file if the frame was encoded. |
| `videoFrameIndex` | INTEGER   | NULL                            | Index of the frame within the encoded video.              |
| `collectionID`    | INTEGER   | NULL                            | ID of the collection to which the frame belongs.          |
| `encodeStatus`    | INTEGER   | DEFAULT 0                       | Indicates the encoding status of the frame.               |

### Status Description

- `0`: The frame is not encoded.
- `1`: The frame is scheduled for encoding. It will appear in the `encoding_task` table.
- `2`: The frame is already encoded.

## Table: `recognition_data`

Stores recognition data associated with frames.

| Column Name | Data Type | Constraints/Default          | Description                                                                 |
|-------------|-----------|------------------------------|-----------------------------------------------------------------------------|
| `id`        | INTEGER   | PRIMARY KEY, AUTOINCREMENT   | Unique identifier for each recognition data entry.                          |
| `frameID`   | INTEGER   | FOREIGN KEY (frame.id)       | ID of the frame to which the recognition data belongs.                      |
| `data`      | TEXT      |                              | Raw recognition data.                                                       |
| `text`      | TEXT      |                              | Recognized text.                                                            |

## Table: `segments`

A segment is a period of time when a user uses a particular application. While capturing the screen, OpenRewind detects the currently active window. When it finds that the currently active window has changed to another application, a new segment will start.

| Column Name   | Data Type | Constraints/Default        | Description                                          |
|---------------|-----------|----------------------------|------------------------------------------------------|
| `id`          | INTEGER   | PRIMARY KEY, AUTOINCREMENT | Unique identifier for each segment.                  |
| `startedAt`   | REAL      |                            | Timestamp when the segment starts.                   |
| `endedAt`     | REAL      |                            | Timestamp when the segment ends.                     |
| `title`       | TEXT      |                            | Title of the segment.                                |
| `appName`     | TEXT      |                            | Name of the application associated with the segment. |
| `appPath`     | TEXT      |                            | Path to the application.                             |
| `text`        | TEXT      |                            | Text content of the segment.                         |
| `type`        | TEXT      |                            | Type of the segment.                                 |
| `appBundleID` | TEXT      | NULL                       | Bundle ID of the application.                        |
| `url`         | TEXT      | NULL                       | URL associated with the segment.                     |

## Table: `encoding_task`

Stores encoding tasks that are queued for processing.

| Column Name | Data Type | Constraints/Default        | Description                          |
|-------------|-----------|----------------------------|--------------------------------------|
| `id`        | INTEGER   | PRIMARY KEY, AUTOINCREMENT | Unique ID for the task.              |
| `createdAt` | REAL      |                            | Timestamp when the task was created. |
| `status`    | INTEGER   | DEFAULT 0                  | Indicates the status of the task.    |

### Task status Description

- `0`: Pending
- `1`: In Progress
- `2`: Completed
  - Once the task was set to this status, it will be imminently deleted by a trigger mentioned below.

## Table: `encoding_task_data`

Stores the frames that need to be encoded for the encoding task.

| Column Name      | Data Type | Constraints/Default                 | Description                                          |
|------------------|-----------|-------------------------------------|------------------------------------------------------|
| `encodingTaskID` | INTEGER   | FOREIGN KEY (encoding_task.id)      | ID for the encoding task associated with this frame. |
| `frame`          | INTEGER   | PRIMARY KEY, FOREIGN KEY (frame.id) | ID for the frame associated with the encoding task.  |

## Virtual Table: `text_search`

Used for full-text search on recognition data.

| Column Name | Data Type | Constraints/Default | Description                                            |
|-------------|-----------|---------------------|--------------------------------------------------------|
| `id`        | INTEGER   | UNINDEXED           | ID of the recognition data entry.                      |
| `frameID`   | INTEGER   | UNINDEXED           | ID of the frame to which the recognition data belongs. |
| `data`      | TEXT      |                     | Raw recognition data.                                  |
| `text`      | TEXT      |                     | Recognized text.                                       |

## Triggers

### `recognition_data_after_insert`

Triggered after inserting a new row into `recognition_data`. Inserts a new row into `text_search` with the same data.

```sql
CREATE TRIGGER IF NOT EXISTS recognition_data_after_insert AFTER INSERT ON recognition_data
BEGIN
    INSERT INTO text_search (id, frameID, data, text)
    VALUES (NEW.id, NEW.frameID, NEW.data, NEW.text);
END;
```

### `recognition_data_after_update`

Triggered after updating a row in `recognition_data`. Updates the associated `text_search` row.

```sql
CREATE TRIGGER IF NOT EXISTS recognition_data_after_update AFTER UPDATE ON recognition_data
BEGIN
    UPDATE text_search
    SET frameID = NEW.frameID, data = NEW.data, text = NEW.text
    WHERE id = NEW.id;
END;
```

### `recognition_data_after_delete`

Triggered after deleting a row from `recognition_data`. Deletes the associated `text_search` row.

```sql
CREATE TRIGGER IF NOT EXISTS recognition_data_after_delete AFTER DELETE ON recognition_data
BEGIN
    DELETE FROM text_search WHERE id = OLD.id;
END;
```

### `delete_encoding_task`

Triggered after updating the `status` of an encoding task to `2` (Completed). Deletes the associated `encoding_task_data` and `encoding_task` rows.

```sql
CREATE TRIGGER IF NOT EXISTS delete_encoding_task
AFTER UPDATE OF status
ON encoding_task
BEGIN
  DELETE FROM encoding_task_data
  WHERE encodingTaskID = OLD.id AND NEW.status = 2;

  DELETE FROM encoding_task
  WHERE id = OLD.id AND NEW.status = 2;
END;
```