export type BlackoutMode = "black" | "white" | null;

export type PresenterSnapshot = {
  index: number;
  count: number;
  revealed: number;
  buildCount: number;
  startedAt: number;
  deckTitle: string;
  blackout: BlackoutMode;
};

export type PresenterCommand =
  | { type: "prev" }
  | { type: "next" }
  | { type: "goto"; index: number }
  | { type: "blackout"; mode: BlackoutMode }
  | { type: "reset-timer" };

export type PresenterMessage =
  | { type: "state"; state: PresenterSnapshot }
  | { type: "command"; command: PresenterCommand }
  | { type: "request-state" };

const CHANNEL_NAME = "paper-slide-presenter";
const STORAGE_KEY = "paper-slide-presenter-message";
const SNAPSHOT_KEY = "paper-slide-presenter-snapshot";

type WireMessage = PresenterMessage & {
  sender: string;
  ts: number;
  packet?: string;
};

function senderId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing and embedded previews can deny localStorage.
  }
}

export function isPresenterWindow() {
  return new URLSearchParams(window.location.search).get("presenter") === "1";
}

export function openPresenterWindow() {
  const url = new URL(window.location.href);
  url.searchParams.set("presenter", "1");
  const win = window.open(url.toString(), "paper-slide-presenter", "popup=yes,width=1440,height=900");
  win?.focus();
}

export function readPresenterSnapshot(): PresenterSnapshot | null {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as PresenterSnapshot) : null;
  } catch {
    return null;
  }
}

export function createPresenterChannel(onMessage: (message: PresenterMessage) => void) {
  const id = senderId();
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  const seenPackets = new Set<string>();
  let packetSequence = 0;

  const receive = (message: WireMessage) => {
    if (!message || message.sender === id) return;
    const packet = message.packet ?? `${message.sender}:${message.ts}:${JSON.stringify(message)}`;
    if (seenPackets.has(packet)) return;
    seenPackets.add(packet);
    if (seenPackets.size > 100) {
      const oldest = seenPackets.values().next().value;
      if (oldest) seenPackets.delete(oldest);
    }
    const { sender: _sender, ts: _ts, ...payload } = message;
    delete payload.packet;
    onMessage(payload);
  };

  channel?.addEventListener("message", (event: MessageEvent<WireMessage>) => receive(event.data));

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      receive(JSON.parse(event.newValue) as WireMessage);
    } catch {
      // Ignore stale or malformed cross-window storage packets.
    }
  };
  window.addEventListener("storage", onStorage);

  return {
    post(message: PresenterMessage) {
      packetSequence += 1;
      const wire = { ...message, sender: id, ts: Date.now(), packet: `${id}:${packetSequence}` };
      if (message.type === "state") {
        writeStorage(SNAPSHOT_KEY, JSON.stringify(message.state));
      }
      channel?.postMessage(wire);
      writeStorage(STORAGE_KEY, JSON.stringify(wire));
    },
    close() {
      channel?.close();
      window.removeEventListener("storage", onStorage);
    },
  };
}
