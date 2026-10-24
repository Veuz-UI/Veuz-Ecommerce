'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setIsSearching(true);
    setSearched(true);

    setTimeout(() => {
      setIsSearching(false);
      // Demo response for valid track
      setTrackingResult({
        orderNumber: orderId.trim().toUpperCase(),
        estimatedDelivery: 'Oct 26, 2026 (Before 5:00 PM)',
        destination: 'Khobar Shamaliya, Saudi Arabia',
        carrier: 'Veuz Express Safety Logistics',
        trackingNumber: 'VX-98234812-SA',
        currentStep: 3, // 1: Placed, 2: Packed, 3: In Transit, 4: Delivered
        steps: [
          { title: 'Order Confirmed', date: 'Oct 23, 2026 - 10:15 AM', done: true },
          { title: 'Quality Inspection & Packed', date: 'Oct 23, 2026 - 02:40 PM', done: true },
          { title: 'In Transit / Courier Dispatched', date: 'Oct 24, 2026 - 08:30 AM', done: true },
          { title: 'Out For Delivery', date: 'Expected Oct 26, 2026', done: false },
        ],
        items: [
          { name: 'Vented Industrial Safety Helmet (ABS Shell)', qty: 4, status: 'In Transit' },
          { name: 'Level 5 Cut Resistant Work Gloves', qty: 10, status: 'In Transit' },
          { name: 'Dielectric Anti-Static Safety Boots', qty: 2, status: 'In Transit' },
        ],
      });
    }, 500);
  };

  const loadDemoOrder = () => {
    setOrderId('ORD-89241');
    setContactInfo('client@safety-contracting.com');
  };

  return (
    <div className="page-content pt-4 pb-60">
      <div className="container">
        {/* Breadcrumb */}
        <div className="mb-4">
          <nav className="d-flex align-items-center gap-2 text-muted fs-13">
            <Link href="/" className="text-muted text-decoration-none hover-primary">
              Home
            </Link>
            <span>/</span>
            <span className="fw-semibold text-dark">Order Tracking</span>
          </nav>
        </div>

        {/* Hero Banner */}
        <div className="text-center mb-5">
          <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2 fw-bold mb-2">
            REAL-TIME DISPATCH TRACKER
          </span>
          <h1 className="fw-black text-dark display-6 mb-2">Track Your Safety Shipment</h1>
          <p className="text-muted fs-15 max-w-600 mx-auto" style={{ maxWidth: '600px' }}>
            Enter your Order ID and associated billing email or mobile number to view real-time courier milestone updates.
          </p>
        </div>

        {/* Search Box */}
        <div className="row justify-content-center mb-5">
          <div className="col-lg-8 col-xl-7">
            <div className="p-4 p-md-5 rounded-4 bg-white border shadow-sm">
              <form onSubmit={handleTrack} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fs-13 fw-semibold text-dark">Order ID / Reference Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ORD-89241"
                    className="form-control py-2 fs-14 text-uppercase"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13 fw-semibold text-dark">Billing Email or Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. user@email.com or +966..."
                    className="form-control py-2 fs-14"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                  />
                </div>
                <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4">
                  <button
                    type="button"
                    onClick={loadDemoOrder}
                    className="btn btn-link text-decoration-none p-0 fs-13 text-primary fw-semibold"
                  >
                    Quick Fill Demo Order (ORD-89241)
                  </button>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="btn btn-primary px-5 py-2 fw-bold rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                    style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                  >
                    {isSearching ? (
                      <span>Searching courier records...</span>
                    ) : (
                      <>
                        <span>Track Shipment</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Tracking Results Card */}
        {searched && trackingResult && (
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="p-4 p-md-5 rounded-4 bg-white border shadow-sm mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between border-bottom pb-4 mb-4 gap-3">
                  <div>
                    <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill mb-2">
                      STATUS: IN TRANSIT
                    </span>
                    <h3 className="fw-black text-dark mb-1">Order #{trackingResult.orderNumber}</h3>
                    <div className="text-muted fs-13">
                      Courier: <strong>{trackingResult.carrier}</strong> | Waybill: <strong>{trackingResult.trackingNumber}</strong>
                    </div>
                  </div>
                  <div className="text-md-end">
                    <div className="text-muted fs-12 text-uppercase fw-semibold">Estimated Delivery</div>
                    <div className="fw-bold text-primary fs-16">{trackingResult.estimatedDelivery}</div>
                    <div className="text-muted fs-13">{trackingResult.destination}</div>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="row g-3 mb-4">
                  {trackingResult.steps.map((st: any, i: number) => (
                    <div key={i} className="col-md-3 col-6 text-center">
                      <div
                        className="mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: st.done ? '#0284c7' : '#e2e8f0',
                          color: st.done ? '#ffffff' : '#64748b',
                        }}
                      >
                        {st.done ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span className="fw-bold fs-13">{i + 1}</span>
                        )}
                      </div>
                      <h6 className={`fw-bold fs-13 mb-1 ${st.done ? 'text-dark' : 'text-muted'}`}>{st.title}</h6>
                      <span className="text-muted fs-11">{st.date}</span>
                    </div>
                  ))}
                </div>

                {/* Shipment Items */}
                <div className="bg-light p-4 rounded-3">
                  <h6 className="fw-bold text-dark mb-3">Items in this Package</h6>
                  <ul className="list-unstyled mb-0">
                    {trackingResult.items.map((item: any, idx: number) => (
                      <li key={idx} className="d-flex align-items-center justify-content-between py-2 border-bottom border-secondary border-opacity-10 fs-14">
                        <span className="text-dark fw-medium">{item.name}</span>
                        <div className="d-flex align-items-center gap-3">
                          <span className="text-muted">Qty: {item.qty}</span>
                          <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold">{item.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
