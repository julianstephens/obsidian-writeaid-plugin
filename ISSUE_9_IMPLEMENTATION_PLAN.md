# Issue #9 Implementation Plan

**Title:** feat: Enhance outline file metadata to match documentation standards

**Issue Link:** https://github.com/julianstephens/obsidian-writeaid-plugin/issues/9

**Branch:** `feat/issue-9`

**Status:** Planning Phase

---

## Executive Summary

Issue #9 addresses a gap between the outline file implementation and the documentation. Currently:

- Outlines lack frontmatter metadata for linking to parent drafts
- Default template doesn't match documented structure
- Customization features exist but aren't documented
- No metadata for tracking outline ownership

This implementation will add comprehensive frontmatter metadata, enhance the default template, and document all features.

---

## Problem Analysis

### Current Implementation

**File:** `src/core/DraftFileService.ts` (lines 676-695)

```typescript
// Current: Template-only, no frontmatter
const content = await this.tpl.render(
  this.manager?.settings?.outlineTemplate || DEFAULT_OUTLINE_TEMPLATE,
  {
    draftName,
  },
);
await this.app.vault.create(outlinePath, content);
```

**Issues:**

- ❌ No frontmatter metadata generation
- ❌ No draft_id linking
- ❌ No type identifier
- ❌ No created timestamp
- ❌ No structure validation

### Documented Structure

**Expected:** `docs/ProjectStructureAndSettings.md` (lines 166-217)

```yaml
---
draft_id: "draft-uuid"
type: "outline"
---
# Outline for Draft 1

## Story Premise
## Main Plot Points
## Character Arcs
## Key Scenes
## Notes
```

### Default Template Gap

| Section           | Documented | Current | Status  |
| ----------------- | ---------- | ------- | ------- |
| Story Premise     | ✓          | ✗       | Missing |
| Main Plot Points  | ✓          | ✗       | Missing |
| Character Arcs    | ✓          | ✗       | Missing |
| Key Scenes        | ✓          | ✗       | Missing |
| Thematic Elements | ✓          | ✗       | Missing |
| Notes             | ✓          | ✗       | Missing |

---

## Solution Design

### Frontmatter Metadata Structure

```yaml
---
draft_id: "draft-[uuid]" # Links to parent draft
type: "outline" # Type identifier
created: "2025-01-15T14:30:45Z" # ISO 8601 UTC timestamp
---
```

**Fields:**

- `draft_id`: UUID for linking to parent draft (enables tracking)
- `type`: Literal value "outline" (identifies file type)
- `created`: ISO 8601 UTC timestamp (records creation time)

### Enhanced Default Template

```markdown
# {{draftName}} Outline

## Story Premise

Brief description of the central story premise goes here.

## Main Plot Points

1. Setup: Introduce the world and protagonist
2. Inciting Incident: The event that starts the story
3. Rising Action: Complications and obstacles
4. Climax: The turning point
5. Resolution: How things are resolved

## Character Arcs

### Protagonist

- Starting State: How they begin
- Motivation: What drives them
- Transformation: How they change
- Ending State: Who they become

### Supporting Characters

- Character Name: Key traits and role

## Key Scenes

- [ ] Scene Title (Chapter X)
- [ ] Scene Title (Chapter X)

## Thematic Elements

- Central theme: [Description]
- Supporting themes: [List]

## Notes

- Pacing considerations
- Structural notes
- Research needed
- TODO items
```

### Settings Enhancements

**New Settings:**

```typescript
includeOutlineMetadata?: boolean      // Control frontmatter generation (default: true)
outlineMetadataFields?: string[]      // Customize included fields
```

**Existing Settings (already in codebase):**

- `includeDraftOutline?: boolean` - Whether to create outlines
- `outlineTemplate?: string` - Custom template
- `outlineFileName?: string` - Custom filename

---

## Implementation Plan

### Phase 1: Core Enhancement (4 tasks)

**Goal:** Add frontmatter metadata and enhance default template

#### 1.1: Add frontmatter generation to createOutline()

**File:** `src/core/DraftFileService.ts`

**Changes:**

```typescript
// Generate frontmatter with metadata
const frontmatter = buildFrontmatter({
  draft_id: draftId,
  type: "outline",
  created: new Date().toISOString(),
});

const content = await this.tpl.render(template, { draftName });
await this.app.vault.create(outlinePath, frontmatter + content);
```

**Details:**

- Import `buildFrontmatter` from utils
- Generate unique UUID for draft_id
- Use ISO 8601 timestamp
- Validate parent draft exists
- Add debug logging

#### 1.2: Update default outline template

**File:** `src/main.ts`

**Changes:**

```typescript
DEFAULT_SETTINGS = {
  outlineTemplate: `# {{draftName}} Outline

## Story Premise
[...]

## Main Plot Points
[...]

## Character Arcs
[...]

## Key Scenes
[...]

## Thematic Elements
[...]

## Notes
[...]`,
};
```

**Details:**

- Replace current simple template
- Include all documented sections
- Keep template variables ({{draftName}})
- Add helpful placeholder text

#### 1.3: Add UUID generation and validation

**File:** `src/core/DraftFileService.ts`

**Changes:**

- Generate unique draft_id using existing `generateDraftId()`
- Validate parent draft exists before outline creation
- Add appropriate error handling and debug logging

#### 1.4: Test outline creation

**Testing:**

- ✓ New outlines have frontmatter
- ✓ Frontmatter contains correct draft_id
- ✓ Frontmatter contains type: "outline"
- ✓ Frontmatter contains created timestamp
- ✓ Default template renders correctly
- ✓ Template variables work ({{draftName}})
- ✓ Parent draft validation works

---

### Phase 2: Settings & Customization (4 tasks)

**Goal:** Add configurable settings for outline behavior

#### 2.1: Add includeOutlineMetadata setting

**File:** `src/types.ts`

**Changes:**

```typescript
export interface WriteAidSettings {
  // ... existing settings
  includeOutlineMetadata?: boolean; // default: true
}
```

#### 2.2: Add outlineMetadataFields setting

**File:** `src/types.ts`

**Changes:**

```typescript
export interface WriteAidSettings {
  // ... existing settings
  outlineMetadataFields?: string[]; // ["draft_id", "type", "created"]
}
```

#### 2.3: Update settings UI

**File:** `src/settings.ts`

**Changes:**

- Add toggle for `includeOutlineMetadata`
- Add field selector for `outlineMetadataFields`
- Add template editor/preview
- Add help text explaining options

#### 2.4: Test settings and customization

**Testing:**

- ✓ `includeDraftOutline` toggle works
- ✓ `includeOutlineMetadata` toggle works (new)
- ✓ `outlineMetadataFields` customization works
- ✓ Custom templates render correctly
- ✓ Settings persist across plugin reload
- ✓ Backward compatibility with existing outlines

---

### Phase 3: Documentation (4 tasks)

**Goal:** Document all outline features and customization

#### 3.1: Update ProjectStructureAndSettings.md

**File:** `docs/ProjectStructureAndSettings.md`

**Changes:**

- Update Outline File section with new frontmatter
- Add frontmatter field descriptions
- Include full example with all sections
- Add note about draft_id linking

**Example addition:**

```markdown
### Outline File (outline.md)

Optional file for planning and organizing your draft:

## \`\`\`yaml

draft_id: "draft-[uuid]"
type: "outline"
created: "2025-01-15T14:30:45Z"

---

# Draft Name Outline

## Story Premise

...
\`\`\`

**Frontmatter Fields:**

- draft_id: Links outline to parent draft
- type: Literal "outline" identifier
- created: ISO 8601 timestamp of creation
```

#### 3.2: Add outline customization docs

**File:** `docs/ProjectStructureAndSettings.md`

**Changes:**

- Add "Outline Customization" section
- Document template variables
- Document all settings
- Show example custom templates

#### 3.3: Update CommandsReference.md

**File:** `docs/CommandsReference.md`

**Changes:**

- Update "Create Outline" command documentation
- Add template variables reference
- Add settings reference
- Show example output

#### 3.4: Update UserGuide.md

**File:** `docs/UserGuide.md`

**Changes:**

- Add "Outline Best Practices" section
- Show example outline structures
- Document workflow recommendations
- Link to ProjectStructureAndSettings.md for details

---

### Phase 4: Testing (1 comprehensive task)

**Goal:** Verify all functionality and documentation

**Test Checklist:**

- [ ] New draft creates outline with frontmatter
- [ ] Frontmatter contains correct draft_id format
- [ ] Frontmatter contains type: "outline"
- [ ] Frontmatter contains valid ISO 8601 timestamp
- [ ] Default template renders with all sections
- [ ] Custom templates work correctly
- [ ] Template variables ({{draftName}}) resolve
- [ ] includeDraftOutline toggle works
- [ ] includeOutlineMetadata toggle works (new)
- [ ] outlineMetadataFields customization works
- [ ] Old outlines without frontmatter still open
- [ ] All documentation updated and accurate
- [ ] Template variables documented
- [ ] Settings UI displays new options
- [ ] No console errors or warnings
- [ ] No TypeScript compilation errors
- [ ] Linter passes all checks

---

## Files to Modify

### Core Implementation

- `src/core/DraftFileService.ts` - Add frontmatter generation
- `src/main.ts` - Update default template and settings
- `src/types.ts` - Add new settings types

### UI/Settings

- `src/settings.ts` - Add outline settings UI

### Documentation

- `docs/ProjectStructureAndSettings.md` - Update outline section
- `docs/CommandsReference.md` - Update Create Outline command
- `docs/UserGuide.md` - Add outline best practices

### Test/Validation

- `test-vault/Test/drafts/Draft 1/outline.md` - Update with new format

---

## Acceptance Criteria

✅ **Frontmatter Metadata**

- Outline frontmatter metadata generated automatically
- draft_id field included and validated
- type: "outline" field included
- created timestamp included (ISO 8601 UTC)

✅ **Enhanced Template**

- Default template matches documentation structure
- All documented sections present
- Template variables work correctly
- Sections are properly formatted

✅ **Documentation**

- ProjectStructureAndSettings.md updated with frontmatter examples
- Template variables documented
- Customization options documented
- CommandsReference.md updated
- UserGuide.md updated with best practices

✅ **Settings**

- New settings implemented and working
- Settings UI displays correctly
- Settings persist across reload

✅ **Quality**

- Backward compatible with existing outlines
- All tests passing
- No console errors or warnings
- TypeScript compiles cleanly
- Linter passes all checks

---

## Related Issues

- Issue #6: Documentation/implementation mismatch (broader)
- Issue #7: Missing project metadata fields
- Issue #8: Enhance manuscript generation
- Issue #10: Enhance chapter file metadata (reference for pattern)
- Issue #11: Enhance single-file draft metadata (similar scope)

---

## Timeline

**Phase 1:** Core Enhancement (2-3 hours)

- 1.1: Add frontmatter generation
- 1.2: Update template
- 1.3: Add validation
- 1.4: Test core functionality

**Phase 2:** Settings (1-2 hours)

- 2.1-2.2: Add settings
- 2.3: Update UI
- 2.4: Test settings

**Phase 3:** Documentation (1-2 hours)

- 3.1-3.4: Update all documentation

**Phase 4:** Testing (1 hour)

- Comprehensive validation

**Total Estimated Time:** 5-8 hours

---

## Success Metrics

✅ All acceptance criteria met
✅ Documentation matches implementation
✅ No console errors or warnings
✅ All tests passing
✅ Code review approved
✅ Ready for merge to main

---

## Next Steps

1. ✅ Complete investigation (Done)
2. ✅ Create implementation plan (This document)
3. → Start Phase 1.1: Add frontmatter generation
4. Continue with remaining phases in order
5. Create pull request when complete
6. Address code review feedback
7. Merge to main
