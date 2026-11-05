# Travellers Rest Crop Planner

A crop planning tool for *Travellers Rest*, adapted from **exnil's** *Crop Planner* for *Stardew Valley*.

**Status: Work in Progress**

This project aims to help players organize their farms, plan crop rotations, and estimate harvest quantities throughout multiple seasons and years.

## Current Features

- Interactive crop planting calendar
- Four seasons with 28 days each
- Crop growth and regrowth calculations
- Seasonal planting restrictions
- Multi-season and multi-year crop planning
- Harvest quantity tracking
- Automatic replanting support
- Seasonal summary
- Browser-based saving
- Import and export functionality

## Running the Planner Locally

The *Travellers Rest Crop Planner* is currently in development and can be run locally using Python's built-in HTTP server.

### Requirements
- Python 3 installed on your computer
- A modern web browser

### Instructions

1. Download or clone this repository.
2. Open Command Prompt or a terminal in the project's root directory (the folder containing `index.html`).
3. Start a local HTTP server by running:

   `py -m http.server 8000`

4. Open your web browser and navigate to:

   **http://localhost:8000**

5. The crop planner should now be accessible in your browser.

### Stopping the Server

Return to the terminal and press **Ctrl + C** to stop the local server.

### Notes

- This project is still under development, and some features may be incomplete or subject to change.
- Your crop plans are saved locally in your browser using local storage.
- Clearing your browser's site data may remove your saved plans.

## Planned Features

- Yearly summary
- Skill Tree bonuses
- Spell-related harvest bonuses
- Seasonal bonus yield calculations
- Arcane crops and fertilizer requirements
- Updated crop information interface
- Improved crop data accuracy
- Additional interface improvements

## Known Limitations

This project is actively being converted from a Stardew Valley crop planner.

Some interface elements and calculations may still reflect the original planner.

Newer *Travellers Rest* mechanics, particularly Arcane fertilizer and seasonal harvest bonuses, are not yet fully documented or implemented.

Crop yield calculations currently use base yields without unverified bonuses.

## Community Feedback and Contributions

Feedback and contributions are welcome!

I'm particularly interested in help with:

- Verifying crop growth times and regrowth intervals
- Confirming crop yields and seasonal availability
- Understanding Arcane fertilizer mechanics
- Determining seasonal bonus probabilities
- Identifying bugs or incorrect calculations
- Suggestions for improving the planner

If you find an issue or have reliable game data, please open a GitHub Issue.

## Credits and Attribution

This project is an adaptation of *Crop Planner*, originally developed by **exnil** for *Stardew Valley*.

Original project: https://github.com/exnil/crop_planner

Original software copyright © 2016 exnil.

The original *Crop Planner* provided the foundation for the calendar interface and crop-planning system. This adaptation modifies that foundation to support *Travellers Rest*.

## License

This project retains the original MIT License and copyright notice.

See the "LICENSE" file for the full license text.

Game-related names, images, and other assets remain the property of their respective owners.
