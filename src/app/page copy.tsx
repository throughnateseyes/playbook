"use client";

import React, { useEffect, useRef, useState } from "react";

interface EdgeCase {
  title: string;
  description: string;
}

interface Escalation {
  when: string;
  contact: string;
}

interface Contact {
  label: string;
  name: string;
  team: string;
  reason: string;
}

interface SOP {
  id: string;
  title: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  overview: string;
  steps: string[];
  edgeCases: EdgeCase[];
  escalation: Escalation;
  contacts: Contact[];
  photos: string[];
}

const INITIAL_SOPS: SOP[] = [
  {
    id: '1',
    title: 'Emergency Maintenance Request',
    category: 'Operations',
    tags: ['Urgent', 'After-Hours'],
    lastUpdated: 'Updated 2 days ago',
    overview: 'Handle emergency maintenance requests that require immediate attention, including water leaks, heating/cooling failures, and electrical issues.',
    steps: [
      'Receive and log the emergency request in the system',
      'Assess severity and potential safety risks',
      'Contact on-call maintenance technician within 15 minutes',
      'Notify property manager if estimated cost exceeds $500',
      'Document all actions taken and time stamps',
      'Follow up with resident within 24 hours of resolution',
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
      'Confirm move-in date and time with resident 48 hours in advance',
      'Complete pre-move-in unit inspection with checklist',
      'Prepare welcome packet with keys, parking passes, and amenity access cards',
      'Conduct walk-through with resident, documenting any existing damage',
      'Review lease terms, community rules, and emergency procedures',
      'Provide contact information for maintenance and management',
      'Have resident sign move-in inspection form',
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
      'Verify rent payment grace period has expired (typically 5th of month)',
      'Check for pending ACH transfers or checks in mail',
      'Review lease agreement for specific late fee terms',
      'Apply late fee to resident account in property management system',
      'Send automated late payment notice via email and portal',
      'Document fee application with date and amount',
      'Monitor account for payment within next 10 days',
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
      'Log complaint with date, time, location, and nature of noise',
      'Review community quiet hours policy (typically 10 PM - 7 AM)',
      'Contact resident making noise via phone or door knock',
      'Issue verbal warning and document conversation',
      'Send follow-up email summarizing policy and expectation',
      'Check back with complainant within 48 hours',
      'Escalate if complaints continue after two warnings',
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
      'Accept packages from delivery personnel and verify unit number',
      'Log package in tracking system with date, carrier, and unit number',
      'Take photo of package label and tracking number',
      'Send automated notification to resident via email and text',
      'Store package in designated area organized by unit number',
      'Follow up if package not picked up within 7 days',
      'Maintain package log for 30 days after pickup',
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
      'Generate list of leases expiring in 90-120 days',
      'Review resident history for any issues or special circumstances',
      'Prepare renewal offers with current market rates and incentives',
      'Send initial renewal notice via email with online renewal option',
      'Follow up with phone call within 5 business days',
      'Schedule in-person meeting for residents who prefer face-to-face',
      'Document all communications and resident decisions',
      'Process renewal paperwork within 48 hours of acceptance',
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

export default function Home() {
  const [sops, setSops] = useState<SOP[]>(INITIAL_SOPS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Add this useEffect after other useEffects
  useEffect(() => {
    setFormValid(formData.title.trim().length > 0 && formData.category.trim().length > 0);
  }, [formData.title, formData.category]);

  const handleAskAI = () => {
    if (!question.trim() || !selectedSOP) return;

    setIsThinking(true);
    setAiResponse(null);

    setTimeout(() => {
      setAiResponse(
        `Based on "${selectedSOP.title}", you should start by reviewing: "${selectedSOP.steps[0]}". If this issue involves escalation, reference: "${selectedSOP.escalation.when}".`
      );
      setIsThinking(false);
    }, 800);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim() || !selectedSOP) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark key={index} className="bg-yellow-200 text-gray-900 rounded px-0.5" data-match="true">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

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
    if (!selectedSOP || !searchQuery.trim() || !detailContainerRef.current) {
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
  }, [searchQuery, selectedSOP]);

  useEffect(() => {
    if (selectedSOP && detailContainerRef.current) {
      detailContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedSOP?.id]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddPanel) {
        setShowAddPanel(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddPanel]);

  const filteredSOPs = sops.filter((sop) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    return (
      sop.title.toLowerCase().includes(query) ||
      sop.category.toLowerCase().includes(query) ||
      sop.tags.some(tag => tag.toLowerCase().includes(query)) ||
      sop.overview.toLowerCase().includes(query) ||
      sop.steps.some(step => step.toLowerCase().includes(query)) ||
      sop.edgeCases.some(ec => ec.title.toLowerCase().includes(query) || ec.description.toLowerCase().includes(query))
    );
  });

  const hasResults = filteredSOPs.length > 0;

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

    const newSOP: SOP = {
      id: String(Date.now()),
      title: formData.title,
      category: formData.category,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      lastUpdated: 'Just now',
      overview: formData.overview,
      steps: formData.steps.filter(s => s.trim()),
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
  };

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
    <div className="flex h-screen bg-gray-50 font-sans antialiased">
      <div className={["bg-white border-r border-gray-200 transition-all duration-200 ease-out flex flex-col", sidebarOpen ? "w-72" : "w-16"].join(" ")}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-gray-100 active:bg-gray-200 active:scale-95 rounded-lg p-2 transition-all"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-600">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {sidebarOpen && <span className="text-lg font-semibold text-gray-900 tracking-tight">Playbook</span>}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          {CATEGORIES.map((category) => {
            const categorySOPs = filteredSOPs.filter((sop) => sop.category === category);
            if (categorySOPs.length === 0) return null;

            return (
              <div key={category} className="mb-6">
                {sidebarOpen && (
                  <div className="px-3 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{category}</span>
                  </div>
                )}
                <div className="space-y-1">
                  {categorySOPs.map((sop) => {
                    const isSelected = selectedSOP?.id === sop.id;

                    return (
                      <button
                        key={sop.id}
                        onClick={() => setSelectedSOP(sop)}
                        className={[
                          "w-full text-left rounded-xl transition-all duration-150 relative overflow-hidden",
                          isSelected
                            ? "bg-blue-50 shadow-sm"
                            : "hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98]"
                        ].join(" ")}
                        title={!sidebarOpen ? sop.title : undefined}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />
                        )}
                        {sidebarOpen ? (
                          <div className={["px-3 py-3", isSelected ? "pl-4" : ""].join(" ")}>
                            <div className={["text-sm mb-1 leading-snug tracking-tight", isSelected ? "font-semibold text-gray-900" : "font-medium text-gray-800"].join(" ")}>
                              {sop.title}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">{sop.lastUpdated}</div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {sop.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center py-3" title={sop.title}>
                            <div className={["w-2 h-2 rounded-full", isSelected ? "bg-blue-500" : "bg-gray-300"].join(" ")} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {searchQuery && !hasResults && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-gray-500">No results found</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between h-16 shadow-sm">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                placeholder="Search playbook..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-24 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />

              {selectedSOP && searchQuery.trim() && totalMatches > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium">
                    {currentMatchIndex + 1} of {totalMatches}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollToMatch(currentMatchIndex - 1)}
                      className="p-1 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors"
                      title="Previous match (Shift+Enter)"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-600">
                        <path d="M6 9L3 6l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollToMatch(currentMatchIndex + 1)}
                      className="p-1 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors"
                      title="Next match (Cmd/Ctrl+Enter)"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-600">
                        <path d="M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowAddPanel(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add SOP
          </button>
        </div>

        <div ref={detailContainerRef} className="flex-1 overflow-y-auto">
          {selectedSOP ? (
            <div className="max-w-4xl mx-auto px-8 py-10">
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-semibold tracking-wide">
                    {selectedSOP.category}
                  </span>
                  {selectedSOP.tags.map((tag) => (
                    <span key={tag} className="text-xs text-gray-700 bg-gray-100 px-3 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight leading-tight">
                  {highlightText(selectedSOP.title, searchQuery)}
                </h1>
                <p className="text-sm text-gray-500">{selectedSOP.lastUpdated}</p>
              </div>

              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 tracking-tight">Overview</h2>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {highlightText(selectedSOP.overview, searchQuery)}
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">Steps</h2>
                  <div className="relative">
                    <div className="absolute left-[19px] top-8 bottom-8 w-px bg-gray-200"></div>
                    <div className="space-y-4">
                      {selectedSOP.steps.map((step, index) => (
                        <div
                          key={index}
                          className="relative flex gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md active:translate-y-[1px] transition-all duration-150 group cursor-pointer"
                        >
                          <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 border-blue-200 bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-semibold group-hover:border-blue-300 group-hover:bg-blue-100 transition-colors">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-base text-gray-800 leading-relaxed max-w-2xl">
                              {highlightText(step, searchQuery)}
                            </p>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                              <path d="M7 10h6m-3-3v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">Reference Materials</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedSOP.photos.map((photo, index) => (
                      <div key={index} className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-300 flex items-center justify-center p-4 text-center hover:border-gray-400 transition-colors">
                        <span className="text-sm text-gray-600 font-medium">{highlightText(photo, searchQuery)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">Edge Cases</h2>
                  <div className="space-y-4">
                    {selectedSOP.edgeCases.map((edge, index) => (
                      <div key={index} className="bg-amber-50 border border-amber-300 rounded-xl p-5 hover:bg-amber-100 transition-colors">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">{highlightText(edge.title, searchQuery)}</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{highlightText(edge.description, searchQuery)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">When to Escalate</h2>
                  <div className="bg-red-50 border border-red-300 rounded-xl p-6 mb-8">
                    <p className="text-base text-gray-900 mb-3 leading-relaxed">
                      <strong className="font-semibold">When:</strong> {highlightText(selectedSOP.escalation.when, searchQuery)}
                    </p>
                    <p className="text-base text-gray-900 leading-relaxed">
                      <strong className="font-semibold">Contact:</strong> {highlightText(selectedSOP.escalation.contact, searchQuery)}
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Helpful Contacts</h3>
                  <div className="space-y-3">
                    {selectedSOP.contacts.map((contact, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{contact.name}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-700">{contact.label}</span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{contact.team}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{contact.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <div className="bg-white border border-gray-300 rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-600">
                        <path d="M8 11v-1m0-4V3m0 8h.01M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
                      Ask About This Procedure
                    </h2>
                  </div>

                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      placeholder="Example: What if the resident is not home?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                    <button
                      onClick={handleAskAI}
                      disabled={!question.trim()}
                      className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      Ask
                    </button>
                  </div>

                  {isThinking && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Thinking...</span>
                    </div>
                  )}

                  {aiResponse && (
                    <div className="mt-4 p-5 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {aiResponse}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 tracking-tight">Select a procedure</h3>
                <p className="text-sm text-gray-600">Choose an SOP from the sidebar to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setShowAddPanel(false)}
          ></div>

          <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">Create New SOP</h2>
                  <p className="text-sm text-gray-600">Define a new standard operating procedure for your team</p>
                </div>
                <button
                  onClick={() => setShowAddPanel(false)}
                  className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors ml-4"
                  aria-label="Close panel"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-600">
                    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="space-y-8">
                {/* Basic Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">1</span>
                    Basic Information
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter SOP title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Tags</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Urgent, After-Hours"
                      />
                      <p className="mt-2 text-xs text-gray-500">Separate multiple tags with commas</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Overview</label>
                      <textarea
                        value={formData.overview}
                        onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief overview of this procedure"
                      />
                    </div>
                  </div>
                </section>

                <div className="border-t border-gray-200"></div>

                {/* Steps */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
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
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <textarea
                            value={step}
                            onChange={(e) => updateStep(index, e.target.value)}
                            rows={2}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Describe this step"
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => moveStep(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-200 active:bg-gray-300 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move up"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-600">
                                <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStep(index, 'down')}
                              disabled={index === formData.steps.length - 1}
                              className="p-1 hover:bg-gray-200 active:bg-gray-300 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move down"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-600">
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

                <div className="border-t border-gray-200"></div>

                {/* Edge Cases */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
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
                            className="flex-1 px-3 py-2 rounded-lg border border-amber-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
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
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                          placeholder="Description"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <div className="border-t border-gray-200"></div>

                {/* Escalation */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">4</span>
                    Escalation
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">When to Escalate</label>
                      <textarea
                        value={formData.escalationWhen}
                        onChange={(e) => setFormData({ ...formData, escalationWhen: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe escalation criteria"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Primary Contact</label>
                      <input
                        type="text"
                        value={formData.escalationContact}
                        onChange={(e) => setFormData({ ...formData, escalationContact: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Contact name and phone"
                      />
                    </div>
                  </div>
                </section>

                <div className="border-t border-gray-200"></div>

                {/* Additional Contacts */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
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
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={contact.name}
                              onChange={(e) => updateContact(index, 'name', e.target.value)}
                              className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={contact.label}
                              onChange={(e) => updateContact(index, 'label', e.target.value)}
                              className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Team"
                          />
                        </div>
                        <textarea
                          value={contact.reason}
                          onChange={(e) => updateContact(index, 'reason', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="When to contact this person"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Bottom spacing for sticky footer */}
                <div className="h-4"></div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPanel(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSOP}
                  disabled={!formValid}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Save SOP
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}