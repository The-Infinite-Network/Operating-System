import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock config before importing Tools
vi.mock("../src/config.js", () => ({
  getConfig: () => ({ DISCORD_TOKEN: "mock-token", PORT: 3003, NODE_ENV: "test", CORS_ALLOWED_ORIGINS: [] }),
  validateConfig: vi.fn(),
}));

// Mock DiscordClient
vi.mock("../src/client.js", () => ({
  DiscordClient: vi.fn().mockImplementation(() => ({
    listGuilds: vi.fn().mockResolvedValue([
      { id: "111", name: "Test Server", icon: null, owner: true, permissions: "0" },
    ]),
    listChannels: vi.fn().mockResolvedValue([
      { id: "222", name: "general", type: 0, topic: "General chat", position: 0, parent_id: null },
    ]),
    readMessages: vi.fn().mockResolvedValue([
      {
        id: "333",
        content: "Hello world",
        author: { id: "444", username: "testuser", global_name: "Test User" },
        timestamp: "2026-03-16T00:00:00.000Z",
        edited_timestamp: null,
        attachments: [],
      },
    ]),
    sendMessage: vi.fn().mockResolvedValue({
      id: "555",
      channel_id: "222",
      content: "sent!",
      timestamp: "2026-03-16T00:00:00.000Z",
    }),
  })),
}));

import { Tools } from "../src/tools.js";

describe("discord.listGuilds", () => {
  it("returns guilds list", async () => {
    const tools = new Tools();
    const result = await tools["discord.listGuilds"](undefined);
    expect(result.count).toBe(1);
    expect(result.guilds[0].name).toBe("Test Server");
  });
});

describe("discord.listChannels", () => {
  it("returns channels for a guild", async () => {
    const tools = new Tools();
    const result = await tools["discord.listChannels"]({ guildId: "111" });
    expect(result.count).toBe(1);
    expect(result.channels[0].name).toBe("general");
  });

  it("rejects missing guildId", async () => {
    const tools = new Tools();
    await expect(tools["discord.listChannels"]({})).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
});

describe("discord.readMessages", () => {
  it("returns messages from a channel", async () => {
    const tools = new Tools();
    const result = await tools["discord.readMessages"]({ channelId: "222", limit: 10 });
    expect(result.count).toBe(1);
    expect(result.messages[0].content).toBe("Hello world");
  });

  it("rejects missing channelId", async () => {
    const tools = new Tools();
    await expect(tools["discord.readMessages"]({})).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
});

describe("discord.sendMessage", () => {
  it("sends a message and returns the result", async () => {
    const tools = new Tools();
    const result = await tools["discord.sendMessage"]({ channelId: "222", content: "sent!" });
    expect(result.id).toBe("555");
    expect(result.content).toBe("sent!");
  });

  it("rejects empty content", async () => {
    const tools = new Tools();
    await expect(
      tools["discord.sendMessage"]({ channelId: "222", content: "" })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects content over 2000 chars", async () => {
    const tools = new Tools();
    await expect(
      tools["discord.sendMessage"]({ channelId: "222", content: "x".repeat(2001) })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
