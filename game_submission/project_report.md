# Trash Tactics — Project Report 

## Introduction
Trash Tactics is a 2D browser drag-and-drop sorting game designed to teach correct recycling and composting practices in Australia through quick, engaging rounds.

## Theme Justification & Potential Impact
“Reduce total waste generated in Australia by 10 per person by 2030.” (DCCEEW, National Waste Policy Action Plan 2019)
By reinforcing correct sorting categories through interactive repetition, the game can help reduce contamination, improve recycling outcomes, and encourage composting where available.

## Technology Stack
- HTML, CSS, Vanilla JavaScript (front-end only)
- No build tools; runs fully in-browser
- LLMs were used for ideation, item lists, code drafting, and refinement

## Gameplay Overview
- Three levels: Home → Campus → Community
- Each level presents a shuffled queue of everyday items
- Player sorts each item into Recycle, Compost, or Landfill via drag-and-drop (desktop) or tap buttons (mobile)
- Scoring: +1 for correct, −2 for wrong

## AI Tools & Prompts
Prompts for concept, assets, code, and refinement are recorded in `prompts/` for transparency.

## Reflection
Vibe coding with LLMs sped up asset ideation and UI scaffolding. Iteration focused on clarity of categories (e.g., coffee cups/lids/liners), accessibility (keyboard shortcuts, ARIA labels), and mobile layout.

## Future Work
- Add region-specific rules (e.g., soft plastics drop-off programs, FOGO availability)
- Introduce timed mode and streak bonuses
- Include a quick reference guide explaining tricky items and local council differences
