'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  DELIVERY_CITIES,
  getUserAddresses,
  setSelectedLocation,
  UserAddress,
} from '@/services/locationService';

interface ChooseDeliveryLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string;
  onSelectLocation?: (location: string) => void;
}

export const ChooseDeliveryLocationModal: React.FC<ChooseDeliveryLocationModalProps> = ({
  isOpen,
  onClose,
  selectedLocation,
  onSelectLocation,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [citySelectValue, setCitySelectValue] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close city dropdown on click outside
  useEffect(() => {
    if (!isCityDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCityDropdownOpen]);

  // Bulletproof body & viewport scroll lock when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalTouchAction = document.body.style.touchAction;

    document.documentElement.classList.add('lightbox-open');
    document.body.classList.add('lightbox-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.touchAction = 'none';

    // Prevent background wheel and touch gestures
    const handleTouchOrWheel = (e: TouchEvent | WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest('.delivery-location-card-content')) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleTouchOrWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchOrWheel, { passive: false });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.classList.remove('lightbox-open');
      document.body.classList.remove('lightbox-open');
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.body.style.touchAction = originalTouchAction;
      window.scrollTo(0, scrollY);
      window.removeEventListener('wheel', handleTouchOrWheel);
      window.removeEventListener('touchmove', handleTouchOrWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || typeof document === 'undefined') {
    return null;
  }

  // Get user addresses (maximum two shown as required)
  const addresses: UserAddress[] = getUserAddresses(user).slice(0, 2);

  const handlePickAddress = (addr: UserAddress) => {
    const locName = addr.city || addr.streetAddress || addr.name;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('veuz_location_manually_selected', 'true');
    }
    setSelectedLocation(locName);
    if (onSelectLocation) onSelectLocation(locName);
    onClose();
  };

  const handleSelectCityItem = (cityName: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('veuz_location_manually_selected', 'true');
    }
    setCitySelectValue(cityName);
    setSelectedLocation(cityName);
    if (onSelectLocation) onSelectLocation(cityName);
    setIsCityDropdownOpen(false);
    onClose();
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    handleSelectCityItem(val);
  };

  const handleSignInClick = () => {
    onClose();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleManageAddressBook = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    if (typeof window !== 'undefined' && window.location.pathname === '/profile') {
      window.location.hash = '#address-book';
    } else {
      router.push('/profile?tab=address-book#address-book');
    }
  };

  return createPortal(
    <div
      className="choose-location-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 1000000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        touchAction: 'none',
        overscrollBehavior: 'none',
      }}
      onClick={onClose}
    >
      <div
        className="choose-location-modal delivery-location-card-content"
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          overflow: 'visible',
          position: 'relative',
          animation: 'locationModalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
          }}
        >
          <h5
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '-0.2px',
            }}
          >
            Choose your delivery location
          </h5>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: '32px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#334155',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = '#334155';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px' }}>
          <p
            style={{
              fontSize: '13px',
              lineHeight: '1.45',
              color: '#475569',
              margin: '0 0 18px 0',
            }}
          >
            Delivery options and delivery speeds may vary for different locations
          </p>

          {/* User Not Logged In -> Amazon-style Gold "Sign in to see your addresses" button */}
          {!user ? (
            <div style={{ marginBottom: '18px' }}>
              <button
                type="button"
                onClick={handleSignInClick}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#ffd814',
                  borderColor: '#fcd200',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '24px',
                  color: '#0f172a',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(213, 162, 0, 0.25)',
                  transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7ca00';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffd814';
                }}
              >
                Sign in to see your addresses
              </button>
            </div>
          ) : (
            /* User Is Logged In -> Show max two addresses */
            <div style={{ marginBottom: '14px' }}>
              {addresses.length === 0 ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    fontSize: '12.5px',
                    marginBottom: '10px',
                    textAlign: 'center',
                  }}
                >
                  No saved addresses found. Add one in your profile.
                </div>
              ) : (
                addresses.map((addr, idx) => {
                  const addrFull = [
                    addr.buildingNo,
                    addr.streetAddress,
                    addr.city,
                    addr.zipCode,
                  ]
                    .filter(Boolean)
                    .join(', ');

                  const isCurrent =
                    (addr.city && selectedLocation.toLowerCase().includes(addr.city.toLowerCase())) ||
                    (addr.streetAddress && selectedLocation.toLowerCase().includes(addr.streetAddress.toLowerCase()));

                  return (
                    <div
                      key={addr.id || idx}
                      onClick={() => handlePickAddress(addr)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isCurrent ? '1.5px solid #0284c7' : '1px solid #94a3b8',
                        backgroundColor: isCurrent ? '#f0f9ff' : '#ffffff',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.borderColor = '#0284c7';
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.borderColor = '#94a3b8';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                      }}
                    >
                      <div style={{ fontSize: '13px', lineHeight: '1.4', color: '#1e293b' }}>
                        <strong style={{ fontWeight: '700', color: '#0f172a' }}>
                          {addr.name || user?.name}
                        </strong>{' '}
                        <span>{addrFull || 'Address details'}</span>
                      </div>
                      {addr.isDefault && (
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: '#475569',
                            marginTop: '4px',
                            fontWeight: '500',
                          }}
                        >
                          Default address
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Manage address book link */}
              <div style={{ marginTop: '6px', marginBottom: '8px' }}>
                <a
                  href="/profile?tab=address-setup#address-setup"
                  onClick={handleManageAddressBook}
                  style={{
                    color: '#007185',
                    fontSize: '13px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                    e.currentTarget.style.color = '#c45500';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                    e.currentTarget.style.color = '#007185';
                  }}
                >
                  Manage address book
                </a>
              </div>
            </div>
          )}

          {/* Divider: "or" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '14px 0 16px 0',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Custom Select your City Dropdown - Exactly 4 items visible, scrollable for the balance */}
          <div ref={cityDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isCityDropdownOpen}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                borderRadius: '8px',
                border: isCityDropdownOpen ? '1.5px solid #0f172a' : '1px solid #94a3b8',
                backgroundColor: '#ffffff',
                fontSize: '13.5px',
                color: citySelectValue ? '#0f172a' : '#334155',
                cursor: 'pointer',
                fontWeight: '500',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s ease',
                boxShadow: isCityDropdownOpen ? '0 0 0 3px rgba(15, 23, 42, 0.08)' : 'none',
              }}
            >
              <span>{citySelectValue || 'Select your City'}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: 'transform 0.2s ease',
                  transform: isCityDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown Menu: Exactly 4 items visible (~152px), scrollable for the balance */}
            {isCityDropdownOpen && (
              <div
                role="listbox"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                  zIndex: 100,
                  maxHeight: '152px', /* Sized for exactly 4 items (4 * 38px = 152px) */
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                }}
              >
                {DELIVERY_CITIES.map((city) => {
                  const isSelected = citySelectValue === city;
                  return (
                    <div
                      key={city}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectCityItem(city)}
                      style={{
                        padding: '9px 14px',
                        height: '38px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13.5px',
                        color: isSelected ? '#0f172a' : '#334155',
                        fontWeight: isSelected ? '700' : '500',
                        backgroundColor: isSelected ? '#f1f5f9' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease',
                        borderBottom: '1px solid #f8fafc',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <span>{city}</span>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
