import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Spinner } from "./ui/spinner";

function AddConnectionModal({
  fromVerseKey,
  onClose,
  onSubmit,
  isLoading,
  error,
}) {
  const [toVerseKey, setToVerseKey] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    const newErrors = {};

    // Validate toVerseKey format (s:v)
    if (!toVerseKey.trim()) {
      newErrors.toVerseKey = "Verse key is required";
    } else if (!/^\d+:\d+$/.test(toVerseKey)) {
      newErrors.toVerseKey = "Invalid format. Use s:v (e.g., 1:5)";
    }

    // Validate note length
    if (note.length > 200) {
      newErrors.note = "Note cannot exceed 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateInputs()) {
      return;
    }

    onSubmit({
      fromVerse: fromVerseKey,
      toVerse: toVerseKey,
      note: note || "",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-foreground-bg border border-foreground-border/20 rounded-lg p-6 w-96 shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Add Connection
          </h3>
          <button
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* From Verse (read-only) */}
          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-1">
              From Verse
            </label>
            <input
              type="text"
              value={fromVerseKey}
              disabled
              className="w-full px-3 py-2 bg-foreground-bg/50 border border-foreground-border/20 rounded text-foreground-muted cursor-not-allowed"
            />
          </div>

          {/* To Verse Key */}
          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-1">
              To Verse <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={toVerseKey}
              onChange={(e) => {
                setToVerseKey(e.target.value);
                if (errors.toVerseKey) {
                  setErrors({ ...errors, toVerseKey: "" });
                }
              }}
              placeholder="e.g., 2:45"
              className={`w-full px-3 py-2 bg-foreground-bg border rounded focus:outline-none focus:ring-2 transition-colors ${
                errors.toVerseKey
                  ? "border-destructive focus:ring-destructive/20"
                  : "border-foreground-border/20 focus:ring-primary/20"
              } text-foreground placeholder:text-foreground-muted/50`}
            />
            {errors.toVerseKey && (
              <p className="text-xs text-destructive mt-1">
                {errors.toVerseKey}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-foreground-muted">
                Note
              </label>
              <span className="text-xs text-foreground-muted">
                {note.length}/200
              </span>
            </div>
            <textarea
              value={note}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setNote(e.target.value);
                  if (errors.note) {
                    setErrors({ ...errors, note: "" });
                  }
                }
              }}
              placeholder="Add a note about this connection..."
              maxLength="200"
              rows="4"
              className={`w-full px-3 py-2 bg-foreground-bg border rounded focus:outline-none focus:ring-2 transition-colors resize-none ${
                errors.note
                  ? "border-destructive focus:ring-destructive/20"
                  : "border-foreground-border/20 focus:ring-primary/20"
              } text-foreground placeholder:text-foreground-muted/50`}
            />
            {errors.note && (
              <p className="text-xs text-destructive mt-1">{errors.note}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-foreground-bg border hover:border-foreground-border/20 rounded-full cursor-pointer text-foreground border-foreground-border/60 transition-colors duration-300 ease-in-out text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary/40 border border-primary/10 rounded-full flex items-center gap-4 cursor-pointer text-foreground hover:text-foreground/80 hover:bg-primary/20 transition-colors duration-300 ease-in-out w-fit text-sm  disabled:opacity-80 disabled:cursor-not-allowed "
            >
              {isLoading ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Creating...
                </>
              ) : (
                "Make Connection"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddConnectionModal;
