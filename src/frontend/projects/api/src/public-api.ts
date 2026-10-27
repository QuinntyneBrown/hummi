export { API_BASE_URL } from './lib/api-base-url';
export { shortRef, toProblem, toResult, type ApiProblem, type ApiResult, type FieldProblem } from './lib/api-result';
export { SessionStore, type CurrentUser } from './lib/auth/session-store';
export { AuthApi, type SignUpRequest } from './lib/auth/auth-api';
export { SignInGate } from './lib/auth/sign-in-gate';
export { provideApi } from './lib/provide-api';
export { apiResource, REQUEST_TIMEOUT_MS, type ApiResource, type ResourceState } from './lib/resource/api-resource';
export { PlaybackApi, type HomeDto, type TrackSummaryDto } from './lib/playback/playback-api';
export { PlayerStore, type PlayState } from './lib/playback/player-store';
export { ConnectivityService } from './lib/playback/connectivity';
export { PlayerOverlays, type TrackMenuState } from './lib/playback/player-overlays';
export {
  GenresApi,
  type GenreDirectoryDto,
  type GenreTileDto,
  type GenreTrackSort,
  type GenreTracksDto,
} from './lib/discovery/genres-api';
export {
  AlbumsApi,
  ArtistsApi,
  TracksApi,
  type AlbumDetailDto,
  type AlbumRefDto,
  type AlbumTileDto,
  type ArtistDetailDto,
  type ArtistRefDto,
  type Licence,
  type TrackDetailDto,
} from './lib/catalogue/catalogue-api';
export { SearchApi, type ArtistHitDto, type SearchResultsDto } from './lib/search/search-api';
export { SearchStore } from './lib/search/search-store';
