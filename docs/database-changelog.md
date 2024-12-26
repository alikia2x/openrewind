# Database Schema Changelog

This document outlines the changes made across different versions of 
database structure used in the OpenRewind, including tables and fields.

## Version 3 Schema Changes

Corresponding version: Since 0.5.0

### Update `encoding_task` Table

#### Change `createAt` to `createdAt`

The column `createAt` was renamed to `createdAt` for consistency.

```sql
ALTER TABLE encoding_task RENAME COLUMN createAt TO createdAt;
```

#### Convert `createdAt` to Unix Timestamp

The `createdAt` column was updated to store Unix timestamps instead of formatted timestamps.

```typescript
const rows = db.prepare(`SELECT id, createdAt FROM encoding_task`).all() as { [x: string]: unknown; id: unknown; }[];
const updateStmt = db.prepare(`UPDATE encoding_task SET createdAt_new = ? WHERE id = ?`);
rows.forEach((row) => {
    const unixTimestamp = convertTimestampToUnix(row.createdAt as string);
    updateStmt.run(unixTimestamp, row.id);
});
```

### Update `frame` Table

#### Change `createAt` to `createdAt`

The column `createAt` was renamed to `createdAt` for consistency.

```sql
ALTER TABLE frame RENAME COLUMN createAt TO createdAt;
```

#### Convert `createdAt` to Unix Timestamp

The `createdAt` column was updated to store Unix timestamps instead of formatted timestamps.

```typescript
const rows = db.prepare(`SELECT id, createdAt FROM frame`).all() as { [x: string]: unknown; id: unknown; }[];
const updateStmt = db.prepare(`UPDATE frame SET createdAt_new = ? WHERE id = ?`);
rows.forEach((row) => {
    const unixTimestamp = convertTimestampToUnix(row.createdAt as string);
    updateStmt.run(unixTimestamp, row.id);
});
```

### Update `segments` Table

#### Rename Columns for Consistency

The columns `startAt` and `endAt` were renamed to `startedAt` and `endedAt` respectively.

```sql
ALTER TABLE segments RENAME COLUMN startAt TO startedAt;
ALTER TABLE segments RENAME COLUMN endAt TO endedAt;
```

#### Convert `startedAt` and `endedAt` to Unix Timestamps

The `startedAt` and `endedAt` columns were updated to store Unix timestamps instead of formatted timestamps.

```typescript
const rows = db.prepare(`SELECT id, startedAt, endedAt FROM segments`).all() as { [x: string]: unknown; id: unknown; }[];
const updateStart = db.prepare(`UPDATE segments SET startedAt_new = ? WHERE id = ?`);
const updateEnd = db.prepare(`UPDATE segments SET endedAt_new = ? WHERE id = ?`);
rows.forEach((row) => {
    updateStart.run(convertTimestampToUnix(row.startedAt as string), row.id);
    updateEnd.run(convertTimestampToUnix(row.endedAt as string), row.id);
});
```

### Drop Deprecated `encoded` Column

The deprecated `encoded` column was removed from the `frame` table.

```sql
ALTER TABLE frame DROP COLUMN encoded;
```

### Summary of Changes

- **Update `encoding_task` Table:**
  - Renamed `createAt` to `createdAt`.
  - Converted `createdAt` to store Unix timestamps.
- **Update `frame` Table:**
  - Renamed `createAt` to `createdAt`.
  - Converted `createdAt` to store Unix timestamps.
  - Dropped the deprecated `encoded` column.
- **Update `segments` Table:**
  - Renamed `startAt` and `endAt` to `startedAt` and `endedAt` respectively.
  - Converted `startedAt` and `endedAt` to store Unix timestamps.

## Version 2 Schema

Corresponding version: 0.4.0

### New Table: `config`

Stores configuration data, including the database version.

| Column Name | Data Type | Constraints/Default | Description                                                                 |
|-------------|-----------|---------------------|-----------------------------------------------------------------------------|
| `key`       | TEXT      | PRIMARY KEY         | Unique key for configuration settings.                                      |
| `value`     | TEXT      |                     | Value associated with the key.                                              |

#### Insert Default Version

```sql
INSERT INTO config (key, value) VALUES ('version', '2');
```

### New Table: `encoding_task`

Stores encoding tasks that are queued for processing.

| Column Name | Data Type | Constraints/Default        | Description                          |
|-------------|-----------|----------------------------|--------------------------------------|
| `id`        | INTEGER   | PRIMARY KEY, AUTOINCREMENT | Unique ID for the task.              |
| `createAt`  | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP  | Timestamp when the task was created. |
| `status`    | INTEGER   | DEFAULT 0                  | Indicates the status of the task.    |

### Task status

- `0`: Pending
- `1`: In Progress
- `2`: Completed 
  - Once the task was set to this status, it will be imminently deleted by a trigger mentioned below.

### New Trigger: `delete_encoding_task`

Triggered after updating the `status` of an encoding task to `2` (Completed).

```sql
CREATE TRIGGER delete_encoding_task
AFTER UPDATE OF status
ON encoding_task
BEGIN
  DELETE FROM encoding_task_data
  WHERE encodingTaskID = OLD.id AND NEW.status = 2;

  DELETE FROM encoding_task
  WHERE id = OLD.id AND NEW.status = 2;
END;

```

### New Table: `encoding_task_data`

Stores the frames that need to be encoded for the encoding task

| Column Name      | Data Type | Constraints/Default                 | Description                                          |
|------------------|-----------|-------------------------------------|------------------------------------------------------|
| `frame`          | INTEGER   | PRIMARY KEY, FOREIGN KEY (frame.id) | ID for the frame associated with the encoding task.  |
| `encodingTaskID` | TIMESTAMP | FOREIGN KEY (encoding_task.id)      | ID for the encoding task associated with this frame. |


### Update `frame` Table

#### Simplify `imgFilename`

The `imgFilename` column was updated to store only the filename without the full path.

```typescript
const rows = db.prepare('SELECT id, imgFilename FROM frame').all() as OldFrame[];
rows.forEach(row => {
    const filename = row.imgFilename.match(/[^\\/]+$/)?.[0];
    if (filename) {
        db.prepare('UPDATE frame SET imgFilename = ? WHERE id = ?').run(filename, row.id);
    }
});
```

#### Add `encodeStatus` Column

A new column `encodeStatus` was added to replace the deprecated `encoded` column.

```sql
ALTER TABLE frame ADD encodeStatus INT;
UPDATE frame SET encodeStatus = CASE WHEN encoded THEN 2 ELSE 0 END;
```

### Summary of Changes

- **New Table:** `config` to store configuration data.
- **Update `frame` Table:**
  - Simplified `imgFilename` to store only the filename.
  - Added `encodeStatus` column to replace the deprecated `encoded` column.
- **Deprecated `encoded` column.**
  - The `encoded` column is no longer used and is retained due to SQLite's inability to drop columns.
    Creating a new table without this column and copying data to the new table could be time-consuming.


## Version 1 Schema

Corresponding version: 0.3.x

### Table: `frame`

Stores information about individual frames.

| Column Name       | Data Type | Constraints/Default             | Description                                                             |
|-------------------|-----------|---------------------------------|-------------------------------------------------------------------------|
| `id`              | INTEGER   | PRIMARY KEY, AUTOINCREMENT      | Unique identifier for each frame.                                       |
| `createAt`        | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP       | Timestamp when the frame was created.                                   |
| `imgFilename`     | TEXT      |                                 | Filename of the image associated with the frame.                        |
| `segmentID`       | INTEGER   | NULL, FOREIGN KEY (segments.id) | ID of the segment to which the frame belongs.                           |
| `videoPath`       | TEXT      | NULL                            | Path to the video file if the frame is part of a video.                 |
| `videoFrameIndex` | INTEGER   | NULL                            | Index of the frame within the video.                                    |
| `collectionID`    | INTEGER   | NULL                            | ID of the collection to which the frame belongs.                        |
| `encoded`         | BOOLEAN   | DEFAULT 0                       | Indicates whether the frame has been encoded (0 for false, 1 for true). |

### Table: `recognition_data`

Stores recognition data associated with frames.

| Column Name | Data Type | Constraints/Default        | Desc[database-structure.md](database-structure.md)ription |
|-------------|-----------|----------------------------|-----------------------------------------------------------|
| `id`        | INTEGER   | PRIMARY KEY, AUTOINCREMENT | Unique identifier for each recognition data entry.        |
| `frameID`   | INTEGER   | FOREIGN KEY (frame.id)     | ID of the frame to which the recognition data belongs.    |
| `data`      | TEXT      |                            | Raw recognition data.                                     |
| `text`      | TEXT      |                            | Recognized text.                                          |

### Table: `segments`

A segment is a period of time when a user uses an application.
While capturing the screen, OpenRewind retrieves the currently active window.
When it finds that the currently active window has changed to another application, a new segment will start.

| Column Name   | Data Type | Constraints/Default        | Description                                          |
|---------------|-----------|----------------------------|------------------------------------------------------|
| `id`          | INTEGER   | PRIMARY KEY, AUTOINCREMENT | Unique identifier for each segment.                  |
| `startAt`     | TIMESTAMP |                            | Timestamp when the segment starts.                   |
| `endAt`       | TIMESTAMP |                            | Timestamp when the segment ends.                     |
| `title`       | TEXT      |                            | Title of the segment.                                |
| `appName`     | TEXT      |                            | Name of the application associated with the segment. |
| `appPath`     | TEXT      |                            | Path to the application.                             |
| `text`        | TEXT      |                            | Text content of the segment.                         |
| `type`        | TEXT      |                            | Type of the segment.                                 |
| `appBundleID` | TEXT      | NULL                       | Bundle ID of the application.                        |
| `url`         | TEXT      | NULL                       | URL associated with the segment.                     |

### Virtual Table: `text_search`

Used for full-text search on recognition data.

| Column Name | Data Type | Constraints/Default | Description                                            |
|-------------|-----------|---------------------|--------------------------------------------------------|
| `id`        | INTEGER   | UNINDEXED           | ID of the recognition data entry.                      |
| `frameID`   | INTEGER   | UNINDEXED           | ID of the frame to which the recognition data belongs. |
| `data`      | TEXT      |                     | Raw recognition data.                                  |
| `text`      | TEXT      |                     | Recognized text.                                       |

### Triggers

#### `recognition_data_after_insert`

Triggered after inserting a new row into `recognition_data`.

```sql
CREATE TRIGGER IF NOT EXISTS recognition_data_after_insert AFTER INSERT ON recognition_data
BEGIN
    INSERT INTO text_search (id, frameID, data, text)
    VALUES (NEW.id, NEW.frameID, NEW.data, NEW.text);
END;
```

#### `recognition_data_after_update`

Triggered after updating a row in `recognition_data`.

```sql
CREATE TRIGGER IF NOT EXISTS recognition_data_after_update AFTER UPDATE ON recognition_data
BEGIN
    UPDATE text_search
    SET frameID = NEW.frameID, data = NEW.data, text = NEW.text
    WHERE id = NEW.id;
END;
```

#### `recognition_data_after_delete`

Triggered after deleting a row from `recognition_data`.

```sql
CREATE TRIGGER IF NOT EXISTS recognition_data_after_delete AFTER DELETE ON recognition_data
BEGIN
    DELETE FROM text_search WHERE id = OLD.id;
END;
```
