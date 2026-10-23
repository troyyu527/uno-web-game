import { motion } from "framer-motion";
import { CardView } from "./CardView";
import type { Card } from "@/game/types";

const card = (id: string, suit: Card["suit"], value: Card["value"], wildColor?: Card["wildColor"]): Card => ({
  id,
  suit,
  value,
  wildColor,
});

const SPECIALS: { c: Card; name: string; text: string }[] = [
  { c: card("r-skip", "Blue", "Skip"), name: "Skip", text: "The next player misses their turn." },
  { c: card("r-rev", "Green", "Reverse"), name: "Reverse", text: "Play reverses direction — the previous player goes next." },
  { c: card("r-d2", "Red", "Draw Two"), name: "Draw Two", text: "The next player draws 2 cards and is skipped." },
  { c: card("r-wild", "Wild", "Wild"), name: "Wild", text: "Play on anything, then choose the color that continues play." },
  {
    c: card("r-d4", "Wild", "Draw Four"),
    name: "Wild Draw Four",
    text: "Play it on any turn, whatever else you're holding. Choose a color; the next player draws 4 and is skipped.",
  },
];

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-7 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-50">How to play UNO</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-slate-300 transition hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-slate-300">
          <section>
            <h3 className="mb-1 font-bold text-uno-yellow">Goal</h3>
            <p>Be the first player to get rid of all your cards.</p>
          </section>

          <section>
            <h3 className="mb-1 font-bold text-uno-yellow">On your turn</h3>
            <p>
              Play one card that matches the top of the discard pile by <b>color</b> or by{" "}
              <b>number/symbol</b>. A number card example:
            </p>
            <div className="mt-3 flex items-center gap-4">
              <CardView card={card("r-num", "Red", "7")} width={4} animateIn={false} />
              <p className="text-slate-400">
                A red 7 can be played on any red card, or on any 7 of another color. If you can't
                play, draw a card from the deck — if <i>that</i> card is playable you may play it
                straight away, otherwise your turn passes.
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-uno-yellow">Special cards</h3>
            <div className="space-y-3">
              {SPECIALS.map((s) => (
                <div key={s.name} className="flex items-center gap-4 rounded-xl bg-white/5 p-3">
                  <CardView card={s.c} width={3.4} animateIn={false} />
                  <div>
                    <div className="font-bold text-slate-100">{s.name}</div>
                    <div className="text-slate-400">{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-1 font-bold text-uno-yellow">Saying "UNO"</h3>
            <p>
              When you're down to your last card, you have UNO! Here each player's badge shows their
              card count, and it flags <b>UNO!</b> automatically when someone has a single card left.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-bold text-uno-yellow">The opening card</h3>
            <p>
              The card turned up to start play counts: a <b>Draw Two</b> makes the first player draw
              two and lose their turn, a <b>Skip</b> passes them by, and a <b>Reverse</b> turns the
              table around before anyone plays. A wild is put back and another card turned up.
            </p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="mt-7 w-full rounded-full bg-gradient-to-br from-uno-red to-rose-600 px-6 py-2.5 font-bold text-white transition hover:brightness-110"
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
}
