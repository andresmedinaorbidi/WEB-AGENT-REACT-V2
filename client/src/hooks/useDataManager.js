import { useRef } from 'react';

export function useDataManager(username, history, setHistory, setUsername, setShowAccountMenu) {
  const fileInputRef = useRef(null);

  const exportData = () => {
    const dataStr = JSON.stringify({ username, history }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `plinng-backup.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowAccountMenu(false);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.history) {
          setHistory(data.history);
          localStorage.setItem('wflow_history', JSON.stringify(data.history));
        }
        if (data.username) {
          setUsername(data.username);
          localStorage.setItem('wflow_username', data.username);
        }
        alert('Data restored!');
        setShowAccountMenu(false);
      } catch (err) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const factoryReset = () => {
    if (confirm('Are you sure you want to reset everything? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return { fileInputRef, exportData, importData, factoryReset };
}