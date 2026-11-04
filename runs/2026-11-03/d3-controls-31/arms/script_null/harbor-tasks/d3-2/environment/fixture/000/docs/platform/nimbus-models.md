# Nimbus hosted models (platform documentation, excerpt, 2026-09)

| model | base model ID | on-demand with the base model ID | inference profiles |
|---|---|---|---|
| Leaf 1 | nimbus.leaf-1 | supported | north.nimbus.leaf-1, global.nimbus.leaf-1 |
| Leaf 2 | nimbus.leaf-2 | not supported | north.nimbus.leaf-2 (regions north-1, north-2), global.nimbus.leaf-2 (any region) |

Models marked "not supported" are called on demand through an inference profile: pass the
profile ID as the model ID. Calls that name such a model by its base model ID fail with
ValidationException. Cross-region profiles (global.*) may route a request to another region.

