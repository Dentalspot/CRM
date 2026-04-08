import React, { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function MultiSelectCombobox({
  options,
  selected = [],
  onChange,
  className,
  placeholder = "Selecciona opciones...",
  searchPlaceholder = "Buscar...",
  notFoundText = "Sin resultados.",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Ensure selected is always an array
  const safeSelected = Array.isArray(selected) ? selected : [];

  const handleToggle = (value) => {
    if (safeSelected.includes(value)) {
      onChange(safeSelected.filter((s) => s !== value));
    } else {
      onChange([...safeSelected, value]);
    }
  };

  const handleUnselect = (item, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(safeSelected.filter((s) => s !== item));
  };

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          type="button"
          className={cn(
            "w-full justify-between min-h-[40px] h-auto",
            className
          )}
        >
          <div className="flex gap-1 flex-wrap flex-1">
            {safeSelected.length > 0 ? (
              safeSelected.map((item) => {
                const option = options.find((opt) => opt.value === item);
                return (
                  <Badge
                    variant="secondary"
                    key={item}
                    className="mr-1 mb-0.5 mt-0.5 cursor-pointer hover:bg-destructive/20"
                  >
                    {option ? option.label : item}
                    <span
                      className="ml-1 rounded-full hover:text-destructive"
                      role="button"
                      tabIndex={0}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => handleUnselect(item, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUnselect(item, e);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                );
              })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex flex-col">
          {/* Search input */}
          <div className="flex items-center border-b px-3">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {notFoundText}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = safeSelected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggle(option.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggle(option.value);
                      }
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}