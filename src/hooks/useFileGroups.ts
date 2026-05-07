import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useFileGroups = () => {
  const { fileGroups, setFileGroups, fileGroupsRef } = useStore();

  useEffect(() => {
    const savedGroups = localStorage.getItem('metamatrix_file_groups');
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups);
        setFileGroups(parsed.map((g: any) => ({
          ...g,
          files: g.files.map((f: any) => ({ ...f, file: new File([], f.file.name) })), // Dummy files
          isGenerating: false,
          previewUrl: '' // Previews lost on refresh
        })));
      } catch (e) {
        console.error('Failed to load saved groups', e);
      }
    }
  }, [setFileGroups]);

  useEffect(() => {
    const groupsToSave = fileGroups.map(g => ({
      id: g.id,
      baseName: g.baseName,
      metadata: g.metadata,
      error: g.error,
      history: g.history,
      files: g.files.map(f => ({
        id: f.id,
        type: f.type,
        baseName: f.baseName,
        extension: f.extension,
        file: { name: f.file.name } // Only save name
      }))
    }));
    localStorage.setItem('metamatrix_file_groups', JSON.stringify(groupsToSave));
  }, [fileGroups]);

  return {
    fileGroups,
    setFileGroups,
    fileGroupsRef
  };
};
