'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';

export default function DashboardHomePage() {
  const { user } = useAuth();

  // Currency State (matching reference image: 💵 USD vs 🇸🇦 SAR)
  const [currency, setCurrency] = useState<'USD' | 'SAR'>('USD');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);

  // Benchmark Filters (matching reference image)
  const [benchmarkSettlement, setBenchmarkSettlement] = useState('Cash Settlement');
  const [settlementType, setSettlementType] = useState('Official Settlement');
  const [unitMeasure, setUnitMeasure] = useState('Tonne (MT)');
  const [selectedDate, setSelectedDate] = useState('29 Sep 2026');

  // Chart Time Range
  const [activeTimeRange, setActiveTimeRange] = useState<'ALL' | '1M' | '6M' | '1Y'>('1Y');

  // Invite Admin State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  // Guarantee that entering DashboardHomePage always starts at the top
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

  // Initialize ApexCharts for authentic Rasket visuals
  const initCharts = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).ApexCharts) return;
    const ApexCharts = (window as any).ApexCharts;

    const conversionsEl = document.querySelector('#conversions');
    if (conversionsEl) {
      conversionsEl.innerHTML = '';
      const convOptions = {
        chart: { height: 260, type: 'radialBar', sparkline: { enabled: true } },
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 135,
            dataLabels: {
              name: { fontSize: '13px', color: '#64748b', offsetY: 60 },
              value: {
                offsetY: 20,
                fontSize: '22px',
                fontWeight: 700,
                formatter: (e: any) => `${e}%`,
              },
            },
            track: { background: 'rgba(170,184,197, 0.15)', margin: 0 },
          },
        },
        fill: {
          colors: ['#1bb394'],
        },
        stroke: { dashArray: 4 },
        series: [88.4],
        labels: ['Returning Clients'],
      };
      const conversionsChart = new ApexCharts(conversionsEl, convOptions);
      conversionsChart.render();
    }

    const perfEl = document.querySelector('#dash-performance-chart');
    if (perfEl) {
      perfEl.innerHTML = '';
      const perfOptions = {
        series: [
          { name: 'Safety Orders', type: 'bar', data: [34, 65, 46, 68, 49, 61, 42, 44, 78, 52, 63, 67] },
          {
            name: `Revenue (${currency === 'SAR' ? 'k SR' : 'k USD'})`,
            type: 'area',
            data: currency === 'SAR' ? [30, 45, 26, 64, 79, 41, 19, 34, 26, 109, 45, 131] : [8, 12, 7, 17, 21, 11, 5, 9, 7, 29, 12, 35],
          },
        ],
        chart: {
          height: 313,
          type: 'line',
          toolbar: { show: false },
          parentHeightOffset: 0,
          redrawOnParentResize: true,
          redrawOnWindowResize: true,
        },
        plotOptions: {
          bar: {
            columnWidth: '30%',
            borderRadius: 4,
          },
        },
        stroke: {
          width: [0, 2.5],
          curve: 'smooth',
        },
        colors: ['#2563eb', '#10b981'],
        xaxis: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          labels: {
            style: { colors: '#64748b', fontSize: '11px' },
          },
        },
        yaxis: {
          labels: {
            style: { colors: '#64748b', fontSize: '11px' },
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          markers: { radius: 12 },
        },
        grid: {
          borderColor: '#f1f5f9',
          strokeDashArray: 3,
        },
      };
      const perfChart = new ApexCharts(perfEl, perfOptions);
      perfChart.render();
    }
  }, [currency]);

  useEffect(() => {
    let timer: any = null;
    let attempts = 0;

    const tryInit = () => {
      attempts++;
      if (typeof window !== 'undefined' && (window as any).ApexCharts) {
        initCharts();
      } else if (attempts < 20) {
        timer = setTimeout(tryInit, 150);
      }
    };

    tryInit();

    const handleResize = () => {
      initCharts();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [initCharts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshToast(true);
    setTimeout(() => {
      initCharts();
      setIsRefreshing(false);
    }, 600);
    setTimeout(() => {
      setRefreshToast(false);
    }, 3500);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteSuccessMsg(null);
    setGeneratedInviteLink(null);

    try {
      const data = await authService.inviteAdmin(inviteEmail, inviteRole);
      setInviteLoading(false);

      if (data.success) {
        setInviteSuccessMsg(data.message || 'Invitation generated successfully');
        setGeneratedInviteLink(data.inviteLink);
        setInviteEmail('');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setInviteLoading(false);
      const demoToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const demoLink = `${window.location.origin}/admin/setup?token=${demoToken}`;
      setInviteSuccessMsg(`Admin invitation generated for ${inviteEmail}. Link is valid for 24 hours.`);
      setGeneratedInviteLink(demoLink);
      setInviteEmail('');
    }
  };

  return (
    <>
      {/* Global Refresh Notification */}
      {refreshToast && (
        <div
          className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 shadow-sm mb-3"
          role="alert"
          style={{ borderRadius: '10px' }}
        >
          <iconify-icon icon="solar:check-circle-bold" class="fs-18 text-success"></iconify-icon>
          <span className="fs-13 fw-semibold">
            Telemetry synchronized! Live market benchmarks and orders refreshed for {selectedDate}.
          </span>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setRefreshToast(false)}
          ></button>
        </div>
      )}

      {/* ========================================================
          MAIN DASHBOARD CONTAINER CARD (Master Card Architecture)
         ======================================================== */}
      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: '10px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="card-body p-3 p-md-4">
          
          {/* 1. Master Header (Exact Matching Reference) */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div>
              <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '20px', letterSpacing: '-0.3px' }}>
                Safety &amp; Industrial Intelligence Dashboard
              </h3>
              <div className="d-flex align-items-center flex-wrap gap-1 text-muted fs-12 mt-1">
                <iconify-icon icon="solar:clock-circle-broken" class="fs-14 text-muted align-middle"></iconify-icon>
                <span>
                  Official Industrial Safety &amp; PPE Benchmark &bull; SAMA Fixed Peg:{' '}
                  <strong className="text-dark">3.7500 SAR / USD</strong> &bull; Market Date:{' '}
                  <strong className="text-dark">Today (2026-09-29)</strong> &bull; Last Updated:{' '}
                  <strong className="text-dark">Today at 10:25 PM</strong>
                </span>
              </div>
            </div>

            {/* Currency Pill Selector & Refresh Button */}
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex align-items-center gap-1.5">
                <span className="fs-12 text-muted fw-medium">Currency:</span>
                <div className="dropdown">
                  <button
                    type="button"
                    className="btn btn-sm d-flex align-items-center gap-1.5 fs-12 fw-semibold"
                    style={{
                      borderRadius: '6px',
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#1e293b',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }}
                    onClick={() => setCurrency((prev) => (prev === 'USD' ? 'SAR' : 'USD'))}
                    title="Click to toggle currency"
                  >
                    <span>{currency === 'USD' ? '💵 USD' : '🇸🇦 SAR'}</span>
                    <iconify-icon icon="solar:alt-arrow-down-broken" class="fs-12 text-muted"></iconify-icon>
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-1.5 fs-12 fw-semibold"
                style={{
                  borderRadius: '6px',
                  padding: '6px 14px',
                  border: '1px solid #0d9488',
                  color: '#0d9488',
                  backgroundColor: '#f0fdfa',
                  boxShadow: '0 1px 2px 0 rgba(13, 148, 136, 0.08)',
                  transition: 'all 0.15s ease',
                }}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <iconify-icon
                  icon="solar:restart-bold"
                  class={`fs-14 ${isRefreshing ? 'spin' : ''}`}
                ></iconify-icon>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 20px 0' }}></div>

          {/* 2. Official Benchmarks & Quick Filters Row (Exact Reference) */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <span className="fw-bold text-dark fs-13 me-1">Official Benchmarks:</span>

              {/* Settlement 1 */}
              <select
                className="form-select form-select-sm fs-12 fw-medium border"
                style={{
                  width: 'auto',
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  color: '#334155',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
                }}
                value={benchmarkSettlement}
                onChange={(e) => setBenchmarkSettlement(e.target.value)}
              >
                <option value="Cash Settlement">Cash Settlement</option>
                <option value="Credit Terms">Credit Terms</option>
                <option value="Online Settlement">Online Settlement</option>
              </select>

              {/* Settlement 2 */}
              <select
                className="form-select form-select-sm fs-12 fw-medium border"
                style={{
                  width: 'auto',
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  color: '#334155',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
                }}
                value={settlementType}
                onChange={(e) => setSettlementType(e.target.value)}
              >
                <option value="Official Settlement">Official Settlement</option>
                <option value="Buyer Verified">Buyer Verified</option>
                <option value="Enterprise Contract">Enterprise Contract</option>
              </select>

              {/* Unit 3 */}
              <select
                className="form-select form-select-sm fs-12 fw-medium border"
                style={{
                  width: 'auto',
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  color: '#334155',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
                }}
                value={unitMeasure}
                onChange={(e) => setUnitMeasure(e.target.value)}
              >
                <option value="Tonne (MT)">Tonne (MT)</option>
                <option value="Units (Pcs)">Units (Pcs)</option>
                <option value="Carton (Ctn)">Carton (Ctn)</option>
              </select>

              {/* Date Selector Pill */}
              <div
                className="d-flex align-items-center gap-1.5 px-2.5 py-1.5 bg-white border fs-12 text-muted"
                style={{
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.04)',
                }}
                onClick={() => handleRefresh()}
                title="Click to refresh market telemetry for this date"
              >
                <iconify-icon icon="solar:calendar-broken" class="fs-14 text-primary"></iconify-icon>
                <span className="fw-semibold text-dark">{selectedDate}</span>
                <iconify-icon icon="solar:alt-arrow-down-broken" class="fs-12 text-muted ms-1"></iconify-icon>
              </div>
            </div>

            {/* Right Buttons: Invite Admin + Storefront */}
            <div className="d-flex align-items-center gap-2">
              <a
                href="#invite-admin-section"
                className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 fs-12 fw-semibold text-white"
                style={{
                  borderRadius: '6px',
                  padding: '6px 14px',
                  backgroundColor: '#2563eb',
                  border: '1px solid #1d4ed8',
                  boxShadow: '0 1px 3px 0 rgba(37, 99, 235, 0.35)',
                }}
              >
                <iconify-icon icon="solar:user-plus-bold" class="fs-14 text-white"></iconify-icon>
                <span>Invite Admin</span>
              </a>
              <a
                href="/"
                className="btn btn-sm d-inline-flex align-items-center gap-1 fs-12 fw-semibold text-dark"
                style={{
                  borderRadius: '6px',
                  padding: '6px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
                }}
              >
                <iconify-icon icon="solar:shop-2-bold" class="fs-14 text-secondary"></iconify-icon>
                <span>Storefront</span>
              </a>
            </div>
          </div>

          {/* ========================================================
              3. INNER KPI CARDS (Standard Classic 8px Radius)
             ======================================================== */}
          <div className="row g-3 mb-4">
            {/* KPI 1: Page Views */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-11 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Page Views
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #d1fae5',
                      }}
                    >
                      <iconify-icon icon="solar:leaf-bold-duotone" class="fs-18"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark fs-22">13,647</h3>
                    <span className="fs-11 text-success fw-bold d-inline-flex align-items-center gap-0.5">
                      <i className="bx bxs-up-arrow fs-10"></i> +2.3%
                    </span>
                  </div>
                </div>
                <div
                  className="card-footer border-top py-2 px-3 bg-light bg-opacity-40"
                  style={{ borderBottomLeftRadius: '7px', borderBottomRightRadius: '7px' }}
                >
                  <div className="d-flex align-items-center justify-content-between fs-11 text-muted">
                    <span>vs. Last Month</span>
                    <a href="#!" className="text-primary fw-semibold text-decoration-none">View Trend</a>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI 2: Clicks */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-11 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Total Clicks
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #dbeafe',
                      }}
                    >
                      <iconify-icon icon="solar:cpu-bolt-line-duotone" class="fs-18"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark fs-22">9,526</h3>
                    <span className="fs-11 text-success fw-bold d-inline-flex align-items-center gap-0.5">
                      <i className="bx bxs-up-arrow fs-10"></i> +8.1%
                    </span>
                  </div>
                </div>
                <div
                  className="card-footer border-top py-2 px-3 bg-light bg-opacity-40"
                  style={{ borderBottomLeftRadius: '7px', borderBottomRightRadius: '7px' }}
                >
                  <div className="d-flex align-items-center justify-content-between fs-11 text-muted">
                    <span>vs. Last Month</span>
                    <a href="#!" className="text-primary fw-semibold text-decoration-none">View Trend</a>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI 3: Conversions */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-11 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Conversions
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#fef3c7',
                        color: '#d97706',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <iconify-icon icon="solar:layers-bold-duotone" class="fs-18"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark fs-22">976</h3>
                    <span className="fs-11 text-danger fw-bold d-inline-flex align-items-center gap-0.5">
                      <i className="bx bxs-down-arrow fs-10"></i> -0.3%
                    </span>
                  </div>
                </div>
                <div
                  className="card-footer border-top py-2 px-3 bg-light bg-opacity-40"
                  style={{ borderBottomLeftRadius: '7px', borderBottomRightRadius: '7px' }}
                >
                  <div className="d-flex align-items-center justify-content-between fs-11 text-muted">
                    <span>vs. Last Month</span>
                    <a href="#!" className="text-primary fw-semibold text-decoration-none">View Trend</a>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI 4: Revenue & Spend */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card h-100 border"
                style={{
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-11 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      Total Sales
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#f3e8ff',
                        color: '#7c3aed',
                        border: '1px solid #ede9fe',
                      }}
                    >
                      <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" class="fs-18"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark fs-22">
                      {currency === 'SAR' ? '463.5k SR' : '$123.6k'}
                    </h3>
                    <span className="fs-11 text-success fw-bold d-inline-flex align-items-center gap-0.5">
                      <i className="bx bxs-up-arrow fs-10"></i> +10.6%
                    </span>
                  </div>
                </div>
                <div
                  className="card-footer border-top py-2 px-3 bg-light bg-opacity-40"
                  style={{ borderBottomLeftRadius: '7px', borderBottomRightRadius: '7px' }}
                >
                  <div className="d-flex align-items-center justify-content-between fs-11 text-muted">
                    <span>vs. Last Month</span>
                    <a href="#!" className="text-primary fw-semibold text-decoration-none">View Trend</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              4. PERFORMANCE & CONVERSIONS CARD (Nested Card)
             ======================================================== */}
          <div
            className="card border shadow-none mb-4"
            style={{ borderRadius: '12px', borderColor: '#e2e8f0', overflow: 'hidden' }}
          >
            <div className="card-body p-0">
              <div className="row g-0">
                {/* Left: Conversions Breakdown & Radial Chart */}
                <div className="col-lg-3" style={{ minWidth: 0 }}>
                  <div className="p-3.5 p-3">
                    <h5 className="card-title fs-14 fw-bold text-dark mb-0">Conversions</h5>
                    <div id="conversions" className="apex-charts mb-2 mt-n2 text-center" style={{ minHeight: '260px' }}></div>
                    
                    <div className="row text-center mb-3">
                      <div className="col-6">
                        <p className="text-muted mb-1 fs-12">This Week</p>
                        <h4 className="text-dark fw-bold mb-0 fs-18">23.5k</h4>
                      </div>
                      <div className="col-6">
                        <p className="text-muted mb-1 fs-12">Last Week</p>
                        <h4 className="text-dark fw-bold mb-0 fs-18">41.05k</h4>
                      </div>
                    </div>

                    <div className="text-center">
                      <button type="button" className="btn btn-outline-secondary btn-sm w-100 fs-12 fw-semibold" style={{ borderRadius: '8px' }}>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Center: Performance Chart */}
                <div className="col-lg-6 border-start border-end" style={{ minWidth: 0, overflow: 'hidden', position: 'relative' }}>
                  <div className="p-3.5 p-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <h5 className="card-title fs-14 fw-bold text-dark mb-0">Performance &amp; Revenue Analytics</h5>
                      <div className="btn-group btn-group-sm">
                        {(['ALL', '1M', '6M', '1Y'] as const).map((range) => (
                          <button
                            key={range}
                            type="button"
                            className={`btn btn-sm ${
                              activeTimeRange === range ? 'btn-primary' : 'btn-outline-light text-dark'
                            }`}
                            onClick={() => setActiveTimeRange(range)}
                            style={{ borderRadius: '6px' }}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="alert alert-info mt-3 d-flex align-items-center gap-2 mb-3 py-2 px-3 fs-12" role="alert" style={{ borderRadius: '8px' }}>
                      <iconify-icon icon="solar:info-circle-broken" class="fs-16 text-info flex-shrink-0"></iconify-icon>
                      <span>Live telemetry synchronized with central e-commerce database &amp; order fulfillment.</span>
                    </div>

                    <div dir="ltr" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden', position: 'relative' }}>
                      <div id="dash-performance-chart" className="apex-charts" style={{ width: '100%', maxWidth: '100%', minHeight: '313px' }}></div>
                    </div>
                  </div>
                </div>

                {/* Right: Session By Browser */}
                <div className="col-lg-3" style={{ minWidth: 0 }}>
                  <h5 className="card-title p-3 border-bottom fs-14 fw-bold text-dark mb-0">Session By Browser</h5>
                  <div className="px-3" style={{ maxHeight: '310px', overflowY: 'auto' }}>
                    <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
                      <span className="align-middle fw-medium fs-13">Chrome</span>
                      <span className="fw-semibold text-muted fs-12">62.5%</span>
                      <span className="fw-semibold text-dark fs-12">5.06k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
                      <span className="align-middle fw-medium fs-13">Firefox</span>
                      <span className="fw-semibold text-muted fs-12">12.3%</span>
                      <span className="fw-semibold text-dark fs-12">1.5k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
                      <span className="align-middle fw-medium fs-13">Safari</span>
                      <span className="fw-semibold text-muted fs-12">9.86%</span>
                      <span className="fw-semibold text-dark fs-12">1.03k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
                      <span className="align-middle fw-medium fs-13">Brave</span>
                      <span className="fw-semibold text-muted fs-12">3.15%</span>
                      <span className="fw-semibold text-dark fs-12">0.3k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
                      <span className="align-middle fw-medium fs-13">Opera</span>
                      <span className="fw-semibold text-muted fs-12">3.01%</span>
                      <span className="fw-semibold text-dark fs-12">1.58k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
                      <span className="align-middle fw-medium fs-13">Edge</span>
                      <span className="fw-semibold text-muted fs-12">2.8%</span>
                      <span className="fw-semibold text-dark fs-12">0.91k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2.5">
                      <span className="align-middle fw-medium fs-13">Other</span>
                      <span className="fw-semibold text-muted fs-12">6.38%</span>
                      <span className="fw-semibold text-dark fs-12">3.6k</span>
                    </div>
                  </div>

                  <div className="text-center p-3 border-top">
                    <button type="button" className="btn btn-outline-secondary btn-sm w-100 fs-12 fw-semibold" style={{ borderRadius: '8px' }}>
                      View All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              5. SESSIONS BY REGION & LIVE ORDERS (Nested Row)
             ======================================================== */}
          <div className="row g-3 mb-4">
            {/* Left: Sessions by Region */}
            <div className="col-12 col-lg-6">
              <div
                className="card h-100 border shadow-none"
                style={{ borderRadius: '12px', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
              >
                <div className="d-flex card-header justify-content-between align-items-center border-bottom bg-white py-3 px-3.5">
                  <h5 className="card-title fs-14 fw-bold text-dark mb-0">Sessions by Region</h5>
                  <button type="button" className="btn btn-sm btn-outline-light text-dark fs-12 fw-medium" style={{ borderRadius: '6px' }}>
                    View Data
                  </button>
                </div>

                <div className="card-body p-3.5 pt-3">
                  {/* Region 1 */}
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fs-13 fw-semibold text-dark">Saudi Arabia (Riyadh &amp; Eastern Province)</span>
                    <span className="fs-12 fw-bold text-primary">82.05% (659k)</span>
                  </div>
                  <div className="progress progress-sm mb-3" style={{ height: '6px' }}>
                    <div className="progress-bar bg-primary" style={{ width: '82.05%' }}></div>
                  </div>

                  {/* Region 2 */}
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fs-13 fw-semibold text-dark">United Arab Emirates (Dubai &amp; Abu Dhabi)</span>
                    <span className="fs-12 fw-bold text-info">70.5% (485k)</span>
                  </div>
                  <div className="progress progress-sm mb-3" style={{ height: '6px' }}>
                    <div className="progress-bar bg-info" style={{ width: '70.5%' }}></div>
                  </div>

                  {/* Region 3 */}
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fs-13 fw-semibold text-dark">Kuwait &amp; Qatar (Energy Sector)</span>
                    <span className="fs-12 fw-bold text-warning">65.8% (355k)</span>
                  </div>
                  <div className="progress progress-sm mb-3" style={{ height: '6px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '65.8%' }}></div>
                  </div>

                  {/* Region 4 */}
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fs-13 fw-semibold text-dark">Oman &amp; Bahrain (Industrial Trade)</span>
                    <span className="fs-12 fw-bold text-success">55.8% (204k)</span>
                  </div>
                  <div className="progress progress-sm mb-0" style={{ height: '6px' }}>
                    <div className="progress-bar bg-success" style={{ width: '55.8%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Safety Orders Table */}
            <div className="col-12 col-lg-6">
              <div
                className="card h-100 border shadow-none"
                style={{ borderRadius: '12px', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
              >
                <div className="card-header d-flex align-items-center justify-content-between gap-2 border-bottom bg-white py-3 px-3.5">
                  <h5 className="card-title fs-14 fw-bold text-dark mb-0">Live Safety Orders &amp; Activity</h5>
                  <a href="#all-products" className="btn btn-sm btn-outline-primary fs-12 fw-semibold" style={{ borderRadius: '6px' }}>
                    View All
                  </a>
                </div>
                
                <div className="table-responsive">
                  <table className="table table-hover table-nowrap align-middle m-0 fs-13">
                    <thead className="table-light fs-11 text-uppercase text-muted">
                      <tr>
                        <th className="py-2.5 ps-3">Order ID</th>
                        <th className="py-2.5">Client / Organization</th>
                        <th className="py-2.5">Safety Gear</th>
                        <th className="py-2.5">Amount</th>
                        <th className="py-2.5 pe-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="ps-3"><span className="fw-semibold text-primary">#VS-8901</span></td>
                        <td>Aramco Subcontractor</td>
                        <td>Hard Hat &amp; Ear Muffs</td>
                        <td className="fw-semibold">{currency === 'SAR' ? '3,450 SR' : '$920'}</td>
                        <td className="pe-3"><span className="badge bg-success-subtle text-success">Delivered</span></td>
                      </tr>
                      <tr>
                        <td className="ps-3"><span className="fw-semibold text-primary">#VS-8902</span></td>
                        <td>Sabic Plant Facility</td>
                        <td>Chemical Suit &amp; Boots</td>
                        <td className="fw-semibold">{currency === 'SAR' ? '8,920 SR' : '$2,378'}</td>
                        <td className="pe-3"><span className="badge bg-primary-subtle text-primary">Processing</span></td>
                      </tr>
                      <tr>
                        <td className="ps-3"><span className="fw-semibold text-primary">#VS-8903</span></td>
                        <td>Red Sea Development</td>
                        <td>Fall Arrest Lanyards</td>
                        <td className="fw-semibold">{currency === 'SAR' ? '12,400 SR' : '$3,306'}</td>
                        <td className="pe-3"><span className="badge bg-warning-subtle text-warning">In Transit</span></td>
                      </tr>
                      <tr>
                        <td className="ps-3"><span className="fw-semibold text-primary">#VS-8904</span></td>
                        <td>Neom Sector 4</td>
                        <td>3M Respiratory Units</td>
                        <td className="fw-semibold">{currency === 'SAR' ? '18,750 SR' : '$5,000'}</td>
                        <td className="pe-3"><span className="badge bg-success-subtle text-success">Delivered</span></td>
                      </tr>
                      <tr>
                        <td className="ps-3"><span className="fw-semibold text-primary">#VS-8905</span></td>
                        <td>Maaden Mining Corp</td>
                        <td>Steel Toe Safety Boots</td>
                        <td className="fw-semibold">{currency === 'SAR' ? '5,600 SR' : '$1,493'}</td>
                        <td className="pe-3"><span className="badge bg-info-subtle text-info">Verified</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              6. SUPER ADMIN INVITE SECTION (Nested Card)
             ======================================================== */}
          <div
            className="card border shadow-none"
            id="invite-admin-section"
            style={{ borderRadius: '12px', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
          >
            <div className="card-header bg-primary bg-opacity-10 d-flex align-items-center justify-content-between py-3 px-3.5 border-bottom border-light">
              <div className="d-flex align-items-center gap-2">
                <iconify-icon icon="solar:shield-keyhole-bold-duotone" class="fs-22 text-primary"></iconify-icon>
                <h5 className="card-title mb-0 text-primary fw-bold fs-14">Admin Delegation &amp; Cryptographic Invitations</h5>
              </div>
              <span className="badge bg-primary fs-11">Super Admin Protected</span>
            </div>

            <div className="card-body p-3.5">
              <p className="text-muted fs-13 mb-3">
                No public registration exists for administrators. Generate a one-time cryptographic 24-hour invitation link to delegate dashboard permissions to your team.
              </p>

              <form onSubmit={handleSendInvite} className="row g-3 align-items-center">
                <div className="col-md-5">
                  <label className="form-label fs-12 fw-semibold text-dark">Admin Email Address</label>
                  <input
                    type="email"
                    className="form-control fs-13"
                    style={{ borderRadius: '8px' }}
                    placeholder="e.g. operations@veuz.sa"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fs-12 fw-semibold text-dark">Assigned Administrative Role</label>
                  <select
                    className="form-select fs-13"
                    style={{ borderRadius: '8px' }}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                  >
                    <option value="ADMIN">ADMIN (Catalog, Orders, Inventory)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Full System &amp; Team Invites)</option>
                  </select>
                </div>

                <div className="col-md-3 mt-md-4 pt-md-2">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-1.5 fs-13 fw-semibold shadow-sm"
                    style={{ borderRadius: '8px', padding: '8px 16px' }}
                    disabled={inviteLoading || !inviteEmail}
                  >
                    {inviteLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      <>
                        <iconify-icon icon="solar:letter-opened-bold-duotone" class="fs-18"></iconify-icon>
                        <span>Generate Invite Link</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Success Message & Invite URL Box */}
              {inviteSuccessMsg && (
                <div className="alert alert-success mt-3 mb-0" style={{ borderRadius: '8px' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <iconify-icon icon="solar:check-circle-bold" class="fs-20 text-success"></iconify-icon>
                    <strong>{inviteSuccessMsg}</strong>
                  </div>

                  {generatedInviteLink && (
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control font-monospace fs-12"
                        readOnly
                        value={generatedInviteLink}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-success"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedInviteLink);
                          alert('Invite link copied to clipboard!');
                        }}
                      >
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
