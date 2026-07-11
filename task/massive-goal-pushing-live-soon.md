## Goal: Unify, Polish, and Clarify the Entire Application

Bring the entire application to a consistent, production-ready standard across every screen, component, entity, and user flow.

### 1. Unify the component system

All functionally similar elements must use the same shared component.

* Consolidate duplicate or near-duplicate components.
* Use shadcn components and our design tokens throughout the application.
* Do not introduce one-off spacing, sizing, colors, radii, shadows, typography, or other arbitrary values.
* Think in terms of DRY before creating anything new.
* Extend an existing component or pattern whenever possible instead of creating another variation.

The application should feel like one coherent product rather than a collection of independently designed screens.

### 2. Eliminate visual inconsistencies

Review every screen and identify inconsistencies in cards, tables, filters, headers, controls, navigation, empty states, and other repeated interface patterns.

All similar components should share the same:

* Structure
* Spacing
* Typography
* Borders and separators
* Corner radii
* Shadows
* Interaction states
* Information hierarchy

Differences must have a clear functional reason. For example, if one card uses separator borders and another does not, there must be a deliberate reason for that difference. Otherwise, the inconsistency should be removed.

All cards and interface elements should clearly look like they belong to the same application.

### 3. Keep entities and data consistent

The same entity must have a consistent data model everywhere it appears.

For example, if a campaign contains a specific set of fields, another screen must not invent or display additional fields that are unavailable in the actual product.

Use the screenshots in the `shots` folder and the staging application as the source of truth for what data is currently available.

Audit every entity across the dashboard and verify that:

* Field names remain consistent.
* Statuses remain consistent.
* Metrics use the same definitions.
* Values are formatted consistently.
* Screens do not display unavailable or fabricated data.
* The same object is represented consistently across lists, cards, detail pages, and reports.

### 4. Remove unnecessary interface noise

Remove anything that does not improve comprehension or support an action.

This includes:

* Redundant descriptions
* Explanatory text that repeats what the UI already communicates
* One-off icons that do not carry clear meaning
* Decorative elements without functional value
* Overly long titles
* Labels that can be inferred directly from the data

Keep titles short and precise. Let the data speak for itself wherever possible.

This does not mean removing necessary context. It means making every word and element earn its place.

### 5. Solve the application's main usability problem

The largest problem is not the amount of information displayed. It is that users often do not know what to do with that information.

Users should not have to repeatedly ask:

* What does this mean?
* Is this result good or bad?
* What changed?
* What should I investigate?
* What should I do next?

Reduce the amount of interpretation and decision-making required from the user.

The interface should clearly communicate:

1. What is happening
2. Why it matters
3. What changed
4. What requires attention
5. What the user should do next

Do not solve this by filling the interface with descriptions, helper icons, tooltips, and instructional copy. Solve it through stronger hierarchy, clearer information architecture, meaningful states, contextual actions, and well-designed flows.

The homepage already begins addressing this problem, but the same principle must be applied throughout the entire application.

Every metric, chart, result, and report should help the user reach a decision or take an action.

### 6. Audit the existing product flows

Complete several important workflows in the staging application using the credentials provided separately.

While completing each workflow, document:

* What was difficult to accomplish
* What was unclear
* Where the next step was not obvious
* What terminology was confusing
* Where information was missing
* Where the interface required unnecessary thought
* Where the user could become stuck
* Where the product failed to explain the result of an action

Then complete the equivalent workflow in our redesigned application.

Compare the two experiences and improve our version until it is materially clearer, faster, and easier to use.

Do not copy the staging application blindly. Treat it as a reference for available functionality and data, then design a substantially better experience.

### 7. Review every screen and flow

Continue until no meaningful screen, state, component, or workflow remains untouched.

This includes:

* Primary flows
* Secondary flows
* Detail pages
* Creation and editing flows
* Filters and search
* Loading states
* Empty states
* Error states
* Success states
* Disabled states
* Edge cases
* Responsive layouts
* Navigation between related entities

Everything must be reviewed, tested, and improved.

### 8. Repeat the audit after implementation

Once the first full pass is complete, return to the beginning and perform the UI/UX consistency audit again.

Repeat the complete process five times:

1. Audit
2. Improve
3. Test
4. Verify
5. Audit again

Each pass should identify issues missed during the previous one.

Continue until the application is:

* Visually consistent
* Structurally coherent
* Easy to understand
* Clear about what users should do next
* Faithful to the available data
* Free from unnecessary interface noise
* Ready for engineering and stakeholder handoff

Use subagents, Codex through `codex exec`, visual testing, and any other available tools where they improve the quality or reliability of the work.
