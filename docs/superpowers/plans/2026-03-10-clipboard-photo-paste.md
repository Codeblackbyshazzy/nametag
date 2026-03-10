# Clipboard Photo Paste Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a photo source modal to the person form that supports file browse, drag-and-drop, and clipboard paste — replacing the current direct file picker.

**Architecture:** New `PhotoSourceModal` component handles all three input methods (browse, drop, paste), validates the file, and passes it to the existing `PhotoCropModal`. `PersonForm` swaps the inline file input for a click handler that opens the new modal. All validation logic (type + size) is shared.

**Tech Stack:** React, TypeScript, next-intl, Vitest + React Testing Library

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/PhotoSourceModal.tsx` | Modal with drop zone, paste listener, file browse |
| Create | `tests/components/PhotoSourceModal.test.tsx` | Unit tests for the new component |
| Modify | `components/PersonForm.tsx:280-311,468-542` | Replace inline file input with modal trigger |
| Modify | `locales/en.json:1092-1105` | Add new translation keys under `people.photo` |
| Modify | `locales/es-ES.json:1092-1105` | Spanish translations |
| Modify | `locales/de-DE.json:1092-1105` | German translations |
| Modify | `locales/ja-JP.json:1092-1105` | Japanese translations |
| Modify | `locales/nb-NO.json:1092-1105` | Norwegian translations |

---

## Task 1: Add i18n keys for the photo source modal

**Files:**
- Modify: `locales/en.json:1092-1105`
- Modify: `locales/es-ES.json:1092-1105`
- Modify: `locales/de-DE.json:1092-1105`
- Modify: `locales/ja-JP.json:1092-1105`
- Modify: `locales/nb-NO.json:1092-1105`

- [ ] **Step 1: Add English translation keys**

In `locales/en.json`, inside the `"photo"` object (under `people`), add these keys after `"sizeError"`:

```json
"sourceTitle": "Add Photo",
"dropzoneText": "Drag and drop, paste, or click to browse",
"dropzoneActive": "Drop image here",
"close": "Close"
```

- [ ] **Step 2: Add Spanish translations**

In `locales/es-ES.json`, same location:

```json
"sourceTitle": "Agregar foto",
"dropzoneText": "Arrastra y suelta, pega o haz clic para buscar",
"dropzoneActive": "Suelta la imagen aquí",
"close": "Cerrar"
```

- [ ] **Step 3: Add German translations**

In `locales/de-DE.json`:

```json
"sourceTitle": "Foto hinzufügen",
"dropzoneText": "Ziehen und ablegen, einfügen oder klicken zum Durchsuchen",
"dropzoneActive": "Bild hier ablegen",
"close": "Schließen"
```

- [ ] **Step 4: Add Japanese translations**

In `locales/ja-JP.json`:

```json
"sourceTitle": "写真を追加",
"dropzoneText": "ドラッグ＆ドロップ、貼り付け、またはクリックして参照",
"dropzoneActive": "ここに画像をドロップ",
"close": "閉じる"
```

- [ ] **Step 5: Add Norwegian translations**

In `locales/nb-NO.json`:

```json
"sourceTitle": "Legg til bilde",
"dropzoneText": "Dra og slipp, lim inn eller klikk for å bla",
"dropzoneActive": "Slipp bildet her",
"close": "Lukk"
```

- [ ] **Step 6: Commit**

```bash
git add locales/en.json locales/es-ES.json locales/de-DE.json locales/ja-JP.json locales/nb-NO.json
git commit -m "feat: add i18n keys for photo source modal"
```

---

## Task 2: Create PhotoSourceModal component with tests

**Files:**
- Create: `components/PhotoSourceModal.tsx`
- Create: `tests/components/PhotoSourceModal.test.tsx`

### Step-by-step

- [ ] **Step 1: Write the test file**

Create `tests/components/PhotoSourceModal.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import PhotoSourceModal from '../../components/PhotoSourceModal';
import enMessages from '../../locales/en.json';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

function createFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

describe('PhotoSourceModal', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title and dropzone text', () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    expect(screen.getByText('Add Photo')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop, paste, or click to browse')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    screen.getByRole('button', { name: /close/i }).click();
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking the backdrop', () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    // Click the backdrop (outermost div)
    const backdrop = screen.getByTestId('photo-source-backdrop');
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('calls onSelect with a valid file from file input', async () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    const file = createFile('photo.png', 'image/png', 1024);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnSelect).toHaveBeenCalledWith(file);
  });

  it('rejects files with invalid type', () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    const file = createFile('doc.pdf', 'application/pdf', 1024);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnSelect).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('rejects files exceeding 10MB', () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    const file = createFile('big.png', 'image/png', 11 * 1024 * 1024);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnSelect).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('handles paste event with image data', () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    const file = createFile('image.png', 'image/png', 1024);
    const pasteEvent = new Event('paste', { bubbles: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
      },
    });

    document.dispatchEvent(pasteEvent);
    expect(mockOnSelect).toHaveBeenCalledWith(file);
  });

  it('handles drop event with image file', () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    const file = createFile('photo.jpg', 'image/jpeg', 2048);
    const dropzone = screen.getByTestId('photo-source-dropzone');
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(mockOnSelect).toHaveBeenCalledWith(file);
  });

  it('shows active state on dragover', () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    const dropzone = screen.getByTestId('photo-source-dropzone');
    fireEvent.dragEnter(dropzone);

    expect(screen.getByText('Drop image here')).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    render(
      <Wrapper>
        <PhotoSourceModal onSelect={mockOnSelect} onClose={mockOnClose} />
      </Wrapper>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/PhotoSourceModal.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create the PhotoSourceModal component**

Create `components/PhotoSourceModal.tsx`:

```tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

interface PhotoSourceModalProps {
  onSelect: (file: File) => void;
  onClose: () => void;
}

export default function PhotoSourceModal({ onSelect, onClose }: PhotoSourceModalProps) {
  const t = useTranslations('people.photo');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateAndSelect = useCallback((file: File | null) => {
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast.error(t('formatError'));
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      toast.error(t('sizeError'));
      return;
    }
    onSelect(file);
  }, [onSelect, t]);

  // Global paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          validateAndSelect(file);
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [validateAndSelect]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (fileInputRef.current) fileInputRef.current.value = '';
    validateAndSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    const file = e.dataTransfer.files[0] ?? null;
    validateAndSelect(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      data-testid="photo-source-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{t('sourceTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div
            data-testid="photo-source-dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            className={`
              flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${isDragOver
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-surface-hover'
              }
            `}
          >
            <svg className="w-10 h-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-muted text-center">
              {isDragOver ? t('dropzoneActive') : t('dropzoneText')}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/PhotoSourceModal.test.tsx`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/PhotoSourceModal.tsx tests/components/PhotoSourceModal.test.tsx
git commit -m "feat: add PhotoSourceModal with browse, drop, and paste support"
```

---

## Task 3: Integrate PhotoSourceModal into PersonForm

**Files:**
- Modify: `components/PersonForm.tsx:147-151,280-306,468-542`

### Step-by-step

- [ ] **Step 1: Add state for the source modal**

In `components/PersonForm.tsx`, after line 150 (`cropImageSrc` state), add:

```tsx
const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
```

- [ ] **Step 2: Add import for PhotoSourceModal**

At the top of the file, after the `PhotoCropModal` import (line 10), add:

```tsx
import PhotoSourceModal from './PhotoSourceModal';
```

- [ ] **Step 3: Replace handlePhotoSelect with handlePhotoSourceSelect**

Replace the existing `handlePhotoSelect` function (lines 283-306) with:

```tsx
const handlePhotoSourceSelect = (file: File) => {
  setShowPhotoSourceModal(false);

  const reader = new FileReader();
  reader.onload = () => {
    setCropImageSrc(reader.result as string);
  };
  reader.readAsDataURL(file);
};
```

Note: Validation (type + size) is now handled by `PhotoSourceModal`, so this function only needs to convert to data URL and open the crop modal. The `fileInputRef` is no longer needed — remove it (line 151) and all references to it.

- [ ] **Step 4: Replace the photo section UI**

Replace the photo section (lines 468-542) with:

```tsx
{/* Photo Section */}
<div className="flex flex-col items-center gap-3 mb-6">
  <div className="relative group">
    {photoPreview ? (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={photoPreview} alt="" className="w-20 h-20 rounded-full object-cover bg-white dark:bg-black" />
    ) : (
      <PersonAvatar
        personId={person?.id || 'new'}
        name={formData.name || formData.surname || '?'}
        photo={photoRemoved ? null : person?.photo}
        size={80}
        loading="eager"
      />
    )}

    {/* Upload overlay on hover */}
    <button
      type="button"
      onClick={() => setShowPhotoSourceModal(true)}
      className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 cursor-pointer transition-colors"
    >
      <svg
        className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>

    {/* Remove button (top-right, visible on hover) */}
    {(photoPreview || (person?.photo && !photoRemoved)) && (
      <button
        type="button"
        onClick={handlePhotoRemove}
        className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        title={tPhoto('removeLabel')}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
  <span className="text-xs text-muted">
    {(person?.photo && !photoRemoved) || photoPreview ? tPhoto('changeLabel') : tPhoto('uploadLabel')}
  </span>
</div>

{/* Photo source modal */}
{showPhotoSourceModal && (
  <PhotoSourceModal
    onSelect={handlePhotoSourceSelect}
    onClose={() => setShowPhotoSourceModal(false)}
  />
)}

{/* Crop modal */}
{cropImageSrc && (
  <PhotoCropModal
    imageSrc={cropImageSrc}
    onConfirm={handleCropConfirm}
    onCancel={() => setCropImageSrc(null)}
  />
)}
```

Key changes:
- The `<label>` wrapping the avatar is now a `<button>` that opens the source modal
- The hidden `<input type="file">` is removed (it lives inside `PhotoSourceModal` now)
- `PhotoSourceModal` is rendered when `showPhotoSourceModal` is true
- `fileInputRef` and `ALLOWED_PHOTO_TYPES`/`MAX_PHOTO_SIZE` constants can be removed from `PersonForm` (they now live in `PhotoSourceModal`)

- [ ] **Step 5: Clean up removed references**

Remove from `PersonForm.tsx`:
- `fileInputRef` declaration (line 151)
- `ALLOWED_PHOTO_TYPES` and `MAX_PHOTO_SIZE` constants (lines 280-281)
- `useRef`, `ChangeEvent` from the React import (line 2) — the import should become:
  ```tsx
  import { useState, FormEvent } from 'react';
  ```
- The old `handlePhotoSelect` function

- [ ] **Step 6: Verify the build compiles**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 7: Run all existing tests**

Run: `npx vitest run`
Expected: All tests pass (no regressions)

- [ ] **Step 8: Commit**

```bash
git add components/PersonForm.tsx components/PhotoSourceModal.tsx
git commit -m "feat: integrate photo source modal with browse, drop, and paste"
```

---

## Task 4: Manual verification

- [ ] **Step 1: Start dev server and test file browse**

Run: `npm run dev`

1. Go to create person page
2. Click the avatar → source modal opens
3. Click the drop zone → file picker opens
4. Select an image → crop modal opens
5. Crop and confirm → preview shown on avatar

- [ ] **Step 2: Test clipboard paste**

1. Take a screenshot (Cmd+Shift+4 on macOS) or copy an image
2. Click the avatar → source modal opens
3. Press Cmd+V → crop modal opens with the pasted image
4. Crop and confirm → preview shown

- [ ] **Step 3: Test drag and drop**

1. Click the avatar → source modal opens
2. Drag an image file from Finder into the drop zone
3. Crop modal opens → crop and confirm

- [ ] **Step 4: Test error cases**

1. Try pasting non-image content (text) → nothing happens
2. Try dropping a PDF → toast error shown
3. Press Escape → modal closes
4. Click backdrop → modal closes
