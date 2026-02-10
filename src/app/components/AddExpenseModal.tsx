'use client';

import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'in' | 'out';
  onAddExpense: (expense: {
    description: string;
    amount: number;
    type: 'in' | 'out';
    createdAt: Date;
    remarks?: string;
    category?: string;
    paymentMode?: string;
    attachments?: string[];
  }) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAddExpense, initialType }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'in' | 'out'>(initialType ?? 'out');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => new Date().toISOString().slice(11,16));
  const [remarks, setRemarks] = useState('');
  const [category, setCategory] = useState('Misc');
  const [paymentMode, setPaymentMode] = useState('Online');
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const { currency } = useCurrency();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const createdAt = new Date(`${date}T${time}`);

    onAddExpense({
      description,
      amount: parseFloat(amount),
      type,
      createdAt,
      remarks: remarks || undefined,
      category,
      paymentMode,
      attachments: attachments ? Array.from(attachments).map((f) => f.name) : [],
    });

    setDescription('');
    setAmount('');
    setType('out');
    setDate(new Date().toISOString().slice(0, 10));
    setTime(new Date().toISOString().slice(11,16));
    setRemarks('');
    setCategory('Misc');
    setPaymentMode('Online');
    setAttachments(null);
  };


  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">Add Entry</h2>
          <button onClick={onClose} className="icon-button" aria-label="Close expense modal">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 mb-4">
            <button type="button" onClick={() => setType('in')} className={`px-4 py-2 rounded-full border ${type === 'in' ? 'bg-green-50 text-green-700' : 'bg-white text-slate-700'}`}>
              Cash In
            </button>
            <button type="button" onClick={() => setType('out')} className={`px-4 py-2 rounded-full border ${type === 'out' ? 'bg-red-600 text-white' : 'bg-white text-slate-700'}`}>
              Cash Out
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-field" />
            </div>
            <div>
              <label className="field-label">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="text-field" />
            </div>
          </div>

          <div className="mb-4 mt-4">
            <label htmlFor="amount" className="field-label">Amount ({currency}) *</label>
            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-field" placeholder={`0.00 ${currency}`} />
          </div>

          <div className="mb-4">
            <label htmlFor="remarks" className="field-label">Remarks</label>
            <textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="text-field" placeholder="e.g. Enter Details (Name, Bill No, Item Name, Quantity etc)" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="field-label">Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-field">
                <option>Misc</option>
                <option>Food</option>
                <option>Medical</option>
                <option>Travel</option>
              </select>
            </div>
            <div>
              <label className="field-label">Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="text-field">
                <option>Online</option>
                <option>Cash</option>
                <option>Card</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="field-label">Attach Bills</label>
            <input type="file" multiple onChange={(e) => setAttachments(e.target.files)} className="mt-2" />
            <p className="text-sm text-slate-500 mt-2">Attach up to 4 images or PDF files</p>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
