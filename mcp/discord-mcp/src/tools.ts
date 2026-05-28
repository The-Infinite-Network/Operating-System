import { z } from "zod";
import { DiscordClient } from "./client.js";
import { MCPError, ErrorCodes } from "./errors.js";

// ── Request / Response Schemas ────────────────────────────────────────────────

const ListGuildsRequestSchema = z.object({}).optional();

const ListGuildsResponseSchema = z.object({
  guilds: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      icon: z.string().nullable(),
      owner: z.boolean(),
    })
  ),
  count: z.number(),
});

const ListChannelsRequestSchema = z.object({
  guildId: z.string().min(1, "guildId is required"),
  types: z.array(z.number()).optional(), // filter by channel type (0=text, 2=voice, 4=category, etc.)
});

const ListChannelsResponseSchema = z.object({
  channels: z.array(
    z.object({
      id: z.string(),
      name: z.string().nullable(),
      type: z.number(),
      topic: z.string().nullable().optional(),
      position: z.number().optional(),
      parent_id: z.string().nullable().optional(),
    })
  ),
  count: z.number(),
});

const ReadMessagesRequestSchema = z.object({
  channelId: z.string().min(1, "channelId is required"),
  limit: z.number().int().min(1).max(100).default(50),
});

const ReadMessagesResponseSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      author: z.object({
        id: z.string(),
        username: z.string(),
        global_name: z.string().nullable().optional(),
      }),
      timestamp: z.string(),
      edited_timestamp: z.string().nullable(),
    })
  ),
  count: z.number(),
});

const SendMessageRequestSchema = z.object({
  channelId: z.string().min(1, "channelId is required"),
  content: z.string().min(1, "content is required").max(2000, "content exceeds Discord 2000-char limit"),
});

const SendMessageResponseSchema = z.object({
  id: z.string(),
  channel_id: z.string(),
  content: z.string(),
  timestamp: z.string(),
});

// ── Tools Class ───────────────────────────────────────────────────────────────

export class Tools {
  private client: DiscordClient;

  constructor() {
    this.client = new DiscordClient();
  }

  async ["discord.listGuilds"](params: unknown) {
    try {
      ListGuildsRequestSchema.parse(params);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, "Invalid request", {
          errors: err.errors,
        });
      }
      throw err;
    }

    try {
      const guilds = await this.client.listGuilds();
      return ListGuildsResponseSchema.parse({
        guilds: guilds.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: g.owner,
        })),
        count: guilds.length,
      });
    } catch (err) {
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }

  async ["discord.listChannels"](params: unknown) {
    let parsed: z.infer<typeof ListChannelsRequestSchema>;
    try {
      parsed = ListChannelsRequestSchema.parse(params);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, "Invalid request", {
          errors: err.errors,
        });
      }
      throw err;
    }

    try {
      const channels = await this.client.listChannels(parsed.guildId);
      const filtered = parsed.types
        ? channels.filter((c) => parsed.types!.includes(c.type))
        : channels;

      return ListChannelsResponseSchema.parse({
        channels: filtered.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          topic: c.topic ?? null,
          position: c.position,
          parent_id: c.parent_id ?? null,
        })),
        count: filtered.length,
      });
    } catch (err) {
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }

  async ["discord.readMessages"](params: unknown) {
    let parsed: z.infer<typeof ReadMessagesRequestSchema>;
    try {
      parsed = ReadMessagesRequestSchema.parse(params);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, "Invalid request", {
          errors: err.errors,
        });
      }
      throw err;
    }

    try {
      const messages = await this.client.readMessages(parsed.channelId, parsed.limit);
      return ReadMessagesResponseSchema.parse({
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          author: {
            id: m.author.id,
            username: m.author.username,
            global_name: m.author.global_name ?? null,
          },
          timestamp: m.timestamp,
          edited_timestamp: m.edited_timestamp,
        })),
        count: messages.length,
      });
    } catch (err) {
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }

  async ["discord.sendMessage"](params: unknown) {
    let parsed: z.infer<typeof SendMessageRequestSchema>;
    try {
      parsed = SendMessageRequestSchema.parse(params);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new MCPError(ErrorCodes.VALIDATION_ERROR, "Invalid request", {
          errors: err.errors,
        });
      }
      throw err;
    }

    try {
      const result = await this.client.sendMessage(parsed.channelId, parsed.content);
      return SendMessageResponseSchema.parse({
        id: result.id,
        channel_id: result.channel_id,
        content: result.content,
        timestamp: result.timestamp,
      });
    } catch (err) {
      if (err instanceof MCPError) throw err;
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, String(err));
    }
  }
}
