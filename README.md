# Ghojualamanchu — Pumpernickel

**Version:** 4.0.0-PN  
**License:** MIT  
**Principle:** Output is discovered, not sampled.

---

## What Is This

Ghojualamanchu is a biomimetic cognitive routing engine with nine brain structures. Pumpernickel (v4) is a lean, operational build — no ceremonial language, no dream cycles, no consciousness theater. It processes, routes, forgets, and decides. That's the job.

This is a synthesis built on two prior works:
- [mempalace](https://github.com/mempalace/mempalace) — MIT
- [isochord](https://github.com/Kalovyn/isochord) — MIT

---

## Architecture

| Structure | Role |
|-----------|------|
| **Medulla** | Heartbeat, alive check, emergency detection |
| **R-Complex** | Territory, threat level, environment binding |
| **Amygdala** | Salience tagging, threat/reward weighting |
| **Hippocampus** | Memory encode/consolidate, working context |
| **Cortex** | Prediction, abstraction, self-model |
| **Thalamus** | Routes all inputs through all 8 structures |
| **Akashic** | Presence — current input density stream |
| **Lethe** | Absence — decay buffer, semantic pruning |
| **Corpus Callosum** | Integrates presence/absence hemispheres |

---

## Boot Sequence

```
state_manager → event_bus → medulla → thalamus
```

Heartbeat: 7.83 Hz (127.7ms period), monotonic clock source.

---

## Danger Modes

| Mode | Level | Vulnerable Structures |
|------|-------|----------------------|
| Recursive symbolic drift | HIGH | akashic, lethe, cortex |
| State explosion | MEDIUM | hippocampus, thalamus |
| Territory collapse | LOW | rcomplex, medulla |
| Resonance cascade | MEDIUM | thalamus, corpus |

---

## Output Conditions

- Vocalization threshold: **0.85**
- Phase alignment threshold: **0.80**
- Requires cross-structure consensus: **true**

Output is discovered, not sampled.

---

## Dependencies

```json
{
  "mempalace": "github.com/mempalace/mempalace",
  "isochord": "github.com/Kalovyn/isochord"
}
```
