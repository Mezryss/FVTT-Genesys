## Alpha 0.2.9

### Features / Enhancements
- [PR #145](https://github.com/Mezryss/FVTT-Genesys/pull/145): FEATURE - Additional enhacenments and fixes to vehicle's sheets
    - Drop areas on the Inventory and Crew tabs now highlight regardless of the drop origin
    - Alternative view for the Skills tab
    - Propt for minion instantiation when dropping it to the sheet

### Bug Fixes / Misc
- [PR #149](https://github.com/Mezryss/FVTT-Genesys/pull/149): BUGFIX - Fix initiative message when rolling with symbols

<details>
<summary>Previous Releases</summary>

## Alpha 0.2.8

### Bug Fixes / Misc
-	[PR #136](https://github.com/Mezryss/FVTT-Genesys/pull/136), [PR #144](https://github.com/Mezryss/FVTT-Genesys/pull/144): BUGFIX - Minion skills and Combat tabs reflect changes immediately
-	[PR #139](https://github.com/Mezryss/FVTT-Genesys/pull/139): LOCALIZATION - Corrections for the french translation (@ZolOnTheNet)
-	[PR #143](https://github.com/Mezryss/FVTT-Genesys/pull/143): STYLING - Pad the motivation and notes editors

## Alpha 0.2.7

### Features / Enhancements
-	[PR #132](https://github.com/Mezryss/FVTT-Genesys/pull/132): ENHANCEMENT - Displays the source field data below an item's description
-	[PR #134](https://github.com/Mezryss/FVTT-Genesys/pull/134): FEATURE - Adds source field to adversaries and display it below their description

### Bug Fixes / Misc
-	[PR #129](https://github.com/Mezryss/FVTT-Genesys/pull/129): CHORE - Upgrade dependencies including Vue
-	[PR #131](https://github.com/Mezryss/FVTT-Genesys/pull/131): REFACTOR - Moves all the settings stored in the `CONFIG` to a nested path
-	[PR #130](https://github.com/Mezryss/FVTT-Genesys/pull/130): LOCALIZATION - Updates the french translation to the latest version (thanks to @ZolOnTheNet)
-	[PR #133](https://github.com/Mezryss/FVTT-Genesys/pull/133): BUGFIX - Fixes drag & drop highlight not working on Chrome/app

## Alpha 0.2.6
This new version will attempt to perform a data migration for vehicles the first time a GM logins into the world. Make sure the migration is completed before doing anything on the world.

### Features
-	[PR #125](https://github.com/Mezryss/FVTT-Genesys/pull/125): Enhance the vehicle sheet and make transfering items more robust

### Bug Fixes/Misc
-	[PR #124](https://github.com/Mezryss/FVTT-Genesys/pull/124): Safely fail if the `CalculateChance` worker is not found
-	[PR #126](https://github.com/Mezryss/FVTT-Genesys/pull/126): Adds the french translation to the language menu (thanks to @ZolOnTheNet)

## Alpha 0.2.5

### Features
-	[PR #117](https://github.com/Mezryss/FVTT-Genesys/pull/117): French translations thanks to @ZolOnTheNet

### Bug Fixes/Misc
-	[PR #116](https://github.com/Mezryss/FVTT-Genesys/pull/116): Fixes a harmless bug on the chance to succeed Web Worker

## Alpha 0.2.4

### Bug Fixes/Misc
-	[PR #112](https://github.com/Mezryss/FVTT-Genesys/pull/112): Fix sending items to chat with no damage
-	[PR #115](https://github.com/Mezryss/FVTT-Genesys/pull/115): Fix rolls with extra symbols

## Alpha 0.2.3

### Features
-	[PR #111](https://github.com/Mezryss/FVTT-Genesys/pull/111): Access the dice prompt directly from the chat

### Bug Fixes/Misc
-	[PR #108](https://github.com/Mezryss/FVTT-Genesys/pull/108): Scope the character and vehicle style sheets

## Alpha 0.2.2

### Features
-	[PR #104](https://github.com/Mezryss/FVTT-Genesys/pull/104): Adds an alternate way to calculate the chance to succeed (FVTTv11 only)

### Bug Fixes/Misc
-	[PR #105](https://github.com/Mezryss/FVTT-Genesys/pull/105): Additional enhacenments and fixes to vehicle's sheets
	-	Adds a plus sign to values equal or greater than 0 when displaying the "Handling" characteristic
	-	Limits the actors that can be dropped into a vehicle to only those you own
	-	Display skill ranks on the "Skills" tab and the "Character Skill Selection" prompt.
	-	Open a character sheet when clicking on their name in the "Skills" tab.
	-	When selecting a skill from the "Character Skill Selection" prompt it now throws a warning when selecting an actor that you don't own (previously it was letting you roll for anyone).
	-	Adds the option to modify a vehicle's passenger quantity and capacity using after effects

## Alpha 0.2.0

### Features
-	[PR #99](https://github.com/Mezryss/FVTT-Genesys/pull/99): Adds support for vehicles

## Alpha 0.1.15

### Features
-	[PR #87](https://github.com/Mezryss/FVTT-Genesys/pull/87): Adds equipment's damage state to the inventory tab
-	[PR #88](https://github.com/Mezryss/FVTT-Genesys/pull/88): Adds support for super-characteristics
-	[PR #95](https://github.com/Mezryss/FVTT-Genesys/pull/95): Use super-characteristics during initiative
-	[PR #96](https://github.com/Mezryss/FVTT-Genesys/pull/96): Allows GMs to add extra initiative slots

### Bug Fixes/Misc

-	[#90](https://github.com/Mezryss/FVTT-Genesys/issues/90): Makes the tier bubble display properly
-	[PR #97](https://github.com/Mezryss/FVTT-Genesys/pull/97): Allows rolling dice pools without dice

## Alpha 0.1.14

### Bug Fixes/Misc

-	[PR #86](https://github.com/Mezryss/FVTT-Genesys/issues/86): Adds injuries and motivations to adversaries
-	[PR #85](https://github.com/Mezryss/FVTT-Genesys/issues/85): Implements sending abilities and talents to chat
-	[PR #84](https://github.com/Mezryss/FVTT-Genesys/issues/84): Bugfix: Removes renamed talents correctly

## Alpha 0.1.13

### Bug Fixes/Misc

-	[#81](https://github.com/Mezryss/FVTT-Genesys/issues/81): Can't save item sheets

## Alpha 0.1.12

### Features

-   [PR #77](https://github.com/Mezryss/FVTT-Genesys/pull/77): Show chance to succeed when forming dice pool.

### Bug Fixes/Misc

-	[#76](https://github.com/Mezryss/FVTT-Genesys/issues/76): Can't edit sheet images
-	[PR #79](https://github.com/Mezryss/FVTT-Genesys/pull/79): Fix talent ranks
-	[#57](https://github.com/Mezryss/FVTT-Genesys/issues/57): Fix combat tracker

## Alpha 0.1.11

### Features

-   [PR #68](https://github.com/Mezryss/FVTT-Genesys/pull/68): Allow PCs to do Unskilled rolls
-	[PR #71](https://github.com/Mezryss/FVTT-Genesys/pull/71): Can manually edit attached item qualities' rating
-	[#12](https://github.com/Mezryss/FVTT-Genesys/issues/12): Equipment should provide its passive ActiveEffects only while equipped

### Bug Fixes/Misc

-	[#47](https://github.com/Mezryss/FVTT-Genesys/issues/47): Fix bug preventing deletion of manually-added abilities.
-	[PR #69](https://github.com/Mezryss/FVTT-Genesys/pull/69): Make case errors more obvious for effect sheets
-	[PR #70](https://github.com/Mezryss/FVTT-Genesys/pull/70): Bugfix: Add up all containers bonus encumbrance
-	[#74](https://github.com/Mezryss/FVTT-Genesys/issues/74): Increasing the Brawn attribute after adding Toughened permanently adds 3 to the wound threshold instead of 1

## Alpha 0.1.10

### Features (thanks to Assembling Kings)

-   [#64](https://github.com/Mezryss/FVTT-Genesys/issues/64): Support unskilled rolls by clicking Characteristic name in NPC sheets.
-   [#29](https://github.com/Mezryss/FVTT-Genesys/issues/29): When editing an Item or Actor's name, make capitalization clear.
-   [PR #62](https://github.com/Mezryss/FVTT-Genesys/pull/62): Categorize Item & Actor types with OptGroups

### Bug Fixes

-   [PR #58](https://github.com/Mezryss/FVTT-Genesys/pull/58): Fix skill check enricher

## Alpha 0.1.9

### Features

- Send to Chat implemented for Inventory Items! Equivalent functionality for Abilities & Talents will come with the Talents tab updates.

### Bug Fixes

- Fix [#40](https://github.com/Mezryss/FVTT-Genesys/issues/40): Upgrading ranked talents was too restrictive.
- Fix [#42](https://github.com/Mezryss/FVTT-Genesys/issues/42): Journal entries for skill upgrades are showing the wrong rank.
- Fix [#44](https://github.com/Mezryss/FVTT-Genesys/issues/44): Ranked Talent effects don't stack per rank.

## Alpha 0.1.8

### Updates

-   Work on [#2](https://github.com/Mezryss/FVTT-Genesys/issues/2): Inventory 2.0. There is still more work to be done on this!

## Alpha 0.1.7

### Bug Fixes

-   Fix [#20](https://github.com/Mezryss/FVTT-Genesys/issues/20): The HTML mode of the text editor was improperly sized.

## Alpha 0.1.6

### Bug Fixes

-   Fix [#35](https://github.com/Mezryss/FVTT-Genesys/issues/35): Active talents with no active category were listed twice.

## Alpha 0.1.5

### Bug Fixes

-   Fix [#36](https://github.com/Mezryss/FVTT-Genesys/issues/36): Career item sheet was not showing editor view.

## Alpha 0.1.4: The Magical Update!

-   With permission, added [MilkMyth](http://milkmyth.com)'s updated Magical Girl custom Dice Symbols to the system! These can be enabled in settings, are client-specific (so each user can use them or not, at their own discretion), and are also available for use in Dice So Nice!

## Alpha 0.1.3

### Bug Fixes:

-   Fix [#32](https://github.com/Mezryss/FVTT-Genesys/issues/32): Deleting qualities & skills on an item embedded in an Actor failed with a proxy error.

## Alpha 0.1.2

### Bug Fixes:

-   Fix [#31](https://github.com/Mezryss/FVTT-Genesys/issues/31): Quantity adjustment for items in inventory doesn't work.

## Alpha 0.1.1

### Updates:

-   Disallowed adding ActiveEffects to Item Qualities until a better solution is implemented for referencing or embedding them in items.
-   [#25](https://github.com/Mezryss/FVTT-Genesys/issues/25) Allow adding item qualities to Armor.

### Bug Fixes:

-   Fix [#22](https://github.com/Mezryss/FVTT-Genesys/issues/22): In skills tab, context menu can appear below XP Container and other skill categories.
-   Fix [#27](https://github.com/Mezryss/FVTT-Genesys/issues/27): Disallow archetype removal if XP has changed since Archetype was applied.
</details>
