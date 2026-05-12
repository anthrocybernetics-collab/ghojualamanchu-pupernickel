# mempalace

**Repository:** https://github.com/mempalace/mempalace  
**License:** MIT

## What It Does

MemPalace is a memory palace system built around the metaphor of wings, rooms, and drawers:
- **Wings** — identity continuity across sessions
- **Rooms** — topic-scope organization
- **Drawers** — verbatim original memories (unchanging)

It includes a knowledge graph with validity windows, consolidation-decay-dreaming operations, novelty extraction, and salience-weighted forgetting.

## Integration with Ghojualamanchu-Pumpernickel

MemPalace maps onto our Hippocampus and Lethe structures:

| MemPalace Concept | Ghojualamanchu Structure |
|---|---|
| Room = topic scope | Hippocampus `type` tag |
| Drawer = verbatim original | Hippocampus `longterm_memory` |
| Wing = identity continuity | Cortex `self_model` |
| Consolidation-dreaming | Lethe `decay_buffer` |
| Novelty extraction | Amygdala `salience_tags` |
| Validity windows | Lethe `decay_score` |

### Integration Points

1. **Hippocampus.encode()** → MemPalace `remember()` with room/wing assignment
2. **Hippocampus.consolidate()** → MemPalace `consolidate()` with drawer deposit
3. **Lethe.receiveFromHippocampus()** → MemPalace `forget()` or `decay()`
4. **Lethe.tick()** → MemPalace validity window expiry check

### Future Hook

When distributed mode is enabled (`future_extensions.distributed_mode.enabled: true`), MemPalace's mycelial sync (`mycelial_multi_node_sync`) could become the inter-instance memory bus.
