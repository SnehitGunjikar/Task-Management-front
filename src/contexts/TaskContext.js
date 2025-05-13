import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated. Please log in.');
        return;
      }
      const response = await axios.get('/tasks');
      setTasks(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (task) => {
    try {
      const response = await axios.post('/tasks', task);
      setTasks([...tasks, response.data]);
      setError(null);
    } catch (err) {
      setError('Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id, task) => {
    try {
      const response = await axios.put(`/tasks/${id}`, task);
      setTasks(tasks.map(t => t.id === id ? response.data : t));
      setError(null);
    } catch (err) {
      setError('Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete task');
      throw err;
    }
  };

  const exportTasks = async () => {
    try {
      const response = await axios.get('/tasks/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tasks.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export tasks');
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/tasks/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'task_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const importTasks = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post('/tasks/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchTasks();
      setError(null);
    } catch (err) {
      setError('Failed to import tasks');
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        exportTasks,
        importTasks,
        downloadTemplate,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}; 