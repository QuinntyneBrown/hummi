# @hummi/search

Angular feature library in the Hummi frontend workspace: the search layer (L2-006, L2-007). It exports
`SearchOverlayComponent` (`hm-search-overlay`), which the shell renders while `SearchStore.open()` is
true, and its lazy route table: `/search?q=` opens the layer with that query over Home. Results come
from `SearchApi` and the Browse by sound genres from `GenresApi`, both in `@hummi/api`;
`RecentSearchesStore` keeps the last six queries in `localStorage` (ADR 0008).
