import { describe, expect, it } from "vitest";
import { ClearAgentAttentionMessageSchema, SessionInboundMessageSchema } from "./messages";

describe("clear_agent_attention observedAttentionTimestamps", () => {
  it("accepts the attention a client observed for each agent", () => {
    const parsed = SessionInboundMessageSchema.parse({
      type: "clear_agent_attention",
      agentId: ["agent-1", "agent-2"],
      observedAttentionTimestamps: { "agent-1": "2026-01-01T00:00:00.000Z" },
      requestId: "req-1",
    });

    expect(parsed).toEqual({
      type: "clear_agent_attention",
      agentId: ["agent-1", "agent-2"],
      observedAttentionTimestamps: { "agent-1": "2026-01-01T00:00:00.000Z" },
      requestId: "req-1",
    });
  });

  it("still accepts a clear from a client that sends no observation", () => {
    const parsed = ClearAgentAttentionMessageSchema.parse({
      type: "clear_agent_attention",
      agentId: "agent-1",
    });

    expect(parsed).toEqual({ type: "clear_agent_attention", agentId: "agent-1" });
  });
});
