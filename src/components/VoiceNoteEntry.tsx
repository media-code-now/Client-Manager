import React, { useState, useRef } from 'react';

// Types
type EntityType = 'contact' | 'deal';
type DueDatePreset = 'tomorrow' | '3days' | 'nextweek';

interface VoiceNoteEntryProps {
  entityType: EntityType;
  entityId: string;
  onNoteSaved: (noteText: string) => void;
  onFollowUpCreated?: (followUp: {
    title: string;
    dueDate: DueDatePreset;
  }) => void;
}

interface DateChipOption {
  label: string;
  value: DueDatePreset;
}

// Component
export const VoiceNoteEntry: React.FC<VoiceNoteEntryProps> = ({
  entityType,
  entityId,
  onNoteSaved,
  onFollowUpCreated,
}) => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<DueDatePreset | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Date chip options
  const dateChips: DateChipOption[] = [
    { label: 'Tomorrow', value: 'tomorrow' },
    { label: 'In 3 days', value: '3days' },
    { label: 'Next week', value: 'nextweek' },
  ];

  // Stub: Start recording
  const startRecording = () => {
    console.log(`[VoiceNoteEntry] Starting recording for ${entityType} ${entityId}`);
    setIsRecording(true);
    setRecordingDuration(0);

    // Simulate recording duration counter
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  // Stub: Stop recording and transcribe
  const stopRecording = async () => {
    console.log(`[VoiceNoteEntry] Stopping recording after ${recordingDuration}s`);
    setIsRecording(false);

    // Clear interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Stub: Simulate transcription
    const mockTranscription = await simulateTranscription();
    setNoteText(mockTranscription);
    setShowBottomSheet(true);
  };

  // Stub: Simulate transcription API call
  const simulateTranscription = async (): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockTexts = [
          'Call John back about the proposal. He mentioned concerns about pricing and timeline.',
          'Follow up on the demo request. Send calendar invite for next Tuesday.',
          'Discuss contract terms with legal team. Need to finalize by end of week.',
          'Review quarterly numbers with Sarah. She has questions about the forecast.',
        ];
        const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
        resolve(randomText);
      }, 1500); // Simulate 1.5s transcription delay
    });
  };

  // Extract first line/sentence as task title
  const getTaskTitleFromNote = (text: string): string => {
    const lines = text.split('\n').filter((line) => line.trim());
    const firstLine = lines[0] || text;

    // Extract first sentence (up to . ! ?)
    const sentenceMatch = firstLine.match(/^[^.!?]+[.!?]?/);
    const firstSentence = sentenceMatch ? sentenceMatch[0].trim() : firstLine.trim();

    // Truncate if too long
    return firstSentence.length > 80
      ? firstSentence.substring(0, 77) + '...'
      : firstSentence;
  };

  // Handle save
  const handleSave = () => {
    if (!noteText.trim()) {
      alert('Note cannot be empty');
      return;
    }

    if (createFollowUp && !selectedDueDate) {
      alert('Please select a due date for the follow-up task');
      return;
    }

    // Save note
    onNoteSaved(noteText);

    // Create follow-up task if requested
    if (createFollowUp && selectedDueDate && onFollowUpCreated) {
      const taskTitle = getTaskTitleFromNote(noteText);
      onFollowUpCreated({
        title: taskTitle,
        dueDate: selectedDueDate,
      });
    }

    // Reset and close
    handleClose();
  };

  // Handle cancel
  const handleCancel = () => {
    if (noteText.trim() && !confirm('Discard this note?')) {
      return;
    }
    handleClose();
  };

  // Close and reset
  const handleClose = () => {
    setShowBottomSheet(false);
    setNoteText('');
    setCreateFollowUp(false);
    setSelectedDueDate(null);
    setRecordingDuration(0);
  };

  // Format recording duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-note-entry">
      {/* Mic Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`mic-button ${isRecording ? 'recording' : ''}`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <svg
          className="mic-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
        {isRecording && (
          <span className="recording-indicator">
            Recording... {formatDuration(recordingDuration)}
          </span>
        )}
      </button>

      {/* Bottom Sheet */}
      {showBottomSheet && (
        <div className="bottom-sheet-overlay" onClick={handleCancel}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Handle bar */}
            <div className="sheet-handle">
              <div className="handle-bar" />
            </div>

            {/* Header */}
            <div className="sheet-header">
              <h3 className="sheet-title">📝 Voice Note</h3>
              <button className="close-button" onClick={handleCancel}>
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="sheet-content">
              {/* Editable text area */}
              <div className="form-group">
                <label className="form-label">Note</label>
                <textarea
                  className="note-textarea"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Edit your voice note here..."
                  rows={6}
                  autoFocus
                />
                <div className="char-count">
                  {noteText.length} / 2000 characters
                </div>
              </div>

              {/* Follow-up toggle */}
              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    className="toggle-checkbox"
                    checked={createFollowUp}
                    onChange={(e) => {
                      setCreateFollowUp(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedDueDate(null);
                      }
                    }}
                  />
                  <span className="toggle-text">
                    Create follow-up task from this note
                  </span>
                </label>
              </div>

              {/* Due date chips */}
              {createFollowUp && (
                <div className="form-group date-chips-group">
                  <label className="form-label">When is this due?</label>
                  <div className="date-chips">
                    {dateChips.map((chip) => (
                      <button
                        key={chip.value}
                        type="button"
                        className={`date-chip ${
                          selectedDueDate === chip.value ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedDueDate(chip.value)}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="sheet-actions">
                <button className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!noteText.trim() || (createFollowUp && !selectedDueDate)}
                >
                  {createFollowUp ? 'Save & Create Task' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .voice-note-entry {
          position: relative;
        }

        /* Mic Button */
        .mic-button {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transition: all 0.2s ease;
          z-index: 1000;
        }

        .mic-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .mic-button.recording {
          background: #ef4444;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }

        .mic-icon {
          width: 28px;
          height: 28px;
        }

        .recording-indicator {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: #1f2937;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* Bottom Sheet */
        .bottom-sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .bottom-sheet {
          width: 100%;
          max-width: 600px;
          background: white;
          border-radius: 24px 24px 0 0;
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
          animation: slideUp 0.3s ease;
          max-height: 90vh;
          overflow-y: auto;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .sheet-handle {
          display: flex;
          justify-content: center;
          padding: 12px 0 8px;
        }

        .handle-bar {
          width: 48px;
          height: 4px;
          background: #d1d5db;
          border-radius: 2px;
        }

        .sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .sheet-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
        }

        .close-button:hover {
          color: #111827;
        }

        .sheet-content {
          padding: 24px;
        }

        /* Form elements */
        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .note-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          color: #111827;
          resize: vertical;
          font-family: inherit;
        }

        .note-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .char-count {
          font-size: 12px;
          color: #6b7280;
          text-align: right;
          margin-top: 4px;
        }

        /* Toggle */
        .toggle-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .toggle-checkbox {
          width: 20px;
          height: 20px;
          margin: 0;
          margin-right: 12px;
          cursor: pointer;
        }

        .toggle-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        /* Date chips */
        .date-chips-group {
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .date-chips {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .date-chip {
          flex: 1;
          min-width: 100px;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .date-chip:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .date-chip.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #2563eb;
        }

        /* Action buttons */
        .sheet-actions {
          display: flex;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          opacity: 0.6;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .bottom-sheet {
            background: #1f2937;
          }

          .sheet-title {
            color: #f9fafb;
          }

          .close-button {
            color: #9ca3af;
          }

          .close-button:hover {
            color: #f9fafb;
          }

          .form-label {
            color: #d1d5db;
          }

          .note-textarea {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .toggle-text {
            color: #d1d5db;
          }

          .date-chip {
            background: #374151;
            border-color: #4b5563;
            color: #9ca3af;
          }

          .date-chip:hover {
            background: #4b5563;
          }

          .date-chip.selected {
            border-color: #3b82f6;
            background: #1e3a8a;
            color: #93c5fd;
          }

          .btn-secondary {
            background: #374151;
            color: #d1d5db;
          }

          .btn-secondary:hover {
            background: #4b5563;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceNoteEntry;
