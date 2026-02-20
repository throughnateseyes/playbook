"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SOP } from '../../types';
import { normalizeSOPs } from '../../lib/normalize';
import Sidebar from '../../components/Sidebar';
import CommandPalette from '../../components/CommandPalette';
import SopDetail from '../../components/SopDetail';
import SopForm from '../../components/SopForm';
import { UserMenu } from '../../components/UserMenu';
import { useSOPRepository } from '../../lib/hooks/useSOPRepository';

export const INITIAL_SOPS = [
  {
    id: '1',
    title: 'Emergency Maintenance Request',
    category: 'Operations',
    tags: ['Urgent', 'After-Hours'],
    lastUpdated: 'Updated 2 days ago',
    overview: 'Handle emergency maintenance requests that require immediate attention, including water leaks, heating/cooling failures, and electrical issues.',
    steps: [
      {
        title: 'Receive and log the emergency request in the system',
        text: 'Log in the property management system under Work Orders → Emergency. Include unit number, time received, and nature of issue.',
        script: 'Portal: [https://portal.example.com]\nWork Orders → New → Emergency\n\nUnit #: ___\nIssue: ___\nReported by: ___\nTime received: ___',
      },
      {
        title: 'Assess severity and potential safety risks',
        text: 'Determine if the issue poses immediate danger (gas leak, flood, no heat in winter). If yes, contact emergency services first.',
      },
      {
        title: 'Contact on-call maintenance technician within 15 minutes',
        text: 'Use the on-call rotation posted in #maintenance on Slack. If unreachable after 2 attempts, escalate to Maintenance Lead.',
      },
      { title: 'Notify property manager if estimated cost exceeds $500' },
      { title: 'Document all actions taken and time stamps' },
      { title: 'Follow up with resident within 24 hours of resolution' },
    ],
    edgeCases: [
      { title: 'After-hours request', description: 'Use emergency contact list. Document overtime authorization.' },
      { title: 'Resident unreachable', description: 'Leave voicemail, send email, and use emergency key if safety concern.' },
    ],
    escalation: {
      when: 'If issue requires more than $1,000 in repairs or poses immediate safety risk',
      who: 'Regional Manager (555-0100)',
    },
    contacts: [
      { role: 'Maintenance Lead', name: 'Mike Chen', department: 'Operations', description: 'After-hours emergency coordination', teamsUrl: 'https://teams.microsoft.com/l/chat/0/0?users=mike.chen@parkmerced.com', linkedinUrl: 'https://linkedin.com/in/mikechen' },
      { role: 'Property Manager', name: 'Sarah Johnson', department: 'Management', description: 'Budget approval over $500', linkedinUrl: 'https://linkedin.com/in/sarahjohnson' },
    ],
    referenceMaterials: [
      { title: 'Emergency contact list', fileUrl: '/files/emergency-contacts.pdf' },
      { title: 'Maintenance log template', fileUrl: '/files/maintenance-log.xlsx' },
      { title: 'Safety checklist', fileUrl: '/files/safety-checklist.pdf' },
    ],
  },
  {
    id: '2',
    title: 'Resident Move-In Process',
    category: 'Leasing',
    tags: ['Onboarding', 'Inspection'],
    lastUpdated: 'Updated 1 week ago',
    overview: 'Complete move-in process for new residents, including unit inspection, key handoff, and orientation.',
    steps: [
      { title: 'Confirm move-in date and time with resident 48 hours in advance' },
      { title: 'Complete pre-move-in unit inspection with checklist' },
      { title: 'Prepare welcome packet with keys, parking passes, and amenity access cards' },
      { title: 'Conduct walk-through with resident, documenting any existing damage' },
      { title: 'Review lease terms, community rules, and emergency procedures' },
      { title: 'Provide contact information for maintenance and management' },
      { title: 'Have resident sign move-in inspection form' },
    ],
    edgeCases: [
      { title: 'Unit not ready', description: 'Offer temporary accommodation or rent concession. Document in lease.' },
      { title: 'Resident disputes condition', description: 'Take photos, get resident signature, escalate to manager.' },
    ],
    escalation: {
      when: 'If resident refuses to sign inspection form or disputes unit condition',
      who: 'Leasing Manager (555-0101)',
    },
    contacts: [
      { role: 'Leasing Manager', name: 'Tom Rodriguez', department: 'Leasing', description: 'Move-in disputes and concessions' },
      { role: 'Legal Counsel', name: 'Jennifer Park', department: 'Legal', description: 'Lease agreement modifications' },
    ],
    referenceMaterials: [
      { title: 'Move-in checklist', fileUrl: '/files/move-in-checklist.pdf' },
      { title: 'Unit inspection form', fileUrl: '/files/unit-inspection.pdf' },
      { title: 'Welcome packet contents', fileUrl: '/files/welcome-packet.pdf' },
    ],
  },
  {
    id: '3',
    title: 'Rent Payment Late Fee Application',
    category: 'Finance',
    tags: ['Billing', 'Policy'],
    lastUpdated: 'Updated 3 days ago',
    overview: 'Apply late fees to resident accounts in accordance with lease terms and state regulations.',
    steps: [
      { title: 'Verify rent payment grace period has expired (typically 5th of month)' },
      { title: 'Check for pending ACH transfers or checks in mail' },
      { title: 'Review lease agreement for specific late fee terms' },
      { title: 'Apply late fee to resident account in property management system' },
      { title: 'Send automated late payment notice via email and portal' },
      { title: 'Document fee application with date and amount' },
      { title: 'Monitor account for payment within next 10 days' },
    ],
    edgeCases: [
      { title: 'Partial payment received', description: 'Apply to rent first, then late fees. Document payment plan if offered.' },
      { title: 'Fee waiver request', description: 'Manager approval required. One waiver per 12 months maximum.' },
    ],
    escalation: {
      when: 'If resident disputes fee or payment is 15+ days late',
      who: 'Finance Manager (555-0102)',
    },
    contacts: [
      { role: 'Finance Manager', name: 'David Kim', department: 'Finance', description: 'Fee waiver approvals', teamsUrl: 'https://teams.microsoft.com/l/chat/0/0?users=david.kim@parkmerced.com' },
      { role: 'Collections Specialist', name: 'Maria Gonzalez', department: 'Finance', description: 'Payment plans and late accounts' },
    ],
    referenceMaterials: [
      { title: 'Late fee schedule', fileUrl: '/files/late-fee-schedule.pdf' },
      { title: 'Notice template', fileUrl: '/files/notice-template.docx' },
      { title: 'Payment policy', fileUrl: '/files/payment-policy.pdf' },
    ],
  },
  {
    id: '4',
    title: 'Noise Complaint Resolution',
    category: 'Resident Support',
    tags: ['Dispute', 'Documentation'],
    lastUpdated: 'Updated 5 days ago',
    overview: 'Address noise complaints between residents while maintaining fairness and documentation.',
    steps: [
      { title: 'Log complaint with date, time, location, and nature of noise' },
      { title: 'Review community quiet hours policy (typically 10 PM - 7 AM)' },
      { title: 'Contact resident making noise via phone or door knock' },
      { title: 'Issue verbal warning and document conversation' },
      { title: 'Send follow-up email summarizing policy and expectation' },
      { title: 'Check back with complainant within 48 hours' },
      { title: 'Escalate if complaints continue after two warnings' },
    ],
    edgeCases: [
      { title: 'Multiple complainants', description: 'Document all parties. May warrant immediate written warning.' },
      { title: 'Daytime noise', description: 'Assess reasonableness. Normal living sounds not enforceable during day.' },
    ],
    escalation: {
      when: 'After third complaint or if noise is extreme/threatening',
      who: 'Property Manager (555-0103)',
    },
    contacts: [
      { role: 'Property Manager', name: 'Alex Turner', department: 'Management', description: 'Resident conflicts and warnings' },
      { role: 'Security Coordinator', name: 'James Wilson', department: 'Operations', description: 'Safety concerns and disturbances' },
    ],
    referenceMaterials: [
      { title: 'Quiet hours policy', fileUrl: '/files/quiet-hours-policy.pdf' },
      { title: 'Warning notice template', fileUrl: '/files/warning-notice.docx' },
      { title: 'Complaint log', fileUrl: '/files/complaint-log.xlsx' },
    ],
  },
  {
    id: '5',
    title: 'Package Delivery Management',
    category: 'Operations',
    tags: ['Daily', 'Resident Service'],
    lastUpdated: 'Updated 1 day ago',
    overview: 'Receive, log, and notify residents of package deliveries to ensure security and timely pickup.',
    steps: [
      { title: 'Accept packages from delivery personnel and verify unit number' },
      { title: 'Log package in tracking system with date, carrier, and unit number' },
      { title: 'Take photo of package label and tracking number' },
      { title: 'Send automated notification to resident via email and text' },
      { title: 'Store package in designated area organized by unit number' },
      { title: 'Follow up if package not picked up within 7 days' },
      { title: 'Maintain package log for 30 days after pickup' },
    ],
    edgeCases: [
      { title: 'Large/heavy packages', description: 'Note in system. Resident may need assistance or special arrangement.' },
      { title: 'Signature required', description: 'Do not accept. Instruct carrier to reattempt or leave notice for resident.' },
    ],
    escalation: {
      when: 'If package unclaimed after 14 days or resident disputes receiving notification',
      who: 'Office Manager (555-0104)',
    },
    contacts: [
      { role: 'Office Manager', name: 'Lisa Brown', department: 'Operations', description: 'Package system issues' },
      { role: 'IT Support', name: 'Kevin Patel', department: 'Technology', description: 'Tracking system failures' },
    ],
    referenceMaterials: [
      { title: 'Package room layout', fileUrl: '/files/package-room-layout.png', thumbnailUrl: '/thumbnails/package-room.jpg' },
      { title: 'Tracking system screenshot', fileUrl: '/files/tracking-system.png', thumbnailUrl: '/thumbnails/tracking-system.jpg' },
      { title: 'Notification template', fileUrl: '/files/notification-template.docx' },
    ],
  },
  {
    id: '6',
    title: 'Lease Renewal Outreach',
    category: 'Leasing',
    tags: ['Retention', 'Communication'],
    lastUpdated: 'Updated 2 weeks ago',
    overview: 'Proactively reach out to residents 90 days before lease expiration to discuss renewal options.',
    steps: [
      { title: 'Generate list of leases expiring in 90-120 days' },
      { title: 'Review resident history for any issues or special circumstances' },
      { title: 'Prepare renewal offers with current market rates and incentives' },
      { title: 'Send initial renewal notice via email with online renewal option' },
      { title: 'Follow up with phone call within 5 business days' },
      { title: 'Schedule in-person meeting for residents who prefer face-to-face' },
      { title: 'Document all communications and resident decisions' },
      { title: 'Process renewal paperwork within 48 hours of acceptance' },
    ],
    edgeCases: [
      { title: 'Resident wants to downsize/upsize', description: 'Check unit availability. Offer transfer with pro-rated fees.' },
      { title: 'Resident negotiating rate', description: 'Refer to manager if request is >5% below offered rate.' },
    ],
    escalation: {
      when: 'If resident not responsive after 3 attempts or negotiating significant concessions',
      who: 'Leasing Manager (555-0101)',
    },
    contacts: [
      { role: 'Leasing Manager', name: 'Tom Rodriguez', department: 'Leasing', description: 'Rate negotiations and retention', teamsUrl: 'https://teams.microsoft.com/l/chat/0/0?users=tom.rodriguez@parkmerced.com', linkedinUrl: 'https://linkedin.com/in/tomrodriguez' },
      { role: 'Revenue Manager', name: 'Rachel Lee', department: 'Finance', description: 'Pricing and market rate approvals' },
      { role: 'Transfer Coordinator', name: 'Brandon Smith', department: 'Leasing', description: 'Unit transfer arrangements' },
    ],
    referenceMaterials: [
      { title: 'Renewal timeline', fileUrl: '/files/renewal-timeline.pdf' },
      { title: 'Incentive options', fileUrl: '/files/incentive-options.pdf' },
      { title: 'Transfer policy', fileUrl: '/files/transfer-policy.pdf' },
    ],
  },
];


const CATEGORIES = ['Operations', 'Resident Support', 'Finance', 'Leasing'];

const AskAISection = React.memo(function AskAISection({ selectedSOP }: { selectedSOP: SOP }) {
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleAskAI = () => {
    if (!question.trim()) return;
    setIsThinking(true);
    setAiResponse(null);
    setTimeout(() => {
      setAiResponse(
        `Based on "${selectedSOP.title}", you should start by reviewing: "${selectedSOP.steps[0]?.title ?? selectedSOP.steps[0]?.text ?? ''}". If this issue involves escalation, reference: "${selectedSOP.escalation.when}".`
      );
      setIsThinking(false);
    }, 800);
  };

  return (
    <section className="border-t border-border-muted pt-6 pb-8">
      <p className="ty-section-label mb-5">
        Ask About This Procedure
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Ask a question about this procedure..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
        />
        <button
          onClick={handleAskAI}
          disabled={!question.trim()}
          className="px-4 py-2.5 bg-foreground text-background text-[13px] font-medium rounded-xl hover:bg-foreground/80 active:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Ask
        </button>
      </div>

      {isThinking && (
        <div className="flex items-center gap-2 text-[13px] text-text-faint">
          <div className="w-3.5 h-3.5 border-[1.5px] border-text-faint border-t-transparent rounded-full animate-spin"></div>
          <span>Thinking...</span>
        </div>
      )}

      {aiResponse && (
        <div className="mt-3 px-4 py-3.5 bg-surface border border-border rounded-xl">
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {aiResponse}
          </p>
        </div>
      )}
    </section>
  );
});

export default function Home() {
  const { sops, createSOP, updateSOP } = useSOPRepository('parkmerced', normalizeSOPs(INITIAL_SOPS));
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingSOP, setEditingSOP] = useState<SOP | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const PINS_KEY = "playbook_pins";
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  // Hydration-safe: read localStorage only after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PINS_KEY);
      if (raw) setPinnedIds(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);
  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem(PINS_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const detailContainerRef = useRef<HTMLDivElement>(null);

  const closePanel = useCallback(() => {
    setShowAddPanel(false);
    setIsEditMode(false);
    setEditingSOP(null);
  }, []);

  const scrollToMatch = (index: number) => {
    if (!detailContainerRef.current) return;

    const marks = detailContainerRef.current.querySelectorAll('[data-match="true"]');
    if (marks.length === 0) return;

    const targetIndex = ((index % marks.length) + marks.length) % marks.length;
    const targetMark = marks[targetIndex] as HTMLElement;

    const containerTop = detailContainerRef.current.getBoundingClientRect().top;
    const markTop = targetMark.getBoundingClientRect().top;
    const offset = markTop - containerTop - 80;

    detailContainerRef.current.scrollBy({
      top: offset,
      behavior: "smooth",
    });

    setCurrentMatchIndex(targetIndex);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!selectedSOP || !searchQuery.trim()) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        scrollToMatch(currentMatchIndex - 1);
      } else if (e.metaKey || e.ctrlKey) {
        scrollToMatch(currentMatchIndex + 1);
      } else {
        scrollToMatch(0);
      }
    }
  };

  useEffect(() => {
    if (!selectedSOP || !debouncedSearchQuery.trim() || !detailContainerRef.current) {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return;
    }

    setTimeout(() => {
      if (!detailContainerRef.current) return;
      const marks = detailContainerRef.current.querySelectorAll('[data-match="true"]');
      setTotalMatches(marks.length);
      setCurrentMatchIndex(0);
    }, 50);
  }, [debouncedSearchQuery, selectedSOP]);

  useEffect(() => {
    if (selectedSOP && detailContainerRef.current) {
      detailContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedSOP?.id]);

  // ── Cmd+K / '/' → open command palette ──────────────────────────────────────
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if (e.key === '/') {
        const target = e.target as HTMLElement;
        const inInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;
        if (!inInput) {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // ── Navigate palette section match → select SOP + highlight + scroll ────────
  const handleNavigateToSection = useCallback(
    (sopId: string, query: string) => {
      const sop = sops.find((s) => s.id === sopId);
      if (!sop) return;
      setSelectedSOP(sop);
      setSearchQuery(query);
      // Wait for debounce (200ms) + render, then scroll to first highlight
      setTimeout(() => {
        if (!detailContainerRef.current) return;
        detailContainerRef.current.scrollTo({ top: 0 });
        requestAnimationFrame(() => {
          if (!detailContainerRef.current) return;
          const marks = detailContainerRef.current.querySelectorAll('[data-match="true"]');
          if (marks.length === 0) return;
          const mark = marks[0] as HTMLElement;
          const containerTop = detailContainerRef.current.getBoundingClientRect().top;
          const markTop = mark.getBoundingClientRect().top;
          detailContainerRef.current.scrollBy({
            top: markTop - containerTop - 100,
            behavior: 'smooth',
          });
          setCurrentMatchIndex(0);
          setTotalMatches(marks.length);
        });
      }, 280);
    },
    [sops]
  );

  // Stable CommandPalette callbacks — prevent new references on every Home render
  const handlePaletteClose = useCallback(() => {
    setCommandPaletteOpen(false);
    setSearchQuery("");
  }, []);

  const handlePaletteSelectSOP = useCallback((sop: SOP) => {
    setSelectedSOP(sop);
    setCommandPaletteOpen(false);
    setSearchQuery("");
  }, []);

  const handlePaletteNavigate = useCallback((sopId: string, query: string) => {
    handleNavigateToSection(sopId, query);
    setCommandPaletteOpen(false);
  }, [handleNavigateToSection]);

  const handleDetailTogglePin = useCallback(() => {
    if (selectedSOP) togglePin(selectedSOP.id);
  }, [selectedSOP, togglePin]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddPanel) {
        closePanel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddPanel, closePanel]);


  const searchRegex = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return null;
    const escaped = debouncedSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${escaped})`, 'gi');
  }, [debouncedSearchQuery]);

  const highlightText = useCallback((text: string): React.ReactNode => {
    if (!searchRegex || !selectedSOP) return text;
    const parts = text.split(searchRegex);
    return parts.map((part, index) =>
      searchRegex.test(part) ? (
        <mark key={index} className="bg-highlight text-highlight-text" data-match="true">
          {part}
        </mark>
      ) : part
    );
  }, [searchRegex, selectedSOP]);

  const handleEditClick = useCallback(() => {
    if (selectedSOP) {
      setEditingSOP(selectedSOP);
      setIsEditMode(true);
      setShowAddPanel(true);
    }
  }, [selectedSOP]);

  return (
    <div className="flex h-screen bg-surface font-sans antialiased">
      <Sidebar
        sops={sops}
        selectedSOP={selectedSOP}
        onSelectSOP={setSelectedSOP}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery("")}
        pinnedIds={pinnedIds}
        onTogglePin={togglePin}
        onHomeClick={() => { window.location.href = '/'; }}
      />

      <div className="flex-1 flex flex-col">
        <div className="bg-background border-b border-border px-4 flex items-center h-14">
          {/* Center — search */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                readOnly
                onClick={() => setCommandPaletteOpen(true)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-16 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow cursor-pointer select-none"
              />

              {/* ⌘K hint — only when no active search and no match counter */}
              {!searchQuery && !(selectedSOP && debouncedSearchQuery.trim() && totalMatches > 0) && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 ty-micro pointer-events-none select-none font-mono">
                  ⌘K
                </span>
              )}

              {/* X clear button — active search query, no match counter */}
              {searchQuery && !(selectedSOP && debouncedSearchQuery.trim() && totalMatches > 0) && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-faint hover:text-text-secondary transition-colors rounded"
                  aria-label="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9.5 2.5l-7 7M2.5 2.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              {/* Match counter — with X prepended when searchQuery is set */}
              {selectedSOP && debouncedSearchQuery.trim() && totalMatches > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-1 text-text-faint hover:text-text-secondary transition-colors rounded"
                      aria-label="Clear search"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M9.5 2.5l-7 7M2.5 2.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                  <span className="text-xs text-text-secondary font-medium">
                    {currentMatchIndex + 1} of {totalMatches}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollToMatch(currentMatchIndex - 1)}
                      className="p-1 hover:bg-surface-2 active:bg-surface-3 rounded transition-colors"
                      title="Previous match (Shift+Enter)"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-secondary">
                        <path d="M6 9L3 6l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollToMatch(currentMatchIndex + 1)}
                      className="p-1 hover:bg-surface-2 active:bg-surface-3 rounded transition-colors"
                      title="Next match (Cmd/Ctrl+Enter)"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-secondary">
                        <path d="M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Add SOP + user menu */}
          <div className="ml-auto flex items-center gap-3">
            {/* TODO: gate behind canCreateSop / admin role when auth is added */}
            <button
              onClick={() => {
                setIsEditMode(false);
                setEditingSOP(null);
                setShowAddPanel(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-text-secondary rounded-lg hover:bg-surface-2 hover:shadow-sm active:bg-surface-3 transition-all duration-150"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add SOP
            </button>
            <UserMenu />
          </div>
        </div>

        <div ref={detailContainerRef} className="flex-1 overflow-y-auto">
          {selectedSOP ? (
            <div className="max-w-3xl mx-auto px-10 py-10">
              <SopDetail
                sop={selectedSOP}
                highlightText={highlightText}
                onEdit={handleEditClick}
                isPinned={pinnedIds.has(selectedSOP.id)}
                onTogglePin={handleDetailTogglePin}
              />
              <AskAISection selectedSOP={selectedSOP} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-16 h-16 text-text-faint mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-[17px] font-semibold text-foreground mb-1 tracking-tight">Select a procedure</h3>
                <p className="text-sm text-text-secondary">Choose an SOP from the sidebar to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={handlePaletteClose}
        sops={sops}
        onSelectSOP={handlePaletteSelectSOP}
        onNavigateToSection={handlePaletteNavigate}
      />

      {showAddPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/25 z-40 animate-fade-in"
            onClick={closePanel}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-background shadow-2xl z-50 animate-slide-in-right flex flex-col">
            <SopForm
              mode={isEditMode ? "edit" : "create"}
              initialData={editingSOP ?? undefined}
              categories={CATEGORIES}
              onSave={(sop) => {
                if (isEditMode && editingSOP) {
                  setSelectedSOP(updateSOP(editingSOP.id, sop));
                } else {
                  setSelectedSOP(createSOP(sop));
                }
                closePanel();
              }}
              onCancel={closePanel}
            />
          </div>
        </>
      )}
    </div>
  );
}
