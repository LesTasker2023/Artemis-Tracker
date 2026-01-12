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
    <>
      <style>{modalStyles}</style>
      <div className="session-modal-overlay">
        <div className="session-modal"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Start New Session</h2>
          <button onClick={onCancel} className="close-button">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Session Name */}
          <div className="form-field">
            <label className="field-label">Session Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Eomon Hunt, Skill Training..."
              className="text-input"
              autoFocus
            />
            <p className="field-hint">
              Leave blank for auto-generated name
            </p>
          </div>

          {/* Tags */}
          <div className="form-field">
            <label className="field-label">Tags (optional)</label>
            <div className="tag-input-row">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tag..."
                className="text-input tag-input"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="add-button"
                disabled={!tagInput.trim()}
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="suggested-section">
                <p className="suggested-label">Previously used tags:</p>
                <div className="suggested-tags">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSuggestedTagClick(tag)}
                      className="suggested-tag"
                    >
                      <Tag size={10} />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tag List */}
            {tags.length > 0 && (
              <div className="tag-list">
                {tags.map((tag) => (
                  <div key={tag} className="active-tag">
                    <Tag size={12} />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove-button"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="confirm-button"
            >
              Start Session
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

const modalStyles = `
  .session-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .session-modal {
    background-color: ${colors.bgCard};
    border-radius: ${radius.lg};
    border: 1px solid ${colors.border};
    width: 90%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${spacing.lg};
    border-bottom: 1px solid ${colors.border};
    background: linear-gradient(to bottom, ${colors.bgCard}, rgba(0, 0, 0, 0.1));
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: ${colors.textPrimary};
    margin: 0;
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: ${radius.md};
    background-color: transparent;
    color: ${colors.textSecondary};
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: ${colors.textPrimary};
  }

  .close-button:active {
    transform: scale(0.95);
  }

  .modal-form {
    padding: ${spacing.lg};
  }

  .form-field {
    margin-bottom: ${spacing.lg};
  }

  .field-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: ${colors.textPrimary};
    margin-bottom: ${spacing.xs};
  }

  .text-input {
    width: 100%;
    padding: ${spacing.sm} ${spacing.md};
    background-color: ${colors.bgApp};
    border: 1px solid ${colors.border};
    border-radius: ${radius.md};
    color: ${colors.textPrimary};
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: all 0.2s;
  }

  .text-input:hover {
    border-color: rgba(99, 102, 241, 0.4);
  }

  .text-input:focus {
    border-color: rgba(99, 102, 241, 0.6);
    background-color: rgba(99, 102, 241, 0.03);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .text-input::placeholder {
    color: ${colors.textSecondary};
    opacity: 0.5;
  }

  .field-hint {
    font-size: 12px;
    color: ${colors.textSecondary};
    margin: ${spacing.xs} 0 0 0;
    opacity: 0.8;
  }

  .tag-input-row {
    display: flex;
    gap: ${spacing.sm};
  }

  .tag-input {
    flex: 1;
  }

  .add-button {
    display: flex;
    align-items: center;
    gap: ${spacing.xs};
    padding: ${spacing.sm} ${spacing.md};
    background-color: ${colors.bgApp};
    border: 1px solid ${colors.border};
    border-radius: ${radius.md};
    color: ${colors.textPrimary};
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .add-button:hover:not(:disabled) {
    background-color: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
    color: #a5b4fc;
  }

  .add-button:active:not(:disabled) {
    transform: scale(0.98);
  }

  .add-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .suggested-section {
    margin-top: ${spacing.sm};
    padding: ${spacing.sm};
    background-color: rgba(99, 102, 241, 0.05);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: ${radius.md};
  }

  .suggested-label {
    font-size: 11px;
    font-weight: 600;
    color: ${colors.textSecondary};
    margin: 0 0 ${spacing.xs} 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .suggested-tags {
    display: flex;
    flex-wrap: wrap;
    gap: ${spacing.xs};
  }

  .suggested-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background-color: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: ${radius.sm};
    color: #a5b4fc;
    font-size: 11px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
  }

  .suggested-tag:hover {
    background-color: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
    color: #c4b5fd;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
  }

  .suggested-tag:active {
    transform: translateY(0);
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: ${spacing.xs};
    margin-top: ${spacing.sm};
  }

  .active-tag {
    display: flex;
    align-items: center;
    gap: ${spacing.xs};
    padding: ${spacing.xs} ${spacing.sm};
    background-color: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: ${radius.md};
    color: #a5b4fc;
    font-size: 12px;
    font-weight: 500;
    animation: tagFadeIn 0.2s ease-out;
  }

  @keyframes tagFadeIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .tag-remove-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: none;
    border-radius: ${radius.sm};
    background-color: transparent;
    color: #a5b4fc;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tag-remove-button:hover {
    background-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: ${spacing.sm};
    margin-top: ${spacing.xl};
    padding-top: ${spacing.lg};
    border-top: 1px solid ${colors.border};
  }

  .cancel-button {
    padding: ${spacing.sm} ${spacing.lg};
    background-color: ${colors.bgApp};
    border: 1px solid ${colors.border};
    border-radius: ${radius.md};
    color: ${colors.textPrimary};
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .cancel-button:active {
    transform: scale(0.98);
  }

  .confirm-button {
    padding: ${spacing.sm} ${spacing.xl};
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border: none;
    border-radius: ${radius.md};
    color: white;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  .confirm-button:hover {
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    transform: translateY(-1px);
  }

  .confirm-button:active {
    transform: translateY(0);
  }
`;
