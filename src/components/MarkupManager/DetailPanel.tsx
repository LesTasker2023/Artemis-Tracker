/**
 * MarkupManager - Detail Panel Component
 * Right panel for editing selected item
 */

import React, { useState, useEffect } from "react";
import {
  Save,
  Trash2,
  Star,
  StarOff,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import type { ItemWithMeta, MarkupFormData } from "./types";

interface DetailPanelProps {
  item: ItemWithMeta | null;
  onUpdate: (itemName: string, updates: Partial<ItemWithMeta>) => void;
  onDelete?: (itemName: string) => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function DetailPanel({
  item,
  onUpdate,
  onDelete,
  onSync,
  isSyncing,
}: DetailPanelProps) {
  const [formData, setFormData] = useState<MarkupFormData>({
    ttValue: "0",
    markupPercent: "100",
    markupValue: "0",
    useFixed: false,
    favorite: false,
    ignored: false,
  });

  // Update form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        ttValue: (item.ttValue ?? 0).toString(),
        markupPercent: (item.markupPercent ?? 100).toString(),
        markupValue: (item.markupValue ?? 0).toString(),
        useFixed: item.useFixed ?? false,
        favorite: item.favorite ?? false,
        ignored: item.ignored ?? false,
      });
    }
  }, [item]);

  if (!item) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyContent}>
          <div style={styles.emptyText}>Select an item to edit</div>
          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              style={styles.syncButton}
              title="Sync from database"
            >
              <RefreshCw
                size={14}
                style={isSyncing ? styles.spinner : undefined}
              />
              <span>{isSyncing ? "Syncing..." : "Sync Database"}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSave = () => {
    const updates: Partial<ItemWithMeta> = {
      favorite: formData.favorite,
      ignored: formData.ignored,
    };

    // Update TT Value
    const ttValue = parseFloat(formData.ttValue);
    if (!isNaN(ttValue) && ttValue >= 0) {
      updates.ttValue = ttValue;
    }

    if (formData.useFixed) {
      const value = parseFloat(formData.markupValue);
      if (!isNaN(value) && value >= 0) {
        updates.markupValue = value;
        updates.useFixed = true;
      }
    } else {
      const percent = parseFloat(formData.markupPercent);
      if (!isNaN(percent) && percent >= 0) {
        updates.markupPercent = percent;
        updates.useFixed = false;
      }
    }

    onUpdate(item.itemName, updates);
  };

  const handleDelete = () => {
    if (
      onDelete &&
      confirm(
        `Delete "${item.itemName}" from the library?\n\nThis will remove all markup settings.`
      )
    ) {
      onDelete(item.itemName);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>Item Details</div>
      </div>

      {/* Item Info */}
      <div style={styles.section}>
        <div style={styles.itemName}>{item.itemName}</div>
        {item.category && (
          <div style={styles.itemCategory}>{item.category}</div>
        )}
      </div>

      {/* TT Value */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>TT VALUE</div>
        <div style={styles.radioRow}>
          <input
            type="number"
            value={formData.ttValue}
            onChange={(e) =>
              setFormData({ ...formData, ttValue: e.target.value })
            }
            style={styles.input}
            step="0.01"
            min="0"
            placeholder="0.00"
          />
          <span style={styles.unit}>PED</span>
        </div>
        <div style={styles.helpText}>Trade Terminal value of the item</div>
      </div>

      {/* Markup Settings */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>MARKUP</div>

        <div style={styles.radioGroup}>
          <label style={styles.radioOption}>
            <input
              type="radio"
              checked={!formData.useFixed}
              onChange={() => setFormData({ ...formData, useFixed: false })}
              style={styles.radio}
            />
            <span style={styles.radioLabel}>Percentage</span>
          </label>
          <div style={styles.radioRow}>
            <input
              type="number"
              value={formData.markupPercent}
              onChange={(e) =>
                setFormData({ ...formData, markupPercent: e.target.value })
              }
              disabled={formData.useFixed}
              style={{
                ...styles.input,
                opacity: formData.useFixed ? 0.5 : 1,
              }}
              step="0.1"
              min="0"
              placeholder="100"
            />
            <span style={styles.unit}>%</span>
          </div>
        </div>

        <div style={styles.radioGroup}>
          <label style={styles.radioOption}>
            <input
              type="radio"
              checked={formData.useFixed}
              onChange={() => setFormData({ ...formData, useFixed: true })}
              style={styles.radio}
            />
            <span style={styles.radioLabel}>Fixed Value</span>
          </label>
          <div style={styles.radioRow}>
            <input
              type="number"
              value={formData.markupValue}
              onChange={(e) =>
                setFormData({ ...formData, markupValue: e.target.value })
              }
              disabled={!formData.useFixed}
              style={{
                ...styles.input,
                opacity: !formData.useFixed ? 0.5 : 1,
              }}
              step="0.01"
              min="0"
              placeholder="0.00"
            />
            <span style={styles.unit}>PED</span>
          </div>
        </div>

        <div style={styles.helpText}>
          Percentage: 100% = TT only, 120% = 20% markup
        </div>
      </div>

      {/* Options */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>OPTIONS</div>

        <button
          onClick={() =>
            setFormData({ ...formData, favorite: !formData.favorite })
          }
          style={{
            ...styles.optionButton,
            ...(formData.favorite ? styles.optionButtonActive : {}),
          }}
        >
          {formData.favorite ? (
            <Star size={16} fill="currentColor" />
          ) : (
            <StarOff size={16} />
          )}
          <span>Favorite</span>
        </button>

        <button
          onClick={() =>
            setFormData({ ...formData, ignored: !formData.ignored })
          }
          style={{
            ...styles.optionButton,
            ...(formData.ignored
              ? styles.optionButtonUntracked
              : styles.optionButtonTracked),
          }}
        >
          {formData.ignored ? <EyeOff size={16} /> : <Eye size={16} />}
          <span>
            {formData.ignored ? "Ignored from Loot" : "Tracked in Loot"}
          </span>
        </button>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button onClick={handleSave} style={styles.saveButton}>
          <Save size={16} />
          Save Changes
        </button>
        {onDelete && item.source === "manual" && (
          <button onClick={handleDelete} style={styles.deleteButton}>
            <Trash2 size={16} />
            Delete
          </button>
        )}
      </div>

      {/* Metadata */}
      <div style={styles.metadata}>
        <div style={styles.metadataItem}>
          <span style={styles.metadataLabel}>Source:</span>
          <span style={styles.metadataValue}>{item.source}</span>
        </div>
        <div style={styles.metadataItem}>
          <span style={styles.metadataLabel}>Updated:</span>
          <span style={styles.metadataValue}>
            {new Date(item.lastUpdated).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "360px",
    minWidth: "360px",
    flexShrink: 0,
    backgroundColor: "hsl(220 13% 9%)",
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: "hsl(220 13% 18%)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    height: "100%",
    overflow: "auto",
  },
  empty: {
    width: "360px",
    minWidth: "360px",
    flexShrink: 0,
    backgroundColor: "hsl(220 13% 9%)",
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: "hsl(220 13% 18%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  emptyContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  emptyText: {
    fontSize: "14px",
    color: "hsl(220 13% 45%)",
    textAlign: "center",
  },
  syncButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "hsl(220 13% 15%)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "hsl(220 13% 22%)",
    borderRadius: "6px",
    color: "hsl(0 0% 85%)",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  spinner: {
    animation: "spin 1s linear infinite",
  },
  header: {
    paddingBottom: "12px",
    borderBottom: "1px solid hsl(220 13% 15%)",
  },
  title: {
    fontSize: "14px",
    fontWeight: 600,
    color: "hsl(0 0% 95%)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: 600,
    color: "hsl(220 13% 45%)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  itemName: {
    fontSize: "16px",
    fontWeight: 500,
    color: "hsl(0 0% 95%)",
    lineHeight: "1.3",
  },
  itemCategory: {
    fontSize: "12px",
    color: "hsl(220 13% 55%)",
  },
  itemTT: {
    fontSize: "13px",
    color: "hsl(220 13% 60%)",
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  radioRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  radioOption: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    flexShrink: 0,
  },
  radio: {
    cursor: "pointer",
  },
  radioLabel: {
    fontSize: "13px",
    color: "hsl(0 0% 90%)",
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "8px 10px",
    backgroundColor: "hsl(220 13% 14%)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "hsl(220 13% 25%)",
    borderRadius: "6px",
    color: "hsl(0 0% 95%)",
    fontSize: "14px",
    outline: "none",
  },
  unit: {
    fontSize: "13px",
    color: "hsl(220 13% 60%)",
  },
  helpText: {
    fontSize: "11px",
    color: "hsl(220 13% 50%)",
    fontStyle: "italic",
  },
  optionButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    backgroundColor: "hsl(220 13% 14%)",
    border: "1px solid hsl(220 13% 25%)",
    borderRadius: "6px",
    color: "hsl(220 13% 70%)",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  optionButtonActive: {
    backgroundColor: "hsl(45 93% 20%)",
    borderColor: "hsl(45 93% 50%)",
    color: "hsl(45 93% 60%)",
  },
  optionButtonTracked: {
    backgroundColor: "hsl(142 76% 20%)",
    borderColor: "hsl(142 76% 40%)",
    color: "hsl(142 76% 80%)",
  },
  optionButtonUntracked: {
    backgroundColor: "hsl(0 60% 20%)",
    borderColor: "hsl(0 60% 40%)",
    color: "hsl(0 60% 80%)",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "auto",
  },
  saveButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    backgroundColor: "hsl(142 76% 36%)",
    border: "1px solid hsl(142 76% 46%)",
    borderRadius: "6px",
    color: "white",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    backgroundColor: "hsl(0 84% 40%)",
    border: "1px solid hsl(0 84% 50%)",
    borderRadius: "6px",
    color: "white",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  metadata: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "12px",
    backgroundColor: "hsl(220 13% 8%)",
    borderRadius: "6px",
  },
  metadataItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
  },
  metadataLabel: {
    color: "hsl(220 13% 50%)",
  },
  metadataValue: {
    color: "hsl(220 13% 70%)",
    fontWeight: 500,
  },
};
