# Issue #7 Implementation Plan

## feat: Add Missing Project Metadata Fields

**Issue:** [Add missing project metadata fields (project_name, description, date_created, date_updated, total_chapters) #7](https://github.com/julianstephens/obsidian-writeaid-plugin/issues/7)

**Status:** Not Started

**Priority:** High (Resolves documentation mismatch, enables project organization)

---

## Overview

This issue addresses the gap between documented and implemented metadata fields in the WriteAid plugin. Currently, the documentation describes fields (`project_name`, `description`, `date_created`, `date_updated`, `total_chapters`) that the implementation does not track.

**Key Goals:**

- Add missing metadata fields to align with documentation
- Improve user experience with better project context
- Enable project organization and filtering
- Maintain backward compatibility with existing projects

---

## Currently Missing Fields

| Field            | Type              | Purpose                           | When Updated               |
| ---------------- | ----------------- | --------------------------------- | -------------------------- |
| `project_name`   | string            | User-friendly project name        | On creation                |
| `description`    | string (optional) | Project description/notes         | On creation, user-editable |
| `date_created`   | ISO 8601 date     | Project creation date             | On creation                |
| `date_updated`   | ISO 8601 date     | Last project modification         | On any project update      |
| `total_chapters` | number            | Count of chapters in active draft | On metadata update         |

---

## Implementation Phases

### Phase 1: Core Metadata Enhancement (2-3 hours)

#### 1.1 Update `ProjectMetadata` Interface

**File:** `src/core/meta.ts`

Add new fields to the interface:

```typescript
export interface ProjectMetadata {
  version?: string;
  project_name?: string; // NEW
  description?: string; // NEW
  date_created?: string; // NEW
  date_updated?: string; // NEW
  total_chapters?: number; // NEW
  current_active_draft?: string;
  current_draft_word_count?: number;
  total_drafts: number;
  target_word_count?: number;
  active_draft_last_modified?: string;
  total_word_count?: number;
  average_draft_word_count?: number;
  project_type?: ProjectType;
  draft?: string;
}
```

**Acceptance Criteria:**

- [ ] Interface updated with all 5 new fields
- [ ] Types are correct (string, number, optional as needed)
- [ ] No TypeScript compilation errors

#### 1.2 Update `updateMetaStats()` Function

**File:** `src/core/meta.ts`

Modify to:

- Always update `date_updated` with current timestamp
- Calculate `total_chapters` for the active draft
- Preserve existing values for `project_name` and `description`

**Acceptance Criteria:**

- [ ] `date_updated` is set on every metadata update
- [ ] `total_chapters` is calculated correctly for active draft
- [ ] Existing project_name and description are preserved

#### 1.3 Update `formatMetaContent()` Function

**File:** `src/core/meta.ts`

Modify to:

- Include new fields in YAML frontmatter output
- Display new fields in human-readable section
- Handle optional fields gracefully

**Expected Output:**

```markdown
---
version: "0.1.0"
project_name: "The Great Adventure"
description: "An epic fantasy novel"
date_created: "2025-01-15T08:30:00.000Z"
date_updated: "2025-01-18T14:45:30.000Z"
total_chapters: 12
current_active_draft: "Draft 1"
current_draft_word_count: 58450
total_drafts: 2
---

# Project Statistics

**Project Name:** The Great Adventure
**Description:** An epic fantasy novel
**Created:** 1/15/2025, 8:30:00 AM
**Last Updated:** 1/18/2025, 2:45:30 PM
...
```

**Acceptance Criteria:**

- [ ] All new fields appear in YAML section
- [ ] Human-readable section displays formatted dates
- [ ] Optional fields handled gracefully (description not shown if empty)

---

### Phase 2: Project Creation Flow (1-2 hours)

#### 2.1 Update `CreateProjectModal`

**File:** `src/ui/modals/CreateProjectModal.ts`

Add optional description input field:

- Description input should be optional and multiline
- Shown below project name field
- Clear placeholder text
- Reasonable character limit (e.g., 500 characters)

**Acceptance Criteria:**

- [ ] Modal has description input field
- [ ] Field is optional (can be left blank)
- [ ] Description is returned in modal result
- [ ] UI is clean and follows existing design

#### 2.2 Update Manager Creation Flow

**File:** `src/manager.ts`

Update `createNewProjectPrompt()` and related methods:

- Collect description from modal
- Pass description through to ProjectService

**Acceptance Criteria:**

- [ ] Description flows from modal to service
- [ ] No breaking changes to existing API

#### 2.3 Update `ProjectService.createProject()`

**File:** `src/core/ProjectService.ts`

Set initial metadata when creating project:

```typescript
const metadata: ProjectMetadata = {
  version: WRITEAID_VERSION,
  project_name: projectName,
  description: description || "",
  date_created: new Date().toISOString(),
  date_updated: new Date().toISOString(),
  total_drafts: 1,
  total_chapters: 0, // Will be calculated on first draft creation
  project_type: singleFile ? "single-file" : "multi-file",
};
```

**Acceptance Criteria:**

- [ ] All new fields are set during project creation
- [ ] ISO 8601 timestamps are used
- [ ] `total_chapters` is initialized to 0 (or updated after first draft)

---

### Phase 3: Metadata Update Logic (1-2 hours)

#### 3.1 Calculate `total_chapters` on Draft Operations

**File:** `src/core/DraftFileService.ts`

Update when:

- Creating new draft
- Deleting draft
- Creating chapters

Calculation logic:

- Get active draft from meta.md
- Count valid chapters (those with required fields: id, order, chapter_name)
- Store in metadata

**Acceptance Criteria:**

- [ ] `total_chapters` updated when chapters added/removed
- [ ] Count is accurate for active draft only
- [ ] Works for both single-file and multi-file projects

#### 3.2 Update `date_updated` on All Project Changes

**File:** `src/core/meta.ts` (updateMetaStats function)

Ensure `date_updated` is set whenever:

- Draft is created/renamed/deleted
- Chapter is created/modified/deleted
- Project metadata is updated
- Any project-related operation occurs

**Acceptance Criteria:**

- [ ] `date_updated` changes on every relevant operation
- [ ] Timestamps are accurate
- [ ] No operations missed

---

### Phase 4: Backward Compatibility & Testing (1-2 hours)

#### 4.1 Handle Legacy Projects

**File:** `src/core/meta.ts`

When reading existing projects without new fields:

- Set `project_name` to project folder name if not present
- Leave `description` as empty string
- Set `date_created` to file creation time or current time (with note)
- Set `date_updated` to current time
- Calculate `total_chapters` from active draft

**Acceptance Criteria:**

- [ ] Existing projects load without errors
- [ ] Missing fields are populated with sensible defaults
- [ ] No data loss

#### 4.2 Comprehensive Testing

**File:** Test scenarios documented below

Test cases to verify:

1. ✓ Create new project with description
2. ✓ Verify meta.md contains all new fields
3. ✓ Create new project without description (optional)
4. ✓ Verify dates are ISO 8601 format
5. ✓ Switch between projects
6. ✓ Verify `date_updated` is different for each project
7. ✓ Add chapters to active draft
8. ✓ Verify `total_chapters` updates correctly
9. ✓ Edit project name/description in meta.md
10. ✓ Verify all fields display in human-readable section
11. ✓ Load existing project without new fields
12. ✓ Verify defaults are applied correctly
13. ✓ Full build completes without errors

---

## Files to Modify

### Core Implementation

1. **`src/core/meta.ts`**
   - Update `ProjectMetadata` interface
   - Update `updateMetaStats()` function
   - Update `formatMetaContent()` function
   - Add legacy project handling

2. **`src/ui/modals/CreateProjectModal.ts`**
   - Add description input field
   - Update modal result type

3. **`src/manager.ts`**
   - Update `createNewProjectPrompt()` method
   - Pass description through creation pipeline

4. **`src/core/ProjectService.ts`**
   - Update `createProject()` method
   - Initialize all new fields

5. **`src/core/DraftFileService.ts`**
   - Update chapter operations to trigger `total_chapters` calculation

### Documentation

6. **`docs/ProjectStructureAndSettings.md`**
   - Update project metadata table
   - Add example meta.md with new fields
   - Document date format standards

---

## Acceptance Criteria

- [x] **Field Tracking:** `project_name`, `description`, `date_created`, `date_updated`, `total_chapters` are tracked in `ProjectMetadata`
- [x] **Modal Input:** `CreateProjectModal` accepts optional description
- [x] **Metadata Creation:** All new fields written to meta.md on project creation
- [x] **Auto Updates:** `date_updated` automatically updated on any metadata change
- [x] **Chapter Counting:** `total_chapters` calculated for active draft
- [x] **Display:** All fields display correctly in human-readable section
- [x] **Backward Compatibility:** Graceful handling of existing projects (defaults applied)
- [x] **Documentation:** Updated to reflect new fields
- [x] **Build Verification:** Full build completes without errors
- [x] **No Regressions:** Existing functionality unchanged

---

## Testing Strategy

### Manual Test Cases

1. **New Project Creation**
   - Create project with name, type, and description
   - Verify all fields in meta.md
   - Verify human-readable section displays correctly

2. **Metadata Updates**
   - Create draft in project
   - Verify `date_updated` changes
   - Verify `total_chapters` is correct

3. **Chapter Operations**
   - Add chapter
   - Verify `total_chapters` increments
   - Delete chapter
   - Verify `total_chapters` decrements

4. **Legacy Project Migration**
   - Open project created before this feature
   - Verify missing fields are populated with defaults
   - Verify project functions normally

5. **Field Editing**
   - Edit `project_name` in meta.md
   - Verify changes persist
   - Edit `description` in meta.md
   - Verify changes persist

### Automated Acceptance Test

Create comprehensive test script covering all acceptance criteria:

- Verify all 5 new fields are present in ProjectMetadata interface
- Test project creation with and without description
- Verify ISO 8601 date format
- Test metadata update flow
- Test chapter counting
- Test backward compatibility
- Build verification

---

## Implementation Checklist

### Phase 1: Core Enhancement

- [ ] Update ProjectMetadata interface with 5 new fields
- [ ] Update updateMetaStats() to set date_updated and calculate total_chapters
- [ ] Update formatMetaContent() to include new fields in output
- [ ] Test interface updates compile without errors

### Phase 2: Project Creation

- [ ] Add description input to CreateProjectModal
- [ ] Update manager.createNewProjectPrompt() to collect description
- [ ] Update ProjectService.createProject() to set all new fields
- [ ] Test project creation with and without description

### Phase 3: Metadata Operations

- [ ] Ensure date_updated updates on all project changes
- [ ] Implement total_chapters calculation for active draft
- [ ] Test chapter operations trigger updates
- [ ] Test metadata consistency across operations

### Phase 4: Testing & Polish

- [ ] Handle legacy projects gracefully
- [ ] Test backward compatibility
- [ ] Run comprehensive acceptance tests
- [ ] Run full build verification
- [ ] Update documentation
- [ ] Code review and cleanup

---

## Related Issues

- **Issue #6:** Documentation mismatch (this implementation resolves it)
- **Issue #8:** Manuscript generation metadata enhancements
- **Issue #9:** Outline file metadata enhancements (COMPLETED)
- **Issue #10:** Chapter file implementation enhancements
- **Issue #11:** Single-file draft enhancements

---

## Success Criteria Summary

✅ Documentation matches implementation  
✅ All 5 new metadata fields tracked and persisted  
✅ Dates use ISO 8601 format  
✅ User can add optional description during project creation  
✅ `date_updated` automatically maintained  
✅ `total_chapters` accurately calculated  
✅ Backward compatible with existing projects  
✅ Build passes without errors  
✅ No regressions in existing functionality

---

## Notes

- Timestamps should use ISO 8601 UTC format: `new Date().toISOString()`
- `total_chapters` should count only valid chapters (those with all required metadata)
- For legacy projects, use file system dates as fallback for `date_created`
- Description is optional and can be empty string
- Human-readable dates should be formatted for user's locale
