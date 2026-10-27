import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A data table in a scrolling wrapper. The caption names the table for assistive technology and
 * stays visually hidden; the first cell of each row is its row header.
 */
@Component({
  selector: 'hm-table',
  template: `
    <div class="table-wrap">
      <table class="table">
        <caption class="visually-hidden">
          {{
            caption()
          }}
        </caption>
        <thead>
          <tr>
            @for (column of columns(); track column) {
              <th scope="col">{{ column }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row[0]) {
            <tr>
              @for (cell of row; track $index) {
                @if ($first) {
                  <th scope="row">{{ cell }}</th>
                } @else {
                  <td>{{ cell }}</td>
                }
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  readonly caption = input.required<string>();
  readonly columns = input.required<readonly string[]>();
  readonly rows = input.required<readonly (readonly string[])[]>();
}
