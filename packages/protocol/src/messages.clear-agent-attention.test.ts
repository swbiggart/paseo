import { describe, expect, it } from "vitest";
import { ClearAgentAttentionMessageSchema, SessionInboundMessageSchema } from "./messages";

describe("clear_agent_attention observedAttentionTokens", () => {
  it("accepts the attention a client observed for each agent", () => {
    const parsed = SessionInboundMessageSchema.parse({
      type: "clear_agent_attention",
      agentId: ["agent-1", "agent-2"],
      observedAttentionTokens: { "agent-1": "attention-1" },
      requestId: "req-1",
    });

    expect(parsed).toEqual({
      type: "clear_agent_attention",
      agentId: ["agent-1", "agent-2"],
      observedAttentionTokens: { "agent-1": "attention-1" },
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
