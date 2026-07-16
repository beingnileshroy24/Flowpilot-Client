import React from 'react';
import Modal from './Modal';
import { AlertOctagon } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, taskTitle, count = 1, entityType = "task" }) {
  const isTask = entityType === "task";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isTask ? "Confirm Ticket Deletion" : "Confirm Project Deletion"} size="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <AlertOctagon size={28} />
        </div>
        
        <h4 className="text-md font-bold mb-2" style={{ color: 'var(--text)' }}>
          {isTask ? (count > 1 ? `Delete ${count} Tickets?` : 'Delete Ticket?') : 'Delete Project?'}
        </h4>
        
        <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
          {isTask ? (
            count > 1 ? (
              `You are about to permanently delete ${count} tickets from this project board. This action cannot be undone.`
            ) : (
              <>
                You are about to permanently delete <strong className="text-[var(--text)]">"{taskTitle}"</strong> from this project board. This action cannot be undone.
              </>
            )
          ) : (
            <>
              You are about to permanently delete the project <strong className="text-[var(--text)]">"{taskTitle}"</strong> and all of its tasks, sprints, milestones, and releases. This action is irreversible.
            </>
          )}
        </p>
        
        <div className="flex w-full gap-3 mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer hover:bg-[var(--surface-solid)]"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2 text-xs font-bold rounded-xl text-white bg-red-600 hover:bg-red-500 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-all cursor-pointer border border-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
