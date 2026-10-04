/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DaemonClient } from "@getpaseo/client/internal/daemon-client";
import { useAgentAttentionClear } from "./use-agent-attention-clear";

type ClearCall = Parameters<DaemonClient["clearAgentAttention"]>;

function createRecordingClient(options: { observedClear: boolean }): {
  client: DaemonClient;
  calls: ClearCall[];
} {
  const calls: ClearCall[] = [];
  const client = {
    getLastServerInfoMessage: () => ({
      features: options.observedClear ? { agentAttentionObservedClear: true } : {},
    }),
    clearAgentAttention: async (...args: ClearCall) => {
      calls.push(args);
    },
  } as unknown as DaemonClient;
  return { client, calls };
}

interface HookProps {
  attentionReason: "finished" | "error" | "permission";
  attentionToken: string | null;
  isScreenFocused: boolean;
}

function renderAttentionClear(client: DaemonClient, initialProps: HookProps) {
  return renderHook(
    (props: HookProps) =>
      useAgentAttentionClear({
        agentId: "agent-1",
        client,
        isConnected: true,
        requiresAttention: true,
        ...props,
      }),
    { initialProps },
  );
}

describe("useAgentAttentionClear", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("names the attention it observed when it clears", () => {
    const { client, calls } = createRecordingClient({ observedClear: true });
    const { result } = renderAttentionClear(client, {
      attentionReason: "finished",
      attentionToken: "attention-1",
      isScreenFocused: false,
    });

    result.current.clearOnInputFocus();

    expect(calls).toEqual([["agent-1", { observedAttentionTokens: { "agent-1": "attention-1" } }]]);
  });

  it("waits for the live attention token before clearing an agent restored from the cache", () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const { client, calls } = createRecordingClient({ observedClear: true });
    // The cached agent is unread and on screen, but the cache holds no token.
    const { result, rerender } = renderAttentionClear(client, {
      attentionReason: "finished",
      attentionToken: null,
      isScreenFocused: true,
    });
    result.current.clearOnInputFocus();

    expect(calls).toEqual([]);

    // The first live snapshot arrives while the agent is still on screen.
    rerender({ attentionReason: "finished", attentionToken: "attention-2", isScreenFocused: true });

    expect(calls).toEqual([["agent-1", { observedAttentionTokens: { "agent-1": "attention-2" } }]]);

    // A later token is a new event, not something this screen is still waiting on.
    rerender({ attentionReason: "finished", attentionToken: "attention-3", isScreenFocused: true });

    expect(calls).toHaveLength(1);
  });

  it("drops a clear it was waiting on when the agent left the screen before the token arrived", () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const { client, calls } = createRecordingClient({ observedClear: true });
    const { result, rerender } = renderAttentionClear(client, {
      attentionReason: "finished",
      attentionToken: null,
      isScreenFocused: true,
    });

    rerender({ attentionReason: "finished", attentionToken: null, isScreenFocused: false });
    result.current.clearOnAgentBlur();
    rerender({
      attentionReason: "finished",
      attentionToken: "attention-2",
      isScreenFocused: false,
    });

    expect(calls).toEqual([]);
  });

  it("clears unconditionally on a daemon that predates attention tokens", () => {
    const { client, calls } = createRecordingClient({ observedClear: false });
    const { result } = renderAttentionClear(client, {
      attentionReason: "finished",
      attentionToken: null,
      isScreenFocused: false,
    });

    result.current.clearOnInputFocus();

    expect(calls).toEqual([["agent-1"]]);
  });

  it("does not clear permission attention", () => {
    const { client, calls } = createRecordingClient({ observedClear: true });
    const { result } = renderAttentionClear(client, {
      attentionReason: "permission",
      attentionToken: "attention-1",
      isScreenFocused: false,
    });

    result.current.clearOnInputFocus();

    expect(calls).toEqual([]);
  });
});
