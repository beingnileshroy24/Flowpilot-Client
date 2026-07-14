import React from 'react';

export function DuplicateAlertPanel({ suggestions, isSearching, error }) {
  if (isSearching) {
    return (
      <div className="mt-2 p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-center shadow-inner border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Scanning task registry for duplicates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md text-sm shadow-inner border border-red-100">
        <div className="flex items-center font-medium mb-1">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Alert
        </div>
        {error}
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 border border-amber-500 bg-amber-50 dark:bg-amber-50/10 rounded-lg shadow-sm">
      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-500 mb-3 flex items-center">
        ⚠️ WARNING: Potential Duplicate Tasks Found (Score Threshold &gt; 85%)
      </h4>
      <ul className="space-y-2">
        {suggestions.map((task) => (
          <li 
            key={task.task_id} 
            tabIndex={0}
            className="text-sm bg-white dark:bg-slate-800 p-3 rounded border border-amber-200 dark:border-amber-700/50 flex flex-wrap gap-2 justify-between items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-primary hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.open(`/tasks/${task.task_id}`, '_blank');
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextLi = e.currentTarget.nextElementSibling;
                if (nextLi) nextLi.focus();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevLi = e.currentTarget.previousElementSibling;
                if (prevLi) prevLi.focus();
              }
            }}
          >
            <div className="flex items-center flex-1 min-w-0">
              <span className="text-amber-600 dark:text-amber-500 mr-2 font-bold">•</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mr-2 shrink-0">
                [{task.status}]
              </span>
              <span className="font-medium text-gray-800 dark:text-gray-200 truncate mr-2" title={task.title}>
                {task.title}
              </span>
              <span className="text-xs font-mono text-amber-700 dark:text-amber-400 shrink-0">
                ({(task.similarity * 100).toFixed(1)}% Match)
              </span>
            </div>
            
            <a 
              href={`/tasks/${task.task_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 focus:outline-none focus:underline"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
            >
              [Open ↗]
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
