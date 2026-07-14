import React from 'react';

export function DuplicateAlertPanel({ suggestions, isSearching, error }) {
  if (isSearching) {
    return (
      <div className="mt-2 p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-center shadow-inner border border-blue-100">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg shadow-sm">
      <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        Potential Duplicates Found
      </h4>
      <p className="text-xs text-yellow-700 mb-3">
        These tasks seem very similar to the one you are creating. Consider reviewing them before submitting.
      </p>
      <ul className="space-y-2">
        {suggestions.map((task) => (
          <li key={task.task_id} className="text-sm bg-white p-2 rounded border border-yellow-100 flex justify-between items-center shadow-sm">
            <span className="font-medium text-gray-800 truncate mr-2 flex-1" title={task.title}>{task.title}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">{task.status}</span>
                <span className="text-xs font-mono text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded border border-yellow-200">{Math.round(task.similarity * 100)}% match</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
