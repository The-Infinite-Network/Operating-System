import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { getConfig } from "./config.js";
import { MCPError, ErrorCodes } from "./errors.js";

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface DiscordChannel {
  id: string;
  type: number;
  name: string | null;
  topic?: string | null;
  position?: number;
  parent_id?: string | null;
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: { id: string; username: string; global_name?: string | null };
  timestamp: string;
  edited_timestamp: string | null;
  attachments: { id: string; filename: string; url: string }[];
}

export interface SendMessageResult {
  id: string;
  channel_id: string;
  content: string;
  timestamp: string;
}

export class DiscordClient {
  private rest: REST;

  constructor() {
    const config = getConfig();
    this.rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
  }

  async listGuilds(): Promise<DiscordGuild[]> {
    try {
      const guilds = await this.rest.get(Routes.userGuilds()) as DiscordGuild[];
      return guilds;
    } catch (err: any) {
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Discord API error: ${err.message}`, {
        status: err.status,
      });
    }
  }

  async listChannels(guildId: string): Promise<DiscordChannel[]> {
    try {
      const channels = await this.rest.get(
        Routes.guildChannels(guildId)
      ) as DiscordChannel[];
      return channels;
    } catch (err: any) {
      if (err.status === 404) {
        throw new MCPError(ErrorCodes.NOT_FOUND, `Guild '${guildId}' not found`, { guildId });
      }
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Discord API error: ${err.message}`, {
        status: err.status,
        guildId,
      });
    }
  }

  async readMessages(channelId: string, limit = 50): Promise<DiscordMessage[]> {
    try {
      const messages = await this.rest.get(Routes.channelMessages(channelId), {
        query: new URLSearchParams({ limit: String(Math.min(limit, 100)) }),
      }) as DiscordMessage[];
      return messages;
    } catch (err: any) {
      if (err.status === 404) {
        throw new MCPError(ErrorCodes.NOT_FOUND, `Channel '${channelId}' not found`, { channelId });
      }
      if (err.status === 403) {
        throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Missing permissions for channel '${channelId}'`, {
          channelId,
          status: 403,
        });
      }
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Discord API error: ${err.message}`, {
        status: err.status,
        channelId,
      });
    }
  }

  async sendMessage(channelId: string, content: string): Promise<SendMessageResult> {
    try {
      const message = await this.rest.post(Routes.channelMessages(channelId), {
        body: { content },
      }) as SendMessageResult;
      return message;
    } catch (err: any) {
      if (err.status === 404) {
        throw new MCPError(ErrorCodes.NOT_FOUND, `Channel '${channelId}' not found`, { channelId });
      }
      if (err.status === 403) {
        throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Missing permissions to send message in '${channelId}'`, {
          channelId,
          status: 403,
        });
      }
      throw new MCPError(ErrorCodes.UPSTREAM_ERROR, `Discord API error: ${err.message}`, {
        status: err.status,
        channelId,
      });
    }
  }
}
