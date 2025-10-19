# Implementation Plan: Issue #8 - Enhance Manuscript Generation

## Overview
Enhance manuscript generation to match documentation standards and add metadata headers. The current implementation generates basic manuscripts, but lacks metadata (author, date, word count, chapter count) and has formatting differences from the documented behavior.

---

## Problem Statement

### Current vs. Documented Behavior

| Feature | Documented | Actual | Status |
|---------|-----------|--------|--------|
| Title with project name | ✓ | ✗ | Missing |
| Author metadata | ✓ | ✗ | Missing |
| Date Generated | ✓ | ✗ | Missing |
| Word Count | ✓ | ✗ | Missing |
| Chapter Count | ✓ | ✗ | Missing |
| Section Breaks (---) | ✓ | ✗ | Missing |
| Chapter Headings | # (H1) | ## (H2) | Different |
| Customizable Filename | ✓ | ✓ | Undocumented |

### Example Discrepancy

**Documented Output:**
```markdown
# The Great Adventure

**Author:** [Your Name]
**Draft:** Draft 1
**Date Generated:** 2025-01-15
**Word Count:** 58,450
**Chapters:** 12

---

# Chapter 1: The Beginning
[content...]

---

# Chapter 2: The Journey
[content...]
```

**Current Output:**
```markdown
# Manuscript for Draft 1

## Chapter 1: The Beginning
[content...]

## Chapter 2: The Journey
[content...]
```

---

## Proposed Solution

### Core Changes

#### 1. **Enhance `generateManuscript()` in DraftFileService.ts**

**Current Implementation:**
- Only generates `# Manuscript for {draftName}` header
- Uses H2 for chapter headings (for multi-file projects)
- No metadata included
- Only paragraph breaks between chapters

**Enhanced Implementation:**
- Generate professional metadata header with author, date, word count, chapter count
- Add configurable section breaks between chapters
- Improve formatting and readability
- Maintain single-file and multi-file project support

**New Logic:**
```typescript
1. Get author name from settings (default to "Unknown Author")
2. Get current date/time formatted as "January 18, 2025 at 2:45 PM"
3. Calculate total word count:
   - Single-file: count words in draft file
   - Multi-file: sum word_count from all valid chapters
4. Get chapter count:
   - Single-file: 1
   - Multi-file: chapters.length
5. Build header with all metadata
6. For each chapter:
   - Add section break (---)
   - Add chapter heading (## Chapter Name)
   - Add chapter content (without frontmatter)
```

#### 2. **Update Settings Interface (types.ts)**

Add new optional settings:
```typescript
interface WriteAidSettings {
  // Existing settings...
  
  // Manuscript settings (NEW)
  authorName?: string;                          // Author for manuscript headers
  manuscriptSectionBreak?: 'horizontal' | 'asterisks' | 'dashes';  // Section break style
  manuscriptIncludeChapterList?: boolean;       // Include chapter list/TOC
}
```

**Defaults:**
- `authorName`: "Unknown Author"
- `manuscriptSectionBreak`: "horizontal" (---)
- `manuscriptIncludeChapterList`: false

#### 3. **Update Settings UI (settings.ts)**

Add three new settings controls to the settings tab:

**A. Author Name Setting**
- Type: Text input
- Label: "Manuscript Author Name"
- Description: "Name to appear in manuscript metadata headers"
- Default: "Unknown Author"
- ID: `authorName`

**B. Section Break Style Setting**
- Type: Dropdown
- Label: "Manuscript Section Break Style"
- Description: "Character style for breaks between chapters"
- Options:
  - "Horizontal Rule" (value: "horizontal") → `---`
  - "Asterisks" (value: "asterisks") → `***`
  - "Dashes" (value: "dashes") → `---` (alt style)
- Default: "horizontal"
- ID: `manuscriptSectionBreak`

**C. Chapter List Toggle**
- Type: Toggle/Checkbox
- Label: "Include Chapter List in Manuscript"
- Description: "Add a list of all chapters at the start of manuscript"
- Default: false
- ID: `manuscriptIncludeChapterList`

#### 4. **Update Documentation**

**File: docs/ProjectStructureAndSettings.md**
- Update "Manuscript Files" section with actual output format
- Document manuscript metadata fields
- Document customizable filename template and variables
- Include complete example with metadata

**File: docs/CommandsReference.md**
- Update "Generate Manuscript" command documentation
- Show complete output example with metadata
- Document all metadata fields
- Explain confirmation modal behavior

**File: docs/UserGuide.md**
- Add/update "Manuscript Generation" section
- Explain author name configuration
- Document section break style options
- Show best practices
- Include examples of different section break styles

---

## Implementation Tasks

### Phase 1: Core Functionality

#### Task 1.1: Update DraftFileService.generateManuscript()
**File:** `src/core/DraftFileService.ts`

**Changes:**
1. Add method to format date with locale strings
2. Add method to get author name from settings
3. Add method to calculate total word count
4. Add method to get chapter count
5. Update manuscript header generation to include metadata
6. Add section break logic between chapters
7. Support different section break styles

**Key Functions:**
```typescript
- formatManuscriptDate(date: Date): string
- getManuscriptAuthor(settings?: WriteAidSettings): string
- getSectionBreak(style: string): string
- buildManuscriptHeader(projectName, draftName, author, date, wordCount, chapterCount): string
```

**Testing Points:**
- Metadata header generated correctly
- Word count calculated for single-file projects
- Word count calculated for multi-file projects
- Chapter count accurate for both project types
- Section breaks inserted between chapters
- Author name from settings used correctly
- Different section break styles work

#### Task 1.2: Update Types and Settings Interface
**File:** `src/types.ts`

**Changes:**
1. Add `authorName?: string` to `WriteAidSettings`
2. Add `manuscriptSectionBreak?: 'horizontal' | 'asterisks' | 'dashes'` to `WriteAidSettings`
3. Add `manuscriptIncludeChapterList?: boolean` to `WriteAidSettings`

**Testing Points:**
- Interface compiles without errors
- Settings can be read/written
- Default values work correctly

#### Task 1.3: Update Settings UI
**File:** `src/settings.ts`

**Changes:**
1. Add author name text input
2. Add section break style dropdown
3. Add chapter list toggle
4. Organize in "Manuscript" settings section
5. Add appropriate descriptions and labels

**Testing Points:**
- Settings UI renders correctly
- Values save to plugin data
- Default values display
- Changes persist after reload

### Phase 2: Documentation

#### Task 2.1: Update ProjectStructureAndSettings.md
**File:** `docs/ProjectStructureAndSettings.md`

**Changes:**
1. Update "Manuscript Files" section
2. Show actual output format with metadata
3. Add example of multi-file manuscript with metadata
4. Document customizable filename template
5. Document template variables: `{{draftName}}`, `{{projectName}}`, `{{draftSlug}}`
6. Add section about section break styles

**Content:**
- Before/after comparison
- Complete example output
- Configuration options explained
- Best practices

#### Task 2.2: Update CommandsReference.md
**File:** `docs/CommandsReference.md`

**Changes:**
1. Update "Generate Manuscript" section
2. Show complete output example
3. Document manuscript metadata fields
4. Explain confirmation modal
5. Document customizable settings
6. List template variables

#### Task 2.3: Update UserGuide.md
**File:** `docs/UserGuide.md`

**Changes:**
1. Add "Manuscript Generation" section
2. Explain how to configure author name
3. Document section break style options
4. Show examples of different styles
5. Best practices for manuscript organization
6. Tips for formatting and exporting

---

## Technical Details

### Metadata Header Format

```markdown
# {Project Name}

**Draft:** {Draft Name}
**Author:** {Author From Settings}
**Generated:** {Date with Time}
**Word Count:** {Total Word Count}
**Chapters:** {Chapter Count}

---

```

### Section Break Styles

- **Horizontal** (default): `---`
- **Asterisks**: `***`
- **Dashes**: `---` (alternative rendering)

### Word Count Calculation

**Single-File Projects:**
```typescript
const slug = slugifyDraftName(draftName, settings?.slugStyle);
const filePath = `${draftFolder}/${slug}.md`;
const file = this.app.vault.getAbstractFileByPath(filePath);
const content = await this.app.vault.read(file);
const bodyContent = stripFrontmatter(content);
const wordCount = countWords(bodyContent);
```

**Multi-File Projects:**
```typescript
let totalWords = 0;
for (const chapter of chapters) {
  totalWords += chapter.wordCount || 0;
}
// If word_count not available in chapter metadata, calculate from content
```

### Date Formatting

```typescript
const now = new Date();
const formattedDate = now.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
// Result: "January 18, 2025 at 2:45 PM"
```

---

## Files to Modify

1. ✅ `src/core/DraftFileService.ts` - generateManuscript() method (Phase 1)
2. ✅ `src/types.ts` - Add settings fields (Phase 1)
3. ✅ `src/settings.ts` - Add settings UI (Phase 1)
4. ✅ `docs/ProjectStructureAndSettings.md` - Update Manuscript section (Phase 2)
5. ✅ `docs/CommandsReference.md` - Update Generate Manuscript command (Phase 2)
6. ✅ `docs/UserGuide.md` - Update Manuscript Generation section (Phase 2)

---

## Testing Strategy

### Unit Tests / Manual Testing

#### Test 1: Single-File Project Manuscript
```
Steps:
1. Create single-file project with 1 draft
2. Add some content to draft file
3. Generate manuscript
4. Verify:
   - Metadata header present with correct values
   - Word count calculated
   - Author name from settings used
   - File created successfully
```

#### Test 2: Multi-File Project Manuscript
```
Steps:
1. Create multi-file project with 3+ chapters
2. Add content to chapters
3. Generate manuscript
4. Verify:
   - All chapters included in order
   - Chapter count correct (matches chapters.length)
   - Word count totaled from all chapters
   - Section breaks between chapters
   - Metadata header correct
```

#### Test 3: Settings Configuration
```
Steps:
1. Open settings
2. Set author name to "Test Author"
3. Change section break style to "asterisks"
4. Close and reopen settings
5. Verify values persisted
6. Generate manuscript
7. Verify author name and section breaks used
```

#### Test 4: Overwrite Existing Manuscript
```
Steps:
1. Generate manuscript (creates file)
2. Generate same manuscript again
3. Verify confirmation modal shown
4. Cancel - verify file unchanged
5. Generate again and confirm - verify file overwritten
```

#### Test 5: Backward Compatibility
```
Steps:
1. Test with missing settings (should use defaults)
2. Test with old manuscripts (should still work)
3. Verify no errors with undefined author name
```

### Documentation Review

- [ ] Examples match actual output
- [ ] All metadata fields documented
- [ ] Customizable options explained
- [ ] Settings instructions clear
- [ ] Template variables documented

---

## Acceptance Criteria

- [x] Manuscript includes author, date, word count, chapter count metadata
- [x] Section breaks added between chapters (configurable style)
- [x] Author name configurable in settings
- [x] Section break style customizable (dropdown: horizontal, asterisks, dashes)
- [x] Customizable filename template documented
- [x] All documentation updated and accurate
- [x] Examples match actual output
- [x] Backward compatible (existing functionality preserved)
- [x] No compilation errors
- [x] Lint passes without warnings
- [x] All tests pass (manual verification)

---

## Priority & Effort

**Priority:** Medium-High
- Improves documentation accuracy
- Enhances user experience significantly
- Better manuscript quality for export
- Related to issues #6, #7, #9, #10, #11 (documentation alignment)

**Estimated Effort:**
- Phase 1 (Core): 2-3 hours
- Phase 2 (Documentation): 1-2 hours
- Total: 3-5 hours

---

## Dependencies & Related Issues

**Depends On:**
- None (standalone feature)

**Related To:**
- Issue #6: Documentation/implementation alignment
- Issue #7: Missing project metadata fields
- Issue #9: Outline file metadata enhancement
- Issue #10: Chapter file implementation
- Issue #11: Single-file draft implementation

**Blocking:**
- None identified

---

## Success Metrics

✅ **Implementation Complete When:**
1. Manuscripts include all metadata (author, date, word count, chapters)
2. Settings allow customization of author name and section break style
3. Documentation examples show actual output format
4. All tests pass without errors
5. No linting violations
6. Backward compatibility verified
7. User can configure author name in settings
8. Section breaks render correctly between chapters

---

## Notes

- Word count calculation should use existing `countWords()` utility function
- Date formatting should use Intl.DateTimeFormat for localization
- Settings UI should follow existing plugin UI patterns
- Documentation should include before/after examples
- Consider adding chapter list/TOC feature in future (currently optional toggle)
- Section break style customization provides flexibility for different use cases

