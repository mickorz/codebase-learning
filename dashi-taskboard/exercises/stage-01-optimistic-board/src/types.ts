// 域模型：与上游 shared/domain.mjs 对齐，练习只保留必要字段。
// 上游还有 labels、assignee、threadBinding 等，本练习明确不做（见 exercises/stage-01.md）。

export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
  "canceled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value as string);
}

export interface Project {
  id: string;
  name: string;
  /** 编号前缀。上游由 projectPrefix() 从 id/name 推导，练习简化为显式传入 */
  prefix: string;
  nextTaskNumber: number;
}

export interface Task {
  id: string; // randomUUID()
  identifier: string; // "LOCAL-1" 人类可读编号
  projectId: string;
  title: string;
  status: TaskStatus;
  sortOrder: number;
  /** 乐观锁计数器，每次写操作 +1 */
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  status: TaskStatus;
  /** 缺省时置顶该列：MIN(sort_order) - 1000，空列给 1000 */
  sortOrder?: number;
}

export interface MoveTaskInput {
  status?: TaskStatus;
  /** 缺省时：换列置顶目标列，同列去底部 MAX(sort_order) + 1000 */
  sortOrder?: number;
}
