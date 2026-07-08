import { useId, useState } from "react";
import { flushSync } from "react-dom";
import { Box, Chip, TextField } from "@mui/material";

type TagAutocompleteProps = {
  label: string;
  placeholder: string;
  value: string;
  availableTags: string[];
  onChange: (value: string) => void;
  onEnter?: (value: string) => void;
};

export function TagAutocomplete({ label, placeholder, value, availableTags, onChange, onEnter }: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const datalistId = useId();
  const tags = parseTags(value);

  function updateTags(nextTags: string[]) {
    onChange([...new Set(nextTags)].join(", "));
  }

  function commitInput(): string {
    const next = inputValue.trim().toLowerCase();
    if (!next) return tags.join(", ");

    const nextTags = [...new Set([...tags, next])];
    updateTags(nextTags);
    setInputValue("");
    return nextTags.join(", ");
  }

  function removeTag(tagToRemove: string) {
    updateTags(tags.filter((tag) => tag !== tagToRemove));
  }

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: tags.length > 0 ? 1 : 0 }}>
        {tags.map((tag) => (
          <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} />
        ))}
      </Box>
      <TextField
        fullWidth
        label={label}
        onBlur={() => commitInput()}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          let nextValue = tags.join(", ");
          flushSync(() => {
            nextValue = commitInput();
          });
          onEnter?.(nextValue);
        }}
        placeholder={placeholder}
        value={inputValue}
        slotProps={{ htmlInput: { list: datalistId } }}
      />
      <datalist id={datalistId}>
        {availableTags.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
    </Box>
  );
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}
