"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SOP, Contact } from '../types';
import Sidebar from '../components/Sidebar';
import CommandPalette from '../components/CommandPalette';
import SopDetail from '../components/SopDetail';
import { ThemeToggle } from '../components/ThemeToggle';

const INITIAL_SOPS: SOP[] = [
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
        description: 'Log in the property management system under Work Orders → Emergency. Include unit number, time received, and nature of issue.',
        script: 'Portal: [https://portal.example.com]\nWork Orders → New → Emergency\n\nUnit #: ___\nIssue: ___\nReported by: ___\nTime received: ___',
      },
      {
        title: 'Assess severity and potential safety risks',
        description: 'Determine if the issue poses immediate danger (gas leak, flood, no heat in winter). If yes, contact emergency services first.',
      },
      {
        title: 'Contact on-call maintenance technician within 15 minutes',
        description: 'Use the on-call rotation posted in #maintenance on Slack. If unreachable after 2 attempts, escalate to Maintenance Lead.',
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
      contact: 'Regional Manager (555-0100)',
    },
    contacts: [
      { label: 'Maintenance Lead', name: 'Mike Chen', team: 'Operations', reason: 'After-hours emergency coordination' },
      { label: 'Property Manager', name: 'Sarah Johnson', team: 'Management', reason: 'Budget approval over $500' },
    ],
    photos: ['Emergency contact list', 'Maintenance log template', 'Safety checklist'],
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
      contact: 'Leasing Manager (555-0101)',
    },
    contacts: [
      { label: 'Leasing Manager', name: 'Tom Rodriguez', team: 'Leasing', reason: 'Move-in disputes and concessions' },
      { label: 'Legal Counsel', name: 'Jennifer Park', team: 'Legal', reason: 'Lease agreement modifications' },
    ],
    photos: ['Move-in checklist', 'Unit inspection form', 'Welcome packet contents'],
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
      contact: 'Finance Manager (555-0102)',
    },
    contacts: [
      { label: 'Finance Manager', name: 'David Kim', team: 'Finance', reason: 'Fee waiver approvals' },
      { label: 'Collections Specialist', name: 'Maria Gonzalez', team: 'Finance', reason: 'Payment plans and late accounts' },
    ],
    photos: ['Late fee schedule', 'Notice template', 'Payment policy'],
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
      contact: 'Property Manager (555-0103)',
    },
    contacts: [
      { label: 'Property Manager', name: 'Alex Turner', team: 'Management', reason: 'Resident conflicts and warnings' },
      { label: 'Security Coordinator', name: 'James Wilson', team: 'Operations', reason: 'Safety concerns and disturbances' },
    ],
    photos: ['Quiet hours policy', 'Warning notice template', 'Complaint log'],
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
      contact: 'Office Manager (555-0104)',
    },
    contacts: [
      { label: 'Office Manager', name: 'Lisa Brown', team: 'Operations', reason: 'Package system issues' },
      { label: 'IT Support', name: 'Kevin Patel', team: 'Technology', reason: 'Tracking system failures' },
    ],
    photos: ['Package room layout', 'Tracking system screenshot', 'Notification template'],
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
      contact: 'Leasing Manager (555-0101)',
    },
    contacts: [
      { label: 'Leasing Manager', name: 'Tom Rodriguez', team: 'Leasing', reason: 'Rate negotiations and retention' },
      { label: 'Revenue Manager', name: 'Rachel Lee', team: 'Finance', reason: 'Pricing and market rate approvals' },
      { label: 'Transfer Coordinator', name: 'Brandon Smith', team: 'Leasing', reason: 'Unit transfer arrangements' },
    ],
    photos: ['Renewal timeline', 'Incentive options', 'Transfer policy'],
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
        `Based on "${selectedSOP.title}", you should start by reviewing: "${selectedSOP.steps[0]?.title}". If this issue involves escalation, reference: "${selectedSOP.escalation.when}".`
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
  const [sops, setSops] = useState<SOP[]>(INITIAL_SOPS);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
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

  const [formData, setFormData] = useState({
    title: '',
    category: 'Operations',
    tags: '',
    overview: '',
    steps: [''],
    edgeCases: [{ title: '', description: '' }],
    escalationWhen: '',
    escalationContact: '',
    contacts: [{ label: '', name: '', team: '', reason: '' }],
  });

  const [editingSOP, setEditingSOP] = useState<SOP | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    setFormValid(formData.title.trim().length > 0 && formData.category.trim().length > 0);
  }, [formData.title, formData.category]);

  useEffect(() => {
    if (editingSOP) {
      setFormData({
        title: editingSOP.title,
        category: editingSOP.category,
        tags: editingSOP.tags.join(', '),
        overview: editingSOP.overview,
        steps: editingSOP.steps.length > 0 ? editingSOP.steps.map(s => s.title) : [''],
        edgeCases: editingSOP.edgeCases.length > 0 ? editingSOP.edgeCases : [{ title: '', description: '' }],
        escalationWhen: editingSOP.escalation.when,
        escalationContact: editingSOP.escalation.contact,
        contacts: editingSOP.contacts.length > 0 ? editingSOP.contacts : [{ label: '', name: '', team: '', reason: '' }],
      });
    }
  }, [editingSOP]);

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
        setShowAddPanel(false);
        setIsEditMode(false);
        setEditingSOP(null);
        resetForm();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddPanel]);


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
        <mark key={index} className="bg-yellow-200 text-foreground rounded px-0.5" data-match="true">
          {part}
        </mark>
      ) : part
    );
  }, [searchRegex, selectedSOP]);

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Operations',
      tags: '',
      overview: '',
      steps: [''],
      edgeCases: [{ title: '', description: '' }],
      escalationWhen: '',
      escalationContact: '',
      contacts: [{ label: '', name: '', team: '', reason: '' }],
    });
  };

  const handleSaveSOP = () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (isEditMode && editingSOP) {
      const updatedSOP: SOP = {
        ...editingSOP,
        title: formData.title,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        lastUpdated: 'Updated just now',
        overview: formData.overview,
        steps: formData.steps.filter(s => s.trim()).map(s => ({ title: s })),
        edgeCases: formData.edgeCases.filter(ec => ec.title.trim() || ec.description.trim()),
        escalation: {
          when: formData.escalationWhen,
          contact: formData.escalationContact,
        },
        contacts: formData.contacts.filter(c => c.name.trim()),
      };

      setSops(sops.map(sop => sop.id === editingSOP.id ? updatedSOP : sop));
      setSelectedSOP(updatedSOP);
      setShowAddPanel(false);
      setIsEditMode(false);
      setEditingSOP(null);
      resetForm();
    } else {
      const newSOP: SOP = {
        id: String(Date.now()),
        title: formData.title,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        lastUpdated: 'Just now',
        overview: formData.overview,
        steps: formData.steps.filter(s => s.trim()).map(s => ({ title: s })),
        edgeCases: formData.edgeCases.filter(ec => ec.title.trim() || ec.description.trim()),
        escalation: {
          when: formData.escalationWhen,
          contact: formData.escalationContact,
        },
        contacts: formData.contacts.filter(c => c.name.trim()),
        photos: [],
      };

      setSops([...sops, newSOP]);
      setSelectedSOP(newSOP);
      setShowAddPanel(false);
      resetForm();
    }
  };

  const handleEditClick = useCallback(() => {
    if (selectedSOP) {
      setEditingSOP(selectedSOP);
      setIsEditMode(true);
      setShowAddPanel(true);
    }
  }, [selectedSOP]);

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, ''] });
  };

  const removeStep = (index: number) => {
    setFormData({ ...formData, steps: formData.steps.filter((_, i) => i !== index) });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...formData.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setFormData({ ...formData, steps: newSteps });
  };

  const addEdgeCase = () => {
    setFormData({ ...formData, edgeCases: [...formData.edgeCases, { title: '', description: '' }] });
  };

  const removeEdgeCase = (index: number) => {
    setFormData({ ...formData, edgeCases: formData.edgeCases.filter((_, i) => i !== index) });
  };

  const updateEdgeCase = (index: number, field: 'title' | 'description', value: string) => {
    const newEdgeCases = [...formData.edgeCases];
    newEdgeCases[index][field] = value;
    setFormData({ ...formData, edgeCases: newEdgeCases });
  };

  const addContact = () => {
    setFormData({ ...formData, contacts: [...formData.contacts, { label: '', name: '', team: '', reason: '' }] });
  };

  const removeContact = (index: number) => {
    setFormData({ ...formData, contacts: formData.contacts.filter((_, i) => i !== index) });
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, contacts: newContacts });
  };

  return (
    <div className="flex h-screen bg-surface font-sans antialiased">
      <Sidebar
        sops={sops}
        selectedSOP={selectedSOP}
        onSelectSOP={setSelectedSOP}
        searchQuery={searchQuery}
        pinnedIds={pinnedIds}
        onTogglePin={togglePin}
      />

      <div className="flex-1 flex flex-col">
        <div className="bg-background border-b border-border px-6 py-3 flex items-center h-16">
          <div className="flex-1 max-w-md">
            <div className="relative">
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
                placeholder="What do you need help with?"
                value={searchQuery}
                readOnly
                onClick={() => setCommandPaletteOpen(true)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-24 py-2 bg-surface border border-border-strong rounded-xl text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow cursor-pointer select-none"
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

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => {
                setIsEditMode(false);
                setEditingSOP(null);
                resetForm();
                setShowAddPanel(true);
              }}
              className="px-4 py-2 text-text-secondary text-sm font-medium rounded-lg hover:bg-surface-2 hover:shadow-sm active:bg-surface-3 transition-all duration-150 flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add SOP
            </button>
            <ThemeToggle />
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
            className="fixed inset-0 bg-black/25 z-40 transition-opacity duration-300"
            onClick={() => {
              setShowAddPanel(false);
              setIsEditMode(false);
              setEditingSOP(null);
              resetForm();
            }}
          ></div>

          <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
            <div className="flex-shrink-0 px-8 py-6 border-b border-border bg-background">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
                    {isEditMode ? 'Edit SOP' : 'Create New SOP'}
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {isEditMode
                      ? 'Update this standard operating procedure'
                      : 'Define a new standard operating procedure for your team'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddPanel(false);
                    setIsEditMode(false);
                    setEditingSOP(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-surface-2 active:bg-surface-3 rounded-lg transition-colors ml-4"
                  aria-label="Close panel"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-secondary">
                    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-6 tracking-tight flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">1</span>
                    Basic Information
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent"
                        placeholder="Enter SOP title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-strong text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent"
                        placeholder="e.g., Urgent, After-Hours"
                      />
                      <p className="mt-2 text-xs text-text-muted">Separate multiple tags with commas</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Overview</label>
                      <textarea
                        value={formData.overview}
                        onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent"
                        placeholder="Brief overview of this procedure"
                      />
                    </div>
                  </div>
                </section>

                <div className="border-t border-border"></div>

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">2</span>
                      Steps
                    </h3>
                    <button
                      type="button"
                      onClick={addStep}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors font-medium"
                    >
                      + Add Step
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.steps.map((step, index) => (
                      <div key={index} className="bg-surface border border-border rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <textarea
                            value={step}
                            onChange={(e) => updateStep(index, e.target.value)}
                            rows={2}
                            className="flex-1 px-3 py-2 rounded-lg border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                            placeholder="Describe this step"
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => moveStep(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-surface-3 active:bg-surface-3 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move up"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-secondary">
                                <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStep(index, 'down')}
                              disabled={index === formData.steps.length - 1}
                              className="p-1 hover:bg-surface-3 active:bg-surface-3 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move down"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-secondary">
                                <path d="M8 4v8M12 8l-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStep(index)}
                              disabled={formData.steps.length === 1}
                              className="p-1 hover:bg-red-100 active:bg-red-200 rounded text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Remove step"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="border-t border-border"></div>

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">3</span>
                      Edge Cases
                    </h3>
                    <button
                      type="button"
                      onClick={addEdgeCase}
                      className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 active:bg-amber-200 transition-colors font-medium"
                    >
                      + Add Edge Case
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.edgeCases.map((edge, index) => (
                      <div key={index} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <input
                            type="text"
                            value={edge.title}
                            onChange={(e) => updateEdgeCase(index, 'title', e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-amber-300 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500 bg-background"
                            placeholder="Edge case title"
                          />
                          <button
                            type="button"
                            onClick={() => removeEdgeCase(index)}
                            className="ml-2 p-1 hover:bg-red-100 active:bg-red-200 rounded text-red-600 transition-colors"
                            title="Remove edge case"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        <textarea
                          value={edge.description}
                          onChange={(e) => updateEdgeCase(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500 bg-background"
                          placeholder="Description"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <div className="border-t border-border"></div>

                <section>
                  <h3 className="text-lg font-semibold text-foreground mb-6 tracking-tight flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">4</span>
                    Escalation
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">When to Escalate</label>
                      <textarea
                        value={formData.escalationWhen}
                        onChange={(e) => setFormData({ ...formData, escalationWhen: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent"
                        placeholder="Describe escalation criteria"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Primary Contact</label>
                      <input
                        type="text"
                        value={formData.escalationContact}
                        onChange={(e) => setFormData({ ...formData, escalationContact: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent"
                        placeholder="Contact name and phone"
                      />
                    </div>
                  </div>
                </section>

                <div className="border-t border-border"></div>

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">5</span>
                      Additional Contacts
                    </h3>
                    <button
                      type="button"
                      onClick={addContact}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors font-medium"
                    >
                      + Add Contact
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.contacts.map((contact, index) => (
                      <div key={index} className="bg-surface border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={contact.name}
                              onChange={(e) => updateContact(index, 'name', e.target.value)}
                              className="px-3 py-2 rounded-lg border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={contact.label}
                              onChange={(e) => updateContact(index, 'label', e.target.value)}
                              className="px-3 py-2 rounded-lg border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                              placeholder="Role/Label"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            className="ml-2 p-1 hover:bg-red-100 active:bg-red-200 rounded text-red-600 transition-colors"
                            title="Remove contact"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            value={contact.team}
                            onChange={(e) => updateContact(index, 'team', e.target.value)}
                            className="px-3 py-2 rounded-lg border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                            placeholder="Team"
                          />
                        </div>
                        <textarea
                          value={contact.reason}
                          onChange={(e) => updateContact(index, 'reason', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                          placeholder="When to contact this person"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <div className="h-4"></div>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-border bg-surface">
              <p className="text-xs text-text-muted">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPanel(false);
                    setIsEditMode(false);
                    setEditingSOP(null);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-text-secondary bg-background border border-border-strong rounded-xl hover:bg-surface active:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSOP}
                  disabled={!formValid}
                  className="px-5 py-2.5 text-sm font-medium text-accent-foreground bg-accent rounded-xl hover:bg-accent/90 active:bg-accent/80 disabled:bg-surface-3 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isEditMode ? 'Save Changes' : 'Save SOP'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}