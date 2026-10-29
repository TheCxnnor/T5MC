import type { ProgressSnapshot } from "./cloudProgress";

export type SaveReceipt = {
  userId: string;
  version: number;
  updated_at: string;
};
export type CloudRecord = SaveReceipt & { progress: ProgressSnapshot };
export type Binding = { userId: string; version: number; fingerprint: string };
export type SyncPhase =
  | "guest"
  | "checking"
  | "choose"
  | "saved"
  | "pending"
  | "saving"
  | "error"
  | "conflict";
export type SyncState = {
  phase: SyncPhase;
  message: string;
  receipt: SaveReceipt | null;
};
export type AutoSavePorts = {
  capture(): ProgressSnapshot;
  binding(): Binding | null;
  store(binding: Binding | null): void;
  read(userId: string): Promise<CloudRecord | null>;
  write(
    userId: string,
    snapshot: ProgressSnapshot,
    version: number,
  ): Promise<SaveReceipt>;
  notify(state: SyncState): void;
  now(): number;
  online(): boolean;
};
export function fingerprint(snapshot: ProgressSnapshot) {
  return JSON.stringify(
    Object.keys(snapshot)
      .sort()
      .map((key) => [key, snapshot[key]]),
  );
}

export class AutoSave {
  private userId: string | null = null;
  private generation = 0;
  private linked = false;
  private paused = false;
  private receipt: SaveReceipt | null = null;
  private baseline = "";
  private observed = "";
  private changedAt = 0;
  private flight: Promise<void> | null = null;
  private stopped = false;
  private lastStatus = "";

  constructor(private ports: AutoSavePorts) {}
  private status(phase: SyncPhase, message: string) {
    const signature = JSON.stringify([phase, message, this.receipt]);
    if (signature === this.lastStatus) return;
    this.lastStatus = signature;
    this.ports.notify({ phase, message, receipt: this.receipt });
  }
  async initialize(userId: string | null) {
    this.userId = userId;
    this.linked = false;
    this.receipt = null;
    const generation = ++this.generation;
    if (!userId) {
      try {
        this.ports.store(null);
      } catch {
        /* Guest tracking needs no cloud binding. */
      }
      this.status("guest", "Saved on this device");
      return;
    }
    if (!this.ports.online()) {
      this.status("error", "Offline — changes are saved on this device.");
      return;
    }
    this.status("checking", "Checking cloud save…");
    try {
      const remote = await this.ports.read(userId);
      if (this.stopped || generation !== this.generation) return;
      const local = fingerprint(this.ports.capture());
      const binding = this.ports.binding();
      this.receipt = remote;
      if (remote && fingerprint(remote.progress) === local) {
        this.link(remote, remote.progress);
      } else if (
        remote &&
        binding?.userId === userId &&
        binding.version === remote.version
      ) {
        this.linked = true;
        this.baseline = binding.fingerprint;
        this.observed = local;
        this.changedAt = this.ports.now();
        this.status(
          local === this.baseline ? "saved" : "pending",
          local === this.baseline
            ? "Saved to cloud"
            : "Changes waiting to save…",
        );
      } else {
        this.status(
          "choose",
          "Choose browser or cloud progress to start auto-save",
        );
      }
    } catch {
      if (!this.stopped && generation === this.generation)
        this.status(
          "error",
          "Couldn’t sync. Browser progress is safe; retry when connected.",
        );
    }
  }
  link(receipt: SaveReceipt, snapshot: ProgressSnapshot) {
    if (this.stopped || receipt.userId !== this.userId) return;
    const value = fingerprint(snapshot);
    // Persist the acknowledged baseline, never unsent changes.
    this.ports.store({
      userId: receipt.userId,
      version: receipt.version,
      fingerprint: value,
    });
    this.generation++;
    this.receipt = {
      userId: receipt.userId,
      version: receipt.version,
      updated_at: receipt.updated_at,
    };
    this.baseline = value;
    this.observed = fingerprint(this.ports.capture());
    this.changedAt = this.ports.now();
    this.linked = true;
    this.status(
      this.observed === value ? "saved" : "pending",
      this.observed === value ? "Saved to cloud" : "Changes waiting to save…",
    );
  }
  unlink() {
    this.generation++;
    this.linked = false;
    this.ports.store(null);
    this.status(
      "choose",
      "Choose browser or cloud progress to start auto-save",
    );
  }
  async pause() {
    this.paused = true;
    await this.flight;
  }
  resume() {
    this.paused = false;
  }
  stop() {
    this.stopped = true;
    this.generation++;
    this.linked = false;
  }

  async tick() {
    if (
      this.stopped ||
      !this.linked ||
      this.paused ||
      this.flight ||
      !this.userId ||
      !this.receipt
    )
      return;
    let snapshot: ProgressSnapshot;
    try {
      snapshot = this.ports.capture();
    } catch {
      this.linked = false;
      this.status(
        "error",
        "Couldn’t read browser progress. Review your save on the Account page.",
      );
      return;
    }
    const value = fingerprint(snapshot);
    if (value === this.baseline) {
      this.observed = value;
      this.status("saved", "Saved to cloud");
      return;
    }
    if (value !== this.observed) {
      this.observed = value;
      this.changedAt = this.ports.now();
      this.status("pending", "Changes waiting to save…");
      return;
    }
    if (this.ports.now() - this.changedAt < 2000) return;
    if (!this.ports.online()) {
      this.status("error", "Offline — changes are saved on this device.");
      return;
    }
    const userId = this.userId,
      version = this.receipt.version,
      generation = this.generation;
    this.status("saving", "Saving to cloud…");
    this.flight = (async () => {
      try {
        const receipt = await this.ports.write(userId, snapshot, version);
        if (this.stopped || generation !== this.generation) return;
        this.link(receipt, snapshot);
      } catch (error) {
        if (this.stopped || generation !== this.generation) return;
        // Pause after an uncertain result. Retry first rechecks the cloud version.
        this.linked = false;
        const conflict =
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "40001";
        this.status(
          conflict ? "conflict" : "error",
          conflict
            ? "Cloud save changed. Choose which progress to keep."
            : "Couldn’t sync. Browser progress is safe; retry when connected.",
        );
      }
    })();
    await this.flight;
    this.flight = null;
  }
}
