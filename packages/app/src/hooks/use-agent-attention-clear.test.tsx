/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DaemonClient } from "@getpaseo/client/internal/daemon-client";
import { useAgentAttentionClear } from "./use-agent-attention-clear";

type ClearCall = Parameters<DaemonClient["clearAgentAttention"]>;

function createRecordingClient(): { client: DaemonClient; calls: ClearCall[] } {
  const calls: ClearCall[] = [];
  const client = {
    clearAgentAttention: async (...args: ClearCall) => {
      calls.push(args);
    },
  } as unknown as DaemonClient;
  return { client, calls };
}

describe("useAgentAttentionClear", () => {
  it("names the attention it observed when it clears", () => {
    const { client, calls } = createRecordingClient();
    const { result } = renderHook(() =>
      useAgentAttentionClear({
        agentId: "agent-1",
        client,
        isConnected: true,
        requiresAttention: true,
        attentionReason: "finished",
        attentionToken: "attention-1",
        isScreenFocused: false,
      }),
    );

    result.current.clearOnInputFocus();

    expect(calls).toEqual([["agent-1", { observedAttentionTokens: { "agent-1": "attention-1" } }]]);
  });

  it("clears without an observation when the snapshot has no attention token", () => {
    const { client, calls } = createRecordingClient();
    const { result } = renderHook(() =>
      useAgentAttentionClear({
        agentId: "agent-1",
        client,
        isConnected: true,
        requiresAttention: true,
        attentionReason: "finished",
        attentionToken: null,
        isScreenFocused: false,
      }),
    );

    result.current.clearOnInputFocus();

    expect(calls).toEqual([["agent-1", { observedAttentionTokens: undefined }]]);
  });

  it("does not clear permission attention", () => {
    const { client, calls } = createRecordingClient();
    const { result } = renderHook(() =>
      useAgentAttentionClear({
        agentId: "agent-1",
        client,
        isConnected: true,
        requiresAttention: true,
        attentionReason: "permission",
        attentionToken: "attention-1",
        isScreenFocused: false,
      }),
    );

    result.current.clearOnInputFocus();

    expect(calls).toEqual([]);
  });
});
