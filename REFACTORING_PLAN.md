# UI Codebase Refactoring Plan

## Current State Analysis

### Structure Overview
```
src/
├── components/          (14 files - mixed concerns)
├── contexts/           (1 file)
├── constants/          (2 files)
├── hooks/              (3 files)
├── types/              (1 file)
├── utils/              (3 files)
└── App.tsx
```

## Issues Identified

### 🔴 CRITICAL ISSUES

#### 1. **Misnamed File: `InsightsView.tsx`**
- **Problem**: File is named `InsightsView.tsx` but exports `MirrorView`
- **Impact**: Confusing for developers, breaks naming conventions
- **Fix**: Rename file to `MirrorView.tsx`

#### 2. **ViewType Mismatch**
- **Problem**: ViewType uses `'insights'` but feature is now "Mirror"
- **Impact**: Confusing terminology throughout codebase
- **Fix**: Change to `'mirror'` in types and all references

### 🟡 ORGANIZATIONAL ISSUES

#### 3. **Components Not Grouped by Feature**
- **Problem**: All components in single flat folder
- **Current**: 14 components mixed together
- **Better Structure**:
  ```
  components/
  ├── auth/              # Auth-related components
  │   ├── AuthContainer.tsx
  │   ├── LoginPage.tsx
  │   ├── RegisterPage.tsx
  │   ├── ForgotPasswordPage.tsx
  │   └── EmailVerificationPage.tsx
  ├── journal/           # Journal-related components
  │   ├── JournalView.tsx
  │   ├── JournalPage.tsx
  │   ├── NewEntryPage.tsx
  │   ├── EntryMenu.tsx
  │   └── TagInput.tsx
  ├── mirror/            # Mirror-related components
  │   └── MirrorView.tsx
  ├── settings/          # Settings components
  │   └── SettingsView.tsx
  └── layout/            # Layout components
      ├── Header.tsx
      └── Sidebar.tsx
  ```

#### 4. **Mirror Mode Configuration**
- **Problem**: MODE_CONFIG defined inline in component
- **Should be**: Extracted to constants for reusability
- **Location**: `src/constants/mirrorModes.ts`

### 🟢 CODE QUALITY ISSUES

#### 5. **Dropdown Component Duplication**
- **Problem**: 3-dot dropdown pattern used in both JournalPage and MirrorView
- **Fix**: Create reusable `<DropdownMenu>` component

#### 6. **Common Theme/Style Patterns**
- **Problem**: Repeated theme conditional logic
- **Fix**: Create utility functions or components for common patterns

#### 7. **API Error Handling**
- **Problem**: Inconsistent error handling across components
- **Fix**: Create error handling utilities

## Detailed Refactoring Steps

### Phase 1: Critical Fixes (Do First)

#### Step 1.1: Rename MirrorView File
```bash
# Rename the file
mv src/components/InsightsView.tsx src/components/MirrorView.tsx

# Update imports in:
- src/App.tsx
```

#### Step 1.2: Update ViewType
```typescript
// types/index.ts
export type ViewType = 'journal' | 'mirror' | 'settings';

// Update all references:
- App.tsx (routing logic)
- Header.tsx (getPageTitle)
- Sidebar.tsx (menu items)
```

### Phase 2: Extract Constants

#### Step 2.1: Extract Mirror Mode Config
```typescript
// Create: src/constants/mirrorModes.ts
export type MirrorMode = 'emotional' | 'cognitive' | 'behavioral' | 'relational';

export interface MirrorModeConfig {
  title: string;
  icon: string;
  gradient: string;
  lightBg: string;
  darkBg: string;
}

export const MIRROR_MODES: Record<MirrorMode, MirrorModeConfig> = {
  emotional: { ... },
  cognitive: { ... },
  behavioral: { ... },
  relational: { ... }
};
```

#### Step 2.2: Extract Mirror Types
```typescript
// Create: src/types/mirror.ts
export interface MirrorReflection {
  reflection: string;
  mode: string;
  available_modes: string[];
  error?: string;
}

export type { MirrorMode, MirrorModeConfig } from '@constants/mirrorModes';
```

### Phase 3: Create Reusable Components

#### Step 3.1: Dropdown Menu Component
```typescript
// Create: src/components/common/DropdownMenu.tsx
interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeType;
  children: React.ReactNode;
}
```

#### Step 3.2: Icon Button Component
```typescript
// Create: src/components/common/IconButton.tsx
interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  theme: ThemeType;
  ariaLabel: string;
}
```

### Phase 4: Reorganize File Structure

#### Step 4.1: Group by Feature
Move files into feature folders as shown in issue #3

#### Step 4.2: Update Import Paths
Update all imports to use new paths

### Phase 5: Create Utilities

#### Step 5.1: Theme Utilities
```typescript
// Create: src/utils/theme.ts
export const getThemeClasses = (theme: ThemeType, isDark: boolean) => {
  const config = THEMES[theme];
  return {
    text: isDark ? 'text-slate-200' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-600',
    hover: isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200',
    // ... more common patterns
  };
};
```

#### Step 5.2: API Error Handler
```typescript
// Create: src/utils/errorHandler.ts
export const handleApiError = (error: unknown, fallbackMessage: string) => {
  console.error('API Error:', error);
  return error instanceof Error ? error.message : fallbackMessage;
};
```

## Priority Implementation Order

### 🔥 **Immediate (Next session)**
1. ✅ Rename `InsightsView.tsx` → `MirrorView.tsx`
2. ✅ Update `ViewType` from `'insights'` to `'mirror'`
3. ✅ Extract mirror constants to separate file

### 📋 **Short-term (This week)**
4. Create `DropdownMenu` reusable component
5. Extract mirror types to separate file
6. Create theme utility functions

### 🎯 **Medium-term (Future)**
7. Reorganize components by feature folders
8. Create common UI components library
9. Add comprehensive error handling

## Files to Create

```
src/
├── components/
│   ├── common/
│   │   ├── DropdownMenu.tsx         (NEW)
│   │   └── IconButton.tsx           (NEW)
│   └── MirrorView.tsx               (RENAME from InsightsView.tsx)
├── constants/
│   └── mirrorModes.ts               (NEW)
├── types/
│   └── mirror.ts                    (NEW)
└── utils/
    ├── theme.ts                     (NEW)
    └── errorHandler.ts              (NEW)
```

## Files to Modify

```
src/
├── types/index.ts                   (Update ViewType)
├── App.tsx                          (Update imports & routing)
├── components/
│   ├── Header.tsx                   (Update ViewType references)
│   └── Sidebar.tsx                  (Update ViewType references)
```

## Breaking Changes

⚠️ **ViewType Change**: `'insights'` → `'mirror'`
- May affect any stored preferences
- Check localStorage usage
- Update any analytics/tracking code

## Benefits After Refactoring

✅ **Clarity**: Clear naming conventions
✅ **Maintainability**: Organized by feature
✅ **Reusability**: Extracted common components
✅ **Consistency**: Standardized patterns
✅ **Scalability**: Easy to add new features
✅ **Debugging**: Easier to locate code

## Estimated Impact

- **Files to rename**: 1
- **Files to create**: 6
- **Files to modify**: 5
- **Import paths to update**: ~10
- **Time estimate**: 1-2 hours for Phase 1-3

## Testing Checklist

After refactoring:
- [ ] All views still navigate correctly
- [ ] Mirror view loads and functions
- [ ] Settings persist correctly
- [ ] Auth flow works
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] All imports resolve correctly
