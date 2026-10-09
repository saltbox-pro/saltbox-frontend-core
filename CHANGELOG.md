# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Minion and collection extra data: manual add/edit/delete of records, extra
  data categories settings page (create/edit/delete with field management),
  modified-at column, and localized category/field labels and filters.
- CSV export unified across extra data, minions and jobs tables, with export
  split by current filters or selection.
- TTL support for jobs, tasks and policies, shown in the task creation form,
  task drawer and job header.
- Jobs tab on the master page (shared job-list components) and
  `minions_count` on the masters page; accepted masters' availability shown
  on the Controllers page.
- Keys shown in the minion drawer on the master page.
- Plugin slot for minion actions on the collection page; plugin tabs on
  minion details.
- Collection tree: drag-and-drop move/reorder and a tree-select parent
  picker in the edit drawer; per-collection statistics tabs with
  drag-and-drop reordering.
- Refresh button on tables, wired to live-refresh on relevant events.
- Toggleable cell filters across jobs, audit and dashboard tables; filter
  copy in the minions query builder and collection filter blocks;
  case-insensitive query-builder filters.
- Busy/blocked/unreachable minion statuses shown in the tasks UI.
- New template picker and SLS editor for jobs/tasks/policies: built-in
  default templates, i18n meta/description editing with a preview language
  switcher, manual Salt function input, and tighter file-name validation.
- Error boundaries wired for modules, routes and parcels; reworked error
  handling and display, including for invalid template schemas.

### Changed

- `json-preview`/`json-popover` components moved to the shared common
  package; the Audit page moved out of Core into its own microfrontend.
- Column resizing enabled by default across core tables (left disabled for
  the dashboard grain table and the SLS editor table).
- WebSocket access-token sync now binds once on module init instead of
  per-page.
- Minion details drawer widened; Salt Minion terminology unified across UI
  strings.
- Table store list updates made immutable for TanStack data; FastTable
  toolbar kept stable with nested tables; FastTable adopted the compound
  API; table settings buttons moved to the toolbar above the table.
- Tables now sort by date/time newest-first.
- Collection editing unified into a single settings drawer; the
  collection-creation modal replaced with a drawer.
- Default max retries for jobs set to 1.
- Long JSON values wrapped inside job return content; launch error message
  shown instead of an empty job returns table; all client job returns shown
  on the command responses tab.

### Fixed

- Statistics tabs scrolling, renaming, reset and the tab add-button
  click/default-tab localization.
- Job-repeat flow reopening the default form instead of the originating
  template.
- Regression in i18n titles/descriptions for SLS templates.
- Reset button text/tooltip and a broken `ActionButtonWithTooltip` import.
- Drop position and tree update after collection move/reorder.

### Removed

- `nodegroup` target type for job creation.
- Persisted filter state on the edit-collection page.
- Legacy job-templates route and JSON-schema based job/task creation flow.

## [0.1.0] - 2025-09-30

### Added

- Initial release — core microfrontend for infrastructure management, built from scratch.
- Minions management: list, details drawer, filtering, and basic actions.
- Commands: create and execute ad‑hoc commands for selected minions or groups.
- Tasks from SLS templates: create parameterized tasks from SLS file templates.
- SLS templates catalog integration with basic schema validation.
- Task and job pages with status, results, and progress stats.
- Routing and navigation for core pages (masters, minions, tasks, collections).
- API integration using `@saltbox/saltbox-core-api-client`.
- Data tables with sorting, filtering, and pagination (TanStack React Table).
- Query Builder integration for task and minion filters.
- Success/error notifications and confirmations for user actions.
- Basic internationalization scaffolding with `i18next`.
- Dynamic plugins system for UI based on Single SPA microfrontends.

### Changed

- UI/UX refinements for task/job modals and tables.
- Menu structure updates with priorities and new icons.

### Fixed

- WebSocket handling and live updates on the Job page.
- Task status rendering and targets column on task pages.
- Navigation issues (minion links, back-to-home, breadcrumbs).
- JSON schema loading, 404 handling, and localization loading.
- Pagination, loading states, and filters initialization for tables.
