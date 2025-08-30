# Button Animation System

This document describes the enhanced button animation system implemented in the Resume AI Analyzer frontend.

## Overview

The new button system provides multiple click animations and interactive feedback to improve user experience. All animations are CSS-based and performant, using GPU acceleration where possible.

## Button Component

### Usage

```tsx
import { Button } from '@/components/ui/Button';

// Basic usage
<Button>Click me</Button>

// With animation
<Button animation="spring" variant="primary" size="lg">
  Animated Button
</Button>

// With loading state
<Button loading={isLoading} animation="pulse">
  Submit
</Button>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'ghost' \| 'outline'` | `'primary'` | Button color variant |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| `animation` | `'default' \| 'bounce' \| 'pulse' \| 'press' \| 'spring' \| 'ripple'` | `'default'` | Click animation type |
| `loading` | `boolean` | `false` | Shows loading spinner and disables button |
| `disabled` | `boolean` | `false` | Disables the button |

## Animation Types

### 1. Default
- Simple scale-down effect on click
- Smooth and subtle
- Good for most use cases

```tsx
<Button animation="default">Default Animation</Button>
```

### 2. Bounce
- Quick bounce effect on click
- Playful and engaging
- Great for demo buttons or fun interactions

```tsx
<Button animation="bounce">Bounce Effect</Button>
```

### 3. Pulse
- Brief scale-up then back to normal
- Attention-grabbing
- Good for important actions

```tsx
<Button animation="pulse">Pulse Effect</Button>
```

### 4. Press
- Inward press effect with shadow
- Tactile feedback feeling
- Good for form submissions

```tsx
<Button animation="press">Press Effect</Button>
```

### 5. Spring
- Multi-stage animation with overshoot
- Dynamic and energetic
- Great for call-to-action buttons

```tsx
<Button animation="spring">Spring Effect</Button>
```

### 6. Ripple
- Material Design-inspired ripple effect
- Modern and smooth
- Good for cards and large buttons

```tsx
<Button animation="ripple">Ripple Effect</Button>
```

## CSS Classes for Manual Use

If you prefer to use regular HTML buttons or want to apply animations to other elements:

### Button Base Classes

```css
.btn                 /* Base button styles */
.btn-primary        /* Primary button variant */
.btn-secondary      /* Secondary button variant */
.btn-success        /* Success button variant */
.btn-warning        /* Warning button variant */
.btn-error          /* Error button variant */
.btn-ghost          /* Ghost button variant */
.btn-outline        /* Outline button variant */
```

### Size Classes

```css
.btn-xs             /* Extra small button */
.btn-sm             /* Small button */
.btn-md             /* Medium button (default) */
.btn-lg             /* Large button */
.btn-xl             /* Extra large button */
```

### Animation Classes

```css
.btn-bounce:active  /* Bounce animation on click */
.btn-pulse:active   /* Pulse animation on click */
.btn-press:active   /* Press animation on click */
.btn-spring:active  /* Spring animation on click */
.btn-click-ripple   /* Ripple effect container */
```

### General Interactive Classes

```css
.clickable          /* Basic click animation for any element */
.clickable-card     /* Click animation optimized for cards */
```

## Examples

### Login Form Example

```tsx
// Primary action with spring animation
<Button
  type="submit"
  loading={isLoading}
  animation="spring"
  className="w-full"
  size="lg"
>
  Sign in
</Button>

// Demo buttons with bounce
<Button
  onClick={handleDemoFill}
  variant="success"
  size="xs"
  animation="bounce"
>
  Demo Account
</Button>
```

### Navigation Example

```tsx
// Apply click animation to regular buttons
<button className="clickable inline-flex items-center...">
  Menu Item
</button>
```

### Card Example

```tsx
// Clickable card with animation
<div className="clickable-card p-6 bg-white rounded-lg shadow">
  Card Content
</div>
```

## Performance Considerations

- All animations use CSS transforms and opacity for optimal performance
- GPU acceleration is enabled with `transform-gpu` class
- Animations are short (0.1s - 0.4s) to feel responsive
- Disabled state properly prevents animations

## Browser Support

- Modern browsers with CSS transform support
- Graceful degradation in older browsers (no animation)
- Touch devices supported

## Accessibility

- Animations respect `prefers-reduced-motion` when implemented
- Focus states are maintained
- Keyboard navigation works normally
- Screen readers can access button content normally

## Migration from Old Buttons

To migrate existing buttons:

1. Import the Button component
2. Replace `<button>` with `<Button>`
3. Move className styles to appropriate props
4. Add desired animation type

```tsx
// Before
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
  Click me
</button>

// After
<Button variant="primary" animation="spring">
  Click me
</Button>
```
