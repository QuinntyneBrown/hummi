# @hummi/sharing

Angular feature library in the Hummi frontend workspace: sharing music (L2-025, L2-026). It exports
`ShareDialogHostComponent` (`hm-share-dialog-host`), which the shell renders for `ShareDialogs` in
`@hummi/api`, and a lazy route table serving `/s/{code}`: the shared track landing page, or a redirect
to the shared playlist with its code (ADR 0014). Calls go through `SharesApi` and `TracksApi`.
