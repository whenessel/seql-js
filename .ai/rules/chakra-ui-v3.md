# Chakra UI v3 Rules

## Scope

This rule applies to: all TSX/React UI code using Chakra UI (e.g. `src/**/*.tsx`).

## Policy

This project uses **Chakra UI v3**. v2 patterns and props must not be used.

## Import Sources

- **From `@chakra-ui/react`:** Alert, Avatar, Button, Card, Field, Table, Input, NativeSelect, Tabs, Textarea, Separator, useDisclosure, Box, Flex, Stack, HStack, VStack, Text, Heading, Icon.
- **From `components/ui` (relative):** Provider, Toaster, ColorModeProvider, Tooltip, PasswordInput, Checkbox, Drawer, Radio, Menu, Dialog.

## Mandatory Rules

### Boolean and control props

- `isOpen` → `open`
- `isDisabled` → `disabled`
- `isInvalid` → `invalid`
- `isRequired` → `required`
- `isActive` → `data-active`
- `isLoading` → `loading`
- `isChecked` → `checked`
- `isClosable` → `closable`
- `isIndeterminate` → `indeterminate`

### Style props

- `colorScheme` → `colorPalette`
- `spacing` → `gap`
- `noOfLines` → `lineClamp`
- `truncated` → `truncate`
- `thickness` → `borderWidth`
- `speed` → `animationDuration`

### Layout and components

- Use **VStack** / **HStack**, not `Stack`.
- Button icons are **children**, not `leftIcon` / `rightIcon` props.
- **Modal** is replaced by **Dialog**; use `open`, `onOpenChange`, `placement="center"` instead of `isOpen`, `onClose`, `isCentered`.
- Use **toaster.create()**, not `useToast()`; toast `status` → `type`, `isClosable` → `meta.closable`, position values e.g. `top-right` → `top-end`.

### Compound components

Prefer compound component patterns:

- **Alert:** `Alert.Root`, `Alert.Indicator`, `Alert.Content`, `Alert.Title`, `Alert.Description`
- **Dialog:** `Dialog.Root`, `Dialog.Backdrop`, `Dialog.Content`, `Dialog.Header`, `Dialog.Title`, `Dialog.Body`
- **Field (validation):** `Field.Root invalid`, `Field.Label`, `Field.ErrorText`
- **Table:** `Table.Root`, `Table.Header`, `Table.Row`, `Table.ColumnHeader`, `Table.Body`, `Table.Cell`
- **Tabs:** `Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`
- **Menu:** `Menu.Root`, `Menu.Trigger`, `Menu.Content`, `Menu.Item`
- **Popover:** `Popover.Root`, `Popover.Trigger`, `Popover.Content`, `Popover.Body`
- **NativeSelect:** `NativeSelect.Root`, `NativeSelect.Field`, `NativeSelect.Indicator`
- **Tooltip:** from `components/ui` with `content` and `positioning`

### Style system

- Nested styles: use `css` and `&` selector, e.g. `css={{ "& svg": { ... } }}`
- Gradients: `bgGradient="to-r"`, `gradientFrom`, `gradientTo`
- Theme tokens: `useChakra().token("colors.gray.400")`, not `useTheme()`

## Forbidden

- `@emotion/styled`, `framer-motion` (not in stack)
- `@chakra-ui/icons` — use `lucide-react` or `react-icons`
- `@chakra-ui/hooks` — use `react-use` or `usehooks-ts`
- `@chakra-ui/next-js` — use `asChild` where needed

## Priority

This rule applies whenever editing or adding UI built with Chakra. For more detail, see project root: `CLAUDE.md`, `AGENTS.md`, and `.cursor/rules/` (Cursor-specific).
