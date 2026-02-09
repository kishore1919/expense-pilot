'use client';

import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (bookName: string) => void;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose, onAddBook }) => {
  const [bookName, setBookName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookName.trim()) {
      onAddBook(bookName.trim());
      setBookName('');
    }
  };

  const handleClose = () => {
    // Reset form state before closing so inputs do not persist
    setBookName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">Create New Expense Book</h2>
          <button onClick={handleClose} className="icon-button" aria-label="Close dialog">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="bookName" className="field-label">Book Name</label>
            <input
              type="text"
              id="bookName"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="e.g., Groceries, Vacation, etc."
              className="text-field"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookModal;
