import { Component, createRef, type ReactNode } from "react";
import { finishMotion, playBuildMotion, playSlideMotion, resolveMotion, type DeckMotion } from "../lib/motion";
import { getBuildOrder } from "../lib/presentationBuilds";
import type { Slide } from "../types";

export type NavKind = "next" | "prev" | "goto";

type MotionStageProps = {
  slides: Slide[];
  index: number;
  revealed: number;
  motion: DeckMotion;
  navKind: NavKind;
  replayToken: number;
  className: string;
  children: ReactNode;
};

type Snapshot =
  | { kind: "slide"; ghost: HTMLElement; from: number }
  | { kind: "replay"; ghost: HTMLElement }
  | { kind: "build"; previous: number }
  | null;

/**
 * Keyed audience stage plus the transition layers around it. A class component because
 * getSnapshotBeforeUpdate runs before React mutates the DOM: the outgoing slide is cloned there
 * and running motion is finished, so split text is restored before React reconciles it.
 */
export class MotionStage extends Component<MotionStageProps> {
  private stage = createRef<HTMLDivElement>();
  private under = createRef<HTMLDivElement>();
  private over = createRef<HTMLDivElement>();

  componentDidMount() {
    this.play(null, 1, true, true);
  }

  getSnapshotBeforeUpdate(prev: MotionStageProps): Snapshot {
    const stage = this.stage.current;
    const slideChanged = prev.index !== this.props.index;
    const replay = prev.replayToken !== this.props.replayToken;
    if (!stage || !(slideChanged || replay || prev.revealed !== this.props.revealed)) return null;
    finishMotion();
    if (slideChanged) return { kind: "slide", ghost: stage.cloneNode(true) as HTMLElement, from: prev.index };
    if (replay) return { kind: "replay", ghost: stage.cloneNode(true) as HTMLElement };
    return { kind: "build", previous: prev.revealed };
  }

  componentDidUpdate(_prev: MotionStageProps, _state: unknown, snapshot: Snapshot) {
    if (!snapshot) return;
    if (snapshot.kind === "build") {
      const stage = this.stage.current;
      if (!stage || this.props.revealed <= snapshot.previous) return;
      const targets = getBuildOrder(this.props.slides[this.props.index]).slice(snapshot.previous, this.props.revealed);
      playBuildMotion(stage, targets, resolveMotion(this.props.motion, this.props.slides, this.props.index));
      return;
    }
    if (snapshot.kind === "replay") {
      this.play(snapshot.ghost, 1, true, true);
      return;
    }
    // Going back shows the previous slide complete; forward moves and jumps replay its entrance.
    this.play(snapshot.ghost, this.props.index > snapshot.from ? 1 : -1, this.props.navKind !== "prev", false);
  }

  componentWillUnmount() {
    finishMotion();
  }

  private play(ghost: HTMLElement | null, dir: number, entrance: boolean, force: boolean) {
    const stage = this.stage.current;
    const deck = stage?.parentElement;
    const under = this.under.current;
    const over = this.over.current;
    if (!stage || !deck || !under || !over) return;
    const profile = resolveMotion(this.props.motion, this.props.slides, this.props.index);
    playSlideMotion({ ghost, incoming: stage, dir, entrance, force, profile, layers: { deck, under, over } });
  }

  render() {
    const { index, className, children } = this.props;
    return (
      <>
        <div ref={this.under} className="motion-layer motion-under" aria-hidden="true" />
        <div ref={this.stage} key={index} className={className}>
          {children}
        </div>
        <div ref={this.over} className="motion-layer motion-over" aria-hidden="true" />
      </>
    );
  }
}
