'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';

export default function DashboardHomePage() {
  const { user } = useAuth();

  // Invite Admin State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  // Initialize ApexCharts for authentic Rasket visuals
  useEffect(() => {
    let conversionsChart: any = null;
    let perfChart: any = null;
    let resizeObserver: any = null;

    const initCharts = () => {
      if (typeof window === 'undefined' || !(window as any).ApexCharts) return;
      const ApexCharts = (window as any).ApexCharts;

      const conversionsEl = document.querySelector('#conversions');
      if (conversionsEl) {
        if (conversionsChart) {
          try { conversionsChart.destroy(); } catch (e) {}
        }
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
        conversionsChart = new ApexCharts(conversionsEl, convOptions);
        conversionsChart.render();
      }

      const perfEl = document.querySelector('#dash-performance-chart');
      if (perfEl) {
        if (perfChart) {
          try { perfChart.destroy(); } catch (e) {}
        }
        perfEl.innerHTML = '';
        const perfOptions = {
          series: [
            { name: 'Safety Orders', type: 'bar', data: [34, 65, 46, 68, 49, 61, 42, 44, 78, 52, 63, 67] },
            { name: 'Revenue (k SR)', type: 'area', data: [8, 12, 7, 17, 21, 11, 5, 9, 7, 29, 12, 35] },
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
              barHeight: '70%',
              borderRadius: 3,
            },
          },
          stroke: { dashArray: [0, 0], width: [0, 2], curve: 'smooth' },
          fill: {
            opacity: [1, 1],
            type: ['solid', 'gradient'],
            gradient: {
              type: 'vertical',
              inverseColors: false,
              opacityFrom: 0.5,
              opacityTo: 0,
              stops: [0, 90],
            },
          },
          markers: { size: [0, 0], strokeWidth: 2, hover: { size: 4 } },
          xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            axisTicks: { show: false },
            axisBorder: { show: false },
          },
          yaxis: { min: 0, axisBorder: { show: false } },
          grid: {
            show: true,
            strokeDashArray: 3,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            borderColor: 'rgba(170,184,197, 0.15)',
            padding: { top: 0, right: 0, bottom: 0, left: 10 },
          },
          legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            markers: { width: 9, height: 9, radius: 6 },
          },
          colors: ['#1bb394', '#2563eb'],
          tooltip: {
            shared: true,
            y: [
              { formatter: (e: any) => (e !== undefined ? `${e.toFixed(0)} orders` : e) },
              { formatter: (e: any) => (e !== undefined ? `${e.toFixed(1)}k SR` : e) },
            ],
          },
        };
        perfChart = new ApexCharts(perfEl, perfOptions);
        perfChart.render();

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => {
            if (perfChart) {
              try { perfChart.windowResizeHandler(); } catch (e) {}
            }
          });
          resizeObserver.observe(perfEl);
        }
      }
    };

    const triggerResize = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('resize'));
      }
    };

    const runInit = () => {
      // Small delay on mount/refresh ensures parent containers have settled their flex/grid geometry
      setTimeout(() => {
        initCharts();
        triggerResize();
      }, 60);

      setTimeout(triggerResize, 250);
      setTimeout(triggerResize, 600);
    };

    // Load ApexCharts script if not already loaded
    if (typeof window !== 'undefined') {
      if (!(window as any).ApexCharts) {
        const script = document.createElement('script');
        script.src = '/dashboard-assets/vendor/apexcharts/apexcharts.min.js';
        script.async = true;
        script.onload = () => runInit();
        document.body.appendChild(script);
      } else {
        runInit();
      }
    }

    return () => {
      if (resizeObserver) {
        try { resizeObserver.disconnect(); } catch (e) {}
      }
      if (conversionsChart) {
        try { conversionsChart.destroy(); } catch (e) {}
      }
      if (perfChart) {
        try { perfChart.destroy(); } catch (e) {}
      }
    };
  }, []);

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
      {/* ========================================================
          1. PAGE HEADER (Exact Rasket Style)
         ======================================================== */}
      <div className="row mb-3 mt-2">
        <div className="col-12">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h4 className="card-title mb-1 fs-18 fw-bold">Analytics &amp; Safety Overview</h4>
              <p className="text-muted fs-13 mb-0">
                Welcome back, <span className="fw-semibold text-primary">{user?.name || 'Administrator'}</span>. Here is the latest performance and activity.
              </p>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <a href="#invite-admin-section" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1">
                <iconify-icon icon="solar:user-plus-broken" class="fs-16"></iconify-icon>
                <span>Invite Admin</span>
              </a>
              <Link href="/" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
                <iconify-icon icon="solar:shop-2-broken" class="fs-16"></iconify-icon>
                <span>Storefront</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. RASKET KPI METRIC CARDS (Exact HTML markup & classes)
         ======================================================== */}
      <div className="row">
        
        {/* KPI 1: Page Views */}
        <div className="col-md-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <div className="avatar-md bg-light bg-opacity-50 rounded d-flex align-items-center justify-content-center">
                    <iconify-icon icon="solar:leaf-bold-duotone" class="fs-32 text-success avatar-title"></iconify-icon>
                  </div>
                </div>
                <div className="col-6 text-end">
                  <p className="text-muted mb-0 text-truncate">Page View</p>
                  <h3 className="text-dark mt-1 mb-0">13, 647</h3>
                </div>
              </div>
            </div>
            <div className="card-footer border-0 py-2 bg-light bg-opacity-50">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-success"><i className="bx bxs-up-arrow fs-12"></i> 2.3%</span>
                  <span className="text-muted ms-1 fs-12">Last Month</span>
                </div>
                <a href="#!" className="text-reset fw-semibold fs-12">View More</a>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Clicks */}
        <div className="col-md-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <div className="avatar-md bg-light bg-opacity-50 rounded d-flex align-items-center justify-content-center">
                    <iconify-icon icon="solar:cpu-bolt-line-duotone" class="fs-32 text-success avatar-title"></iconify-icon>
                  </div>
                </div>
                <div className="col-6 text-end">
                  <p className="text-muted mb-0 text-truncate">Clicks</p>
                  <h3 className="text-dark mt-1 mb-0">9, 526</h3>
                </div>
              </div>
            </div>
            <div className="card-footer border-0 py-2 bg-light bg-opacity-50">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-success"><i className="bx bxs-up-arrow fs-12"></i> 8.1%</span>
                  <span className="text-muted ms-1 fs-12">Last Month</span>
                </div>
                <a href="#!" className="text-reset fw-semibold fs-12">View More</a>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Conversions */}
        <div className="col-md-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <div className="avatar-md bg-light bg-opacity-50 rounded d-flex align-items-center justify-content-center">
                    <iconify-icon icon="solar:layers-bold-duotone" class="fs-32 text-success avatar-title"></iconify-icon>
                  </div>
                </div>
                <div className="col-6 text-end">
                  <p className="text-muted mb-0 text-truncate">Conversions</p>
                  <h3 className="text-dark mt-1 mb-0">976</h3>
                </div>
              </div>
            </div>
            <div className="card-footer border-0 py-2 bg-light bg-opacity-50">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-danger"><i className="bx bxs-down-arrow fs-12"></i> 0.3%</span>
                  <span className="text-muted ms-1 fs-12">Last Month</span>
                </div>
                <a href="#!" className="text-reset fw-semibold fs-12">View More</a>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: New Users */}
        <div className="col-md-6 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <div className="avatar-md bg-light bg-opacity-50 rounded d-flex align-items-center justify-content-center">
                    <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" class="fs-32 text-success avatar-title"></iconify-icon>
                  </div>
                </div>
                <div className="col-6 text-end">
                  <p className="text-muted mb-0 text-truncate">New Users</p>
                  <h3 className="text-dark mt-1 mb-0">$123.6k</h3>
                </div>
              </div>
            </div>
            <div className="card-footer border-0 py-2 bg-light bg-opacity-50">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-danger"><i className="bx bxs-down-arrow fs-12"></i> 10.6%</span>
                  <span className="text-muted ms-1 fs-12">Last Month</span>
                </div>
                <a href="#!" className="text-reset fw-semibold fs-12">View More</a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          3. PERFORMANCE & CONVERSIONS SECTION (Exact Rasket structure)
         ======================================================== */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body p-0">
              <div className="row g-0">
                
                {/* Left: Conversions Breakdown & Radial Chart */}
                <div className="col-lg-3" style={{ minWidth: 0 }}>
                  <div className="p-3">
                    <h5 className="card-title">Conversions</h5>
                    <div id="conversions" className="apex-charts mb-2 mt-n2 text-center" style={{ minHeight: '260px' }}></div>
                    
                    <div className="row text-center">
                      <div className="col-6">
                        <p className="text-muted mb-2 fs-13">This Week</p>
                        <h3 className="text-dark mb-3">23.5k</h3>
                      </div>
                      <div className="col-6">
                        <p className="text-muted mb-2 fs-13">Last Week</p>
                        <h3 className="text-dark mb-3">41.05k</h3>
                      </div>
                    </div>

                    <div className="text-center">
                      <button type="button" className="btn btn-light shadow-none w-100 fs-13">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Center: Performance Chart */}
                <div className="col-lg-6 border-start border-end" style={{ minWidth: 0, overflow: 'hidden', position: 'relative' }}>
                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <h4 className="card-title mb-0">Performance</h4>
                      <div className="btn-group btn-group-sm">
                        <button type="button" className="btn btn-outline-light text-dark">ALL</button>
                        <button type="button" className="btn btn-outline-light text-dark">1M</button>
                        <button type="button" className="btn btn-outline-light text-dark">6M</button>
                        <button type="button" className="btn btn-primary active">1Y</button>
                      </div>
                    </div>

                    <div className="alert alert-info mt-3 d-flex align-items-center gap-2 mb-3" role="alert">
                      <iconify-icon icon="solar:info-circle-broken" class="fs-20"></iconify-icon>
                      <span className="fs-13">Live telemetry synchronized with central e-commerce database &amp; order fulfillment.</span>
                    </div>

                    <div dir="ltr" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden', position: 'relative' }}>
                      <div id="dash-performance-chart" className="apex-charts" style={{ width: '100%', maxWidth: '100%', minHeight: '313px' }}></div>
                    </div>
                  </div>
                </div>

                {/* Right: Session By Browser */}
                <div className="col-lg-3" style={{ minWidth: 0 }}>
                  <h5 className="card-title p-3 border-bottom mb-0">Session By Browser</h5>
                  <div className="px-3" style={{ maxHeight: '310px', overflowY: 'auto' }}>
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="align-middle fw-medium fs-13">Chrome</span>
                      <span className="fw-semibold text-muted fs-13">62.5%</span>
                      <span className="fw-semibold text-muted fs-13">5.06k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="align-middle fw-medium fs-13">Firefox</span>
                      <span className="fw-semibold text-muted fs-13">12.3%</span>
                      <span className="fw-semibold text-muted fs-13">1.5k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="align-middle fw-medium fs-13">Safari</span>
                      <span className="fw-semibold text-muted fs-13">9.86%</span>
                      <span className="fw-semibold text-muted fs-13">1.03k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="align-middle fw-medium fs-13">Brave</span>
                      <span className="fw-semibold text-muted fs-13">3.15%</span>
                      <span className="fw-semibold text-muted fs-13">0.3k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="align-middle fw-medium fs-13">Opera</span>
                      <span className="fw-semibold text-muted fs-13">3.01%</span>
                      <span className="fw-semibold text-muted fs-13">1.58k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="align-middle fw-medium fs-13">Edge</span>
                      <span className="fw-semibold text-muted fs-13">2.8%</span>
                      <span className="fw-semibold text-muted fs-13">0.91k</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2">
                      <span className="align-middle fw-medium fs-13">Other</span>
                      <span className="fw-semibold text-muted fs-13">6.38%</span>
                      <span className="fw-semibold text-muted fs-13">3.6k</span>
                    </div>
                  </div>

                  <div className="text-center p-3 border-top">
                    <button type="button" className="btn btn-light shadow-none w-100 fs-13">
                      View All
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. SESSIONS BY COUNTRY + RECENT ORDERS / TOP PAGES TABLE
         ======================================================== */}
      <div className="row">
        
        {/* Left: Sessions by Country */}
        <div className="col-lg-6">
          <div className="card">
            <div className="d-flex card-header justify-content-between align-items-center border-bottom border-dashed">
              <h4 className="card-title mb-0">Sessions by Region</h4>
              <div className="dropdown">
                <button type="button" className="btn btn-sm btn-outline-light text-dark">
                  View Data
                </button>
              </div>
            </div>

            <div className="card-body pt-3">
              {/* Region 1 */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fs-13 fw-semibold">Saudi Arabia (Riyadh &amp; Eastern Province)</span>
                <span className="fs-13 fw-bold">82.05% (659k)</span>
              </div>
              <div className="progress progress-sm mb-3">
                <div className="progress-bar bg-primary" style={{ width: '82.05%' }}></div>
              </div>

              {/* Region 2 */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fs-13 fw-semibold">United Arab Emirates (Dubai &amp; Abu Dhabi)</span>
                <span className="fs-13 fw-bold">70.5% (485k)</span>
              </div>
              <div className="progress progress-sm mb-3">
                <div className="progress-bar bg-info" style={{ width: '70.5%' }}></div>
              </div>

              {/* Region 3 */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fs-13 fw-semibold">Kuwait &amp; Qatar (Energy Sector)</span>
                <span className="fs-13 fw-bold">65.8% (355k)</span>
              </div>
              <div className="progress progress-sm mb-3">
                <div className="progress-bar bg-warning" style={{ width: '65.8%' }}></div>
              </div>

              {/* Region 4 */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fs-13 fw-semibold">Oman &amp; Bahrain (Industrial Trade)</span>
                <span className="fs-13 fw-bold">55.8% (204k)</span>
              </div>
              <div className="progress progress-sm mb-0">
                <div className="progress-bar bg-success" style={{ width: '55.8%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live PPE Orders & Top Pages Table */}
        <div className="col-lg-6">
          <div className="card card-height-100">
            <div className="card-header d-flex align-items-center justify-content-between gap-2 border-bottom border-dashed">
              <h4 className="card-title flex-grow-1 mb-0">Live Safety Orders &amp; Activity</h4>
              <a href="#all-products" className="btn btn-sm btn-soft-primary">View All</a>
            </div>
            
            <div className="table-responsive">
              <table className="table table-hover table-nowrap table-centered m-0">
                <thead className="bg-light bg-opacity-50">
                  <tr>
                    <th className="py-2">Order ID</th>
                    <th className="py-2">Client / Organization</th>
                    <th className="py-2">Safety Gear</th>
                    <th className="py-2">Total Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="fw-semibold text-primary">#VS-8901</span></td>
                    <td>Aramco Subcontractor</td>
                    <td>Hard Hat &amp; Ear Muffs</td>
                    <td>3,450 SR</td>
                    <td><span className="badge bg-success-subtle text-success">Delivered</span></td>
                  </tr>
                  <tr>
                    <td><span className="fw-semibold text-primary">#VS-8902</span></td>
                    <td>Sabic Plant Facility</td>
                    <td>Chemical Suit &amp; Boots</td>
                    <td>8,920 SR</td>
                    <td><span className="badge bg-primary-subtle text-primary">Processing</span></td>
                  </tr>
                  <tr>
                    <td><span className="fw-semibold text-primary">#VS-8903</span></td>
                    <td>Red Sea Development</td>
                    <td>Fall Arrest Lanyards</td>
                    <td>12,400 SR</td>
                    <td><span className="badge bg-warning-subtle text-warning">In Transit</span></td>
                  </tr>
                  <tr>
                    <td><span className="fw-semibold text-primary">#VS-8904</span></td>
                    <td>Neom Sector 4</td>
                    <td>3M Respiratory Units</td>
                    <td>18,750 SR</td>
                    <td><span className="badge bg-success-subtle text-success">Delivered</span></td>
                  </tr>
                  <tr>
                    <td><span className="fw-semibold text-primary">#VS-8905</span></td>
                    <td>Maaden Mining Corp</td>
                    <td>Steel Toe Safety Boots</td>
                    <td>5,600 SR</td>
                    <td><span className="badge bg-info-subtle text-info">Verified</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          5. SUPER ADMIN: INVITE NEW ADMINISTRATOR SECTION
         ======================================================== */}
      <div className="row mt-3" id="invite-admin-section">
        <div className="col-12">
          <div className="card border-primary border">
            <div className="card-header bg-primary bg-opacity-10 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <iconify-icon icon="solar:shield-keyhole-bold-duotone" class="fs-24 text-primary"></iconify-icon>
                <h5 className="card-title mb-0 text-primary fw-bold">Admin Delegation &amp; Cryptographic Invitations</h5>
              </div>
              <span className="badge bg-primary">Super Admin Protected</span>
            </div>

            <div className="card-body">
              <p className="text-muted fs-13 mb-3">
                No public registration exists for administrators. Generate a one-time cryptographic 24-hour invitation link to delegate dashboard permissions to your team.
              </p>

              <form onSubmit={handleSendInvite} className="row g-3 align-items-center">
                <div className="col-md-5">
                  <label className="form-label fs-12 fw-semibold">Admin Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. operations@veuz.in"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fs-12 fw-semibold">Assigned Administrative Role</label>
                  <select
                    className="form-select"
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
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-1"
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
                <div className="alert alert-success mt-3 mb-0">
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
