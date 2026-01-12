/**
 * Start Session Modal
 * Allows user to set title and tags before starting a session
 */

import React, { useState } from "react";
import { X, Tag, Plus } from "lucide-react";
import { colors, spacing, radius } from "./ui/tokens";

interface StartSessionModalProps {
  onConfirm: (name: string, tags: string[]) => void;
  onCancel: () => void;
  availableTags?: string[];
}

export function StartSessionModal({ onConfirm, onCancel, availableTags = [] }: StartSessionModalProps) {
  const [name, setName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Get suggested tags (available tags not already added)
  const suggestedTags = availableTags.filter(tag => !tags.includes(tag));

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSuggestedTagClick = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name || undefined, tags);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Start New Session</h2>
          <button onClick={onCancel} style={styles.closeButton}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Session Name */}
          <div style={styles.field}>
            <label style={styles.label}>Session Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Eomon Hunt, Skill Training..."
              style={styles.input}
              autoFocus
            />
            <p style={styles.hint}>Leave blank for auto-generated name</p>
          </div>

          {/* Tags */}
          <div style={styles.field}>
            <label style={styles.label}>Tags (optional)</label>
            <div style={styles.tagInputRow}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tag..."
                style={{...styles.input, flex: 1}}
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{
                  ...styles.addButton,
                  opacity: tagInput.trim() ? 1 : 0.5,
                  cursor: tagInput.trim() ? 'pointer' : 'not-allowed'
                }}
                disabled={!tagInput.trim()}
              >
                <Plus size={16} />
                <span style={{marginLeft: spacing.xs}}>Add</span>
              </button>
            </div>

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div style={styles.suggestedSection}>
                <p style={styles.suggestedLabel}>Previously used tags:</p>
                <div style={styles.suggestedTags}>
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSuggestedTagClick(tag)}
                      style={styles.suggestedTag}
                    >
                      <Tag size={10} />
                      <span style={{marginLeft: '4px'}}>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Tags */}
            {tags.length > 0 && (
              <div style={styles.tagList}>
                {tags.map((tag) => (
                  <div key={tag} style={styles.activeTag}>
                    <Tag size={12} />
                    <span style={{marginLeft: spacing.xs}}>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={styles.tagRemoveButton}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button type="button" onClick={onCancel} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.confirmButton}>
              Start Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    width: '90%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: colors.textPrimary,
    margin: 0,
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: radius.md,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
  },
  form: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.bgApp,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: '12px',
    color: colors.textSecondary,
    margin: `${spacing.xs} 0 0 0`,
    opacity: 0.8,
  },
  tagInputRow: {
    display: 'flex',
    gap: spacing.sm,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.bgApp,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  suggestedSection: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: radius.md,
  },
  suggestedLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: colors.textSecondary,
    margin: `0 0 ${spacing.xs} 0`,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  suggestedTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  suggestedTag: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 10px',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    borderRadius: radius.sm,
    color: '#a5b4fc',
    fontSize: '11px',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  activeTag: {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: radius.md,
    color: '#a5b4fc',
    fontSize: '12px',
    fontWeight: 500,
  },
  tagRemoveButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
    marginLeft: spacing.xs,
    border: 'none',
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
    color: '#a5b4fc',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTop: `1px solid ${colors.border}`,
  },
  cancelButton: {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.bgApp,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: `${spacing.sm} ${spacing.xl}`,
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: radius.md,
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
  },
};
