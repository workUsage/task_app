// src/components/TaskForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

function TaskForm({ onTaskCreated, users }) {
  const [task, setTask] = useState({
    inwardNo: '',
    subject: '',
    description: '',
    startDate: '',
    endDate: '',
    assignedTo: ''
  });

  const handleChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/tasks', task, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setTask({
        inwardNo: '',
        subject: '',
        description: '',
        startDate: '',
        endDate: '',
        assignedTo: ''
      });
      onTaskCreated();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="inwardNo">
          Inward Number
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="inwardNo"
          type="text"
          placeholder="Inward Number"
          name="inwardNo"
          value={task.inwardNo}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject">
          Subject
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="subject"
          type="text"
          placeholder="Subject"
          name="subject"
          value={task.subject}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
          Description
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="description"
          placeholder="Description"
          name="description"
          value={task.description}
          onChange={handleChange}
          required
        />
      </div>
      <div className='flex w-full space-x-2 flex-col md:flex-row'>
      <div className="mb-4 w-full">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
          Start Date
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="startDate"
          type="date"
          name="startDate"
          value={task.startDate}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-4 w-full">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
          End Date
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="endDate"
          type="date"
          name="endDate"
          value={task.endDate}
          onChange={handleChange}
          required
        />
      </div>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assignedTo">
          Assigned To
        </label>
        <select
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="assignedTo"
          name="assignedTo"
          value={task.assignedTo}
          onChange={handleChange}
          required
        >
          <option value="">Select a user</option>
          {users.map((user) => (
            <option key={user.id} value={user.email}>
              {user.email}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
        >
          Create Inward
        </button>
      </div>
    </form>
  );
}

export default TaskForm;