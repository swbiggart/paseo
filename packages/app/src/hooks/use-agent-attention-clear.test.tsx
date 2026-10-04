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
        attentionTimestamp: "2026-01-01T00:00:00.000Z",
        isScreenFocused: false,
      }),
    );

    result.current.clearOnInputFocus();

    expect(calls).toEqual([
      ["agent-1", { observedAttentionTimestamps: { "agent-1": "2026-01-01T00:00:00.000Z" } }],
    ]);
  });

  it("clears without an observation when the attention has no timestamp", () => {
    const { client, calls } = createRecordingClient();
    const { result } = renderHook(() =>
      useAgentAttentionClear({
        agentId: "agent-1",
        client,
        isConnected: true,
        requiresAttention: true,
        attentionReason: "finished",
        attentionTimestamp: null,
        isScreenFocused: false,
      }),
    );

    result.current.clearOnInputFocus();

    expect(calls).toEqual([["agent-1", { observedAttentionTimestamps: undefined }]]);
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
        attentionTimestamp: "2026-01-01T00:00:00.000Z",
        isScreenFocused: false,
      }),
    );

    result.current.clearOnInputFocus();

    expect(calls).toEqual([]);
  });
});
