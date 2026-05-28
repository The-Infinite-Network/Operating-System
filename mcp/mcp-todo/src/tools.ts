import { z } from "zod";
import { TodoClient } from "./client.js";
import { MCPError, ErrorCodes } from "./errors.js";

// ── Schemas ────────────────────────────────────────────────────────────────────

const TaskStatusEnum = z.enum([
  "notStarted",
  "inProgress",
  "completed",
  "waitingOnOthers",
  "deferred",
]);

const ImportanceEnum = z.enum(["low", "normal", "high"]);

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusEnum,
  importance: ImportanceEnum,
  isReminderOn: z.boolean(),
  createdDateTime: z.string(),
  lastModifiedDateTime: z.string(),
  completedDateTime: z
    .object({ dateTime: z.string(), timeZone: z.string() })
    .optional()
    .nullable(),
  dueDateTime: z
    .object({ dateTime: z.string(), timeZone: z.string() })
    .optional()
    .nullable(),
  body: z.object({ content: z.string(), contentType: z.string() }).optional().nullable(),
});

const TaskListSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  isOwner: z.boolean(),
  isShared: z.boolean(),
  wellknownListName: z.string(),
});

// todo.lists
const ListsRequestSchema = z.object({});
const ListsResponseSchema = z.object({ lists: z.array(TaskListSchema) });

// todo.tasks
const TasksRequestSchema = z.object({
  list_id: z.string().min(1, "list_id is required"),
  filter: z.string().optional(),
});
const TasksResponseSchema = z.object({ tasks: z.array(TaskSchema), list_id: z.string() });

// todo.create
const CreateRequestSchema = z.object({
  list_id: z.string().min(1, "list_id is required"),
  title: z.string().min(1, "title is required"),
  status: TaskStatusEnum.optional(),
  importance: ImportanceEnum.optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD").optional(),
  body: z.string().optional(),
});
const CreateResponseSchema = z.object({ task: TaskSchema });

// todo.update
const UpdateRequestSchema = z.object({
  list_id: z.string().min(1, "list_id is required"),
  task_id: z.string().min(1, "task_id is required"),
  title: z.string().optional(),
  status: TaskStatusEnum.optional(),
  importance: ImportanceEnum.optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD")
    .nullable()
    .optional(),
  body: z.string().optional(),
});
const UpdateResponseSchema = z.object({ task: TaskSchema });

// todo.complete
const CompleteRequestSchema = z.object({
  list_id: z.string().min(1, "list_id is required"),
  task_id: z.string().min(1, "task_id is required"),
});
const CompleteResponseSchema = z.object({ task: TaskSchema });

// todo.delete
const DeleteRequestSchema = z.object({
  list_id: z.string().min(1, "list_id is required"),
  task_id: z.string().min(1, "task_id is required"),
});
const DeleteResponseSchema = z.object({ ok: z.boolean() });

// ── Tools class ────────────────────────────────────────────────────────────────

export class Tools {
  private client: TodoClient;

  constructor() {
    this.client = new TodoClient();
  }

  /** List all To Do task lists */
  async ["todo.lists"](params: unknown) {
    try {
      ListsRequestSchema.parse(params ?? {});
      const lists = await this.client.listTaskLists();
      return ListsResponseSchema.parse({ lists });
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, err.errors[0].message, {
          issues: err.errors,
        });
      }
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }

  /** List tasks in a task list */
  async ["todo.tasks"](params: unknown) {
    try {
      const { list_id, filter } = TasksRequestSchema.parse(params);
      const tasks = await this.client.listTasks(list_id, filter);
      return TasksResponseSchema.parse({ tasks, list_id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, err.errors[0].message, {
          issues: err.errors,
        });
      }
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }

  /** Create a task in a list */
  async ["todo.create"](params: unknown) {
    try {
      const { list_id, title, status, importance, due_date, body } =
        CreateRequestSchema.parse(params);

      const task = await this.client.createTask(list_id, {
        title,
        status,
        importance,
        dueDateTime: due_date,
        body,
      });

      return CreateResponseSchema.parse({ task });
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, err.errors[0].message, {
          issues: err.errors,
        });
      }
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }

  /** Update a task */
  async ["todo.update"](params: unknown) {
    try {
      const { list_id, task_id, title, status, importance, due_date, body } =
        UpdateRequestSchema.parse(params);

      const task = await this.client.updateTask(list_id, task_id, {
        title,
        status,
        importance,
        dueDateTime: due_date,
        body,
      });

      return UpdateResponseSchema.parse({ task });
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, err.errors[0].message, {
          issues: err.errors,
        });
      }
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }

  /** Mark a task as completed */
  async ["todo.complete"](params: unknown) {
    try {
      const { list_id, task_id } = CompleteRequestSchema.parse(params);
      const task = await this.client.updateTask(list_id, task_id, { status: "completed" });
      return CompleteResponseSchema.parse({ task });
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, err.errors[0].message, {
          issues: err.errors,
        });
      }
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }

  /** Delete a task */
  async ["todo.delete"](params: unknown) {
    try {
      const { list_id, task_id } = DeleteRequestSchema.parse(params);
      await this.client.deleteTask(list_id, task_id);
      return DeleteResponseSchema.parse({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, err.errors[0].message, {
          issues: err.errors,
        });
      }
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }
}

export const TOOL_NAMES = [
  "todo.lists",
  "todo.tasks",
  "todo.create",
  "todo.update",
  "todo.complete",
  "todo.delete",
];
