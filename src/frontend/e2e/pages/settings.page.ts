import type { Locator, Page } from '@playwright/test';

/** Page object for Settings (`/settings`): the four sections, the switches, Theme and the actions. */
export class SettingsPage {
  readonly main: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly summary: Locator;
  readonly alert: Locator;

  constructor(private readonly page: Page) {
    this.main = page.locator('main#main');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.subtitle = this.main.locator('.page-header .subtitle');
    this.summary = this.main.locator('.form-summary');
    this.alert = this.main.locator('.alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
  }

  section(name: string): Locator {
    return this.main.locator('section.card').filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  field(label: string): Locator {
    return this.main.getByLabel(label, { exact: true });
  }

  fieldError(label: string): Locator {
    return this.main
      .locator('.field')
      .filter({ has: this.page.getByLabel(label, { exact: true }) })
      .locator('.field__error');
  }

  switch(name: string): Locator {
    return this.main.getByRole('switch', { name: new RegExp(`^${name}`) });
  }

  theme(name: string): Locator {
    return this.main.getByRole('radio', { name, exact: true });
  }

  button(name: string | RegExp): Locator {
    return this.main.getByRole('button', { name });
  }
}

/** The header wordmark's stroke and the brand colours it should take (L2-049 AC4). */
export async function logoColours(page: Page): Promise<{ stroke: string; coral: string; cream: string }> {
  return page.evaluate(() => {
    const resolve = (value: string) => {
      const probe = document.createElement('span');
      probe.style.color = value;
      document.body.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    };
    const stroke = document.querySelector('.topnav .logo .stroke')!;
    return {
      stroke: getComputedStyle(stroke).stroke,
      coral: resolve('var(--palette-coral-500)'),
      cream: resolve('var(--palette-cream-50, var(--color-fg-default))'),
    };
  });
}
