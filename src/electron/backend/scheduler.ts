import osu from "node-os-utils";

type TaskId = string;
type TaskFunction = () => void;

interface Task {
	id: TaskId;
	func: TaskFunction;
	interval?: number;
	lastRun?: number;
	nextRun?: number;
	isPaused: boolean;
	delayUntil?: number;
	requiredSystemState: SystemState;
}

export interface TaskStatus {
    status: "NOT_FOUND" | "PAUSED" | "DELAYED" | "SCHEDULED" | "IDLE";
    until?: string;
    nextRun?: string;
}

type SystemState = "ANY" | "LOW_POWER" | "IDLE";

export class Scheduler {
	private tasks: Map<TaskId, Task> = new Map();
	private timer: NodeJS.Timeout | null = null;
	private monitorTimer: NodeJS.Timeout | null = null;
	private cpuUsage: number = 0;

	constructor(private readonly minTickInterval: number = 500) {
		this.start();
	}

	private start(): void {
		this.scheduleNextTick();
		this.monitorTimer = setInterval(() => this.monitor(), 1000);
	}

	private monitor(): void {
	    osu.cpu.usage().then((cpuPercentage) => {
	        this.cpuUsage = cpuPercentage / 100;
	    })
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

		const taskRequiredLowPower = task.requiredSystemState === "LOW_POWER";
		const cpuUsage = this.cpuUsage;
		const isSystemLowPower = cpuUsage < 0.75;
		const isTaskReadyForLowPowerRun = taskRequiredLowPower ? isSystemLowPower : true;
		const reachedTaskNextRun = task.interval && task.nextRun && now >= task.nextRun;
		const isTaskReadyForIntervalRun = reachedTaskNextRun && isTaskReadyForLowPowerRun;
		
		if (!isTaskReadyForLowPowerRun) {
			this.delayTask(task.id, 1000)
		}

		if (isTaskReadyForIntervalRun) {
			task.func();
			task.lastRun = now;
			task.nextRun = now + task.interval!;
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
	 * @param requiredSystemState The required system state for the task to run.
	 */
	addTask(id: TaskId, func: TaskFunction, interval?: number, requiredSystemState: SystemState = "ANY"): void {
		this.tasks.set(id, {
			id,
			func,
			interval,
			isPaused: false,
			lastRun: undefined,
			nextRun: interval ? Date.now() + interval : undefined,
			requiredSystemState: requiredSystemState,
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
	 * Resume a paused task, so that it can be executed according to its interval.
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
			if (task.nextRun) {
				task.nextRun += delayMs;
			}
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
		if (this.monitorTimer) {
			clearTimeout(this.monitorTimer);
			this.monitorTimer = null;
		}
	}
}
