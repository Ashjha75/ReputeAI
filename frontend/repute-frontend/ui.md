# UI Development Guidelines: Angular Material Only

## Mandatory Policy
- **All UI components must use the latest [Angular Material](https://material.angular.dev/components/categories) library.**
- Do NOT create custom UI components, styles, or icon systems unless absolutely necessary and approved by the team.
- Always check the official Angular Material documentation for the latest component usage, accessibility, and design patterns.
- Use Material Icons and the Roboto font for all UI elements.
- If a required UI pattern is not available in Angular Material, discuss with the team before implementing a custom solution.

## Setup Steps
1. **Install Angular Material, Material Icons, and Animations**
   ```bash
   ng add @angular/material
   ```
   - Follow the prompts to select a theme (recommend: Indigo/Pink or custom theme).
   - Enable global typography and animations when prompted.

2. **Import Material Modules**
   - Import only the needed Material modules in your feature modules. Example:
     ```ts
     import { MatButtonModule } from '@angular/material/button';
     import { MatIconModule } from '@angular/material/icon';
     // ...other Material modules
     @NgModule({
       imports: [MatButtonModule, MatIconModule]
     })
     export class MyFeatureModule {}
     ```

3. **Use Material Components in Templates**
   - Reference the official docs for usage:
     - [Material Components List](https://material.angular.dev/components/categories)
   - Example:
     ```html
     <button mat-raised-button color="primary">
       <mat-icon>check_circle</mat-icon>
       Confirm
     </button>
     ```

4. **Use Material Icons**
   - Ensure this is in your `index.html`:
     ```html
     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
     ```
   - Use icons in templates with `<mat-icon>`.

5. **Use Roboto Font**
   - Ensure this is in your `index.html`:
     ```html
     <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
     ```
   - Set Roboto as the default font in your global styles.

6. **Theme and Color**
   - Use Angular Material's theming system for all colors and typography.
   - Do not hardcode colors or use custom CSS for theming.

## Reference
- [Angular Material Components](https://material.angular.dev/components/categories)
- [Material Theming Guide](https://material.angular.dev/guide/theming)

## Enforcement
- PRs with custom UI components or styles will be rejected unless there is a clear, documented reason and team approval.
- Always link to the official Material documentation in code reviews and PRs when using new components.

---

**Summary:**
> Use only Angular Material for all UI. Follow the official docs. No custom UI unless absolutely necessary and approved.
