// Stable public entry point: Explore/Home and Search share primitive contracts,
// not query state. Internal files avoid a circular schema dependency.
export * from './discovery.js';
export * from './search-results.js';
export * from './search-home.js';
