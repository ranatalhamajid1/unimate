"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import {
  Search,
  Check,
  Building2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Loader2,
  X,
  Globe,
} from "lucide-react";

export interface UniversityOption {
  id: string;
  name: string;
  shortName?: string | null;
  country: string;
  countryCode?: string | null;
  city?: string | null;
  isVerified: boolean;
  campuses?: { id: string; name: string; city?: string | null; isMain: boolean }[];
  departments?: { id: string; name: string; faculty?: string | null }[];
}

interface UniversityComboboxProps {
  value?: string | null;
  onChange: (university: UniversityOption | null) => void;
  selectedUniversityName?: string | null;
  placeholder?: string;
  countryFilter?: string;
  className?: string;
}

export function UniversityCombobox({
  value,
  onChange,
  selectedUniversityName,
  placeholder = "Search for your university or college...",
  countryFilter,
  className = "",
}: UniversityComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UniversityOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUniv, setSelectedUniv] = useState<UniversityOption | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Custom University Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCountry, setCustomCountry] = useState(countryFilter || "");
  const [customCity, setCustomCity] = useState("");
  const [customWebsite, setCustomWebsite] = useState("");
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Fetch initial selected university details if value provided
  useEffect(() => {
    if (value && !selectedUniv) {
      fetch(`/api/universities?limit=1`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.universities) {
            const found = data.universities.find((u: UniversityOption) => u.id === value);
            if (found) setSelectedUniv(found);
          }
        })
        .catch(() => {});
    }
  }, [value, selectedUniv]);

  // Debounced search query
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (countryFilter && countryFilter.trim()) {
        const trimmed = countryFilter.trim();
        if (trimmed.length === 2) {
          params.set("countryCode", trimmed.toUpperCase());
        } else {
          params.set("country", trimmed);
        }
      }
      params.set("limit", "25");

      fetch(`/api/universities?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setResults(data.universities || []);
            setActiveIndex(-1);
          }
        })
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen, countryFilter]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          selectUniversity(results[activeIndex]);
        } else if (results.length === 0 && query.trim().length >= 3) {
          openCustomUniversityModal(query);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const selectUniversity = (univ: UniversityOption) => {
    setSelectedUniv(univ);
    onChange(univ);
    setIsOpen(false);
    setQuery("");
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUniv(null);
    onChange(null);
    setQuery("");
    inputRef.current?.focus();
  };

  const openCustomUniversityModal = (initialName: string) => {
    setCustomName(initialName.trim());
    setCustomCountry(countryFilter || "");
    setCustomCity("");
    setCustomWebsite("");
    setCustomError(null);
    setShowAddModal(true);
    setIsOpen(false);
  };

  const handleCreateCustomUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    if (customName.trim().length < 3) {
      setCustomError("University name must be at least 3 characters.");
      return;
    }

    if (customCountry.trim().length < 2) {
      setCustomError("Please provide a valid country.");
      return;
    }

    setIsSubmittingCustom(true);

    try {
      const res = await fetch("/api/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          country: customCountry.trim(),
          city: customCity.trim() || undefined,
          website: customWebsite.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create university.");
      }

      selectUniversity(data.university);
      setShowAddModal(false);
    } catch (err: any) {
      setCustomError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  const displayName = selectedUniv?.name || selectedUniversityName;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Combobox Trigger / Search Input */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`flex items-center gap-2.5 rounded-xl border bg-[var(--color-surface)] px-3.5 py-2.5 shadow-xs transition-colors cursor-text ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-[var(--color-border)] hover:border-[var(--color-border-subtle)]"
        }`}
      >
        <Building2 className="h-4 w-4 shrink-0 text-[var(--color-text-3)]" />

        {displayName && !isOpen ? (
          <div className="flex flex-1 items-center justify-between min-w-0">
            <span className="truncate text-sm font-medium text-[var(--color-text)]">
              {displayName}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg p-1 text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              aria-label="Clear selected university"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={displayName || placeholder}
            className="w-full bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-3)] outline-hidden"
          />
        )}

        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
        ) : (
          !displayName && <Search className="h-4 w-4 shrink-0 text-[var(--color-text-3)]" />
        )}
      </div>

      {/* Floating Dropdown Results */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-72 w-full overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-xl transition-all"
        >
          {results.length > 0 ? (
            results.map((univ, index) => {
              const isSelected = selectedUniv?.id === univ.id || value === univ.id;
              const isActive = index === activeIndex;

              return (
                <div
                  key={univ.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectUniversity(univ)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    isActive
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      : "hover:bg-[var(--color-surface-2)]"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--color-text)]">
                        {univ.name}
                      </span>
                      {univ.shortName && (
                        <span className="rounded-md bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-text-2)] uppercase">
                          {univ.shortName}
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-3)]">
                      {(univ.city || univ.country) && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {[univ.city, univ.country].filter(Boolean).join(", ")}
                        </span>
                      )}

                      {/* Verification Badge */}
                      {univ.isVerified ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="h-3 w-3" />
                          Community
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-1" />
                  )}
                </div>
              );
            })
          ) : !isLoading ? (
            <div className="p-3 text-center">
              <p className="text-xs font-medium text-[var(--color-text-2)]">
                No universities found matching &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : null}

          {/* "Can't find your university? Add it" CTA */}
          <div className="border-t border-[var(--color-border-subtle)] mt-1.5 pt-1.5">
            <button
              type="button"
              onClick={() => openCustomUniversityModal(query)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors text-left"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Can&apos;t find your university? Add &ldquo;{query.trim() || "New University"}&rdquo;</span>
            </button>
          </div>
        </div>
      )}

      {/* Controlled Modal: Add Custom University */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-univ-title"
            className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 id="add-univ-title" className="text-base font-bold text-[var(--color-text)]">
                  Add University
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomUniversity} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  University Name *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. National College of Arts"
                  className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    placeholder="e.g. Pakistan"
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                    City (Optional)
                  </label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="e.g. Lahore"
                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2 text-sm text-[var(--color-text)] outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-3)]">
                  Official Website (Optional)
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2">
                  <Globe className="h-4 w-4 text-[var(--color-text-3)] shrink-0" />
                  <input
                    type="url"
                    value={customWebsite}
                    onChange={(e) => setCustomWebsite(e.target.value)}
                    placeholder="https://example.edu.pk"
                    className="w-full bg-transparent text-sm text-[var(--color-text)] outline-hidden"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <span className="font-semibold">Note:</span> Custom institutions are added as community entries and marked unverified until validated.
              </div>

              {customError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{customError}</p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustom}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmittingCustom && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Add Institution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
