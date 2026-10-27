# @hummi/library

Angular feature library in the Hummi frontend workspace: the signed-in listener's library (L2-019).
Its lazy route table serves `/library` with the Playlists, Liked and Following tabs, the empty state
and the signed-out prompt. Likes and follows themselves are toggled through `LibraryStore` in
`@hummi/api`, which every page with a like or follow button uses (L2-018, ADR 0012).
