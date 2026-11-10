// 迷你乐观锁看板：复刻上游 server/database.mjs 的核心能力（数据层）
// 上游参考：learning/dashi-taskboard/repo/server/database.mjs（提交 bdf7698）
//
// 你的任务：把所有"尚未实现"替换成真正的实现。
// 提示以伪代码注释给出，括号内是上游对应行号，实现前先读上游源码对照。

import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { ApiError } from "./errors.js";
import { isTaskStatus, type CreateTaskInput, type MoveTaskInput, type Project, type Task, type TaskStatus } from "./types.js";

const SORT_GAP = 1000;

export class TaskboardDatabase {
  // 上游 server/database.mjs:259-264
  constructor(filename: string) {
    // mkdirSync(dirname, { recursive: true })
    // this.database = new DatabaseSync(filename)
    // PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
    // this.#migrate()
    throw new Error("尚未实现");
  }

  private database!: DatabaseSync;

  // 上游 database.mjs:268 起的 #migrate()。练习只需要两张表：
  // projects(id, name, prefix, next_task_number CHECK > 0)
  // tasks(id, identifier UNIQUE, project_id REFERENCES projects(id),
  //       title, status CHECK IN (7 种状态), sort_order REAL,
  //       version INTEGER DEFAULT 1 CHECK > 0, created_at, updated_at)
  // 全部 CREATE TABLE IF NOT EXISTS（幂等收敛，无迁移版本号）
  #migrate(): void {
    throw new Error("尚未实现");
  }

  createProject(input: { id: string; name: string; prefix: string }): Project {
    // INSERT INTO projects ... next_task_number = 1
    // id 冲突时 SQLite 会抛 UNIQUE 约束错误，直接让它抛出即可
    throw new Error("尚未实现");
  }

  // 上游 database.mjs:1808-1906 createTask()
  createTask(input: CreateTaskInput): Task {
    // 1. 预检：isTaskStatus(input.status) 不通过 → ApiError(400, "INVALID_STATUS", ...)
    // 2. BEGIN IMMEDIATE（拿写锁，消除读计数器与写入之间的竞态窗口）
    // 3. 读项目：不存在 → ROLLBACK + ApiError(404, "PROJECT_NOT_FOUND", ...)
    // 4. 自愈编号（上游 1830-1834）：
    //    MAX(CAST(substr(identifier, prefix.length + 2) AS INTEGER))
    //      FROM tasks WHERE identifier GLOB '<prefix>-[0-9]*'
    //    number = max(project.nextTaskNumber, maximum === null ? 1 : maximum + 1)
    //    注意 substr 是 1 基，跳过 "PREFIX-" 需要 prefix.length + 2
    // 5. sortOrder 缺省 → 该列最小值 - SORT_GAP；空列 → SORT_GAP（置顶语义）
    // 6. UPDATE projects SET next_task_number = number + 1
    // 7. INSERT INTO tasks (id=randomUUID(), version=1, created_at=updated_at=ISO 时间)
    // 8. COMMIT，返回 this.getTask(id)
    // 任何一步抛错 → ROLLBACK 后 rethrow
    throw new Error("尚未实现");
  }

  // 上游 database.mjs:2053-2104 moveTask()。这是本练习的核心：
  // 双层乐观锁 = 预检（快失败）+ WHERE version = ?（原子守卫）
  moveTask(id: string, version: number, input: MoveTaskInput): Task {
    // 1. current = 读任务；不存在 → ApiError(404, "TASK_NOT_FOUND", ...)（上游 #requireTask）
    // 2. 预检 current.version !== version → ApiError(409, "VERSION_CONFLICT", ...,
    //      { expectedVersion: version, actualVersion: current.version })（上游 2856 #requireVersion）
    // 3. sortOrder 缺省时（上游 2061-2070）：
    //      换列 → 目标列最小值 - SORT_GAP；空列 → SORT_GAP（置顶）
    //      同列 → COALESCE(MAX(sort_order), 0) + SORT_GAP（去底部），排除自己
    // 4. BEGIN IMMEDIATE
    // 5. UPDATE tasks SET status=?, sort_order=?, version = version + 1, updated_at=?
    //      WHERE id = ? AND version = ?
    // 6. result.changes !== 1 → 该行要么没了要么版本又变了：重查一次区分 404 / 409
    //    （上游 2874 #throwMissingOrConflict，两个错误码不同，不许吞歧义）
    // 7. COMMIT，返回 this.getTask(id)；抛错路径 ROLLBACK 后 rethrow
    throw new Error("尚未实现");
  }

  // 上游 database.mjs:1680-1723 listTasks()。练习只需 projectId / status 过滤。
  listTasks(filters?: { projectId?: string; status?: TaskStatus }): Task[] {
    // 动态拼 WHERE（参数化，禁止字符串拼接值）
    // 排序：status 按看板列顺序 CASE WHEN backlog 1 ... canceled 7，再按 sort_order, created_at
    // 每行用 taskFromRow 转 camelCase（上游 database.mjs:64）
    throw new Error("尚未实现");
  }

  getTask(id: string): Task {
    // 查不到 → ApiError(404, "TASK_NOT_FOUND", ...)
    throw new Error("尚未实现");
  }

  // 练习专用：硬删除，制造编号空洞，用于验证编号自愈。
  // 上游产品里只有归档（软删），没有这个方法。
  removeTask(id: string): void {
    throw new Error("尚未实现");
  }

  // 行 → API 形状：snake_case → camelCase（上游 database.mjs:64 taskFromRow）
  #taskFromRow(row: Record<string, unknown>): Task {
    throw new Error("尚未实现");
  }
}
