// Stage 1 验收测试：建表、createTask、编号自愈、listTasks。
// 这是验收标准，不要修改本文件。跑不过就回去改 src/。
import { describe, expect, it } from "vitest";
import { ApiError } from "../src/errors.js";
import { TaskboardDatabase } from "../src/board.js";

function makeDb() {
  const db = new TaskboardDatabase(":memory:");
  db.createProject({ id: "local", name: "My project", prefix: "LOCAL" });
  return db;
}

describe("Stage 1 createProject", () => {
  it("创建项目后 nextTaskNumber 从 1 开始", () => {
    const db = makeDb();
    // 通过第一个任务间接验证：编号应为 LOCAL-1
    const task = db.createTask({ projectId: "local", title: "第一条", status: "todo" });
    expect(task.identifier).toBe("LOCAL-1");
  });

  it("重复的项目 id 被拒绝", () => {
    const db = makeDb();
    expect(() => db.createProject({ id: "local", name: "again", prefix: "LOCAL" })).toThrow();
  });
});

describe("Stage 1 createTask", () => {
  it("首个任务 version=1，sortOrder=1000（空列置顶基准值）", () => {
    const db = makeDb();
    const task = db.createTask({ projectId: "local", title: "a", status: "todo" });
    expect(task.version).toBe(1);
    expect(task.sortOrder).toBe(1000);
    expect(task.status).toBe("todo");
    expect(task.id).toBeTruthy();
    expect(task.createdAt).toBe(task.updatedAt);
  });

  it("新任务默认置顶：sortOrder = 当前列最小值 - 1000", () => {
    const db = makeDb();
    const t1 = db.createTask({ projectId: "local", title: "a", status: "todo" });
    const t2 = db.createTask({ projectId: "local", title: "b", status: "todo" });
    expect(t1.sortOrder).toBe(1000);
    expect(t2.sortOrder).toBe(0); // 1000 - 1000，t2 排在 t1 前面
  });

  it("项目不存在返回 404 PROJECT_NOT_FOUND", () => {
    const db = makeDb();
    try {
      db.createTask({ projectId: "nope", title: "a", status: "todo" });
      expect.unreachable("应当抛出 ApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
      expect((error as ApiError).code).toBe("PROJECT_NOT_FOUND");
    }
  });

  it("非法状态被预检拒绝（400 INVALID_STATUS）", () => {
    const db = makeDb();
    try {
      db.createTask({ projectId: "local", title: "a", status: "doing" as never });
      expect.unreachable("应当抛出 ApiError");
    } catch (error) {
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).code).toBe("INVALID_STATUS");
    }
  });
});

describe("Stage 1 编号自愈", () => {
  it("删除最大编号任务后，新任务不重号（MAX 与计数器取大者）", () => {
    const db = makeDb();
    const t1 = db.createTask({ projectId: "local", title: "a", status: "todo" });
    const t2 = db.createTask({ projectId: "local", title: "b", status: "todo" });
    expect(t1.identifier).toBe("LOCAL-1");
    expect(t2.identifier).toBe("LOCAL-2");
    db.removeTask(t2.id);
    const t3 = db.createTask({ projectId: "local", title: "c", status: "todo" });
    // 计数器已经是 3：即使 LOCAL-2 没了，也不能复用编号 2
    expect(t3.identifier).toBe("LOCAL-3");
  });

  it("编号空洞不影响计数器语义（删中间不重号）", () => {
    const db = makeDb();
    const t1 = db.createTask({ projectId: "local", title: "a", status: "todo" });
    db.createTask({ projectId: "local", title: "b", status: "todo" });
    db.removeTask(t1.id);
    const t3 = db.createTask({ projectId: "local", title: "c", status: "todo" });
    expect(t3.identifier).toBe("LOCAL-3");
  });
});

describe("Stage 1 listTasks", () => {
  it("按看板列顺序排序：backlog 在 todo 之前", () => {
    const db = makeDb();
    db.createTask({ projectId: "local", title: "todo 的", status: "todo" });
    db.createTask({ projectId: "local", title: "backlog 的", status: "backlog" });
    const tasks = db.listTasks({ projectId: "local" });
    expect(tasks.map((t) => t.status)).toEqual(["backlog", "todo"]);
  });

  it("status 过滤生效", () => {
    const db = makeDb();
    db.createTask({ projectId: "local", title: "a", status: "todo" });
    db.createTask({ projectId: "local", title: "b", status: "done" });
    const done = db.listTasks({ projectId: "local", status: "done" });
    expect(done).toHaveLength(1);
    expect(done[0].title).toBe("b");
  });

  it("projectId 过滤生效", () => {
    const db = new TaskboardDatabase(":memory:");
    db.createProject({ id: "p1", name: "P1", prefix: "P1" });
    db.createProject({ id: "p2", name: "P2", prefix: "P2" });
    db.createTask({ projectId: "p1", title: "a", status: "todo" });
    db.createTask({ projectId: "p2", title: "b", status: "todo" });
    expect(db.listTasks({ projectId: "p1" })).toHaveLength(1);
    expect(db.listTasks({ projectId: "p1" })[0].identifier).toBe("P1-1");
  });
});
