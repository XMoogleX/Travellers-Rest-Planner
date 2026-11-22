# Travellers Rest Crop Planner

A crop planning tool for *Travellers Rest*, adapted from **exnil's** *Crop Planner* for *Stardew Valley*.

**Status: Work in Progress**

This project helps players organize their farms, plan crop rotations, estimate harvest quantities, and track the potential ingredient value of their crops across multiple seasons and years.

## Current Features

- Interactive planting calendar with four seasons of 28 days each.
- Multi-year planning with year and season navigation.
- Crop growth and regrowth calculations based on individual crop data.
- Seasonal planting restrictions and crops that continue growing across seasons.
- Automatic replanting support for single-harvest crops.
- Harvest quantity tracking with daily and seasonal totals.
- Seed cost and ingredient value calculations, including estimated net ingredient value.
- Gold, silver, and copper currency display using in-game coin sprites.
- Crop information sidebar with seasonal filters, search, growth information, and individual Wiki links.
- Expanded crop database, including trees and newer Arcane crops.
- Updated Travellers Rest interface, featuring in-game crop artwork and seasonal background styling.
- Browser-based saving using local storage.
- Import and export functionality for saving and transferring crop plans.
- Options to clear individual seasons, entire years, or the planner.

## How Calculations Work

The planner estimates crop production using growth times, regrowth intervals, planting quantities, seed costs, and base ingredient values.

Ingredient Value represents the estimated value of harvested ingredients.

Net Ingredient Value is calculated as:

Net Ingredient Value = Ingredient Value − Seed Costs

These figures are planning estimates, not guaranteed earnings. Crops used for cooking, brewing, or other crafting activities do not necessarily generate the displayed value as direct income.

Current calculations use base crop yields and do not include unverified skill, spell, fertilizer, or seasonal yield bonuses.

### Notes

- This project is still under development. Features and calculations may change as additional game mechanics are researched.
- Your crop plans are saved locally in your browser.
- Clearing your browser's site data may remove saved plans.
- Use the Export feature to create a backup of your crop plans.
- Crop information can be checked through the Wiki links provided in the planner.

## Planned Features

- Yearly statistics and financial summary.
- Skill Tree bonuses affecting growth, yields, and crop value.
- Spell-related crop bonuses.
- Seasonal bonus yield calculations.
- Arcane fertilizer requirements and related mechanics.
- Continued verification and refinement of crop data.
- Additional interface, accessibility, and usability improvements.

## Known Limitations

This project is an ongoing adaptation of the original Stardew Valley Crop Planner. Some calculations and internal systems may still require adjustments for *Travellers Rest*.

Although newer Arcane crops are included in the crop database, their special fertilizer requirements and other associated mechanics are not yet fully implemented.

Seasonal yield bonuses and other modifiers are not currently included in harvest projections.

Crop yield calculations use base yields unless otherwise specified.

## Community Feedback and Contributions

Feedback and contributions are welcome!

If you find an issue or have reliable game data, please open a GitHub Issue.

## Credits and Attribution

This project is an adaptation of *Crop Planner*, originally developed by **exnil** for *Stardew Valley*.

Original project: https://github.com/exnil/crop_planner

Original software copyright © 2016 exnil.

The original planner provided the foundation for the calendar interface and crop-planning system. This adaptation modifies that foundation to support *Travellers Rest*, including its crops, growth mechanics, currency system, and visual presentation.

Travellers Rest and its associated game artwork belong to their respective rights holders.

## License

This project retains the original MIT License and copyright notice.

See the LICENSE file for the complete license text.

The MIT License applies to the software code and does not grant rights to third-party game artwork, names, or other copyrighted assets.
