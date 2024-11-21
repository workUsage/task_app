// backend/src/routes/tasks.js
const express = require('express');
const router = express.Router();
const { getSheets } = require('../utils/googleSheets');
const auth = require('../middleware/auth');
const ExcelJS = require('exceljs')

module.exports = function(io) {
  // Create a new task (admin only)
  router.post('/', auth, async (req, res) => {
    try {
      const sheets = await getSheets();
      const { inwardNo, subject, description, startDate, endDate, assignedTo } = req.body;

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'Tasks!A:H',
        valueInputOption: 'RAW',
        resource: {
          values: [[inwardNo, subject, description, startDate, endDate, assignedTo, 'pending']],
        },
      });

      const newTask = { inwardNo, subject, description, startDate, endDate, assignedTo, status: 'pending' };
      io.emit('newTask', newTask);

      res.json({ msg: 'Task created successfully', task: newTask });
    } catch (err) {
      console.error('Error creating task:', err.message);
      res.status(500).send('Server error');
    }
  });

  // Get all tasks (admin only)
  router.get('/', auth, async (req, res) => {
    try {
      const sheets = await getSheets();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'Tasks!A:H',
      });
      const tasks = response.data.values || [];
      res.json(tasks.map(task => ({
        inwardNo: task[0],
        subject: task[1],
        description: task[2],
        startDate: task[3],
        endDate: task[4],
        assignedTo: task[5],
        status: task[6],
      })));
    } catch (err) {
      console.error('Error fetching tasks:', err.message);
      res.status(500).send('Server error');
    }
  });

  // Get tasks for a specific user
  router.get('/user', auth, async (req, res) => {
    try {
      const sheets = await getSheets();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'Tasks!A:H',
      });
      const tasks = response.data.values || [];
      const userTasks = tasks.filter(task => task[5] === req.user.email);
      res.json(userTasks.map(task => ({
        inwardNo: task[0],
        subject: task[1],
        description: task[2],
        startDate: task[3],
        endDate: task[4],
        assignedTo: task[5],
        status: task[6],
      })));
    } catch (err) {
      console.error('Error fetching user tasks:', err.message);
      res.status(500).send('Server error');
    }
  });

  // Update task status (accept, forward, complete, fail)
  router.put('/:inwardNo/:action', auth, async (req, res) => {
    try {
      const sheets = await getSheets();
      const { inwardNo, action } = req.params;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'Tasks!A:H',
      });
      const tasks = response.data.values || [];
      const taskIndex = tasks.findIndex(task => task[0] === inwardNo);

      if (taskIndex === -1) {
        return res.status(404).json({ msg: 'Task not found' });
      }

      const task = tasks[taskIndex];
      if (task[5] !== req.user.email) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      let newStatus;
      switch (action) {
        case 'accept':
          newStatus = 'accepted';
          break;
        case 'forward':
          task[5] = req.body.forwardTo;
          newStatus = 'pending';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        case 'fail':
          newStatus = 'failed';
          break;
        default:
          return res.status(400).json({ msg: 'Invalid action' });
      }

      task[6] = newStatus;

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: `Tasks!A${taskIndex + 1}:H${taskIndex + 1}`,
        valueInputOption: 'RAW',
        resource: {
          values: [task],
        },
      });

      const updatedTask = {
        inwardNo: task[0],
        subject: task[1],
        description: task[2],
        startDate: task[3],
        endDate: task[4],
        assignedTo: task[5],
        status: task[6],
      };

      io.emit('taskUpdated', updatedTask);

      res.json({ msg: 'Task updated successfully', task: updatedTask });
    } catch (err) {
      console.error('Error updating task:', err.message);
      res.status(500).send('Server error');
    }
  });
  router.get('/download', auth, async (req, res) => {
    try {
      const sheets = await getSheets();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'Tasks!A:H',
      });
  
      const tasks = response.data.values || [];
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tasks');
  
      worksheet.columns = [
        { header: 'Inward No', key: 'inwardNo', width: 15 },
        { header: 'Subject', key: 'subject', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Assigned To', key: 'assignedTo', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
      ];
  
      tasks.forEach(task => {
        worksheet.addRow({
          inwardNo: task[0],
          subject: task[1],
          description: task[2],
          startDate: task[3],
          endDate: task[4],
          assignedTo: task[5],
          status: task[6],
        });
      });
  
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks.xlsx');
  
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('Error downloading tasks:', err.message);
      res.status(500).send('Server error');
    }
  });
  return router;
};