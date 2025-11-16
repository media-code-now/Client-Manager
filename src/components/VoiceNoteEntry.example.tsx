import React from 'react';
import { VoiceNoteEntry } from './VoiceNoteEntry';

/**
 * Example usage of the VoiceNoteEntry component
 */
export const VoiceNoteEntryExample: React.FC = () => {
  // Example: Contact detail screen
  const contactId = 'contact-123';
  
  // Example: Deal detail screen
  const dealId = 'deal-456';

  // Handler: Note saved
  const handleNoteSaved = (noteText: string) => {
    console.log('✅ Note saved:', noteText);
    
    // TODO: Call your API to save the note
    // await api.notes.create({
    //   content: noteText,
    //   contactId: contactId,
    //   createdFrom: 'voice',
    // });
    
    alert('Note saved successfully!');
  };

  // Handler: Follow-up task created
  const handleFollowUpCreated = (followUp: {
    title: string;
    dueDate: string;
  }) => {
    console.log('✅ Follow-up task created:', followUp);
    
    // Calculate actual due date from preset
    const dueDateMap = {
      tomorrow: new Date(Date.now() + 24 * 60 * 60 * 1000),
      '3days': new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      nextweek: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    
    const actualDueDate = dueDateMap[followUp.dueDate as keyof typeof dueDateMap];
    
    // TODO: Call your API to create the task
    // await api.tasks.create({
    //   title: followUp.title,
    //   dueDate: actualDueDate.toISOString(),
    //   contactId: contactId,
    //   status: 'pending',
    //   priority: 'medium',
    // });
    
    alert(`Task created: "${followUp.title}" due ${followUp.dueDate}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>VoiceNoteEntry Component Examples</h1>

      {/* Example 1: Contact screen */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Example 1: Contact Detail Screen</h2>
        <p>Click the floating mic button to record a voice note for this contact.</p>
        
        <div style={{ 
          padding: '20px', 
          border: '2px dashed #ddd', 
          borderRadius: '8px',
          position: 'relative',
          minHeight: '200px'
        }}>
          <h3>Contact: John Smith</h3>
          <p>Email: john.smith@example.com</p>
          <p>Phone: (555) 123-4567</p>
          
          <VoiceNoteEntry
            entityType="contact"
            entityId={contactId}
            onNoteSaved={handleNoteSaved}
            onFollowUpCreated={handleFollowUpCreated}
          />
        </div>
      </section>

      {/* Example 2: Deal screen */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Example 2: Deal Detail Screen</h2>
        <p>Click the floating mic button to record a voice note for this deal.</p>
        
        <div style={{ 
          padding: '20px', 
          border: '2px dashed #ddd', 
          borderRadius: '8px',
          position: 'relative',
          minHeight: '200px'
        }}>
          <h3>Deal: Q4 Enterprise Contract</h3>
          <p>Value: $50,000</p>
          <p>Stage: Proposal</p>
          
          <VoiceNoteEntry
            entityType="deal"
            entityId={dealId}
            onNoteSaved={handleNoteSaved}
            onFollowUpCreated={handleFollowUpCreated}
          />
        </div>
      </section>

      {/* Example 3: Without follow-up callback */}
      <section>
        <h2>Example 3: Note Only (No Follow-up)</h2>
        <p>If you don't provide onFollowUpCreated, users can still create notes but the follow-up toggle won't trigger anything.</p>
        
        <div style={{ 
          padding: '20px', 
          border: '2px dashed #ddd', 
          borderRadius: '8px',
          position: 'relative',
          minHeight: '200px'
        }}>
          <h3>Contact: Jane Doe</h3>
          
          <VoiceNoteEntry
            entityType="contact"
            entityId="contact-789"
            onNoteSaved={(text) => console.log('Note only:', text)}
            // No onFollowUpCreated provided
          />
        </div>
      </section>

      {/* Instructions */}
      <section style={{ marginTop: '40px', padding: '20px', background: '#f0f9ff', borderRadius: '8px' }}>
        <h2>📝 Usage Instructions</h2>
        <ol>
          <li>Click the blue microphone button (bottom-right corner)</li>
          <li>Click again to stop recording</li>
          <li>After ~1.5 seconds, a bottom sheet will appear with mock transcribed text</li>
          <li>Edit the text if needed</li>
          <li>Toggle "Create follow-up task" if you want a task created</li>
          <li>Select a due date chip (Tomorrow, In 3 days, Next week)</li>
          <li>Click "Save" or "Save & Create Task"</li>
        </ol>

        <h3>🔧 Implementation Notes</h3>
        <ul>
          <li><strong>Recording:</strong> Currently uses stub functions. Replace with actual Web Speech API or recording library.</li>
          <li><strong>Transcription:</strong> Mock transcription returns random sample text after 1.5s delay.</li>
          <li><strong>Callbacks:</strong> Integrate with your API in the onNoteSaved and onFollowUpCreated handlers.</li>
          <li><strong>Styling:</strong> Uses scoped CSS-in-JS. Can be replaced with Tailwind or CSS modules.</li>
        </ul>

        <h3>🎨 Customization</h3>
        <p>The component includes built-in dark mode support and responsive design. The mic button is fixed to bottom-right by default.</p>
      </section>
    </div>
  );
};

export default VoiceNoteEntryExample;
