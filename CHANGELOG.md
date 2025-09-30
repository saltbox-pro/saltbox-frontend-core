# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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


