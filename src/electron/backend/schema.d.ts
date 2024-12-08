export interface Frame {
	id: number;
	createdAt: number;
	imgFilename: string;
	segmentID: number | null;
	videoPath: string | null;
	videoFrameIndex: number | null;
	collectionID: number | null;
	encodeStatus: number;
}


export interface EncodingTask {
	id: number;
	createdAt: number;
	status: number;
}

export interface EncodingTaskData {
	encodingTaskID: number;
	frame: number;
}