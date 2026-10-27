import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

/**
 * A labelled text input (`.field`): optional help, an error that sets aria-invalid, and both wired with
 * aria-describedby. Read-only while a form submits. `fieldId` is the input id the error summary links to.
 */
@Component({
  selector: 'hm-text-field',
  template: `
    <div class="field">
      <label class="field__label" [for]="fieldId()">{{ label() }}</label>
      <input
        #control
        class="input"
        [id]="fieldId()"
        [name]="fieldId()"
        [type]="type()"
        [value]="value()"
        [attr.autocomplete]="autocomplete()"
        [required]="required()"
        [readOnly]="readonly()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        (input)="value.set(control.value)"
      />
      @if (help()) {
        <span class="field__help" [id]="fieldId() + '-help'">{{ help() }}</span>
      }
      @if (error()) {
        <span class="field__error" [id]="fieldId() + '-err'">{{ error() }}</span>
      }
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent {
  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly type = input<'text' | 'email' | 'password'>('text');
  readonly autocomplete = input<string | null>(null);
  readonly help = input('');
  readonly error = input('');
  readonly required = input(false);
  readonly readonly = input(false);
  readonly value = model('');

  protected describedBy(): string | null {
    const ids = [this.help() && `${this.fieldId()}-help`, this.error() && `${this.fieldId()}-err`].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }
}

/** A checkbox with its label and an optional hint line (`.choice`). */
@Component({
  selector: 'hm-checkbox',
  template: `
    <label class="choice">
      <input
        #control
        type="checkbox"
        [id]="fieldId()"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-invalid]="error() ? 'true' : null"
        (change)="checked.set(control.checked)"
      />
      <span class="choice__text"
        >{{ label() }}
        @if (hint()) {
          <small>{{ hint() }}</small>
        }
      </span>
    </label>
    @if (error()) {
      <span class="field__error">{{ error() }}</span>
    }
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent {
  readonly label = input.required<string>();
  readonly fieldId = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly disabled = input(false);
  readonly checked = model(false);
}

/** One entry of the error summary: the input id it links to and the message. */
export interface FormError {
  fieldId: string;
  message: string;
}

/**
 * The error summary at the top of a form (`.form-summary`): "Fix {n} things to continue" and a link to
 * each invalid field. It takes focus when shown, and a link moves focus to its field.
 */
@Component({
  selector: 'hm-error-summary',
  template: `
    <div #box class="form-summary" role="alert" tabindex="-1">
      <strong>Fix {{ errors().length }} thing{{ errors().length === 1 ? '' : 's' }} to continue</strong>
      <ul>
        @for (error of errors(); track error.fieldId) {
          <li>
            <a [href]="'#' + error.fieldId" (click)="jump($event, error.fieldId)">{{ error.message }}</a>
          </li>
        }
      </ul>
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorSummaryComponent {
  readonly errors = input.required<readonly FormError[]>();
  readonly jumped = output<string>();
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');

  constructor() {
    afterNextRender(() => this.box().nativeElement.focus());
  }

  protected jump(event: MouseEvent, fieldId: string): void {
    event.preventDefault();
    document.getElementById(fieldId)?.focus();
    this.jumped.emit(fieldId);
  }
}

/** An on/off switch (`.switch`, role="switch") with its label and hint line (L2-034, L2-035). */
@Component({
  selector: 'hm-switch',
  template: `
    <label class="switch">
      <input
        #control
        type="checkbox"
        role="switch"
        [id]="fieldId()"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="checked.set(control.checked)"
      />
      <span class="choice__text"
        >{{ label() }}
        @if (hint()) {
          <small class="text-muted">{{ hint() }}</small>
        }
      </span>
    </label>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchComponent {
  readonly label = input.required<string>();
  readonly fieldId = input('');
  readonly hint = input('');
  readonly disabled = input(false);
  readonly checked = model(false);
}

/** One option of a radio group. */
export interface RadioOption {
  value: string;
  label: string;
}

/** A labelled group of radios in a fieldset (`.choice`), such as the Theme choices (L2-049). */
@Component({
  selector: 'hm-radio-group',
  template: `
    <fieldset [disabled]="disabled()">
      <legend>{{ legend() }}</legend>
      @for (option of options(); track option.value) {
        <label class="choice">
          <input
            type="radio"
            [name]="name()"
            [value]="option.value"
            [checked]="value() === option.value"
            [attr.aria-invalid]="error() ? 'true' : null"
            [attr.aria-describedby]="error() ? name() + '-err' : null"
            (change)="value.set(option.value)"
          />
          <span class="choice__text">{{ option.label }}</span>
        </label>
      }
      @if (error()) {
        <span class="field__error" [id]="name() + '-err'">{{ error() }}</span>
      }
    </fieldset>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioGroupComponent {
  readonly legend = input.required<string>();
  readonly name = input.required<string>();
  readonly options = input.required<readonly RadioOption[]>();
  readonly disabled = input(false);
  /** A required choice left empty, for example "Choose a reason" (L2-038 AC2). */
  readonly error = input('');
  readonly value = model('');
}

/** A labelled multi-line field (`.textarea`), marked "(optional)" unless required (L2-038 AC1). */
@Component({
  selector: 'hm-textarea',
  template: `
    <div class="field">
      <label class="field__label" [for]="fieldId()"
        >{{ label() }}
        @if (!required()) {
          <span class="optional">(optional)</span>
        }
      </label>
      <textarea
        #control
        class="textarea"
        [id]="fieldId()"
        [rows]="rows()"
        [readOnly]="readonly()"
        [required]="required()"
        [value]="value()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? fieldId() + '-err' : null"
        (input)="value.set(control.value)"
      ></textarea>
      @if (error()) {
        <span class="field__error" [id]="fieldId() + '-err'">{{ error() }}</span>
      }
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaComponent {
  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly rows = input(3);
  readonly required = input(false);
  readonly readonly = input(false);
  readonly error = input('');
  readonly value = model('');
}
