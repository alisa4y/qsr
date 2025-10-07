# qsr - Declarative DOM Data Binding

`qsr` is a lightweight, powerful utility that bridges the gap between your HTML view and your JavaScript logic. It extends standard HTML elements with an `eval` property, allowing you to treat parts of your DOM as a structured JavaScript object. This enables intuitive, two-way data binding with a syntax that mirrors your HTML structure.

It uses custom data attributes (`data-key`, `data-branch`, `data-item`) to understand how your data is organized in the view.

## Table of Contents

- [Core Concept: The `eval` Property](#core-concept-the-eval-property)
- [Custom Data Attributes](#custom-data-attributes)
  - [`data-key`](#data-key)
  - [`data-branch`](#data-branch)
  - [`data-item`](#data-item)
  - [`data-x`](#data-x)
- [Dynamic Rules with `qsr`](#dynamic-rules-with-qsr)
- [Practical Examples](#practical-examples)
- [Utility Tools](#utility-tools)

## Core Concept: The `eval` Property

`qsr` introduces a new `eval` property on HTML elements selected by its utility functions (`qs`, `qsa`). This property acts as a proxy to the element's underlying value, making data extraction and manipulation seamless.

The structure of the object returned by `eval` is defined by `data-key` and `data-branch` attributes in your HTML.

### How `eval` determines an element's value:

- **Input Elements** (`<input>`, `<textarea>`): `eval` proxies the `value` property.
- **Text Elements** (`<span>`, `<p>`, `<div>`, etc.): `eval` proxies the `textContent`.
- **Other Elements**: `eval` uses a custom `data-x` attribute to get or set its value.

`qsr` also performs automatic type casting. If an element's text content is a number (e.g., `<span>10</span>`), `eval` will return a `number` type instead of a string.

## Custom Data Attributes

### `data-key`

The `data-key` attribute marks an element as a data holder. Its value becomes the key in the parent element's `eval` object.

**Example: Reading and Writing Data**

Consider this HTML:

```html
<div class="info">
  <span data-key="name">hi</span>
  <input data-key="version" value="1.0" />
</div>
```

You can access and modify the data like a regular JavaScript object:

```javascript
import { qs } from "./src"

const info = qs(".info")

// Read values
console.log(info.eval.name) // "hi"
console.log(info.eval.version) // "1.0"

// Modify values
info.eval.name = "hello"
info.eval.version = "2.0"

console.log(qs("span").textContent) // "hello"
console.log(qs("input").value) // "2.0"
```

### `data-branch`

The `data-branch` attribute groups child elements with `data-key` into a nested object. This is useful for organizing complex data structures. An element with `data-branch` cannot also have a `data-key`.

**Example: Nested Data**

```html
<div class="info">
  <div data-branch="input" class="container">
    <input data-key="name" value="ali" />
  </div>
  <div>
    <span data-key="name">hi</span>
  </div>
</div>
```

The `eval` object will be nested:

```javascript
import { qs } from "./src"

const info = qs(".info")

console.log(info.eval)
// {
//   name: "hi",
//   input: { name: "ali" }
// }

// Modify nested data
info.eval.input.name = "someName"
console.log(qs("input").value) // "someName"
```

### `data-item`

The `data-item` attribute is used to manage lists of elements, turning them into a JavaScript array. The value of this attribute must be the ID of a `<template>` element that defines the structure for each item in the list.

The `eval` property on an element with `data-item` returns a special array-like proxy object. You can use standard array methods like `push`, `pop`, `shift`, `unshift`, and `splice` to dynamically add or remove items from the DOM.

**Example: Managing a Dynamic List**

```html
<div class="list">
  <ul data-key="counters" data-item="counterItem">
    <!-- Items will be added here -->
  </ul>
  <template id="counterItem">
    <li>
      <span data-key="count">0</span>
    </li>
  </template>
</div>
```

Now you can manipulate the list with JavaScript:

```javascript
import { qs } from "./src"

const list = qs(".list")
const ul = qs("ul")

// Set the entire array
list.eval.counters = [{ count: 10 }, { count: 23 }]
// DOM now has two <li> elements

// Add a new item
ul.eval.push({ count: 99 })
// A third <li> is added to the DOM

// The retrieved array reflects the DOM state
console.log(JSON.stringify(list.eval.counters))
// [{"count":10},{"count":23},{"count":99}]

// Remove an item
const removedItem = ul.eval.pop()
console.log(removedItem) // { count: 99 }
```

### `data-x`

For elements that are not text or input-based, `qsr` uses the `data-x` attribute to store and retrieve values. When you set the `eval` property of such an element, it creates or updates the `data-x` attribute.

**Example:**

```html
<div class="info">
  <div data-key="name">hi</div>
</div>
```

```javascript
import { qs } from "./src"

const div = qs("div[data-key]")

// Set the value
div.eval = "xxx"

// The 'data-x' attribute is created
console.log(div.getAttribute("data-x")) // "xxx"

// Reading the value
console.log(div.eval) // "xxx"
```

## Dynamic Rules with `qsr`

One of the most powerful features of `qsr` is its ability to dynamically apply and revert logic based on CSS selectors, much like a browser applies CSS rules. It actively watches the DOM for changes and ensures that your logic is always in sync with the state of your view.

This is achieved using a `MutationObserver` that monitors changes to elements and their attributes.

### How It Works

1.  **Initial Application**: When `qsr` is initialized, it scans the DOM and applies the handler function to any element that matches a given CSS selector.
2.  **Dynamic Monitoring**: It then continues to watch for:
    - **New Elements**: If a new element that matches a selector is added to the DOM, `qsr` automatically runs the corresponding handler on it.
    - **Attribute Changes**: If an element's attributes change (e.g., a class is added or removed), `qsr` re-evaluates the rules. If an element now matches a selector, the handler is applied. If it _no longer_ matches, the cleanup logic is executed.
    - **Element Removal**: If an element is removed from the DOM, its cleanup logic is also triggered.
3.  **Cleanup Function**: The handler function you provide to `qsr` can return another function. This returned function is the "cleanup" or "destructor" logic. It is stored and called automatically when the element no longer matches the selector or is removed from the DOM. This is perfect for reverting effects or removing event listeners.

### Example: A Toggling Style

Imagine you want to apply a style to an element only when it has a specific class, and remove it otherwise.

```html
<div class="box">Click me to toggle the 'active' class</div>
<button>Toggle Active</button>
```

```javascript
import { qs, qsr, ael } from "./src"

const box = qs(".box")
const btn = qs("button")

// Toggle the class on the box when the button is clicked
ael(btn, "click", () => box.classList.toggle("active"))

// Define a rule that only applies when the '.active' class is present
qsr({
  ".box.active": elm => {
    // --- Application Logic ---
    console.log("Element is now active. Applying styles.")
    elm.style.backgroundColor = "lightblue"
    elm.style.border = "2px solid blue"

    // --- Cleanup Logic ---
    // This function will be called automatically when '.active' is removed
    return () => {
      console.log("Element is no longer active. Reverting styles.")
      elm.style.backgroundColor = ""
      elm.style.border = ""
    }
  },
})
```

In this example, when you click the button:

- The first time, the `.active` class is added. `qsr` detects this, runs the handler, and the box's style changes.
- The second time, the `.active` class is removed. `qsr` detects this change, and because the element no longer matches `.box.active`, it executes the returned cleanup function, reverting the style.

This pattern makes your component logic declarative and self-managing, reducing the need for manual state tracking and cleanup code.

## Practical Examples

### 1. Simple Data Binding

`qsr` makes it trivial to bind an input field to another element.

```html
<div class="info">
  <div data-branch="input">
    <input data-key="name" placeholder="Type here..." />
  </div>
  <div>Your name is: <span data-key="name"></span></div>
</div>
```

```javascript
import { qs, qsr, ael } from "./src"

qsr({
  ".info": elm => {
    const inputField = qs("input")
    // Bind the input's value to the span's textContent
    ael(inputField, "keyup", () => {
      elm.eval.name = elm.eval.input.name
    })
  },
})
```

### 2. Simple Counter Component

Here's how to create a simple counter without manually updating the DOM.

```html
<div class="counterComponent">
  <button>-</button>
  <span type="number" data-key="count">0</span>
  <button>+</button>
</div>
```

```javascript
import { qs, qsr, ael } from "./src"

qsr({
  ".counterComponent": elm => {
    const [decBtn, , incBtn] = elm.children
    ael(decBtn, "click", () => elm.eval.count--)
    ael(incBtn, "click", () => elm.eval.count++)
  },
})
```

## Utility Tools

A collection of utility functions to simplify common DOM manipulations.

- `qs(selector, scope?)`: A shorthand for `document.querySelector`. It finds the **first** element matching the CSS `selector`. You can optionally provide a `scope` element to search within (defaults to `document`).

- `qsa(selector, scope?)`: A shorthand for `document.querySelectorAll`. It finds **all** elements matching the CSS `selector` and returns them as an array. You can optionally provide a `scope` element to search within (defaults to `document`).

- `mqs(...selectors, scope)`: Stands for "multi-query-selector". Takes multiple CSS selector strings and a final `scope` element. It runs `qs` for each selector within the scope and returns an array of the found elements.

  ```javascript
  const [header, content, footer] = mqs(
    "#header",
    ".content",
    "#footer",
    document.body
  )
  ```

- `ma(...attributeNames, scope)`: Stands for "multi-attribute". Takes multiple attribute name strings and a final `scope` element. It retrieves the value of each attribute from the element and returns them as an array of strings.

  ```javascript
  const [id, role] = ma("id", "role", myElement)
  ```

- `ce(tag, options?)`: A powerful "create element" utility. It creates an element of the given `tag` and configures it based on the `options` object. Options can include:

  - `text` or `textContent`: Sets the text content.
  - `html` or `innerHTML`: Sets the inner HTML.
  - `class`: Sets the class name.
  - `dataset`: An object for setting `data-*` attributes.
  - `children`: An array of objects to create and append child elements recursively.
  - Any other key is set as a standard attribute (e.g., `href`, `src`).

- `ael(element, event, handler, options?)`: A convenient shorthand for `element.addEventListener`.

- `loadScript(src)`: Dynamically loads an external script. It creates a `<script>` tag and appends it to the body. Returns a `Promise` that resolves when the script has loaded successfully.

- `onClickAway`: An object that helps detect clicks outside of a specified element. It has two methods:

  - `subscribe({ element, callback })`: Registers an element and a callback function. The `callback` is triggered when a click occurs anywhere in the document _except_ inside the `element`.
  - `unSubscribe({ element, callback })`: Removes the listener.

- `findAncestor(selector, startElement)`: Traverses up the DOM tree from a `startElement` and returns the first ancestor that matches the CSS `selector`.

- `findNearestSibling(selector, startElement)`: Finds the closest sibling (either previous or next) to the `startElement` that matches the CSS `selector`.

- `findNearestAncestorSibling(selector, startElement)`: A combination of the above. It first looks for a matching sibling at the current level. If none is found, it moves to the parent element and searches for a matching sibling of the parent, continuing up the DOM tree until a match is found.

- `domTraversal(callback, startElement)`: Performs a depth-first traversal of the DOM tree, starting from `startElement`. It executes the `callback` function for the `startElement` and each of its descendants.
