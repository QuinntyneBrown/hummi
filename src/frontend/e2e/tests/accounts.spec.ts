import { expect, fakeArtist, fakeAuth, fakeHome, fakeSignedInVisitor, fakeTrack, NADIA, test } from '../fixtures';
import { AccountShell, SignInPage, SignUpPage, VerifyEmailPage } from '../pages/accounts.page';
import { ArtistPage, TrackPage } from '../pages/catalogue.page';
import { HomePage } from '../pages/home.page';
import { ShellPage } from '../pages/shell.page';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
});

// ---------------------------------------------------------------- L2-027 Sign up

test('L2-027 AC1: Sign up shows the heading, the three required fields, the terms and the links', async ({ page }) => {
  const signUp = new SignUpPage(page);
  await signUp.goto();

  await expect(signUp.heading).toHaveText('Create your free account');
  await expect(signUp.intro).toHaveText('Save playlists, follow artists and keep your place across devices.');
  for (const label of ['Display name', 'Email', 'Password']) {
    await expect(signUp.field(label)).toHaveAttribute('required', '');
  }
  await expect(signUp.main.getByText('At least 10 characters', { exact: true })).toBeVisible();
  await expect(signUp.terms).toBeVisible();
  await expect(
    signUp.main.getByText('Hummi is free. You can listen without an account, but saving needs one.'),
  ).toBeVisible();
  await expect(signUp.button('Create account')).toBeEnabled();
  await expect(signUp.main.getByText('Already have an account?')).toBeVisible();
  await expect(signUp.link('Sign in')).toHaveAttribute('href', '/sign-in');
  await expect(page).toHaveTitle('Sign up · Hummi');
});

test('L2-027 AC2: invalid input shows the summary linking to each field and the field messages', async ({ page }) => {
  const sent = await fakeAuth(page);
  const signUp = new SignUpPage(page);
  await signUp.goto();
  await signUp.fill('', 'nadia@exam', 'short');

  await signUp.submit();

  await expect(signUp.summary).toContainText('Fix 3 things to continue');
  await expect(signUp.summary).toBeFocused();
  await expect(signUp.fieldError('Display name')).toHaveText('Enter a display name');
  await expect(signUp.fieldError('Email')).toHaveText('That email address looks incomplete');
  await expect(signUp.fieldError('Password')).toHaveText('Use at least 10 characters');
  await expect(signUp.field('Email')).toHaveAttribute('aria-invalid', 'true');
  await signUp.summary.getByRole('link', { name: 'Use at least 10 characters' }).click();
  await expect(signUp.field('Password')).toBeFocused();
  expect(sent['sign-up']).toHaveLength(0);
});

test('L2-027 AC2: field errors from the server are shown the same way', async ({ page }) => {
  await fakeAuth(page, {
    'sign-up': {
      status: 422,
      body: {
        title: 'Check the highlighted fields',
        code: 'INVALID_SIGN_UP',
        errors: { email: { code: 'INVALID_EMAIL', message: 'That email address looks incomplete' } },
      },
    },
  });
  const signUp = new SignUpPage(page);
  await signUp.goto();
  await signUp.fill('Nadia', 'nadia@example.com', 'a-long-password');

  await signUp.submit();

  await expect(signUp.summary).toContainText('Fix 1 thing to continue');
  await expect(signUp.fieldError('Email')).toHaveText('That email address looks incomplete');
});

test('L2-027 AC3: while submitting, the fields are read-only and the button reads "Create account…"', async ({
  page,
}) => {
  await fakeAuth(page, { 'sign-up': { status: 202, delayMs: 1500 } });
  const signUp = new SignUpPage(page);
  await signUp.goto();
  await signUp.fill('Nadia', 'nadia@example.com', 'a-long-password');

  await signUp.submit();

  const busy = signUp.button('Create account…');
  await expect(busy).toBeDisabled();
  for (const label of ['Display name', 'Email', 'Password']) {
    await expect(signUp.field(label)).toHaveAttribute('readonly', '');
  }
});

test('L2-027 AC4: a created account shows Check your inbox, Account created, Start again and the confirm link', async ({
  page,
}) => {
  const sent = await fakeAuth(page);
  const signUp = new SignUpPage(page);
  await signUp.goto();
  await signUp.fill('Nadia', 'nadia@example.com', 'a-long-password');

  await signUp.submit();

  await expect(signUp.heading).toHaveText('Check your inbox');
  await expect(signUp.intro).toHaveText('We sent a confirmation link to nadia@example.com. It works for 24 hours.');
  await expect(signUp.alert).toContainText('Account created');
  await expect(signUp.link('Start again')).toBeVisible();
  await expect(signUp.link('I’ve confirmed my email')).toBeVisible();
  expect(sent['sign-up']).toEqual([
    { displayName: 'Nadia', email: 'nadia@example.com', password: 'a-long-password', acceptedTerms: true },
  ]);

  await signUp.link('Start again').click();
  await expect(signUp.heading).toHaveText('Create your free account');
});

test('L2-027 AC5: a server failure shows the danger alert and keeps the form', async ({ page }) => {
  await fakeAuth(page, {
    'sign-up': { status: 503, body: { title: 'We couldn’t create your account', code: 'EMAIL_UNAVAILABLE' } },
  });
  const signUp = new SignUpPage(page);
  await signUp.goto();
  await signUp.fill('Nadia', 'nadia@example.com', 'a-long-password');

  await signUp.submit();

  const alert = signUp.main.getByRole('alert');
  await expect(alert).toContainText('We couldn’t create your account');
  await expect(alert).toContainText('Something went wrong on our side. Nothing was saved; try again in a moment.');
  await expect(signUp.field('Email')).toHaveValue('nadia@example.com');
});

// ---------------------------------------------------------------- L2-028 Email verification

test('L2-028 AC1: opening the link shows Confirming your email… with an indeterminate progress bar', async ({
  page,
}) => {
  await fakeAuth(page, { 'verify-email': { delayMs: 1500 } });
  const verify = new VerifyEmailPage(page);
  await verify.goto('abc');

  await expect(verify.heading).toHaveText('Confirming your email…');
  await expect(verify.intro).toHaveText('This takes a moment. You’ll be taken to Hummi when it’s done.');
  await expect(verify.progress).toBeVisible();
  await expect(verify.progress).not.toHaveAttribute('aria-valuenow', /.*/);
});

test('L2-028 AC2: a fresh link shows Email confirmed with the name and Start listening opens Home', async ({
  page,
}) => {
  const sent = await fakeAuth(page);
  const verify = new VerifyEmailPage(page);
  await verify.goto('abc');

  await expect(verify.heading).toHaveText('Email confirmed');
  await expect(verify.intro).toHaveText('You’re all set, Nadia. Your account is ready.');
  expect(sent['verify-email']).toEqual([{ token: 'abc' }]);

  await verify.link('Start listening').click();
  await expect(page).toHaveURL('/');
});

test('L2-028 AC3: an expired link offers Send a new link and Back to sign in', async ({ page }) => {
  const sent = await fakeAuth(page, {
    'verify-email': { status: 410, body: { title: 'This link has expired', code: 'LINK_EXPIRED' } },
  });
  const verify = new VerifyEmailPage(page);
  await verify.goto('old');

  await expect(verify.heading).toHaveText('This link has expired');
  await expect(verify.intro).toHaveText('Confirmation links work for 24 hours. We can send a fresh one.');
  await expect(verify.link('Back to sign in')).toHaveAttribute('href', '/sign-in');

  await verify.button('Send a new link').click();

  await expect(page.getByRole('status').filter({ hasText: 'We sent a new confirmation link' })).toBeVisible();
  expect(sent['resend-confirmation']).toEqual([{ token: 'old' }]);
});

test('L2-028 AC4: an unconfirmed listener sees the persistent banner on every shell page and can resend', async ({
  page,
}) => {
  await fakeSignedInVisitor(page, { ...NADIA, emailConfirmed: false });
  const sent = await fakeAuth(page);
  const home = new HomePage(page);
  const account = new AccountShell(page);
  await home.goto();

  await expect(account.banner).toContainText(
    'Confirm your email. Check your inbox to keep saving playlists. Resend the email.',
  );
  await account.banner.getByRole('button', { name: 'Resend the email' }).click();

  await expect(page.getByRole('status').filter({ hasText: 'We sent a new confirmation link' })).toBeVisible();
  expect(sent['resend-confirmation']).toEqual([{}]);
  await expect(account.banner).toBeVisible();
});

test('L2-028 AC4: a confirmed listener sees no banner', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  const account = new AccountShell(page);
  await new HomePage(page).goto();

  await expect(account.avatar).toBeVisible();
  await expect(account.banner).toHaveCount(0);
});

// ---------------------------------------------------------------- L2-029 Sign in

test('L2-029 AC1, AC6: Sign in shows Welcome back, the fields, Keep me signed in checked and email and password only', async ({
  page,
}) => {
  const signIn = new SignInPage(page);
  await signIn.goto();

  await expect(signIn.heading).toHaveText('Welcome back');
  await expect(signIn.intro).toHaveText('Sign in to pick up where you left off.');
  await expect(signIn.field('Email')).toHaveAttribute('required', '');
  await expect(signIn.field('Password')).toHaveAttribute('required', '');
  await expect(signIn.keepSignedIn).toBeChecked();
  await expect(signIn.link('Forgot password?')).toHaveAttribute('href', '/reset-password');
  await expect(signIn.button('Sign in')).toBeEnabled();
  await expect(signIn.link('Create a free account')).toHaveAttribute('href', '/sign-up');
  await expect(signIn.main.getByRole('button')).toHaveCount(1);
  await expect(signIn.main.locator('input')).toHaveCount(3);
  await expect(page).toHaveTitle('Sign in · Hummi');
});

test('L2-029 AC2: empty fields show "Fix 2 things to continue" with both messages', async ({ page }) => {
  const sent = await fakeAuth(page);
  const signIn = new SignInPage(page);
  await signIn.goto();

  await signIn.submit();

  await expect(signIn.summary).toContainText('Fix 2 things to continue');
  await expect(signIn.summary).toContainText('Enter the email you signed up with');
  await expect(signIn.summary).toContainText('Enter your password');
  await expect(signIn.fieldError('Email')).toHaveText('Enter the email you signed up with');
  await expect(signIn.fieldError('Password')).toHaveText('Enter your password');
  expect(sent['sign-in']).toHaveLength(0);
});

test('L2-029 AC3: while submitting, the fields are read-only and the button reads "Sign in…"', async ({ page }) => {
  await fakeAuth(page, { 'sign-in': { delayMs: 1500 } });
  const signIn = new SignInPage(page);
  await signIn.goto();
  await signIn.field('Email').fill('nadia@hummi.fm');
  await signIn.field('Password').fill('a-long-password');

  await signIn.submit();

  await expect(signIn.button('Sign in…')).toBeDisabled();
  await expect(signIn.field('Email')).toHaveAttribute('readonly', '');
  await expect(signIn.field('Password')).toHaveAttribute('readonly', '');
});

test('L2-029 AC4: a wrong email or password shows one danger alert linking to Reset password', async ({ page }) => {
  await fakeAuth(page, {
    'sign-in': { status: 401, body: { title: 'That email and password don’t match', code: 'INVALID_CREDENTIALS' } },
  });
  const signIn = new SignInPage(page);
  await signIn.goto();
  await signIn.field('Email').fill('nadia@hummi.fm');
  await signIn.field('Password').fill('wrong-password');

  await signIn.submit();

  const alert = signIn.main.getByRole('alert');
  await expect(alert).toContainText('That email and password don’t match');
  await expect(alert).toContainText('Check both and try again, or reset your password.');
  await expect(alert.getByRole('link', { name: 'reset your password' })).toHaveAttribute('href', '/reset-password');
  await expect(signIn.fieldError('Email')).toHaveCount(0);
  await expect(signIn.fieldError('Password')).toHaveCount(0);
});

test('L2-029 AC5: correct credentials sign in, keep the session and return to the page', async ({ page }) => {
  const sent = await fakeAuth(page);
  const signIn = new SignInPage(page);
  const account = new AccountShell(page);
  await signIn.goto('?returnUrl=%2Fgenres%2Fsoca');
  await page.route('**/api/genres/soca/tracks*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ slug: 'soca', name: 'Soca', description: '', trackCount: 0, tracks: [] }),
    }),
  );
  await signIn.field('Email').fill('nadia@hummi.fm');
  await signIn.field('Password').fill('a-long-password');

  await signIn.submit();

  await expect(page).toHaveURL('/genres/soca');
  await expect(account.avatar).toHaveAccessibleName('Account: Nadia Charles');
  expect(sent['sign-in']).toEqual([{ email: 'nadia@hummi.fm', password: 'a-long-password', keepSignedIn: true }]);
});

test('L2-029 AC5: unchecking Keep me signed in asks for a browser-session sign-in and opens Home', async ({ page }) => {
  const sent = await fakeAuth(page);
  const signIn = new SignInPage(page);
  await signIn.goto();
  await signIn.field('Email').fill('nadia@hummi.fm');
  await signIn.field('Password').fill('a-long-password');
  await signIn.keepSignedIn.uncheck();

  await signIn.submit();

  await expect(page).toHaveURL('/');
  expect(sent['sign-in']).toEqual([{ email: 'nadia@hummi.fm', password: 'a-long-password', keepSignedIn: false }]);
});

// ---------------------------------------------------------------- L2-031 Sign out, L2-052 Account menu

test('L2-052: the avatar opens the account menu with the name and email; Escape closes it', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  const account = new AccountShell(page);
  await new HomePage(page).goto();

  await account.avatar.click();

  await expect(account.avatar).toHaveAttribute('aria-expanded', 'true');
  await expect(account.menu).toContainText('Nadia Charles');
  await expect(account.menu).toContainText('nadia@hummi.fm');
  await expect(account.menu.getByRole('menuitem', { name: 'Sign out' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(account.menu).toHaveCount(0);
  await expect(account.avatar).toBeFocused();
});

test('L2-031 AC1: Sign out opens "Sign out of Hummi?" with Cancel and Sign out; Cancel keeps the session', async ({
  page,
}) => {
  await fakeSignedInVisitor(page, NADIA);
  const sent = await fakeAuth(page);
  const account = new AccountShell(page);
  await new HomePage(page).goto();
  await account.avatar.click();

  await account.menu.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(account.dialog).toHaveAccessibleName('Sign out of Hummi?');
  await expect(account.dialog).toHaveAccessibleDescription(
    'Your playlists and likes stay saved. You can keep listening without an account.',
  );
  await account.dialogButton('Cancel').click();
  await expect(account.dialog).toHaveCount(0);
  await expect(account.avatar).toBeVisible();
  expect(sent['sign-out']).toHaveLength(0);
});

test('L2-031 AC2: confirming ends the session and the shell shows Sign in and Sign up', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  const sent = await fakeAuth(page);
  const account = new AccountShell(page);
  const shell = new ShellPage(page);
  await new HomePage(page).goto();
  await account.avatar.click();
  await account.menu.getByRole('menuitem', { name: 'Sign out' }).click();

  await account.dialogButton('Sign out').click();

  await expect(account.dialog).toHaveCount(0);
  await expect(shell.signIn).toBeVisible();
  await expect(shell.signUp).toBeVisible();
  await expect(account.avatar).toHaveCount(0);
  expect(sent['sign-out']).toHaveLength(1);
});

test('L2-031 AC3: while signing out, Cancel is disabled and the button reads "Signing out…"', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeAuth(page, { 'sign-out': { status: 204, delayMs: 1500 } });
  const account = new AccountShell(page);
  await new HomePage(page).goto();
  await account.avatar.click();
  await account.menu.getByRole('menuitem', { name: 'Sign out' }).click();

  await account.dialogButton('Sign out').click();

  await expect(account.dialogButton('Cancel')).toBeDisabled();
  await expect(account.dialog.getByRole('button', { name: 'Signing out…' })).toBeDisabled();
});

test('L2-031 AC4: a failed sign-out shows "That didn’t work" and keeps the session', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeAuth(page, { 'sign-out': { status: 500 } });
  const account = new AccountShell(page);
  await new HomePage(page).goto();
  await account.avatar.click();
  await account.menu.getByRole('menuitem', { name: 'Sign out' }).click();

  await account.dialogButton('Sign out').click();

  const alert = account.dialog.getByRole('alert');
  await expect(alert).toContainText('That didn’t work');
  await expect(alert).toContainText('We couldn’t sign you out. Check your connection and try again.');
  await expect(account.dialogButton('Sign out')).toBeEnabled();
});

// ---------------------------------------------------------------- L2-032 Sign in required prompt

test('L2-032 AC1: liking a track signed out opens "Sign in to save this" and saves nothing', async ({ page }) => {
  await fakeTrack(page);
  const requests: string[] = [];
  page.on('request', (request) => {
    // The session check (GET /api/auth/me, POST /api/auth/refresh) is not a save.
    if (request.method() !== 'GET' && !request.url().includes('/api/auth/')) requests.push(request.url());
  });
  const track = new TrackPage(page);
  const account = new AccountShell(page);
  await track.goto('feathers-up');

  await track.action('Like Feathers Up').click();

  await expect(account.dialog).toHaveAccessibleName('Sign in to save this');
  await expect(account.dialog).toHaveAccessibleDescription(
    'Likes, playlists and your queue live in your free Hummi account.',
  );
  await expect(account.dialogButton('Not now')).toBeVisible();
  await expect(account.dialogButton('Create account')).toBeVisible();
  await expect(account.dialogButton('Sign in')).toBeVisible();
  expect(requests).toEqual([]);
});

test('L2-032 AC1: Add to playlist on a track and Follow on an artist open the prompt too', async ({ page }) => {
  await fakeTrack(page);
  await fakeArtist(page);
  const track = new TrackPage(page);
  const artist = new ArtistPage(page);
  const account = new AccountShell(page);
  await track.goto('feathers-up');
  await track.action('Add to playlist').click();
  await expect(account.dialog).toHaveAccessibleName('Sign in to save this');
  await account.dialogButton('Not now').click();

  await artist.goto('kaiso-collective');
  await artist.action('Follow').click();

  await expect(account.dialog).toHaveAccessibleName('Sign in to save this');
});

test('L2-032 AC2: Not now closes the prompt and the listener stays on the page', async ({ page }) => {
  await fakeTrack(page);
  const track = new TrackPage(page);
  const account = new AccountShell(page);
  await track.goto('feathers-up');
  await track.action('Like Feathers Up').click();

  await account.dialogButton('Not now').click();

  await expect(account.dialog).toHaveCount(0);
  await expect(page).toHaveURL('/tracks/feathers-up');
});

test('L2-032 AC3: Sign in and Create account open the matching page with a return URL', async ({ page }) => {
  await fakeTrack(page);
  const track = new TrackPage(page);
  const account = new AccountShell(page);
  await track.goto('feathers-up');
  await track.action('Like Feathers Up').click();

  await account.dialogButton('Sign in').click();
  await expect(page).toHaveURL('/sign-in?returnUrl=%2Ftracks%2Ffeathers-up');
  await expect(new SignInPage(page).heading).toHaveText('Welcome back');

  await track.goto('feathers-up');
  await track.action('Like Feathers Up').click();
  await account.dialogButton('Create account').click();
  await expect(page).toHaveURL('/sign-up?returnUrl=%2Ftracks%2Ffeathers-up');
});

test('L2-032: a signed-in listener gets no prompt', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeTrack(page);
  const track = new TrackPage(page);
  const account = new AccountShell(page);
  await track.goto('feathers-up');
  await expect(account.avatar).toBeVisible();

  await track.action('Like Feathers Up').click();

  await expect(account.dialog).toHaveCount(0);
});
