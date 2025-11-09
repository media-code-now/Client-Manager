'use client';

import React, { useState, useRef, useEffect } from 'react';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'compose' | 'reply' | 'forward';
  replyToEmail?: {
    id: number;
    from_email: string;
    from_name?: string;
    to_emails: string;
    cc_emails?: string;
    subject: string;
    body_html?: string;
    body_text?: string;
    message_id: string;
    thread_id?: string;
  };
  prefilledTo?: string;
  prefilledSubject?: string;
  contactId?: number;
}

interface Attachment {
  file: File;
  name: string;
  size: number;
  type: string;
}

export default function EmailComposer({
  isOpen,
  onClose,
  mode = 'compose',
  replyToEmail,
  prefilledTo = '',
  prefilledSubject = '',
  contactId
}: EmailComposerProps) {
  const [to, setTo] = useState(prefilledTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(prefilledSubject);
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchEmailIntegrations();
      
      // Set up initial values based on mode
      if (mode === 'reply' && replyToEmail) {
        setTo(replyToEmail.from_email);
        setSubject(replyToEmail.subject.startsWith('Re: ') 
          ? replyToEmail.subject 
          : `Re: ${replyToEmail.subject}`
        );
        
        // Add quoted reply text
        const originalBody = replyToEmail.body_html || replyToEmail.body_text || '';
        const quotedText = `<br><br><div style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 10px; color: #666;">
          <p><strong>On ${new Date().toLocaleString()}, ${replyToEmail.from_name || replyToEmail.from_email} wrote:</strong></p>
          ${originalBody}
        </div>`;
        setBody(quotedText);
        
      } else if (mode === 'forward' && replyToEmail) {
        setSubject(replyToEmail.subject.startsWith('Fwd: ') 
          ? replyToEmail.subject 
          : `Fwd: ${replyToEmail.subject}`
        );
        
        // Add forwarded message
        const originalBody = replyToEmail.body_html || replyToEmail.body_text || '';
        const forwardedText = `<br><br><div style="border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
          <p><strong>---------- Forwarded message ----------</strong></p>
          <p><strong>From:</strong> ${replyToEmail.from_name || replyToEmail.from_email}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Subject:</strong> ${replyToEmail.subject}</p>
          <p><strong>To:</strong> ${replyToEmail.to_emails}</p>
          <br>
          ${originalBody}
        </div>`;
        setBody(forwardedText);
      }
    } else {
      // Reset form when closed
      setTo(prefilledTo);
      setCc('');
      setBcc('');
      setSubject(prefilledSubject);
      setBody('');
      setAttachments([]);
      setShowCc(false);
      setShowBcc(false);
      setError('');
    }
  }, [isOpen, mode, replyToEmail, prefilledTo, prefilledSubject]);

  const fetchEmailIntegrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/integrations/email', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const activeIntegrations = data.integrations.filter((i: any) => i.status === 'active');
        setIntegrations(activeIntegrations);
        if (activeIntegrations.length > 0) {
          setSelectedIntegration(activeIntegrations[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSend = async () => {
    setError('');
    
    // Validation
    if (!to.trim()) {
      setError('Please enter at least one recipient');
      return;
    }
    
    if (!selectedIntegration) {
      setError('Please connect an email account first');
      return;
    }
    
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    setIsSending(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('integrationId', selectedIntegration);
      formData.append('to', to);
      if (cc) formData.append('cc', cc);
      if (bcc) formData.append('bcc', bcc);
      formData.append('subject', subject);
      formData.append('body', body || '');
      formData.append('html', body || '');
      
      // Add metadata for tracking
      if (contactId) {
        formData.append('contactId', contactId.toString());
      }
      if (mode === 'reply' && replyToEmail) {
        formData.append('inReplyTo', replyToEmail.message_id);
        if (replyToEmail.thread_id) {
          formData.append('threadId', replyToEmail.thread_id);
        }
      }
      
      // Add attachments
      attachments.forEach((attachment) => {
        formData.append('attachments', attachment.file);
      });

      const response = await fetch('/api/integrations/email/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Success - close composer
        onClose();
        // You might want to trigger a refresh of the email list here
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Toolbar functions for rich text
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    bodyRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === 'reply' ? 'Reply to Email' : mode === 'forward' ? 'Forward Email' : 'Compose Email'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Integration Selection */}
        {integrations.length > 0 && (
          <div className="px-4 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send from:
            </label>
            <select
              value={selectedIntegration}
              onChange={(e) => setSelectedIntegration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {integrations.map((integration) => (
                <option key={integration.id} value={integration.id}>
                  {integration.name} ({integration.config?.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {integrations.length === 0 && (
          <div className="px-4 pt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                Please connect an email account in Integrations before sending emails.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* To Field */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 w-16">To:</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!showCc && (
              <button
                onClick={() => setShowCc(true)}
                className="text-sm text-blue-600 hover:text-blue-700 px-2"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                onClick={() => setShowBcc(true)}
                className="text-sm text-blue-600 hover:text-blue-700 px-2"
              >
                Bcc
              </button>
            )}
          </div>

          {/* Cc Field */}
          {showCc && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 w-16">Cc:</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setShowCc(false);
                  setCc('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Bcc Field */}
          {showBcc && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 w-16">Bcc:</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setShowBcc(false);
                  setBcc('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Subject Field */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 w-16">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Rich Text Toolbar */}
          <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => execCommand('bold')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => execCommand('italic')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => execCommand('underline')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Underline"
            >
              <u>U</u>
            </button>
            <div className="w-px bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => execCommand('insertUnorderedList')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Bullet List"
            >
              ⦿
            </button>
            <button
              type="button"
              onClick={() => execCommand('insertOrderedList')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Numbered List"
            >
              1.
            </button>
            <div className="w-px bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) execCommand('createLink', url);
              }}
              className="p-2 hover:bg-gray-200 rounded"
              title="Insert Link"
            >
              🔗
            </button>
          </div>

          {/* Rich Text Body */}
          <div
            ref={bodyRef}
            contentEditable
            onInput={(e) => setBody(e.currentTarget.innerHTML)}
            className="min-h-[300px] p-3 border border-t-0 border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ whiteSpace: 'pre-wrap' }}
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: body }}
          />

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Attachments:</label>
              <div className="space-y-1">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-gray-700">{attachment.name}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>Attach Files</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || integrations.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
