---
applyTo: '*'
---

---

tags:

- patterns
- front-end

---

# Front-End Guidelines with Angular

## Component Internal Structure

Angular components must be **standalone** and should be divided into the following sections:

1. **Injected fields**: Defined as `readonly`.
2. **Inputs and Outputs**: Use Angular's version 17 features like `input`, `input.required` (for required inputs), `model` (for two-way binding), and `output`.
3. **Properties**: Public properties used in templates or in reactive contexts should preferably be `signals` (writable or computed) to optimize the change detection process.
4. **Methods**: The constructor should always be the first method, followed by public methods, then protected, and finally private methods.

### Field Ordering

- Fields should be ordered by visibility and accessibility.
- Public fields should be listed first (do **not** use the `public` modifier as it is the default).
- Protected fields should follow.
- Private fields should use the TypeScript private naming convention with a **\_** prefix (e.g., `_privateField`) and the `private` keyword. This ensures fields are not publicly accessible and are easily identifiable as private.

### ViewChild and ContentChild

- Use the new Angular functions that return signals for `ViewChild`, `ViewChildren`, `ContentChild`, and `ContentChildren`.
- Always declare them as `readonly`.

### Computed Properties

- For computed properties, explicitly declare all dependent signals at the beginning of the computation unless they are inline.

### Effects

- Effects used for side effects triggered by signal changes can be declared in the constructor or assigned to a private property.

### Summary Example

```typescript
export class ExampleComponent {
  // Injected fields
  readonly x = inject(X);
  private readonly _y = inject(Y);

  // Inputs and Outputs
  normalInput = input<string>('initialValue');
  requiredInput = input.required<string>();
  modelInput = model('initialValue');

  // Properties
  readonly childCmp = viewChild(CmpComponent);
  someNumber = signal(1);
  otherNumber = signal(3);

  // Computed inline
  sum = computed(() => this.someNumber() + this.otherNumber());

  // Computed with body
  longComputed = computed(() => {
    const firstSignal = this.first();
    const secondSignal = this.second();
    // Computation logic...
  });

  private _test = 'test';
  private _internalSignal = signal(5);

  // Effects
  private _logSumEffect = effect(() => console.log(this.sum()));

  // Methods
  constructor() {
    effect(() => console.warn(this.otherNumber()));
  }

  someMethod() {
    return 'some';
  }

  private _privateMethod() {
    return 1;
  }
}
```
