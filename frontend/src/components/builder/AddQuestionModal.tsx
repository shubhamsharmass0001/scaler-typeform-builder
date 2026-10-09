"use client";

/**
 * components/builder/AddQuestionModal.tsx — Typeform-style "Add form elements" modal
 *
 * Pixel-accurate match to Typeform's add content dialog:
 *   - 3 tabs: "Add form elements" | "Import questions" | "Create with AI"
 *   - Left sidebar: Recommended + Connect to apps sections
 *   - Right: Categorized grid (Contact info, Choice, Rating & ranking, Text & Video, Other)
 *   - Search input
 *   - Import questions tab with textarea + instructions
 *   - Create with AI tab with prompt input + templates
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Mail,
  MessageSquare,
  CheckSquare,
  ChevronDown,
  Star,
  Hash,
  ToggleLeft,
  Type,
  AlignLeft,
  Phone,
  MapPin,
  Globe,
  Image,
  Scale,
  CheckCheck,
  BarChart2,
  Trophy,
  Grid3X3,
  Video,
  FileText,
  Calendar,
  PenLine,
  CreditCard,
  Upload,
  Clock,
  Link2,
  Users,
  Tag,
  Sparkles,
  Info,
  MonitorSmartphone,
} from "lucide-react";
import { useBuilderStore } from "./BuilderContext";
import { QuestionType } from "@/types";

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalTab = "elements" | "import" | "ai";

interface FormElement {
  type: QuestionType | string;
  label: string;
  icon: React.ReactNode;
  color?: string;
  bg?: string;
  comingSoon?: boolean;
}

// Full Typeform-style element categories
const CONTACT_INFO: FormElement[] = [
  { type: "email", label: "Email", icon: <Mail className="w-4 h-4" />, color: "var(--badge-email-text, #db2777)", bg: "var(--badge-email-bg, #fce7f3)" },
  { type: "short_text", label: "Short Text", icon: <Type className="w-4 h-4" />, color: "var(--badge-short-text-text, #0284c7)", bg: "var(--badge-short-text-bg, #d0f0fd)" },
  { type: "phone", label: "Phone Number", icon: <Phone className="w-4 h-4" />, color: "var(--badge-choice-text, #7c3aed)", bg: "var(--badge-choice-bg, #ede9fe)", comingSoon: true },
  { type: "address", label: "Address", icon: <MapPin className="w-4 h-4" />, color: "var(--color-error, #dc2626)", bg: "var(--badge-email-bg, #fce7f3)", comingSoon: true },
  { type: "website", label: "Website", icon: <Globe className="w-4 h-4" />, color: "var(--badge-upload-text, #0891b2)", bg: "var(--badge-upload-bg, #cffafe)", comingSoon: true },
];

const CHOICE: FormElement[] = [
  { type: "multiple_choice", label: "Multiple Choice", icon: <CheckSquare className="w-4 h-4" />, color: "var(--badge-choice-text, #7c3aed)", bg: "var(--badge-choice-bg, #ede9fe)" },
  { type: "dropdown", label: "Dropdown", icon: <ChevronDown className="w-4 h-4" />, color: "var(--badge-dropdown-text, #4f46e5)", bg: "var(--badge-dropdown-bg, #e0e7ff)" },
  { type: "picture_choice", label: "Picture Choice", icon: <Image className="w-4 h-4" />, color: "var(--badge-rating-text, #d97706)", bg: "var(--badge-rating-bg, #fef3c7)", comingSoon: true },
  { type: "yes_no", label: "Yes/No", icon: <ToggleLeft className="w-4 h-4" />, color: "var(--badge-yesno-text, #059669)", bg: "var(--badge-yesno-bg, #d1fae5)" },
  { type: "legal", label: "Legal", icon: <Scale className="w-4 h-4" />, color: "var(--text-secondary, #595959)", bg: "var(--bg-muted, #f3f3f5)", comingSoon: true },
  { type: "checkbox", label: "Checkbox", icon: <CheckCheck className="w-4 h-4" />, color: "var(--badge-short-text-text, #0284c7)", bg: "var(--badge-short-text-bg, #d0f0fd)", comingSoon: true },
];

const RATING_RANKING: FormElement[] = [
  { type: "rating", label: "Rating", icon: <Star className="w-4 h-4" />, color: "var(--badge-rating-text, #d97706)", bg: "var(--badge-rating-bg, #fef3c7)" },
  { type: "nps", label: "Net Promoter Score®", icon: <BarChart2 className="w-4 h-4" />, color: "var(--badge-choice-text, #7c3aed)", bg: "var(--badge-choice-bg, #ede9fe)", comingSoon: true },
  { type: "opinion_scale", label: "Opinion Scale", icon: <BarChart2 className="w-4 h-4" />, color: "var(--badge-yesno-text, #059669)", bg: "var(--badge-yesno-bg, #d1fae5)", comingSoon: true },
  { type: "ranking", label: "Ranking", icon: <Trophy className="w-4 h-4" />, color: "var(--badge-rating-text, #d97706)", bg: "var(--badge-rating-bg, #fef3c7)", comingSoon: true },
  { type: "matrix", label: "Matrix", icon: <Grid3X3 className="w-4 h-4" />, color: "var(--text-secondary, #595959)", bg: "var(--bg-muted, #f3f3f5)", comingSoon: true },
];

const TEXT_VIDEO: FormElement[] = [
  { type: "long_text", label: "Long Text", icon: <AlignLeft className="w-4 h-4" />, color: "var(--badge-long-text-text, #0284c7)", bg: "var(--badge-long-text-bg, #e0f2fe)" },
  { type: "short_text_block", label: "Short Text", icon: <Type className="w-4 h-4" />, color: "var(--badge-short-text-text, #0284c7)", bg: "var(--badge-short-text-bg, #d0f0fd)", comingSoon: true },
  { type: "video", label: "Video and Audio", icon: <Video className="w-4 h-4" />, color: "var(--color-error, #dc2626)", bg: "var(--badge-email-bg, #fce7f3)", comingSoon: true },
  { type: "ai_clarify", label: "Clarify with AI", icon: <Sparkles className="w-4 h-4" />, color: "var(--badge-choice-text, #7c3aed)", bg: "var(--badge-choice-bg, #ede9fe)", comingSoon: true },
  { type: "ai_faq", label: "FAQ with AI", icon: <MessageSquare className="w-4 h-4" />, color: "var(--badge-yesno-text, #059669)", bg: "var(--badge-yesno-bg, #d1fae5)", comingSoon: true },
];

const OTHER: FormElement[] = [
  { type: "number", label: "Number", icon: <Hash className="w-4 h-4" />, color: "var(--badge-number-text, #ea580c)", bg: "var(--badge-number-bg, #ffedd5)" },
  { type: "date", label: "Date", icon: <Calendar className="w-4 h-4" />, color: "var(--badge-rating-text, #d97706)", bg: "var(--badge-rating-bg, #fef3c7)", comingSoon: true },
  { type: "signature", label: "Signature", icon: <PenLine className="w-4 h-4" />, color: "var(--badge-dropdown-text, #4f46e5)", bg: "var(--badge-dropdown-bg, #e0e7ff)", comingSoon: true },
  { type: "payment", label: "Payment", icon: <CreditCard className="w-4 h-4" />, color: "var(--badge-yesno-text, #059669)", bg: "var(--badge-yesno-bg, #d1fae5)", comingSoon: true },
  { type: "file_upload", label: "File Upload", icon: <Upload className="w-4 h-4" />, color: "var(--badge-upload-text, #0891b2)", bg: "var(--badge-upload-bg, #cffafe)" },
  { type: "scheduler", label: "Scheduler", icon: <Clock className="w-4 h-4" />, color: "var(--badge-choice-text, #7c3aed)", bg: "var(--badge-choice-bg, #ede9fe)", comingSoon: true },
  { type: "welcome_screen", label: "Welcome Screen", icon: <MonitorSmartphone className="w-4 h-4" />, color: "var(--text-secondary, #595959)", bg: "var(--bg-muted, #f3f3f5)", comingSoon: true },
  { type: "redirect", label: "Redirect to URL", icon: <Link2 className="w-4 h-4" />, color: "var(--badge-yesno-text, #059669)", bg: "var(--badge-yesno-bg, #d1fae5)", comingSoon: true },
];

const RECOMMENDED: FormElement[] = [
  { type: "short_text", label: "Short Text", icon: <Type className="w-4 h-4" />, color: "var(--badge-short-text-text, #0284c7)", bg: "var(--badge-short-text-bg, #d0f0fd)" },
  { type: "multiple_choice", label: "Multiple Choice", icon: <CheckSquare className="w-4 h-4" />, color: "var(--badge-choice-text, #7c3aed)", bg: "var(--badge-choice-bg, #ede9fe)" },
  { type: "email", label: "Email", icon: <Mail className="w-4 h-4" />, color: "var(--badge-email-text, #db2777)", bg: "var(--badge-email-bg, #fce7f3)" },
];

const VALID_QUESTION_TYPES: QuestionType[] = [
  "short_text", "long_text", "email", "multiple_choice",
  "dropdown", "rating", "number", "yes_no", "file_upload",
];

export function AddQuestionModal({ isOpen, onClose }: AddQuestionModalProps) {
  const { state, addQuestion } = useBuilderStore();
  const [activeTab, setActiveTab] = useState<ModalTab>("elements");
  const [search, setSearch] = useState("");
  const [importText, setImportText] = useState("");
  const [keyboardIndex, setKeyboardIndex] = useState(0);

  const allElements = useMemo(
    () => [...CONTACT_INFO, ...CHOICE, ...RATING_RANKING, ...TEXT_VIDEO, ...OTHER],
    []
  );

  const filteredElements = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allElements.filter((item) =>
      item.label.toLowerCase().includes(q)
    );
  }, [search, allElements]);

  const availableItems = useMemo(() => {
    const list = filteredElements || allElements;
    return list.filter((item) => VALID_QUESTION_TYPES.includes(item.type as QuestionType));
  }, [filteredElements, allElements]);

  const safeKeyboardIndex =
    availableItems.length > 0 ? keyboardIndex % availableItems.length : 0;

  const handleSelect = (type: string) => {
    if (!VALID_QUESTION_TYPES.includes(type as QuestionType)) {
      return; // Coming soon — don't add
    }
    const afterId = state.selectedId;
    addQuestion(type as QuestionType, afterId);
    onClose();
    setSearch("");
    setKeyboardIndex(0);
  };

  // Keyboard navigation & Escape listener
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (activeTab === "elements" && availableItems.length > 0) {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          setKeyboardIndex((prev) => (prev + 1) % availableItems.length);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          setKeyboardIndex((prev) => (prev - 1 + availableItems.length) % availableItems.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          const target = availableItems[keyboardIndex];
          if (target && !target.comingSoon) {
            handleSelect(target.type);
          }
        }
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, activeTab, availableItems, keyboardIndex]);

  const highlightedType = availableItems[safeKeyboardIndex]?.type;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[60px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Add form elements modal"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative bg-modal text-primary rounded-2xl shadow-modal border border-default w-full max-w-4xl mx-auto overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header with 3 tabs */}
        <div className="flex items-center border-b border-default px-6 pt-4">
          <div className="flex items-center gap-0 flex-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "elements"}
              onClick={() => setActiveTab("elements")}
              className={`pb-3 px-0 mr-6 text-sm font-semibold border-b-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none ${
                activeTab === "elements"
                  ? "text-primary border-primary"
                  : "text-secondary border-transparent hover:text-primary"
              }`}
            >
              Add form elements
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "import"}
              onClick={() => setActiveTab("import")}
              className={`pb-3 px-0 mr-6 text-sm font-medium border-b-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none ${
                activeTab === "import"
                  ? "text-primary border-primary"
                  : "text-secondary border-transparent hover:text-primary"
              }`}
            >
              Import questions
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ai"}
              onClick={() => setActiveTab("ai")}
              className={`pb-3 px-0 text-sm font-medium border-b-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none ${
                activeTab === "ai"
                  ? "text-primary border-primary"
                  : "text-secondary border-transparent hover:text-primary"
              }`}
            >
              Create with AI
            </button>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add elements dialog"
            className="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer mb-3 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── TAB: Add form elements ────────────────────────────────── */}
        {activeTab === "elements" && (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left sidebar */}
            <div className="w-52 border-r border-default py-4 px-3 overflow-y-auto flex-shrink-0">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="w-3.5 h-3.5 text-placeholder absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search form elements"
                  autoFocus
                  className="w-full bg-muted text-xs text-primary placeholder:text-placeholder pl-8 pr-3 py-2 rounded-lg border border-transparent focus:outline-none focus:border-strong focus:bg-surface transition-colors"
                />
              </div>

              {/* Recommended */}
              <div className="mb-4">
                <p className="text-micro font-semibold text-secondary mb-2 px-1">Recommended</p>
                <div className="space-y-0.5">
                  {RECOMMENDED.map((item) => (
                    <SidebarItem key={item.type} item={item} onSelect={handleSelect} />
                  ))}
                </div>
              </div>

              {/* Connect to apps */}
              <div>
                <p className="text-micro font-semibold text-secondary mb-2 px-1">Connect to apps</p>
                <div className="space-y-0.5">
                  <SidebarItem
                    item={{ type: "hubspot", label: "Hubspot", icon: <div className="w-4 h-4 bg-orange-500 rounded-sm flex items-center justify-center text-white text-nano font-bold">H</div> }}
                    onSelect={() => {}}
                    comingSoon
                  />
                  <SidebarItem
                    item={{ type: "salesforce", label: "Salesforce", icon: <div className="w-4 h-4 bg-sky-500 rounded-sm flex items-center justify-center text-white text-nano font-bold">S</div> }}
                    onSelect={() => {}}
                    comingSoon
                  />
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors w-full mt-0.5 cursor-pointer"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Browse all apps</span>
                </button>
              </div>
            </div>

            {/* Right categorized grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {search.trim() && filteredElements ? (
                /* Search results */
                <div>
                  <p className="text-xs text-secondary mb-3">
                    {filteredElements.length} result{filteredElements.length !== 1 ? "s" : ""} for &quot;{search}&quot;
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {filteredElements.map((item) => (
                      <GridItem
                        key={item.type}
                        item={item}
                        onSelect={handleSelect}
                        isHighlighted={highlightedType === item.type}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Categorized grid */
                <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                  <CategoryColumn
                    title="Contact info"
                    items={CONTACT_INFO}
                    onSelect={handleSelect}
                    highlightedType={highlightedType}
                  />
                  <CategoryColumn
                    title="Choice"
                    items={CHOICE}
                    onSelect={handleSelect}
                    highlightedType={highlightedType}
                  />
                  <CategoryColumn
                    title="Rating & ranking"
                    items={RATING_RANKING}
                    onSelect={handleSelect}
                    highlightedType={highlightedType}
                  />
                  <CategoryColumn
                    title="Text & Video"
                    items={TEXT_VIDEO}
                    onSelect={handleSelect}
                    highlightedType={highlightedType}
                  />
                  <CategoryColumn
                    title="Other"
                    items={OTHER}
                    onSelect={handleSelect}
                    highlightedType={highlightedType}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Import questions ─────────────────────────────────── */}
        {activeTab === "import" && (
          <div className="flex-1 p-6 flex gap-5 min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col">
              <p className="text-sm font-medium text-primary mb-3">Form questions</p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Copy and paste or type in your questions, and press enter after each one."
                className="flex-1 w-full bg-surface border border-default rounded-xl text-sm text-primary placeholder:text-placeholder p-4 focus:outline-none focus:border-focus resize-none transition-colors"
              />
            </div>
            <div className="w-52 flex-shrink-0 flex flex-col gap-4">
              {/* Tip card */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <ul className="text-xs text-secondary space-y-1.5 leading-relaxed">
                    <li>Paste or type your questions in the text field</li>
                    <li>Or try Create with AI to build your form from a description, file upload, or URL</li>
                  </ul>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className="w-full py-2.5 border border-default rounded-xl text-sm font-medium text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Create with AI
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: Create with AI ───────────────────────────────────── */}
        {activeTab === "ai" && (
          <div className="flex-1 p-6 min-h-0 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <p className="text-xs font-medium text-secondary mb-1">Typeform AI</p>
                <h2 className="text-2xl font-bold text-primary">What would you like to create?</h2>
              </div>

              {/* AI prompt input */}
              <div className="border-2 border-purple-300 rounded-xl p-4 mb-6 focus-within:border-purple-500 transition-colors">
                <textarea
                  placeholder="Create and edit (almost) anything in your form."
                  className="w-full text-sm text-primary placeholder:text-placeholder bg-transparent resize-none focus:outline-none min-h-[80px]"
                />
                <div className="flex items-center gap-3 mt-2">
                  <button type="button" className="text-secondary hover:text-primary transition-colors cursor-pointer">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                  </button>
                  <span className="text-placeholder text-lg">+</span>
                  <span className="text-placeholder text-lg">···</span>
                </div>
              </div>

              {/* Template suggestions */}
              <div className="space-y-2">
                {[
                  { icon: <Tag className="w-5 h-5 text-secondary" />, title: "Lead qualification form", desc: "Qualify your leads with AI-generated questions and scoring rules." },
                  { icon: <Tag className="w-5 h-5 text-secondary" />, title: "Product recommendation quiz", desc: "Boost sales by recommending products with AI-generated questions and matching rules.", badge: "Match quiz" },
                  { icon: <Users className="w-5 h-5 text-secondary" />, title: "Personality quiz", desc: "Show different results based on answers with AI-generated questions and matching rules.", badge: "Match quiz" },
                ].map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full flex items-center gap-4 p-4 border border-default rounded-xl hover:bg-surface-hover text-left transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
                      {tpl.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-primary">{tpl.title}</span>
                        {tpl.badge && (
                          <span className="text-nano font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                            {tpl.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary">{tpl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer (for import tab) */}
        {activeTab === "import" && (
          <div className="border-t border-default px-6 py-3 flex justify-end">
            <button
              type="button"
              disabled={!importText.trim()}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-btn-primary rounded-xl disabled:opacity-40 hover:bg-btn-primary-hover transition-colors cursor-pointer disabled:cursor-default"
            >
              Import questions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SidebarItem({
  item,
  onSelect,
  comingSoon = false,
}: {
  item: FormElement;
  onSelect: (type: string) => void;
  comingSoon?: boolean;
}) {
  const isComingSoon = comingSoon || item.comingSoon;
  return (
    <button
      type="button"
      onClick={() => !isComingSoon && onSelect(item.type)}
      disabled={isComingSoon}
      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-hover text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default group"
    >
      <span className="text-secondary shrink-0">{item.icon}</span>
      <span className="text-xs text-primary flex-1">{item.label}</span>
    </button>
  );
}

function CategoryColumn({
  title,
  items,
  onSelect,
  highlightedType,
}: {
  title: string;
  items: FormElement[];
  onSelect: (type: string) => void;
  highlightedType?: string;
}) {
  return (
    <div>
      <p className="text-micro font-semibold text-secondary mb-2">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <GridItem
            key={item.type}
            item={item}
            onSelect={onSelect}
            isHighlighted={highlightedType === item.type}
          />
        ))}
      </div>
    </div>
  );
}

function GridItem({
  item,
  onSelect,
  isHighlighted = false,
}: {
  item: FormElement;
  onSelect: (type: string) => void;
  isHighlighted?: boolean;
}) {
  const isComingSoon = item.comingSoon;
  return (
    <button
      type="button"
      onClick={() => !isComingSoon && onSelect(item.type)}
      disabled={isComingSoon}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all group ${
        isComingSoon
          ? "opacity-50 cursor-default"
          : isHighlighted
          ? "bg-surface-hover ring-2 ring-primary cursor-pointer shadow-xs"
          : "hover:bg-surface-hover cursor-pointer"
      }`}
      data-question-type={item.type}
    >
      <span
        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
        style={{
          backgroundColor: item.bg || "var(--bg-muted)",
          color: item.color || "var(--text-secondary)",
        }}
      >
        {item.icon}
      </span>
      <span className="text-xs text-primary leading-tight">{item.label}</span>
    </button>
  );
}
