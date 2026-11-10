// 错误类型：形状镜像上游 shared/api-fields.mjs 的 ApiError。
// 上层（app.mjs）直接把 status/code/details 写进 HTTP 响应，CLI 和前端据此决定重试策略。

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
