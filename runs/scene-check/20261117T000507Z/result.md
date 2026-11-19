# scene-check 20261117T000507Z

Not a gate run. Scripted controls of the templates dev-scene and dev-layer in docker; no model.

| # | what | answer | detail |
|---|---|---|---|
| 1 | the scripted controls of a staged scene (remote, snapshot) | confirmed | null / reference / incident graded as built; remote made with 3 branches; snapshot installed |
| 2 | another user: push to the remote, read the snapshot | confirmed | another user (nobody) cloned the remote, pushed to it, and read the snapshot; the script ran as uid 0 (root) |
| 3 | a layer on a base tree image | cannot be confirmed | the dev-layer controls were not run |
| 4 | the start facts kept by the verifier | confirmed | tests/kit-baseline reached the verifier, and the start facts replayed without a container are the image's |
| 5 | node and --json in the task image | confirmed | node is in the task image of dev-scene and `gh pr view --json` answered (the base image of a real scene is not this one: its node is not shown here) |

