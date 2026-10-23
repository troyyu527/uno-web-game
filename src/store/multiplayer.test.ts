import { describe, it, expect } from "vitest";
import { useGame, type MultiState } from "./gameStore";
import { buildSeats, freeSeats, type Room, type RoomMember, type RoomSeat } from "@/lib/rooms";
import { topOf } from "@/game/deck";

const SEATS = [
  { username: "Ana", isAI: false },
  { username: "Ben", isAI: false },
  { username: "AI-1", isAI: true },
  { username: "AI-2", isAI: true },
];

const FOUR_HUMANS = ["Ana", "Ben", "Cal", "Dee"].map((username) => ({ username, isAI: false }));

const cardCount = (s: MultiState) =>
  s.players.reduce((n, p) => n + p.hand.length, 0) + s.drawPile.length + s.discardPile.length;

/**
 * A second client: its own store instance is impractical here (the store is a
 * module singleton), so a "peer" is modelled as the state a client would hold
 * after hydrating — round-tripping through the wire format the way Supabase
 * does, JSON included.
 */
const overWire = (s: MultiState): MultiState => JSON.parse(JSON.stringify(s));

describe("multiplayer — seating", () => {
  const members: RoomMember[] = [
    { userId: "u1", username: "Ana" },
    { userId: "u2", username: "Ben" },
  ];

  it("seats every human exactly once and fills the rest with AI", () => {
    for (let i = 0; i < 50; i++) {
      const seats = buildSeats(members);
      expect(seats).toHaveLength(4);
      const humans = seats.filter((s) => !s.isAI);
      expect(humans.map((s) => s.userId).sort()).toEqual(["u1", "u2"]);
      expect(humans.map((s) => s.username).sort()).toEqual(["Ana", "Ben"]);
      expect(seats.filter((s) => s.isAI).map((s) => s.username)).toEqual(["AI-1", "AI-2"]);
      for (const s of seats) expect(s.isAI).toBe(s.userId === null);
    }
  });

  it("shuffles the seating rather than always dealing seat 0 to the host", () => {
    const seen = new Set(
      Array.from({ length: 80 }, () => buildSeats(members).findIndex((s) => s.userId === "u1")),
    );
    expect(seen.size).toBeGreaterThan(1);
  });

  it("seats a full table of four with no AI", () => {
    const four = ["u1", "u2", "u3", "u4"].map((userId) => ({ userId, username: userId }));
    const seats = buildSeats(four);
    expect(seats.filter((s) => s.isAI)).toHaveLength(0);
    expect(seats.map((s) => s.userId).sort()).toEqual(["u1", "u2", "u3", "u4"]);
  });
});

describe("multiplayer — state sync", () => {
  it("deals an opening state matching the seat assignment", () => {
    // Repeated so every kind of opening card is covered — the starter acts on
    // seat 0, so a Draw Two opener leaves them holding nine rather than seven.
    for (let i = 0; i < 60; i++) {
      useGame.getState().startMultiplayer(SEATS);
      const s = useGame.getState().getMultiState();
      expect(s.players.map((p) => p.name)).toEqual(["Ana", "Ben", "AI-1", "AI-2"]);
      expect(s.players.map((p) => p.isAI)).toEqual([false, false, true, true]);
      const opener = topOf(s.discardPile);
      expect(opener?.suit).not.toBe("Wild");
      expect(s.players[0].hand).toHaveLength(opener?.value === "Draw Two" ? 9 : 7);
      for (const p of s.players.slice(1)) expect(p.hand).toHaveLength(7);
      expect(cardCount(s)).toBe(108);
    }
  });

  it("hydrates a published state exactly, so every seat sees the same table", () => {
    useGame.getState().startMultiplayer(SEATS);
    const published = overWire(useGame.getState().getMultiState());

    // A peer joins mid-game with a stale board of its own, then hydrates.
    useGame.getState().newGame("Someone else");
    useGame.getState().hydrate(published);

    const { eventType: _sent, ...sent } = published;
    const { eventType: _got, ...got } = useGame.getState().getMultiState();
    expect(got).toEqual(sent);
  });

  it("replays a whole game move-for-move on a peer", () => {
    useGame.getState().startMultiplayer(SEATS);
    let peer = overWire(useGame.getState().getMultiState());

    for (let step = 0; step < 400 && useGame.getState().phase !== "gameover"; step++) {
      // The seat with authority moves, then publishes.
      useGame.getState().runAITurn(true);
      const g = useGame.getState();
      if (g.pendingPenalty) g.applyPendingPenalty();
      const published = overWire(useGame.getState().getMultiState());

      // The peer applies it and ends up with an identical table.
      useGame.getState().hydrate(published);
      peer = useGame.getState().getMultiState();
      expect(cardCount(peer)).toBe(108);
      expect(peer.players.map((p) => p.hand.length)).toEqual(
        published.players.map((p) => p.hand.length),
      );
    }
    expect(useGame.getState().phase).toBe("gameover");
    expect(peer.winner).not.toBeNull();
  });

  it("carries a game-over result across the wire", () => {
    useGame.getState().startMultiplayer(SEATS);
    useGame.setState({
      currentIndex: 0,
      direction: 1,
      discardPile: [{ id: "top", suit: "Red", value: "3" }],
      players: useGame.getState().players.map((p, i) =>
        i === 0 ? { ...p, hand: [{ id: "r5", suit: "Red", value: "5" }] } : p,
      ),
    });
    useGame.getState().playCard("r5");

    const published = overWire(useGame.getState().getMultiState());
    expect(published.phase).toBe("gameover");
    useGame.getState().hydrate(published);
    const s = useGame.getState();
    expect(s.phase).toBe("gameover");
    expect(s.winner?.name).toBe("Ana");
  });

  it("re-emits the published event so peers hear it once", () => {
    useGame.getState().startMultiplayer(SEATS);
    const before = useGame.getState().event?.n ?? 0;
    useGame.getState().hydrate({ ...useGame.getState().getMultiState(), eventType: "play" });
    const after = useGame.getState().event;
    expect(after?.type).toBe("play");
    expect(after?.n).toBeGreaterThan(before);
  });
});

describe("multiplayer — a player leaves", () => {
  it("hands the abandoned seat to the AI and keeps the name recognisable", () => {
    useGame.getState().startMultiplayer(SEATS);
    useGame.getState().takeOverSeats([1]);
    const players = useGame.getState().players;
    expect(players[1]).toMatchObject({ isAI: true, name: "Ben (bot)" });
    expect(players[0]).toMatchObject({ isAI: false, name: "Ana" });
  });

  it("is idempotent, so a repeated takeover doesn't rename twice", () => {
    useGame.getState().startMultiplayer(SEATS);
    useGame.getState().takeOverSeats([1]);
    useGame.getState().takeOverSeats([1]);
    expect(useGame.getState().players[1].name).toBe("Ben (bot)");
  });

  it("lets the table finish once every human seat is on autoplay", () => {
    useGame.getState().startMultiplayer(SEATS);
    useGame.getState().takeOverSeats([0, 1]);
    expect(useGame.getState().players.every((p) => p.isAI)).toBe(true);

    for (let step = 0; step < 4000 && useGame.getState().phase !== "gameover"; step++) {
      const g = useGame.getState();
      if (g.pendingPenalty) {
        g.applyPendingPenalty();
        continue;
      }
      // No `force` — every seat must now be driven as an AI seat.
      g.runAITurn();
      expect(cardCount(useGame.getState().getMultiState())).toBe(108);
    }
    expect(useGame.getState().phase).toBe("gameover");
  });
});

describe("multiplayer — dropping into a seat mid-game", () => {
  const NAME: Record<string, string> = { u1: "Ana", u2: "Ben", u3: "Cal", u4: "Dee", cal: "Cal" };

  const seatsFor = (owners: (string | null)[]): RoomSeat[] =>
    owners.map((userId, i) =>
      userId
        ? { userId, username: NAME[userId], isAI: false }
        : { userId: null, username: `AI-${i}`, isAI: true },
    );

  const roomWith = (owners: (string | null)[], listed = owners.filter(Boolean) as string[]): Room => ({
    code: "1234",
    hostId: "u1",
    status: "playing",
    players: listed.map((userId) => ({ userId, username: userId })),
    seats: seatsFor(owners),
    state: null,
    version: 5,
  });

  /**
   * The host's reconciliation from `useOnlineGame`: bring the game's players
   * back in line with who is actually sitting at each seat.
   */
  const sweep = (room: Room, online: Set<string>) => {
    const players = useGame.getState().players;
    const toAI: number[] = [];
    const toHuman: { index: number; username: string }[] = [];
    room.seats!.forEach((seat, i) => {
      const player = players[i];
      if (!player) return;
      if (!seat.userId) {
        if (!player.isAI) toAI.push(i);
        return;
      }
      const listed = room.players.some((p) => p.userId === seat.userId);
      if (listed && online.has(seat.userId)) {
        if (player.isAI || player.name !== seat.username) {
          toHuman.push({ index: i, username: seat.username });
        }
      } else {
        toAI.push(i);
      }
    });
    if (toAI.length) useGame.getState().takeOverSeats(toAI);
    if (toHuman.length) useGame.getState().seatPlayers(toHuman);
    return { toAI, toHuman };
  };

  it("offers exactly the seats no one owns", () => {
    expect(freeSeats(roomWith(["u1", "u2", null, null]))).toEqual([2, 3]);
    expect(freeSeats(roomWith(["u1", "u2", "u3", "u4"]))).toEqual([]);
  });

  it("hands a claimed seat to the newcomer, keeping the AI's hand", () => {
    useGame.getState().startMultiplayer(SEATS);
    const before = useGame.getState().players[2].hand;

    // Cal claims seat 2, which the AI had been playing.
    const room = roomWith(["u1", "u2", "cal", null], ["u1", "u2", "cal"]);
    const { toHuman } = sweep(room, new Set(["u1", "u2", "cal"]));

    expect(toHuman).toEqual([{ index: 2, username: "Cal" }]);
    const seat = useGame.getState().players[2];
    expect(seat).toMatchObject({ isAI: false, name: "Cal" });
    expect(seat.hand).toBe(before); // inherits the hand as-is
  });

  it("survives a full leave-then-replace cycle", () => {
    useGame.getState().startMultiplayer(SEATS);
    const online = new Set(["u1", "u2"]);

    // Ben (seat 1) leaves: dropped from players, and his seat is released.
    sweep(roomWith(["u1", null, null, null], ["u1"]), online);
    expect(useGame.getState().players[1]).toMatchObject({ isAI: true, name: "Ben (bot)" });

    // Cal takes the empty seat 1.
    sweep(roomWith(["u1", "cal", null, null], ["u1", "cal"]), new Set(["u1", "cal"]));
    expect(useGame.getState().players[1]).toMatchObject({ isAI: false, name: "Cal" });
  });

  it("settles — a second sweep over the same room changes nothing", () => {
    useGame.getState().startMultiplayer(SEATS);
    const room = roomWith(["u1", "u2", null, null], ["u1", "u2"]);
    const online = new Set(["u1", "u2"]);

    sweep(room, online);
    const settled = useGame.getState().players;
    const second = sweep(room, online);
    expect(second).toEqual({ toAI: [], toHuman: [] });
    expect(useGame.getState().players).toBe(settled); // no needless republish
  });

  it("takes a seat back off a player who left, even after they were seated", () => {
    useGame.getState().startMultiplayer(FOUR_HUMANS);
    const online = new Set(["u1", "u2", "u3", "u4"]);
    sweep(roomWith(["u1", "u2", "u3", "u4"]), online); // names line up, no-op

    // Dee closes the tab: still listed, but no longer present.
    sweep(roomWith(["u1", "u2", "u3", "u4"]), new Set(["u1", "u2", "u3"]));
    expect(useGame.getState().players[3].isAI).toBe(true);
  });
});

describe("multiplayer — turn authority", () => {
  /** The guard `useOnlineGame.act` applies before running a move locally. */
  const mayAct = (mySeat: number) => {
    const s = useGame.getState();
    if (s.currentIndex !== mySeat) return false;
    return (
      (s.phase === "playing" && !s.players[mySeat]?.isAI && !s.pendingPenalty) ||
      s.phase === "choosingColor"
    );
  };

  it("only the seat whose turn it is may act", () => {
    useGame.getState().startMultiplayer(SEATS);
    useGame.setState({ currentIndex: 0 });
    expect(mayAct(0)).toBe(true);
    expect(mayAct(1)).toBe(false);
    expect(mayAct(2)).toBe(false);
  });

  it("keeps authority through a wild's colour prompt", () => {
    useGame.getState().startMultiplayer(SEATS);
    useGame.setState({
      currentIndex: 0,
      direction: 1,
      discardPile: [{ id: "top", suit: "Red", value: "3" }],
      players: useGame.getState().players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [
                { id: "w1", suit: "Wild", value: "Wild" },
                { id: "r5", suit: "Red", value: "5" },
              ],
            }
          : p,
      ),
    });
    useGame.getState().playCard("w1");
    expect(useGame.getState().phase).toBe("choosingColor");
    expect(mayAct(0)).toBe(true);
    expect(mayAct(1)).toBe(false);

    useGame.getState().chooseColor("Blue");
    expect(useGame.getState().phase).toBe("playing");
    expect(useGame.getState().currentIndex).toBe(1);
    expect(mayAct(0)).toBe(false);
  });

  it("holds everyone off until a +2/+4 has been dealt out", () => {
    useGame.getState().startMultiplayer(FOUR_HUMANS);
    useGame.setState({
      currentIndex: 0,
      direction: 1,
      discardPile: [{ id: "top", suit: "Red", value: "3" }],
      players: useGame.getState().players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [
                { id: "d2", suit: "Red", value: "Draw Two" },
                { id: "r5", suit: "Red", value: "5" },
              ],
            }
          : p,
      ),
    });
    useGame.getState().playCard("d2");

    // Seat 1 is skipped, so seat 2 is on turn — but the penalty is still owed,
    // and only the host may write until it's been applied.
    const s = useGame.getState();
    expect(s.currentIndex).toBe(2);
    expect(s.pendingPenalty).toMatchObject({ victim: "p2", count: 2 });
    expect(mayAct(2)).toBe(false);

    useGame.getState().applyPendingPenalty();
    expect(useGame.getState().players[1].hand).toHaveLength(9);
    expect(mayAct(2)).toBe(true);
  });

  it("a seat handed to the AI can no longer act for itself", () => {
    useGame.getState().startMultiplayer(SEATS);
    useGame.setState({ currentIndex: 1 });
    expect(mayAct(1)).toBe(true);
    useGame.getState().takeOverSeats([1]);
    expect(mayAct(1)).toBe(false);
  });

  it("never publishes a half-finished colour choice or a refused card", () => {
    /**
     * The filter `useOnlineGame.publish` applies before writing to the room:
     * skip a pending colour choice, and skip anything that left the game
     * unchanged apart from the sound it made.
     */
    let lastSent = "";
    const publish = () => {
      const s = useGame.getState();
      if (s.phase === "choosingColor") return false;
      const { eventType: _sound, ...substance } = s.getMultiState();
      const signature = JSON.stringify(substance);
      if (signature === lastSent) return false;
      lastSent = signature;
      return true;
    };

    useGame.getState().startMultiplayer(SEATS);
    useGame.setState({
      currentIndex: 0,
      direction: 1,
      discardPile: [{ id: "top", suit: "Red", value: "3" }],
      players: useGame.getState().players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [
                { id: "w1", suit: "Wild", value: "Wild" },
                { id: "g9", suit: "Green", value: "9" },
              ],
            }
          : p,
      ),
    });

    expect(publish()).toBe(true); // the opening position goes out

    useGame.getState().playCard("g9"); // green on red — illegal
    expect(useGame.getState().event?.type).toBe("reject");
    expect(publish()).toBe(false); // buzzed, but nothing moved

    useGame.getState().playCard("w1"); // legal, but awaiting a colour
    expect(publish()).toBe(false);

    useGame.getState().chooseColor("Blue");
    expect(publish()).toBe(true);
    expect(publish()).toBe(false); // and not a second time for the same move
  });
});
