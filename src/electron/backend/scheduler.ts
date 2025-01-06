type TaskId = string;
type TaskFunction = () => void;

interface Task {
	id: TaskId;
	func: TaskFunction;
	interval?: number;
	maxInterval?: number;
	lastRun?: number;
	nextRun?: number;
	isPaused: boolean;
	delayUntil?: number;
}

export interface TaskStatus {
    status: "NOT_FOUND" | "PAUSED" | "DELAYED" | "SCHEDULED" | "IDLE";
    until?: string;
    nextRun?: string;
}

export class Scheduler {
	private tasks: Map<TaskId, Task> = new Map();
	private timer: NodeJS.Timeout | null = null;
	private nextTickTime: number | null = null;

	constructor(private readonly minTickInterval: number = 500) {
		this.start();
	}

	private start(): void {
		this.scheduleNextTick();
	}

	private scheduleNextTick(): void {
		if (this.timer) {
			clearTimeout(this.timer);
		}

		const now = Date.now();
		let nextTick = now + this.minTickInterval;

		for (const task of this.tasks.values()) {
            const isTaskPaused = task.isPaused;
            const isTaskDelayed = task.delayUntil && now < task.delayUntil;
			if (isTaskPaused || isTaskDelayed) {
				continue;
			}

            const nextTaskEarlierThanNextTick = task.nextRun && task.nextRun < nextTick;
			if (nextTaskEarlierThanNextTick) {
				nextTick = task.nextRun!;
			}
		}

		const delay = Math.max(0, nextTick - now);
		this.timer = setTimeout(() => this.tick(), delay);
	}

	private tickSingleTask(
		task: Task,
		getNextTick: () => number,
		updateNextTick: (nextTick: number) => void
	): void {
		const now = Date.now();
		const isTaskPaused = task.isPaused;
		const isTaskDelayed = task.delayUntil && now < task.delayUntil;

		if (isTaskPaused || isTaskDelayed) {
			return;
		}

		const isTaskReadyForIntervalRun = task.interval && task.nextRun && now >= task.nextRun;
		if (isTaskReadyForIntervalRun) {
			task.func();
			task.lastRun = now;
			task.nextRun = now + task.interval!;
		}

		const isTaskReadyForMaxIntervalRun =
			task.maxInterval && task.lastRun && now - task.lastRun >= task.maxInterval;
		if (isTaskReadyForMaxIntervalRun) {
			task.func();
			task.lastRun = now;
			if (task.interval) {
				task.nextRun = now + task.interval;
			}
		}

		const isTaskNextRunEarlierThanNextTick = task.nextRun && task.nextRun < getNextTick();
		if (isTaskNextRunEarlierThanNextTick) {
			updateNextTick(task.nextRun!);
		}
	}

	private tick(): void {
		const now = Date.now();
		let nextTick = now + this.minTickInterval;

		for (const task of this.tasks.values()) {
			this.tickSingleTask(
				task,
				() => nextTick,
				(v) => (nextTick = v)
			);
		}

		this.scheduleNextTick();
	}

	/**
	 * Add a new task to the scheduler.
	 *
	 * @param id A unique string identifier for the task.
	 * @param func The function to be executed by the task.
	 * @param interval The interval (in milliseconds) between task executions.
	 * @param maxInterval The maximum time (in milliseconds) that a task can wait before being executed.
	 * If a task has not been executed in this amount of time, it will be executed immediately.
	 */
	addTask(id: TaskId, func: TaskFunction, interval?: number, maxInterval?: number): void {
		this.tasks.set(id, {
			id,
			func,
			interval,
			maxInterval,
			isPaused: false,
			lastRun: undefined,
			nextRun: interval ? Date.now() + interval : undefined
		});

		this.scheduleNextTick();
	}

	/**
	 * Trigger a task to execute immediately, regardless of its current state.
	 *
	 * If the task is paused or delayed, it will not be executed.
	 *
	 * @param id The unique string identifier for the task.
	 */
	triggerTask(id: TaskId): void {
		const task = this.tasks.get(id);
		if (task && !task.isPaused && (!task.delayUntil || Date.now() >= task.delayUntil)) {
			task.func();
			task.lastRun = Date.now();
			if (task.interval) {
				task.nextRun = Date.now() + task.interval;
			}
		}

		this.scheduleNextTick();
	}

	/**
	 * Pause a task, so that it will not be executed until it is resumed.
	 *
	 * @param id The unique string identifier for the task.
	 */
	pauseTask(id: TaskId): void {
		const task = this.tasks.get(id);
		if (task) {
			task.isPaused = true;
		}

		this.scheduleNextTick();
	}

	/**
	 * Resume a paused task, so that it can be executed according to its interval and maxInterval.
	 *
	 * @param id The unique string identifier for the task.
	 */
	resumeTask(id: TaskId): void {
		const task = this.tasks.get(id);
		if (task) {
			task.isPaused = false;
		}

		this.scheduleNextTick();
	}

	/**
	 * Delay a task from being executed for a specified amount of time.
	 *
	 * @param id The unique string identifier for the task.
	 * @param delayMs The amount of time in milliseconds to delay the task's execution.
	 */
	delayTask(id: TaskId, delayMs: number): void {
		const task = this.tasks.get(id);
		if (task) {
			task.delayUntil = Date.now() + delayMs;
		}

		this.scheduleNextTick();
	}

	setTaskInterval(id: TaskId, interval: number): void {
		const task = this.tasks.get(id);
		if (task) {
			task.interval = interval;
			task.nextRun = Date.now() + interval;
		}

		this.scheduleNextTick();
	}

	getTaskStatus(id: TaskId): TaskStatus {
	    const task = this.tasks.get(id);
	    if (!task) {
	        return { status: "NOT_FOUND" };
	    }
	    if (task.isPaused) {
	        return { status: "PAUSED" };
	    }
	    if (task.delayUntil && Date.now() < task.delayUntil) {
	        return {
	            status: "DELAYED",
	            until: new Date(task.delayUntil).toLocaleString()
	        };
	    }
	    if (task.nextRun) {
	        return {
	            status: "SCHEDULED",
	            nextRun: new Date(task.nextRun).toLocaleString()
	        };
	    }
	    return { status: "IDLE" };
	}

	stop(): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
}
