# EIQ Practical Examples

## 📚 Коллекция реальных примеров EIQ

### 🎯 Базовые элементы

#### Кнопки

```
# Submit button
v1: form :: button[type="submit"]

# Primary action button with class
v1: section :: button.btn-primary[type="button"]

# Cancel button (2nd button)
v1: dialog :: button[type="button"]#2

# Button with aria-label
v1: nav :: button[aria-label="Close menu"]
```

#### Ссылки

```
# Navigation link
v1: nav :: a[href="/products"]

# External link with target
v1: footer :: a[href="https://twitter.com",target="_blank"]

# Email link
v1: section :: a[href="mailto:info@example.com"]

# Phone link with text pattern
v1: footer :: a[href="tel:+39123456",text~="+39"]
```

#### Поля ввода

```
# Email input
v1: form :: input[name="email",type="email"]

# Password input with placeholder
v1: form :: input[name="password",placeholder="Enter password",type="password"]

# Checkbox
v1: form :: input[id="remember",type="checkbox"]

# Radio button (3rd option)
v1: form :: input[name="plan",type="radio"]#3
```

---

### 🏗️ Списки и навигация

#### Простой список

```
# Unordered list item
v1: section :: ul > li[text="Features"]

# Numbered list item (2nd)
v1: article :: ol > li#2

# List with semantic class
v1: footer :: ul.space-y-3 > li[text~="contact"]
```

#### Навигация

```
# Main navigation
v1: nav[aria-label="Main"] :: ul.menu > li.active > a[href="/"]

# Breadcrumbs
v1: nav[aria-label="Breadcrumb"] :: ol > li#3 > a

# Sidebar navigation
v1: aside.sidebar :: nav > ul > li > a[href="/dashboard"]
```

#### Dropdown menu

```
# Dropdown trigger
v1: nav :: button[aria-expanded="false",aria-haspopup="true"]

# Dropdown item
v1: nav :: div[role="menu"] > button[role="menuitem"]#1

# Nested dropdown
v1: nav :: ul > li > ul > li > a
```

---

### 📋 Формы

#### Login форма

```
# Username field
v1: form[id="login"] :: input[name="username",type="text"]

# Password field
v1: form[id="login"] :: input[name="password",type="password"]

# Remember me checkbox
v1: form[id="login"] :: label > input[type="checkbox"]

# Submit button
v1: form[id="login"] :: button[type="submit"]
```

#### Registration форма

```
# First name
v1: form[id="register"] :: fieldset#1 > input[name="firstName"]

# Email with validation
v1: form[id="register"] :: input[name="email",required="true",type="email"]

# Terms acceptance
v1: form[id="register"] :: input[name="terms",type="checkbox"] {visible=true}

# Submit (with position)
v1: form[id="register"] :: button[type="submit"]#1
```

#### Multi-step форма

```
# Step indicator (current step)
v1: form :: ol.steps > li.active[aria-current="step"]

# Step 1 fields
v1: form :: div[data-step="1"] > input[name="email"]

# Next button
v1: form :: div.form-actions > button[type="button"] {pos=2}
```

---

### 🎨 UI компоненты

#### Modal dialog

```
# Modal container
v1: body :: div[role="dialog"]

# Modal title
v1: div[role="dialog"] :: h2[id="modal-title"]

# Close button
v1: div[role="dialog"] :: button[aria-label="Close"]

# Modal footer button
v1: div[role="dialog"] :: div.modal-footer > button.btn-primary
```

#### Tabs

```
# Tab list
v1: section :: div[role="tablist"]

# Active tab
v1: div[role="tablist"] :: button[aria-selected="true",role="tab"]

# Tab panel
v1: section :: div[role="tabpanel"]#1

# Tab content
v1: div[role="tabpanel"] :: div.content
```

#### Accordion

```
# Accordion button (collapsed)
v1: section :: button[aria-expanded="false"]#1

# Accordion panel
v1: section :: div[aria-labelledby="accordion-1"]

# Nested accordion
v1: div.accordion :: div.item#2 > button
```

#### Cards

```
# Card container
v1: section :: div.Card

# Card header
v1: div.Card :: div.CardHeader > h3

# Card action button
v1: div.Card :: div.CardFooter > button[type="button"]
```

---

### 📊 Tables

#### Simple table

```
# Table header cell
v1: table :: thead > tr > th#1

# Table body cell
v1: table :: tbody > tr#2 > td#3

# Table with caption
v1: table :: caption[text="Monthly Sales"]
```

#### Data table with sorting

```
# Sortable header
v1: table :: th > button[aria-sort="ascending"]

# Row with data-id
v1: table :: tbody > tr[data-id="123"]

# Cell with specific content
v1: table :: tbody > tr#5 > td[text~="pending"]
```

#### Nested table

```
# Parent table
v1: section :: table.primary

# Nested table
v1: table.primary :: tr#3 > td > table.nested

# Nested cell
v1: table.nested :: tr#1 > td#2
```

---

### 🎭 SVG Icons

#### Basic icon

```
# Mail icon
v1: footer :: svg.lucide-mail

# Mail icon rect
v1: footer :: svg.lucide-mail > rect[dHash="7bf591b2"]

# Mail icon path
v1: footer :: svg.lucide-mail > path[dHash="abc123"]
```

#### Icon в кнопке

```
# Button with icon
v1: button :: svg.icon > path

# Icon in link
v1: a[href="/settings"] :: svg > circle[dHash="def456"]
```

#### Multiple SVG paths

```
# First path
v1: section :: svg.logo > path#1

# Second path (with hash)
v1: section :: svg.logo > path[dHash="xyz789"]#2

# Group element
v1: svg :: g[id="layer1"] > rect
```

---

### 📱 Mobile-specific

#### Hamburger menu

```
# Menu button
v1: header :: button[aria-label="Open menu"]

# Menu icon (3 lines)
v1: button[aria-label="Open menu"] :: svg > rect#2

# Mobile nav
v1: body :: nav[aria-label="Mobile"]
```

#### Touch targets

```
# Large touch button
v1: section :: button.touch-target[type="button"]

# Swipeable card
v1: div.carousel :: div.card[data-index="2"]
```

---

### 🌐 i18n / Localization

#### Language switcher

```
# Current language
v1: nav :: button[aria-label="Language"][aria-expanded="false"]

# Language option
v1: div[role="menu"] :: button[lang="ru",role="menuitem"]
```

#### RTL support

```
# RTL navigation
v1: nav[dir="rtl"] :: ul > li > a

# RTL button
v1: section[dir="rtl"] :: button.btn-primary
```

---

### 🔐 Authentication

#### OAuth buttons

```
# Google login
v1: form :: button[data-provider="google"]

# GitHub login
v1: form :: button[aria-label="Sign in with GitHub"]
```

#### 2FA

```
# Code input field
v1: form :: input[autocomplete="one-time-code",name="code"]

# Verification button
v1: form[id="2fa"] :: button[type="submit"]
```

---

### 📄 Content areas

#### Article

```
# Article title
v1: article :: h1

# Article paragraph (3rd)
v1: article :: p#3

# Article image
v1: article :: img[alt~="preview"]
```

#### Blog post

```
# Post metadata
v1: article :: div.meta > time[datetime="2024-01-15"]

# Author link
v1: article :: div.meta > a[href="/author/john"]

# Comments section
v1: article :: section[id="comments"]
```

---

### 🛒 E-commerce

#### Product card

```
# Product title
v1: div.ProductCard :: h3.title

# Price
v1: div.ProductCard :: span.price[text~="$"]

# Add to cart button
v1: div.ProductCard :: button[aria-label="Add to cart"]

# Product image
v1: div.ProductCard :: img[alt~="product"]
```

#### Shopping cart

```
# Cart item
v1: section[aria-label="Cart"] :: div.cart-item#2

# Quantity input
v1: div.cart-item :: input[name="quantity",type="number"]

# Remove button
v1: div.cart-item :: button[aria-label="Remove item"]

# Checkout button
v1: section[aria-label="Cart"] :: button.checkout[type="button"]
```

#### Filters

```
# Price range slider
v1: aside.filters :: input[name="price-max",type="range"]

# Category checkbox
v1: aside.filters :: input[name="category",value="electronics"]

# Apply filters button
v1: aside.filters :: button[type="submit"]
```

---

### 📅 Date pickers

#### Calendar

```
# Date picker button
v1: form :: button[aria-label="Choose date"]

# Calendar grid
v1: div[role="dialog"] :: div[role="grid"]

# Selected date
v1: div[role="grid"] :: button[aria-selected="true"]

# Date cell (15th)
v1: div[role="grid"] :: button[aria-label="15 January 2024"]
```

#### React DatePicker

```
# Month selector
v1: div.rdp :: button[aria-label="Go to next month"]

# Day button
v1: table[role="grid"] :: tbody > tr#2 > td#4 > button

# Today button
v1: div.rdp :: button[text="Today"]
```

---

### 🔍 Search

#### Search form

```
# Search input
v1: form[role="search"] :: input[name="q",type="search"]

# Search button
v1: form[role="search"] :: button[type="submit"]

# Clear search
v1: form[role="search"] :: button[aria-label="Clear search"]
```

#### Search results

```
# Result item
v1: section[aria-label="Results"] :: article#3

# Result title link
v1: article :: h3 > a

# Pagination
v1: nav[aria-label="Pagination"] :: button[aria-label="Next page"]
```

---

### 🎥 Media

#### Video player

```
# Play button
v1: div.video-player :: button[aria-label="Play"]

# Volume slider
v1: div.video-player :: input[aria-label="Volume",type="range"]

# Fullscreen button
v1: div.video-player :: button[aria-label="Fullscreen"]
```

#### Image gallery

```
# Thumbnail
v1: div.gallery :: button > img[alt~="thumbnail"]#4

# Lightbox image
v1: div[role="dialog"] :: img.lightbox

# Navigation arrow
v1: div.gallery :: button[aria-label="Next image"]
```

---

### ⚠️ Edge cases

#### Shadow DOM

```
# Element in shadow root (not yet supported in v1)
v1: div.component :: button

# Note: Shadow DOM traversal requires special handling
```

#### iFrame

```
# Element in iframe (not yet supported in v1)
v1: iframe[id="embed"] :: button

# Note: Cross-frame access requires extension
```

#### Dynamic IDs

```
# Avoid dynamic IDs
❌ v1: div[id="react-123"] :: button
✅ v1: div.modal :: button[aria-label="Close"]
```

#### Generated classes

```
# Avoid CSS-in-JS generated classes
❌ v1: div[class="css-1a2b3c"] :: span
✅ v1: div.Card :: span.title
```

---

### 🧪 Testing examples

#### Cypress

```javascript
// Use EIQ for stable selectors
const eiq = 'v1: form :: button[type="submit"]';
const eid = parseEIQ(eiq);
const selector = generateCSSSelector(eid);

cy.get(selector).click();
```

#### Playwright

```javascript
// Generate EIQ during recording
const eiq = await page.evaluate((el) => {
  const eid = generateEID(el);
  return stringifyEID(eid);
}, element);

// Store in test
test('submit form', async ({ page }) => {
  const eid = parseEIQ('v1: form :: button[type="submit"]');
  await page.click(await resolveSelector(eid));
});
```

---

### 📈 Analytics examples

#### Google Analytics

```javascript
// Track button clicks with EIQ
gtag('event', 'click', {
  event_category: 'engagement',
  element_identity: 'v1: section :: button.btn-primary',
  event_label: 'CTA Click'
});

// Track form submissions
gtag('event', 'submit', {
  event_category: 'conversion',
  element_identity: 'v1: form[id="newsletter"] :: button[type="submit"]'
});
```

#### Segment

```javascript
analytics.track('Element Clicked', {
  elementIdentity: 'v1: nav :: a[href="/pricing"]',
  elementType: 'link',
  timestamp: Date.now()
});
```

---

### 🔄 Migration patterns

#### From CSS to EIQ

```
CSS:     button.btn-primary:nth-child(2)
EIQ:     v1: section :: button.btn-primary#2

CSS:     #login-form input[name="email"]
EIQ:     v1: form[id="login"] :: input[name="email",type="email"]

CSS:     .product-card > .title
EIQ:     v1: div.ProductCard :: h3.title

CSS:     footer a[href*="twitter"]
EIQ:     v1: footer :: a[href~="twitter"]
```

#### From XPath to EIQ

```
XPath:   //footer//ul/li[3]/a
EIQ:     v1: footer :: ul > li#3 > a

XPath:   //form[@id='login']//button[@type='submit']
EIQ:     v1: form[id="login"] :: button[type="submit"]

XPath:   //*[@aria-label='Close']
EIQ:     v1: body :: button[aria-label="Close"]
```

---

### ✅ Best practices

#### DO

```
✅ v1: footer :: ul > li#3
   (Clear hierarchy)

✅ v1: form :: input[name="email",type="email"]
   (Semantic attributes sorted)

✅ v1: section :: button.btn-primary[type="button"]
   (Semantic class + attribute)

✅ v1: nav[aria-label="Main"] :: a[href="/"]
   (Accessible anchor)
```

#### DON'T

```
❌ footer>ul>li:nth-child(3)
   (Missing version, spaces, using nth-child)

❌ v1: div[class*="button"] :: span
   (CSS attribute selector syntax)

❌ v1: footer :: li[text="john.doe@example.com"]
   (Contains PII)

❌ v1: div.flex.mt-4.px-2 :: button
   (Utility classes)
```

---

## 🎯 Чек-лист для создания EIQ

При написании EIQ проверьте:

1. ✅ Начинается с версии (`v1:`)
2. ✅ Есть anchor separator (`::`)
3. ✅ Используется только ` > ` между узлами
4. ✅ Атрибуты в алфавитном порядке
5. ✅ Классы семантические, не утилитарные
6. ✅ Текст в двойных кавычках и нормализован
7. ✅ Нет PII (email, телефоны, имена)
8. ✅ Позиция через `#N`, не `:nth-child(N)`
9. ✅ Нет CSS псевдоселекторов
10. ✅ Спецсимволы экранированы

---

**Используйте эти примеры как reference** при создании собственных EIQ!
