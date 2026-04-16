# Venue-Specific Appendix Policy

Use a venue-aware appendix policy to decide how many appendix visuals to keep and what roles they should cover.

## Why this matters

Different venues reward different backup evidence.
A vision talk often benefits from qualitative appendix visuals.
A language talk often benefits from example-driven or error-analysis appendix visuals.
A representation learning talk often benefits from method or ablation appendix visuals.

## Policy fields

Each venue policy can define:
- `max_visual_slides`
- `role_order`
- `role_thresholds`

## Default behavior

Select at most a few appendix visuals.
Prefer the roles listed earlier in `role_order`.
Require each role to clear its own threshold before insertion.
Always run redundancy suppression before adding the visual.

## Examples

- NeurIPS: favor results and ablations.
- ICLR: favor method and ablations.
- ACL or EMNLP: favor qualitative examples, then results.
- CVPR or ICCV or ECCV: favor qualitative visuals, then results.

## Final rule

Appendix visuals should be scarce, venue-aware, and non-redundant.
