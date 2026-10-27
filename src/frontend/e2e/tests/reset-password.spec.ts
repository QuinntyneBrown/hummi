import { expect, fakeAuth, fakeHome, test } from '../fixtures';
import { NewPasswordPage, ResetPasswordPage } from '../pages/accounts.page';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
});

// ---------------------------------------------------------------- L2-030 Reset password

test('L2-030 AC1: Reset password shows the heading, the required Email field, Send reset link and Back to sign in', async ({
  page,
}) => {
  await fakeAuth(page);
  const reset = new ResetPasswordPage(page);

  await reset.goto();

  await expect(reset.heading).toHaveText('Reset your password');
  await expect(reset.intro).toHaveText('Enter your email and we’ll send a link to choose a new one.');
  await expect(reset.field('Email')).toHaveAttribute('required', '');
  await expect(reset.button('Send reset link')).toBeVisible();
  await expect(reset.link('Back to sign in')).toHaveAttribute('href', '/sign-in');
});

test('L2-030 AC2: an empty email shows the summary and the field message', async ({ page }) => {
  const sent = await fakeAuth(page);
  const reset = new ResetPasswordPage(page);
  await reset.goto();

  await reset.submit();

  await expect(reset.summary).toContainText('Enter the email you signed up with');
  await expect(reset.fieldError('Email')).toHaveText('Enter the email you signed up with');
  expect(sent['password-reset']).toEqual([]);
});

test('L2-030 AC3: while submitting, the field is read-only and the button reads "Send reset link…"', async ({
  page,
}) => {
  await fakeAuth(page, { 'password-reset': { status: 202, delayMs: 1500 } });
  const reset = new ResetPasswordPage(page);
  await reset.goto();
  await reset.field('Email').fill('nadia@example.com');

  await reset.submit();

  await expect(reset.button('Send reset link…')).toBeDisabled();
  await expect(reset.field('Email')).toHaveAttribute('readonly', '');
});

for (const email of ['nadia@example.com', 'nobody@example.com']) {
  test(`L2-030 AC4: ${email} gets the same Check your inbox`, async ({ page }) => {
    const sent = await fakeAuth(page);
    const reset = new ResetPasswordPage(page);
    await reset.goto();
    await reset.field('Email').fill(email);

    await reset.submit();

    await expect(reset.heading).toHaveText('Check your inbox');
    await expect(reset.intro).toHaveText(
      `If an account exists for ${email}, a reset link is on its way. It works for 1 hour.`,
    );
    await expect(reset.link('Back to sign in')).toBeVisible();
    expect(sent['password-reset']).toEqual([{ email }]);
  });
}

test('L2-030 AC6: when the email cannot be sent, a danger alert explains and keeps the form', async ({ page }) => {
  await fakeAuth(page, {
    'password-reset': { status: 503, body: { title: 'We couldn’t send the email', code: 'EMAIL_UNAVAILABLE' } },
  });
  const reset = new ResetPasswordPage(page);
  await reset.goto();
  await reset.field('Email').fill('nadia@example.com');

  await reset.submit();

  const alert = reset.main.getByRole('alert');
  await expect(alert).toContainText('We couldn’t send the email');
  await expect(alert).toContainText('Try again in a minute. If it keeps happening, contact support.');
  await expect(reset.field('Email')).toHaveValue('nadia@example.com');
});

test('L2-030 AC5: an expired link shows This link has expired with Request a new link', async ({ page }) => {
  await fakeAuth(page, {
    'password-reset/confirm': { status: 410, body: { title: 'This link has expired', code: 'LINK_EXPIRED' } },
  });
  const choose = new NewPasswordPage(page);
  await choose.goto('old');
  await choose.field('New password').fill('a-new-long-password');

  await choose.submit();

  await expect(choose.heading).toHaveText('This link has expired');
  await expect(choose.intro).toHaveText('Reset links work for 1 hour. Request a new one to choose a password.');
  await expect(choose.link('Back to sign in')).toBeVisible();
  await choose.link('Request a new link').click();
  await expect(page).toHaveURL(/\/reset-password$/);
});

// ---------------------------------------------------------------- L2-055 Choose a new password

test('L2-055 AC1: the reset link opens Choose a new password with the help and the actions', async ({ page }) => {
  await fakeAuth(page);
  const choose = new NewPasswordPage(page);

  await choose.goto('abc');

  await expect(choose.heading).toHaveText('Choose a new password');
  await expect(choose.intro).toHaveText('Pick a new password for your Hummi account.');
  await expect(choose.field('New password')).toHaveAttribute('required', '');
  await expect(choose.main.getByText('At least 10 characters')).toBeVisible();
  await expect(choose.button('Change password')).toBeVisible();
  await expect(choose.link('Back to sign in')).toBeVisible();
});

test('L2-055 AC2: a short password shows "Use at least 10 characters" and sends nothing', async ({ page }) => {
  const sent = await fakeAuth(page);
  const choose = new NewPasswordPage(page);
  await choose.goto('abc');
  await choose.field('New password').fill('short');

  await choose.submit();

  await expect(choose.summary).toContainText('Use at least 10 characters');
  await expect(choose.fieldError('New password')).toHaveText('Use at least 10 characters');
  expect(sent['password-reset/confirm']).toEqual([]);
});

test('L2-055 AC3: while submitting, the field is read-only and the button reads "Change password…"', async ({
  page,
}) => {
  await fakeAuth(page, { 'password-reset/confirm': { status: 204, delayMs: 1500 } });
  const choose = new NewPasswordPage(page);
  await choose.goto('abc');
  await choose.field('New password').fill('a-new-long-password');

  await choose.submit();

  await expect(choose.button('Change password…')).toBeDisabled();
  await expect(choose.field('New password')).toHaveAttribute('readonly', '');
});

test('L2-055 AC4: a fresh link changes the password and offers Sign in', async ({ page }) => {
  const sent = await fakeAuth(page);
  const choose = new NewPasswordPage(page);
  await choose.goto('abc');
  await choose.field('New password').fill('a-new-long-password');

  await choose.submit();

  await expect(choose.heading).toHaveText('Password changed');
  await expect(choose.intro).toHaveText('Sign in with your new password.');
  expect(sent['password-reset/confirm']).toEqual([{ token: 'abc', password: 'a-new-long-password' }]);
  await choose.link('Sign in').click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('L2-055: any other failure shows "We couldn’t change your password" above the field', async ({ page }) => {
  await fakeAuth(page, { 'password-reset/confirm': { status: 500 } });
  const choose = new NewPasswordPage(page);
  await choose.goto('abc');
  await choose.field('New password').fill('a-new-long-password');

  await choose.submit();

  await expect(choose.main.getByRole('alert')).toContainText('We couldn’t change your password');
  await expect(choose.heading).toHaveText('Choose a new password');
});
