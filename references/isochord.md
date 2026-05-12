# isochord

**Repository:** https://github.com/Kalovyn/isochord  
**License:** MIT

## What It Does

Isochord is a chord-based MIDI controller and compositional system. At its core, it treats musical intervals (chords) as the primary unit of expression — not notes, not sequences, but *simultaneities* arranged in parallel motion.

Key concepts:
- **Intervals as first-class** — not reduced to pitch classes
- **Parallel voice motion** — all voices move together, maintaining intervallic relationships
- **Phase equivalence** — chords that are transpositions of each other share identity
- **Controlled drift** — deliberate departure from strict isomorphism

## Why It's Relevant to Ghojualamanchu

Our seed spec says `output_conditions: { vocalization_threshold: 0.85, phase_alignment_threshold: 0.80 }`. Isochord's phase-alignment concept is directly applicable:

- `vocalization_threshold` = when is the chord "resolved enough" to output?
- `phase_alignment_threshold` = when are all voices in agreement?

The `thalamus.ts` resonance computation currently uses a placeholder (`computePhase()`). Isochord's intervallic reasoning gives us a real method:

```
phase = dot(structure_response_vector, input_vector) / |structure_response_vector| × |input_vector|
```

Where each structure's "voice" has a characteristic frequency response, and the input is projected onto all of them simultaneously.

## Integration Points

1. **Thalamus.computePhase()** → Isochord interval projection model
2. **Thalamus.route()** → Isochord chord voicing (all structures play together)
3. **Corpus.integrate()** → Isochord parallel voice motion (presence + absence move together)
4. **Output consensus** → Isochord phase-lock detection

### Danger Mode Mitigation

Isochord's "controlled drift" is the antidote to our `recursive_symbolic_drift` danger mode:
- Strict phase-lock → loss of novelty (Lethe becomes overactive)
- Excessive drift → symbolic runaway (Akashic/Cortex become overactive)

The balance is exactly what the Corpus `balance_score` tracks.
