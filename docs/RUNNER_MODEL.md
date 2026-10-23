# Animated runner asset

The game can load a rigged runner from `public/models/quaternius-platformer-runner.glb`. Keep the procedural character in place as a fallback. The model must include at least one embedded animation clip; a clip named `Run`, `Jog`, or `Sprint` is preferred.

## Recommended source

- Quaternius, [Platformer Game Kit](https://quaternius.com/packs/ultimateplatformer.html)
- Official public download folder: [Platformer Game Kit - Dec 2021](https://drive.google.com/drive/folders/1NDZn_aGnn0vfFV3M22Y8GPcDjO8BVcLs)
- The pack page lists animated content, glTF format, and a CC0 license. The download folder also contains the pack's `License.txt`.

The public pack is organized into folders. Select the animated character model and export or convert it to a self-contained GLB with its rig, textures, and animation clips. Put that file at the path above and preserve the pack's `License.txt` alongside the asset (for example, as `public/models/Quaternius-License.txt`). Verify the model loads in the game and the animation clip is present before removing the procedural fallback.

No model file is currently included. Until the GLB is added, the existing procedural runner remains in use.
