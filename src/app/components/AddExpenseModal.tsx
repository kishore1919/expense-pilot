'use client';

import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: { description: string; amount: number }) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAddExpense }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const { currency } = useCurrency();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    onAddExpense({ description, amount: parseFloat(amount) });
    setDescription('');
    setAmount('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">Add New Expense</h2>
          <button onClick={onClose} className="icon-button" aria-label="Close expense modal">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="description" className="field-label">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-field"
              placeholder="e.g., Groceries, Rent, etc."
            />
          </div>
          <div className="mb-6">
            <label htmlFor="amount" className="field-label">
              Amount ({currency})
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-field"
              placeholder={`0.00 ${currency}`}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
