// Stage 2 验收测试：moveTask 与乐观锁语义。
// 这是验收标准，不要修改本文件。跑不过就回去改 src/。
import { describe, expect, it } from "vitest";
import { ApiError } from "../src/errors.js";
import { TaskboardDatabase } from "../src/board.js";

function makeDb() {
  const db = new TaskboardDatabase(":memory:");
  db.createProject({ id: "local", name: "My project", prefix: "LOCAL" });
  return db;
}

function expectApiError(fn: () => unknown, status: number, code: string) {
  try {
    fn();
    expect.unreachable(`应当抛出 ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    expect((error as ApiError).code).toBe(code);
  }
}

describe("Stage 2 moveTask 基础语义", () => {
  it("换列：status 变化，version 1 到 2，updatedAt 不早于 createdAt", () => {
    const db = makeDb();
    const task = db.createTask({ projectId: "local", title: "a", status: "todo" });
    const moved = db.moveTask(task.id, 1, { status: "in_progress" });
    expect(moved.status).toBe("in_progress");
    expect(moved.version).toBe(2);
    expect(moved.updatedAt >= moved.createdAt).toBe(true);
  });

  it("移入空列：sortOrder = 1000（该列置顶基准值）", () => {
    const db = makeDb();
    const task = db.createTask({ projectId: "local", title: "a", status: "todo" });
    const moved = db.moveTask(task.id, task.version, { status: "done" });
    expect(moved.sortOrder).toBe(1000);
  });

  it("同列不带 sortOrder：去底部（MAX + 1000）", () => {
    const db = makeDb();
    const a = db.createTask({ projectId: "local", title: "a", status: "todo" });
    const b = db.createTask({ projectId: "local", title: "b", status: "todo" });
    // a(1000) b(0)，把 a 移到同列底部
    const moved = db.moveTask(a.id, a.version, { status: "todo" });
    expect(moved.sortOrder).toBe(b.sortOrder + 1000);
  });

  it("任务不存在返回 404 TASK_NOT_FOUND", () => {
    const db = makeDb();
    expectApiError(() => db.moveTask("no-such-id", 1, { status: "done" }), 404, "TASK_NOT_FOUND");
  });
});

describe("Stage 2 乐观锁", () => {
  it("过期版本被预检拒绝：409 VERSION_CONFLICT，details 给出期望与实际版本", () => {
    const db = makeDb();
    const task = db.createTask({ projectId: "local", title: "a", status: "todo" });
    const moved = db.moveTask(task.id, 1, { status: "done" }); // version 1 -> 2
    expect(moved.version).toBe(2);
    try {
      db.moveTask(task.id, 1, { status: "canceled" }); // 再用过期的 1
      expect.unreachable("应当抛出 VERSION_CONFLICT");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.status).toBe(409);
      expect(apiError.code).toBe("VERSION_CONFLICT");
      expect(apiError.details).toMatchObject({ expectedVersion: 1, actualVersion: 2 });
    }
  });

  it("模拟两个客户端竞抢：读同一版本，只有一个能成功（SKILL.md 认领协议）", () => {
    const db = makeDb();
    const task = db.createTask({ projectId: "local", title: "a", status: "todo" });
    // 客户端 A 和 B 都基于 version=1 工作
    const winner = db.moveTask(task.id, 1, { status: "in_progress" }); // A 认领成功
    expect(winner.version).toBe(2);
    expectApiError(() => db.moveTask(task.id, 1, { status: "in_progress" }), 409, "VERSION_CONFLICT"); // B 失败
  });

  it("冲突后按协议重试：重读最新版本，用最新版本重试成功", () => {
    const db = makeDb();
    const task = db.createTask({ projectId: "local", title: "a", status: "todo" });
    db.moveTask(task.id, 1, { status: "in_progress" });
    expectApiError(() => db.moveTask(task.id, 1, { status: "in_review" }), 409, "VERSION_CONFLICT");
    // SKILL.md 第 3 条：重新 issue get，用最新 version 重试一次
    const fresh = db.getTask(task.id);
    const retried = db.moveTask(fresh.id, fresh.version, { status: "in_review" });
    expect(retried.status).toBe("in_review");
    expect(retried.version).toBe(3);
  });

  it("version 不减不回退：每次成功写操作后严格 +1", () => {
    const db = makeDb();
    const task = db.createTask({ projectId: "local", title: "a", status: "todo" });
    expect(db.moveTask(task.id, 1, { status: "done" }).version).toBe(2);
    expect(db.moveTask(task.id, 2, { status: "backlog" }).version).toBe(3);
    expect(db.moveTask(task.id, 3, { status: "done" }).version).toBe(4);
  });
});
