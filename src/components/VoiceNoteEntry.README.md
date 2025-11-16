# VoiceNoteEntry Component

A simple, reusable React component for adding "Voice To Note + Instant Follow Up" functionality to your CRM.

## Features

✅ **Press to Record**: Click mic button to start/stop recording  
✅ **Mock Transcription**: Simulates voice-to-text conversion (stub for real implementation)  
✅ **Bottom Sheet UI**: Beautiful modal with editable transcript  
✅ **Follow-up Toggle**: Option to create a task from the note  
✅ **Due Date Chips**: Quick selection (Tomorrow, 3 days, Next week)  
✅ **First Line → Task Title**: Automatically extracts first sentence  
✅ **Dark Mode**: Automatic dark mode support  
✅ **TypeScript**: Fully typed with interfaces  

---

## Installation

No external dependencies required! Just copy the files:

```bash
src/components/
  ├── VoiceNoteEntry.tsx           # Main component
  └── VoiceNoteEntry.example.tsx   # Usage examples
```

---

## Basic Usage

```tsx
import { VoiceNoteEntry } from './components/VoiceNoteEntry';

function ContactDetailScreen() {
  const contactId = 'contact-123';

  const handleNoteSaved = (noteText: string) => {
    // Save note to your database
    await api.notes.create({
      content: noteText,
      contactId: contactId,
      createdFrom: 'voice',
    });
  };

  const handleFollowUpCreated = (followUp) => {
    // Create task from the note
    await api.tasks.create({
      title: followUp.title,
      dueDate: calculateDueDate(followUp.dueDate),
      contactId: contactId,
      status: 'pending',
    });
  };

  return (
    <div>
      <h1>Contact: John Smith</h1>
      
      <VoiceNoteEntry
        entityType="contact"
        entityId={contactId}
        onNoteSaved={handleNoteSaved}
        onFollowUpCreated={handleFollowUpCreated}
      />
    </div>
  );
}
```

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `entityType` | `'contact' \| 'deal'` | ✅ | Type of entity the note belongs to |
| `entityId` | `string` | ✅ | ID of the contact or deal |
| `onNoteSaved` | `(noteText: string) => void` | ✅ | Callback when note is saved |
| `onFollowUpCreated` | `(followUp: FollowUp) => void` | ❌ | Callback when follow-up task is created |

### FollowUp Object

```typescript
{
  title: string;        // First line/sentence from note
  dueDate: DueDatePreset; // 'tomorrow' | '3days' | 'nextweek'
}
```

---

## Component Behavior

### Recording Flow

1. **User clicks mic button** → Recording starts
2. **User clicks again** → Recording stops
3. **1.5s delay** → Mock transcription completes
4. **Bottom sheet opens** → Shows transcribed text

### Save Flow

**Without Follow-up:**
- Edit text
- Click "Save Note"
- Calls `onNoteSaved(noteText)`

**With Follow-up:**
- Edit text
- Toggle "Create follow-up task"
- Select due date chip
- Click "Save & Create Task"
- Calls `onNoteSaved(noteText)`
- Calls `onFollowUpCreated({ title, dueDate })`

### Validation

- **Empty note**: Save button disabled
- **Follow-up without date**: Save button disabled + alert
- **Cancel with content**: Confirmation dialog shown

---

## Stub Functions

The component uses placeholder functions for recording and transcription. Replace these in production:

### Recording (Lines 46-56)

```typescript
const startRecording = () => {
  // TODO: Replace with actual recording
  // Example using Web Speech API:
  // const recognition = new webkitSpeechRecognition();
  // recognition.start();
};
```

### Transcription (Lines 68-80)

```typescript
const simulateTranscription = async (): Promise<string> => {
  // TODO: Replace with actual API call
  // Example:
  // const response = await fetch('/api/transcribe', {
  //   method: 'POST',
  //   body: audioBlob,
  // });
  // return response.json().text;
};
```

---

## Customization

### Styling

The component uses scoped CSS-in-JS. To customize:

1. **Change colors**: Update hex codes in `<style jsx>` block
2. **Change button position**: Modify `.mic-button` CSS
3. **Change sheet width**: Adjust `.bottom-sheet max-width`

### Date Chips

Modify the `dateChips` array to add custom options:

```typescript
const dateChips: DateChipOption[] = [
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'In 3 days', value: '3days' },
  { label: 'Next week', value: 'nextweek' },
  { label: 'Custom date', value: 'custom' }, // Add custom
];
```

### Task Title Extraction

Customize how the task title is extracted:

```typescript
const getTaskTitleFromNote = (text: string): string => {
  // Current: Uses first sentence
  // Custom: Use first N characters, regex, etc.
  return text.substring(0, 50) + '...';
};
```

---

## Real Implementation

To make this production-ready, integrate:

### 1. Web Speech API (Browser)

```typescript
const startRecording = () => {
  const recognition = new (window as any).webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    setNoteText(transcript);
  };
  
  recognition.start();
};
```

### 2. Cloud Transcription (Google/AWS/Azure)

```typescript
const stopRecording = async () => {
  // Upload audio blob
  const formData = new FormData();
  formData.append('audio', audioBlob);
  
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });
  
  const { text } = await response.json();
  setNoteText(text);
  setShowBottomSheet(true);
};
```

### 3. Database Integration

```typescript
const handleNoteSaved = async (noteText: string) => {
  const note = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: noteText,
      contactId: contactId,
      createdFrom: 'voice',
      audioUrl: audioUrl, // If you store audio file
    }),
  });
  
  // Refresh notes list, show toast, etc.
};
```

---

## Testing

Test the component with the example file:

```tsx
import { VoiceNoteEntryExample } from './components/VoiceNoteEntry.example';

// In your App.tsx or test page
<VoiceNoteEntryExample />
```

This shows three usage scenarios:
1. Contact detail screen
2. Deal detail screen  
3. Note-only mode (no follow-up)

---

## Browser Support

- ✅ **Chrome** (recommended)
- ✅ **Edge**
- ✅ **Safari**
- ✅ **Firefox**
- ✅ **Mobile browsers**

For Web Speech API:
- ✅ Chrome/Edge (full support)
- ✅ Safari (partial support)
- ❌ Firefox (not supported)

---

## Accessibility

- ✅ Keyboard navigation
- ✅ ARIA labels (add as needed)
- ✅ Focus management
- ✅ Color contrast (WCAG AA)
- ✅ Touch-friendly (44px buttons)

---

## FAQ

**Q: How do I change the mic button to press-and-hold?**

A: Replace `onClick` with `onMouseDown`/`onMouseUp`:

```tsx
<button
  onMouseDown={startRecording}
  onMouseUp={stopRecording}
  onMouseLeave={isRecording ? stopRecording : undefined}
>
```

**Q: Can I use this with Tasks instead of Contacts/Deals?**

A: Yes! Just pass `entityType="task"` or add a new type:

```typescript
type EntityType = 'contact' | 'deal' | 'task';
```

**Q: How do I store the audio file?**

A: After recording, upload the blob to cloud storage:

```typescript
const audioBlob = await getRecordedAudio();
const audioUrl = await uploadToS3(audioBlob);
```

**Q: Can I customize the transcription mock text?**

A: Yes, modify the `mockTexts` array in `simulateTranscription()`.

---

## Roadmap

Future enhancements:

- [ ] Real Web Speech API integration
- [ ] Audio playback in bottom sheet
- [ ] Re-record button if transcription is wrong
- [ ] Confidence score display
- [ ] Multiple language support
- [ ] Custom date picker (beyond chips)
- [ ] Rich text editor for notes
- [ ] Attach to multiple entities

---

## License

MIT - Use freely in your projects!

---

## Support

For issues or questions, check:
- Example file: `VoiceNoteEntry.example.tsx`
- Component code: `VoiceNoteEntry.tsx`
- This README

Happy coding! 🎤✨
