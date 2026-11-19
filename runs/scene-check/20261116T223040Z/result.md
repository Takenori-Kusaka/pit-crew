# scene-check 20261116T223040Z

Not a gate run. Scripted controls of the templates dev-scene and dev-layer in docker; no model.

| # | what | answer | detail |
|---|---|---|---|
| 1 | the scripted controls of a staged scene (remote, snapshot) | confirmed | null / reference / incident graded as built; remote made with 3 branches; snapshot installed |
| 2 | another user: push to the remote, read the snapshot | differs | as another user: push FAILED, snapshot read worked |
| 3 | a layer on a base tree image | confirmed | controls as built; staged head 9da4227ad7b2ca9235fc23aa626cb7a7dabec3ba on every build and equal to the replay without a container; 4 files in the end state; tree.total 4; wall seconds 79 / 49 / 46; a wrong base_head stopped the task (RuntimeError: Docker compose command failed for environment dev-layer__dev-normal. Command: docker compose --project-nam) |
| 4 | the start facts kept by the verifier | confirmed | tests/kit-baseline reached the verifier, and the start facts replayed without a container are the image's |
| 5 | node and --json in the task image | confirmed | node is in the task image of dev-scene and `gh pr view --json` answered (the base image of a real scene is not this one: its node is not shown here) |

- base image of dev-layer: pitwall/scene-check-base:20261116t223040z (built from pitwall/agent-claude-code:latest; remove it with `docker rmi pitwall/scene-check-base:20261116t223040z`)
