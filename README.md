# jsreport-debugger

The jsreport-debugger is a Node.js script that allows manipulation of HTML files based on a set of custom functions and data. It is useful for generating dynamic reports, where the content of the report is determined at runtime.

## How to use

The script is run from the command line and requires four arguments:

- The path to the input HTML file.
- The path to the input JSON data file.
- The path to the input JavaScript functions file.
- The path to the output HTML file.

```bash
node reportmounter.js input.html data.json functions.js output.html
```

## Creating the input files

### Functions file

The functions file should contain normally declared JavaScript functions. Each declared function will be made available to be called within the HTML file.

```javascript
function renderMoney(currency, value) {
  return `<span class="currency">${currency}</span> <span class="val">${Number(
    value
  ).toFixed(2)}</span>`;
}

function renderDate(date) {
  return new Date(date).toLocaleDateString("pt-BR");
}
```

### HTML file
The HTML file can contain function calls and data references in the format `{{key}}`, `{{#each key}}...{{/each}}` and `{{#function arg1 arg2 ...}}{{/function}}`.

```html
<p>{{name}}</p>
<p>{{#renderMoney currency value}}{{/renderMoney}}</p>
<ul>
  {{#each items}}
  <li>{{this}}</li>
  {{/each}}
</ul>
```

### Data file
The data file should be a valid JSON file. The data can be referenced in the HTML file using the {{key}} syntax.

```json
{
  "name": "John Doe",
  "currency": "USD",
  "value": 123.45,
  "items": ["item1", "item2", "item3"]
}
```

## Output file
The output file will be an HTML file with all function calls and data references replaced by their corresponding values.
