'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  category: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  categoryLabel: string;
  description?: string;
}

export default function CalendarPage() {
  // Guarantee calendar page starts at the top
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
      } catch (e) {}
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const pc = document.querySelector('.page-content');
      if (pc) pc.scrollTop = 0;
    }
  }, []);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('10:00 AM');
  const [newEventCategory, setNewEventCategory] = useState<'primary' | 'success' | 'warning' | 'danger' | 'info'>('primary');
  const [newEventDesc, setNewEventDesc] = useState('');

  // Initial Sample Events for Industrial Safety & PPE
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Bulk PPE Shipment Arrival (3M Respirators)',
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-05`,
      time: '09:00 AM',
      category: 'primary',
      categoryLabel: 'Shipments',
      description: 'Port customs clearance and warehouse receiving of certified 3M masks.'
    },
    {
      id: '2',
      title: 'Monthly Safety & Fire Equipment Audit',
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-12`,
      time: '11:30 AM',
      category: 'danger',
      categoryLabel: 'Audits',
      description: 'Complete inspection of fire extinguishers, alarms, and emergency exits.'
    },
    {
      id: '3',
      title: 'Industrial Client Bulk Order Review (ARAMCO)',
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-18`,
      time: '02:00 PM',
      category: 'success',
      categoryLabel: 'Orders',
      description: 'Review contract requirements for high-visibility flame resistant uniforms.'
    },
    {
      id: '4',
      title: 'PPE Quality & EN Standard Certification Test',
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-24`,
      time: '10:00 AM',
      category: 'warning',
      categoryLabel: 'Testing',
      description: 'Sample batch tensile test on Kevlar safety gloves & harnesses.'
    },
    {
      id: '5',
      title: 'Warehouse Safety & Forklift Training Session',
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-28`,
      time: '03:30 PM',
      category: 'info',
      categoryLabel: 'Training',
      description: 'OSHA-compliant hazard management and safe material handling certification.'
    }
  ]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Generate calendar days
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarGrid = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarGrid.push({
      day: daysInPrevMonth - i,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    calendarGrid.push({
      day: d,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
      isToday:
        d === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear(),
    });
  }

  // Next month leading days to complete 35 or 42 grid slots
  const remainingSlots = (calendarGrid.length > 35 ? 42 : 35) - calendarGrid.length;
  for (let d = 1; d <= remainingSlots; d++) {
    calendarGrid.push({
      day: d,
      month: currentMonth === 11 ? 0 : currentMonth + 1,
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      isCurrentMonth: false,
    });
  }

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) return;

    const categoryLabelMap = {
      primary: 'Shipments',
      success: 'Orders',
      warning: 'Testing',
      danger: 'Audits',
      info: 'Training',
    };

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime,
      category: newEventCategory,
      categoryLabel: categoryLabelMap[newEventCategory],
      description: newEventDesc,
    };

    setEvents([...events, newEvent]);
    setShowEventModal(false);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventDesc('');
  };

  const filteredEvents = selectedCategory === 'all'
    ? events
    : events.filter((ev) => ev.category === selectedCategory);

  return (
    <div className="py-3">
      
      {/* Page Title & Breadcrumb */}
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between mb-3">
            <h4 className="mb-0 fs-18 fw-bold">Calendar &amp; Schedule</h4>
            <div className="page-title-right">
              <ol className="breadcrumb m-0 fs-13">
                <li className="breadcrumb-item">
                  <Link href="/dashboard" style={{ textDecoration: 'none' }}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">Calendar</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        
        {/* Left Column: Actions & Event Categories */}
        <div className="col-xl-3 col-lg-4">
          
          {/* Add Event Card */}
          <div className="card mb-3 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-3">
              <button
                type="button"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                onClick={() => {
                  setNewEventDate(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`);
                  setShowEventModal(true);
                }}
                style={{ fontWeight: '600', borderRadius: '8px' }}
              >
                <iconify-icon icon="solar:add-circle-broken" class="fs-20 align-middle"></iconify-icon>
                <span>Add Schedule Event</span>
              </button>
            </div>
          </div>

          {/* Event Filters */}
          <div className="card mb-3 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title mb-0 fs-15 fw-bold text-dark">Schedule Categories</h5>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`btn text-start d-flex align-items-center justify-content-between px-3 py-2 ${
                    selectedCategory === 'all' ? 'btn-primary' : 'btn-light'
                  }`}
                  style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    <span className="badge rounded-circle p-1 bg-white border"></span>
                    All Events
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary">{events.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('primary')}
                  className={`btn text-start d-flex align-items-center justify-content-between px-3 py-2 ${
                    selectedCategory === 'primary' ? 'btn-primary' : 'btn-light'
                  }`}
                  style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    <span className="badge rounded-circle p-1 bg-primary"></span>
                    PPE Shipments
                  </span>
                  <span className="badge bg-primary-subtle text-primary">
                    {events.filter((e) => e.category === 'primary').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('success')}
                  className={`btn text-start d-flex align-items-center justify-content-between px-3 py-2 ${
                    selectedCategory === 'success' ? 'btn-success text-white' : 'btn-light'
                  }`}
                  style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    <span className="badge rounded-circle p-1 bg-success"></span>
                    Orders &amp; Contracts
                  </span>
                  <span className="badge bg-success-subtle text-success">
                    {events.filter((e) => e.category === 'success').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('danger')}
                  className={`btn text-start d-flex align-items-center justify-content-between px-3 py-2 ${
                    selectedCategory === 'danger' ? 'btn-danger text-white' : 'btn-light'
                  }`}
                  style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    <span className="badge rounded-circle p-1 bg-danger"></span>
                    Safety Audits
                  </span>
                  <span className="badge bg-danger-subtle text-danger">
                    {events.filter((e) => e.category === 'danger').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('warning')}
                  className={`btn text-start d-flex align-items-center justify-content-between px-3 py-2 ${
                    selectedCategory === 'warning' ? 'btn-warning text-dark' : 'btn-light'
                  }`}
                  style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    <span className="badge rounded-circle p-1 bg-warning"></span>
                    Quality Certification
                  </span>
                  <span className="badge bg-warning-subtle text-warning">
                    {events.filter((e) => e.category === 'warning').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('info')}
                  className={`btn text-start d-flex align-items-center justify-content-between px-3 py-2 ${
                    selectedCategory === 'info' ? 'btn-info text-white' : 'btn-light'
                  }`}
                  style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    <span className="badge rounded-circle p-1 bg-info"></span>
                    Staff Safety Training
                  </span>
                  <span className="badge bg-info-subtle text-info">
                    {events.filter((e) => e.category === 'info').length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Schedule List */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title mb-0 fs-15 fw-bold text-dark">Upcoming Tasks</h5>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                {filteredEvents.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvent(item)}
                    style={{
                      cursor: 'pointer',
                      padding: '10px 12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      borderLeft: `4px solid var(--bs-${item.category})`,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className={`badge bg-${item.category}-subtle text-${item.category} fs-11`}>
                        {item.categoryLabel}
                      </span>
                      <small className="text-muted fs-11">{item.time}</small>
                    </div>
                    <p className="mb-0 fs-13 fw-semibold text-dark text-truncate">{item.title}</p>
                    <small className="text-muted fs-11">{item.date}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Month Calendar Grid */}
        <div className="col-xl-9 col-lg-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            
            {/* Calendar Controls Header */}
            <div className="card-header bg-white border-bottom py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                  onClick={prevMonth}
                  title="Previous Month"
                >
                  <iconify-icon icon="solar:alt-arrow-left-broken" class="fs-18"></iconify-icon>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                  onClick={nextMonth}
                  title="Next Month"
                >
                  <iconify-icon icon="solar:alt-arrow-right-broken" class="fs-18"></iconify-icon>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary fw-semibold"
                  onClick={goToToday}
                >
                  Today
                </button>
              </div>

              <h4 className="m-0 fs-18 fw-bold text-dark text-center">
                {monthNames[currentMonth]} {currentYear}
              </h4>

              <div className="d-flex align-items-center gap-1">
                <span className="badge bg-primary-subtle text-primary px-3 py-2 fw-semibold fs-12" style={{ borderRadius: '6px' }}>
                  Month View
                </span>
              </div>
            </div>

            {/* Calendar Grid Table */}
            <div className="card-body p-0">
              
              {/* Day Name Headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '13px',
                  color: '#475569',
                  padding: '10px 0'
                }}
              >
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Grid Cells */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  minHeight: '620px',
                  backgroundColor: '#ffffff'
                }}
              >
                {calendarGrid.map((slot, index) => {
                  const dateString = `${slot.year}-${String(slot.month + 1).padStart(2, '0')}-${String(slot.day).padStart(2, '0')}`;
                  const dayEvents = filteredEvents.filter((ev) => ev.date === dateString);

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setNewEventDate(dateString);
                        setShowEventModal(true);
                      }}
                      style={{
                        borderRight: '1px solid #f1f5f9',
                        borderBottom: '1px solid #f1f5f9',
                        padding: '8px',
                        backgroundColor: slot.isCurrentMonth
                          ? slot.isToday
                            ? '#f0fdf4'
                            : '#ffffff'
                          : '#fcfcfc',
                        opacity: slot.isCurrentMonth ? 1 : 0.45,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        minHeight: '100px'
                      }}
                      className="calendar-cell"
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: slot.isToday ? '700' : '600',
                            color: slot.isToday ? '#16a34a' : '#334155',
                            width: slot.isToday ? '24px' : 'auto',
                            height: slot.isToday ? '24px' : 'auto',
                            borderRadius: '50%',
                            backgroundColor: slot.isToday ? '#dcfce7' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {slot.day}
                        </span>
                        {slot.isToday && (
                          <span className="badge bg-success-subtle text-success fs-10">Today</span>
                        )}
                      </div>

                      {/* Event Badges */}
                      <div className="d-flex flex-column gap-1">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className={`badge bg-${ev.category} text-white text-truncate text-start px-2 py-1`}
                            style={{
                              fontSize: '11px',
                              fontWeight: '500',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title={`${ev.time || ''} - ${ev.title}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* ========================================================
          Event Details Modal
         ======================================================== */}
      {selectedEvent && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
          tabIndex={-1}
          onClick={() => setSelectedEvent(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
              <div className="modal-header border-bottom py-3">
                <span className={`badge bg-${selectedEvent.category} me-2 fs-12`}>
                  {selectedEvent.categoryLabel}
                </span>
                <h5 className="modal-title fs-16 fw-bold text-dark m-0">{selectedEvent.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body py-3">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="d-flex align-items-center gap-1 text-muted fs-13">
                    <iconify-icon icon="solar:calendar-broken" class="fs-18"></iconify-icon>
                    <span>{selectedEvent.date}</span>
                  </div>
                  {selectedEvent.time && (
                    <div className="d-flex align-items-center gap-1 text-muted fs-13">
                      <iconify-icon icon="solar:clock-circle-broken" class="fs-18"></iconify-icon>
                      <span>{selectedEvent.time}</span>
                    </div>
                  )}
                </div>
                {selectedEvent.description && (
                  <p className="text-secondary fs-14 mb-0" style={{ lineHeight: '1.6' }}>
                    {selectedEvent.description}
                  </p>
                )}
              </div>
              <div className="modal-footer border-top py-2">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    setEvents(events.filter((e) => e.id !== selectedEvent.id));
                    setSelectedEvent(null);
                  }}
                >
                  Delete Event
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          Add New Event Modal
         ======================================================== */}
      {showEventModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
          tabIndex={-1}
          onClick={() => setShowEventModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
              <form onSubmit={handleCreateEvent}>
                <div className="modal-header border-bottom py-3">
                  <h5 className="modal-title fs-16 fw-bold text-dark m-0">Create Schedule Event</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEventModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">Event Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Forklift Inspection & Warehouse Safety"
                      required
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13 fw-semibold text-dark">Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13 fw-semibold text-dark">Time</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="10:00 AM"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark">Category</label>
                    <select
                      className="form-select"
                      value={newEventCategory}
                      onChange={(e) => setNewEventCategory(e.target.value as any)}
                    >
                      <option value="primary">Blue - PPE Shipments &amp; Inventory</option>
                      <option value="success">Green - Client Orders &amp; Contracts</option>
                      <option value="danger">Red - Safety Audits &amp; Compliance</option>
                      <option value="warning">Yellow - Certification &amp; Testing</option>
                      <option value="info">Cyan - Training &amp; Meetings</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label fs-13 fw-semibold text-dark">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Add details, inspection checklist, or attendees..."
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top py-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowEventModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm fw-semibold">
                    Save Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
