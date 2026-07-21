import React, { useState, useEffect } from 'react';
import Modal from './Modal';

export default function AdvancedSearchModal({ isOpen, onClose, filters, onApply, projects = [] }) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Sync local filters with parent filters when the modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  // Extract unique items dynamically from project list
  const allTechs = Array.from(
    new Set(projects.flatMap(p => p.tech_stack || []))
  ).sort();

  const allOwners = Array.from(
    new Set(projects.map(p => p.owner_name || p.owner_id).filter(Boolean))
  ).sort();

  const allDevelopers = Array.from(
    new Set(projects.flatMap(p => p.developer_names || []).filter(Boolean))
  ).sort();

  const handleToggleTech = (tech) => {
    setLocalFilters(prev => {
      const techs = prev.techs.includes(tech)
        ? prev.techs.filter(t => t !== tech)
        : [...prev.techs, tech];
      return { ...prev, techs };
    });
  };

  const handleReset = () => {
    setLocalFilters({
      text: '',
      techs: [],
      owner: '',
      developer: '',
      minRate: '',
      maxRate: '',
      minTasks: '',
      maxTasks: '',
      minHours: '',
      maxHours: '',
      sortBy: 'name-asc'
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Project Search" size="lg">
      <div className="space-y-6 text-sm">
        {/* Two column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Categorical filters */}
          <div className="space-y-4">
            {/* Tech Stack */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                Tech Stack (Select tags)
              </label>
              {allTechs.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No tech tags available</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl border custom-scrollbar" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  {allTechs.map(tech => {
                    const isSelected = localFilters.techs.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => handleToggleTech(tech)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer"
                        style={{
                          borderColor: isSelected ? 'var(--yellow)' : 'var(--border)',
                          background: isSelected ? 'var(--yellow)' : 'transparent',
                          color: isSelected ? 'var(--text-on-yellow)' : 'var(--text)',
                        }}
                      >
                        {tech}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Owner Dropdown */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Project Owner
              </label>
              <select
                value={localFilters.owner}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, owner: e.target.value }))}
                className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                style={{
                  background: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="">All Owners</option>
                {allOwners.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>

            {/* Developer Dropdown */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Assigned Developer
              </label>
              <select
                value={localFilters.developer}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, developer: e.target.value }))}
                className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                style={{
                  background: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="">All Developers</option>
                {allDevelopers.map(dev => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
            </div>

            {/* Sorting Select */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Sort Results By
              </label>
              <select
                value={localFilters.sortBy}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                style={{
                  background: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="name-asc">Project Name (A-Z)</option>
                <option value="name-desc">Project Name (Z-A)</option>
                <option value="rate-desc">Completion Rate (High to Low)</option>
                <option value="rate-asc">Completion Rate (Low to High)</option>
                <option value="tasks-desc">Total Tasks (High to Low)</option>
                <option value="hours-desc">Estimated Hours (High to Low)</option>
                <option value="date-desc">Date Created (Newest First)</option>
                <option value="date-asc">Date Created (Oldest First)</option>
              </select>
            </div>
          </div>

          {/* Column 2: Numeric range filters */}
          <div className="space-y-4">
            {/* Completion Rate Range */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                Completion Rate (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Min %"
                  min="0"
                  max="100"
                  value={localFilters.minRate}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, minRate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>to</span>
                <input
                  type="number"
                  placeholder="Max %"
                  min="0"
                  max="100"
                  value={localFilters.maxRate}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            {/* Total Tasks Range */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                Total Tasks Volume
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Min Tasks"
                  min="0"
                  value={localFilters.minTasks}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, minTasks: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>to</span>
                <input
                  type="number"
                  placeholder="Max Tasks"
                  min="0"
                  value={localFilters.maxTasks}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, maxTasks: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            {/* Estimated Hours Range */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                Estimated Effort (Hours)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Min Hours"
                  min="0"
                  value={localFilters.minHours}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, minHours: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>to</span>
                <input
                  type="number"
                  placeholder="Max Hours"
                  min="0"
                  value={localFilters.maxHours}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, maxHours: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-semibold rounded-xl transition-all border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Reset Filters
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl transition-all border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer hover:opacity-90"
              style={{
                background: 'var(--yellow)',
                color: 'var(--text-on-yellow)',
                boxShadow: 'var(--shadow-yellow)',
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
