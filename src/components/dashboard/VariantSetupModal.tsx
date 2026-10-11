'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PRESET_SIZES, SYSTEM_COLORS } from '@/data/categoryProductsData';

type Mode = 'sizes' | 'colors';

interface VariantSetupModalProps {
  isOpen: boolean;
  mode: Mode;
  selected: string[];
  onChange: (items: string[]) => void;
  onClose: () => void;
}

export default function VariantSetupModal({ isOpen, mode, selected, onChange, onClose }: VariantSetupModalProps) {
  const [customValue, setCustomValue] = useState('');
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const frame = requestAnimationFrame(() => setIsClosing(false));
      return () => cancelAnimationFrame(frame);
    }
    if (shouldRender) {
      setIsClosing(true);
      const timer = window.setTimeout(() => setShouldRender(false), 260);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender || typeof document === 'undefined') return null;

  const isSize = mode === 'sizes';
  const defaults = isSize ? PRESET_SIZES : SYSTEM_COLORS.map((color) => color.name);
  const title = isSize ? 'Manage Product Sizes' : 'Manage Product Colors';
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  const addCustom = (event: React.FormEvent) => {
    event.preventDefault();
    const value = customValue.trim();
    if (value && !selected.some((item) => item.toLowerCase() === value.toLowerCase())) onChange([...selected, value]);
    setCustomValue('');
  };
  const getHex = (name: string) => SYSTEM_COLORS.find((color) => color.name.toLowerCase() === name.toLowerCase())?.hex || '#64748b';

  return createPortal(
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-end" style={{ zIndex: 110000, backgroundColor: 'rgba(15,23,42,.32)', backdropFilter: 'blur(5px)' }} onClick={onClose}>
      <div className="bg-white h-100 d-flex flex-column shadow-lg" style={{ width: '720px', maxWidth: '100vw', borderRadius: '3px 0 0 3px', animation: `${isClosing ? 'variantModalExitRight' : 'variantModalEnterRight'} .26s cubic-bezier(.16,1,.3,1) forwards` }} onClick={(event) => event.stopPropagation()}>
        <style jsx>{`
          @keyframes variantModalEnterRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
          @keyframes variantModalExitRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100%); } }
        `}</style>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between" style={{ borderColor: '#edf0f3' }}>
          <div><h4 className="fs-18 fw-semibold text-dark mb-1">{title}</h4><span className="text-muted fs-12">Choose defaults or add a custom {isSize ? 'size' : 'color'}.</span></div>
          <button type="button" onClick={onClose} className="btn border-0 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>
        <div className="p-4 flex-grow-1 overflow-y-auto">
          <div className="d-flex align-items-center justify-content-between mb-3"><span className="fw-bold fs-13 text-dark">Default {isSize ? 'Sizes' : 'Colors'}</span><span className="badge bg-dark">{selected.length} selected</span></div>
          <form onSubmit={addCustom} className="p-3 rounded-3 border mb-4" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}><label className="fw-bold fs-13 mb-2">Add custom {isSize ? 'size' : 'color'}</label><div className="d-flex gap-2"><input value={customValue} onChange={(event) => setCustomValue(event.target.value)} className="form-control" placeholder={isSize ? 'e.g. XXL' : 'e.g. Neon Yellow'} /><button className="btn btn-dark px-4">Add</button></div></form>
          <div className="rounded-3 border overflow-hidden mb-4" style={{ borderColor: '#e2e8f0' }}>
            <table className="table table-sm align-middle mb-0"><thead style={{ backgroundColor: '#f8fafc' }}><tr><th className="px-3 py-2">{isSize ? 'SIZE' : 'COLOR'}</th><th className="px-3 py-2 text-end">STATUS</th></tr></thead>
              <tbody>{defaults.map((value) => <tr key={value}><td className="px-3 py-2">{!isSize && <span className="d-inline-block rounded-circle me-2" style={{ width: '12px', height: '12px', backgroundColor: getHex(value), border: '1px solid #cbd5e1' }} />}{value}</td><td className="px-3 py-2 text-end"><button type="button" onClick={() => toggle(value)} className={`btn btn-sm ${selected.includes(value) ? 'btn-dark' : 'btn-light border'}`} style={{ minWidth: '74px', fontSize: '11px' }}>{selected.includes(value) ? 'Selected' : 'Add'}</button></td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="px-4 py-3 border-top d-flex justify-content-end" style={{ borderColor: '#e2e8f0' }}><button type="button" className="btn btn-dark" onClick={onClose}>Apply Now</button></div>
      </div>
    </div>, document.body
  );
}
