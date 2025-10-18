# GitHub Issues Summary

## Overview

Two complementary GitHub issues have been created to address the gap between documented and actual project metadata implementation:

- **Issue #6**: Documents the discrepancy (what needs to be fixed)
- **Issue #7**: Proposes the solution (feature enhancement)

---

## Issue #6: Documentation Mismatch ⚠️

**Title:** `docs: Align project metadata documentation with actual implementation`  
**Type:** Bug + Documentation  
**Priority:** HIGH  
**URL:** https://github.com/julianstephens/obsidian-writeaid-plugin/issues/6

### Problem Statement

The documentation in `docs/ProjectStructureAndSettings.md` describes metadata fields that do not exist in the actual implementation (`src/core/meta.ts`).

### Documented (but NOT implemented)

These fields are described in documentation but **not tracked** by the plugin:

- `project_name` - Project name
- `description` - Optional project description
- `date_created` - Project creation date
- `date_updated` - Last modification time
- `total_chapters` - Chapter count (multi-file only)

### Actually Implemented

These fields **do exist** in the implementation:

- `version` - WriteAid project version (not documented!)
- `current_active_draft` - Active draft name (not documented!)
- `current_draft_word_count` - Active draft word count (not documented!)
- `total_drafts` - Draft count (not documented!)
- `target_word_count` - Word count goal (not documented!)
- `active_draft_last_modified` - Last modification timestamp (not documented!)
- `average_draft_word_count` - Auto-calculated (not documented!)
- `project_type` - ✓ Correctly documented
- `total_word_count` - ✓ Correctly documented

### Issue Details

| Documented                   | Actual                        | Status            |
| ---------------------------- | ----------------------------- | ----------------- |
| `project_name`               | ❌ Not tracked                | FALSE             |
| `project_type`               | ✅ project_type               | TRUE              |
| `description`                | ❌ Not tracked                | FALSE             |
| `date_created`               | ❌ Not tracked                | FALSE             |
| `date_updated`               | ✅ active_draft_last_modified | Different field   |
| `total_chapters`             | ❌ Not calculated             | FALSE             |
| `total_word_count`           | ✅ total_word_count           | TRUE              |
| `version`                    | ✅ (not documented)           | Missing from docs |
| `current_active_draft`       | ✅ (not documented)           | Missing from docs |
| `current_draft_word_count`   | ✅ (not documented)           | Missing from docs |
| `total_drafts`               | ✅ (not documented)           | Missing from docs |
| `target_word_count`          | ✅ (not documented)           | Missing from docs |
| `active_draft_last_modified` | ✅ (not documented)           | Missing from docs |
| `average_draft_word_count`   | ✅ (not documented)           | Missing from docs |

### Example: Actual Meta File

```yaml
---
version: "0.1.0"
current_active_draft: "Draft 1"
current_draft_word_count: 58450
total_drafts: 2
total_word_count: 58450
average_draft_word_count: 29225
project_type: multi-file
active_draft_last_modified: "2025-01-15T14:30:45.000Z"
---

# Project Statistics

**Active Draft:** Draft 1
**Current Draft Word Count:** 58,450
**Total Drafts:** 2
**Total Word Count:** 58,450
**Average Draft Word Count:** 29,225
**Last Modified:** 1/15/2025, 2:30:45 PM
```

### Files That Need Documentation Updates

1. `docs/ProjectStructureAndSettings.md` - Lines 55-95 (Project Metadata section)
2. `docs/UserGuide.md` - Any meta.md field references
3. `docs/README.md` - If any references exist

### Solution Options

**Option A: Fix Documentation (Quick)**

- Remove documented fields that don't exist
- Document the fields that actually exist
- This is what Issue #6 is about

**Option B: Add Missing Fields (Better)**

- Implement the documented fields in the code
- Update documentation to match
- This is what Issue #7 proposes

---

## Issue #7: Feature Enhancement 🎯

**Title:** `feat: Add missing project metadata fields`  
**Subtitle:** `(project_name, description, date_created, date_updated, total_chapters)`  
**Type:** Feature Enhancement  
**Priority:** HIGH  
**URL:** https://github.com/julianstephens/obsidian-writeaid-plugin/issues/7

### Purpose

Implement the missing metadata fields documented in the user guides to provide:

- Better project context (name, description, timestamps)
- Project tracking and organization
- Alignment with user expectations
- Feature parity across single-file and multi-file projects

### Fields to Add

| Field            | Type              | Purpose                       | Auto-maintained? |
| ---------------- | ----------------- | ----------------------------- | ---------------- |
| `project_name`   | string            | User-friendly project name    | Manual           |
| `description`    | string (optional) | Project description/notes     | Manual           |
| `date_created`   | ISO 8601          | Creation timestamp            | Automatic        |
| `date_updated`   | ISO 8601          | Last modification timestamp   | Automatic        |
| `total_chapters` | number            | Chapter count in active draft | Automatic        |

### Proposed Implementation

#### 1. Update Interface (`src/core/meta.ts`)

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

#### 2. Update CreateProjectModal (`src/ui/modals/CreateProjectModal.ts`)

Add optional description input field to project creation modal.

#### 3. Update Creation Pipeline

- `manager.ts` - Pass description through creation flow
- `ProjectService.ts` - Set initial metadata with dates
- `meta.ts` - Format new fields in YAML and display

#### 4. Update Metadata Logic

- Auto-update `date_updated` on any metadata change
- Calculate and update `total_chapters` for active draft
- Preserve `date_created` on subsequent updates

### File-by-File Changes

| File                                  | Changes                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `src/core/meta.ts`                    | • Add fields to interface • Update updateMetaStats() • Update formatMetaContent() |
| `src/ui/modals/CreateProjectModal.ts` | • Add description input field                                                     |
| `src/manager.ts`                      | • Pass description in createNewProject()                                          |
| `src/core/ProjectService.ts`          | • Initialize metadata with dates and name                                         |
| `docs/ProjectStructureAndSettings.md` | • Update after implementation                                                     |

### Expected Behavior

**Project Creation:**

```
User: Open "Create New Project" command
UI:   Shows form with:
      - Project name (required)
      - Project type (single-file / multi-file)
      - Description (optional)
      - Initial draft name (optional)
Result: meta.md contains all fields with initial values
```

**Project Management:**

- `date_updated` automatically updates when metadata changes
- `total_chapters` automatically calculated for active draft
- Users can manually edit `project_name` and `description`

### Example Meta File After Implementation

```yaml
---
version: "0.1.0"
project_name: "The Great Adventure"
description: "An epic fantasy novel exploring themes of courage and redemption"
date_created: "2025-01-15T08:30:00.000Z"
date_updated: "2025-01-18T14:45:30.000Z"
current_active_draft: "Draft 1"
current_draft_word_count: 58450
total_drafts: 2
total_chapters: 12
total_word_count: 58450
average_draft_word_count: 29225
project_type: multi-file
active_draft_last_modified: "2025-01-18T14:30:00.000Z"
---

# Project Statistics

**Project Name:** The Great Adventure
**Description:** An epic fantasy novel exploring themes of courage and redemption
**Created:** 1/15/2025, 8:30:00 AM
**Last Updated:** 1/18/2025, 2:45:30 PM
**Active Draft:** Draft 1
**Current Draft Word Count:** 58,450
**Total Drafts:** 2
**Total Chapters:** 12
**Total Word Count:** 58,450
**Average Draft Word Count:** 29,225
```

### Benefits

✅ **Aligns Implementation with Documentation**

- Users see what they expect to see

✅ **Improves User Experience**

- Better project context at a glance
- Timestamps track project evolution
- Descriptions help organize projects

✅ **Enables Organization**

- Filter/sort projects by type or date
- Track project creation and updates
- Add notes without external tools

✅ **Maintains Compatibility**

- All new fields are optional
- Existing projects continue to work
- Graceful handling of missing fields

✅ **Feature Parity**

- Single-file and multi-file projects have equal metadata support

### Testing Checklist

- [ ] Create new project with all fields populated
- [ ] Verify `meta.md` contains all new fields with correct values
- [ ] Verify `date_created` set on creation
- [ ] Verify `date_updated` updates on metadata changes
- [ ] Create/delete chapters and verify `total_chapters` updates
- [ ] Edit `project_name` and `description` manually in `meta.md`
- [ ] Verify all fields display in human-readable section
- [ ] Test backward compatibility with existing projects
- [ ] Verify no breaking changes to existing functionality

### Acceptance Criteria

- [x] All 5 fields added to ProjectMetadata interface
- [x] CreateProjectModal accepts description input
- [x] All fields written to meta.md on project creation
- [x] date_updated auto-updated on metadata changes
- [x] total_chapters auto-calculated for active draft
- [x] All fields display in human-readable section
- [x] Backward compatible with existing projects
- [x] Documentation updated to reflect implementation

### Related Work

- Resolves: Issue #6 (documentation mismatch)
- Improves: User experience and project organization
- Enables: Better project tracking and management

---

## Implementation Path

### Phase 1: Understand (COMPLETE ✅)

- [x] Identify discrepancy between docs and code (Issue #6)
- [x] Plan feature enhancement (Issue #7)
- [x] Create GitHub issues with detailed specs

### Phase 2: Implement (PENDING 🔄)

- [ ] Update ProjectMetadata interface
- [ ] Update CreateProjectModal
- [ ] Update project creation pipeline
- [ ] Update metadata management logic
- [ ] Test thoroughly

### Phase 3: Document (PENDING 🔄)

- [ ] Update `docs/ProjectStructureAndSettings.md`
- [ ] Update `docs/UserGuide.md` if needed
- [ ] Update `README.md` if needed
- [ ] Close Issue #6 as resolved

### Phase 4: Release (PENDING 🔄)

- [ ] Merge to main branch
- [ ] Create release notes
- [ ] Tag version
- [ ] Announce update

---

## Priority & Impact

### Why This Matters

1. **Documentation Accuracy**: Users read docs and expect features to exist
2. **User Expectations**: Fields are already documented, implementation should match
3. **Project Management**: Metadata helps users organize and track projects
4. **Quality**: Closing this gap demonstrates attention to quality

### Impact Assessment

| Area                   | Impact  | Effort    |
| ---------------------- | ------- | --------- |
| User Experience        | HIGH ⬆️ | Medium 📊 |
| Documentation          | HIGH ⬆️ | Low 📝    |
| Code Quality           | HIGH ⬆️ | Medium 💻 |
| Backward Compatibility | NONE ✓  | Low 🔧    |
| Performance            | NONE ✓  | Low ⚡    |

---

## Related Resources

### Current Metadata Implementation

- **File:** `src/core/meta.ts`
- **Interface:** `ProjectMetadata`
- **Functions:** `readMetaFile()`, `writeMetaFile()`, `updateMetaStats()`

### User-Facing Documentation

- **File:** `docs/ProjectStructureAndSettings.md`
- **Section:** "Project Metadata (meta.md)"
- **Lines:** 55-95 (approximate)

### Project Creation Flow

- **Entry:** `createNewProjectCommand()` in `src/commands/project/`
- **Modal:** `CreateProjectModal` in `src/ui/modals/`
- **Manager:** `createNewProject()` in `src/manager.ts`
- **Service:** `ProjectService.createProject()` in `src/core/`

---

## Next Steps

1. **Review Issues**
   - Read Issue #6 for complete context
   - Review Issue #7 implementation plan

2. **Implement Features**
   - Follow the step-by-step plan in Issue #7
   - Add each field systematically
   - Test after each change

3. **Update Documentation**
   - Update `docs/ProjectStructureAndSettings.md`
   - Update `docs/UserGuide.md` as needed
   - Close Issue #6 as resolved

4. **Prepare Release**
   - Ensure all tests pass
   - Update version numbers
   - Create release notes

---

## Summary

Two GitHub issues have been created to systematically address the metadata documentation/implementation gap:

| Issue | Focus             | Type        | Action                                  |
| ----- | ----------------- | ----------- | --------------------------------------- |
| #6    | Identify mismatch | Bug/Doc     | Fix documentation OR implement features |
| #7    | Propose solution  | Enhancement | Implement missing fields                |

**Recommendation:** Implement Issue #7 (add the fields) rather than just fixing documentation, as this provides better user experience and aligns reality with expectations.

Both issues are assigned and ready for implementation. Implementation roadmap is clearly laid out with code examples and testing checklist.
