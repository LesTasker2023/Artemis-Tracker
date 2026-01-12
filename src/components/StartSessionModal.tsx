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
}

export function StartSessionModal({ onConfirm, onCancel }: StartSessionModalProps) {
  const [name, setName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

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
      <div style={styles.modal}>
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
            <p style={styles.hint}>
              Leave blank for auto-generated name
            </p>
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
                style={styles.tagInput}
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={styles.addButton}
                disabled={!tagInput.trim()}
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {/* Tag List */}
            {tags.length > 0 && (
              <div style={styles.tagList}>
                {tags.map((tag) => (
                  <div key={tag} style={styles.tag}>
                    <Tag size={12} />
                    <span>{tag}</span>
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
            <button
              type="button"
              onClick={onCancel}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.confirmButton}
            >
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
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    width: "90%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    color: colors.textPrimary,
    margin: 0,
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: "none",
    borderRadius: radius.sm,
    backgroundColor: "transparent",
    color: colors.textSecondary,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  form: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    width: "100%",
    padding: spacing.sm,
    backgroundColor: colors.bgApp,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  hint: {
    fontSize: "12px",
    color: colors.textSecondary,
    marginTop: spacing.xs,
    margin: 0,
  },
  tagInputRow: {
    display: "flex",
    gap: spacing.sm,
  },
  tagInput: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.bgApp,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.bgApp,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: radius.md,
    color: "#a5b4fc",
    fontSize: "12px",
    fontWeight: "500",
  },
  tagRemoveButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    border: "none",
    borderRadius: radius.sm,
    backgroundColor: "transparent",
    color: "#a5b4fc",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
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
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  confirmButton: {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.primary,
    border: "none",
    borderRadius: radius.md,
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
