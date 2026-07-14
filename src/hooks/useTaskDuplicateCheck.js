import { useState, useEffect, useCallback } from 'react';
import { fetchDuplicateScreening } from '../api/duplicate';

export function useTaskDuplicateCheck(title, description, projectId) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!title || title.trim().length < 6 || !projectId) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const data = await fetchDuplicateScreening({
          project_id: projectId,
          title: title,
          description: description
        });
        setSuggestions(data.matches || []);
      } catch (err) {
        setError('Failed processing matching query execution loops.');
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms Debounce Window Boundary

    return () => clearTimeout(delayDebounceFn);
  }, [title, description, projectId]);

  return { suggestions, isSearching, error };
}
