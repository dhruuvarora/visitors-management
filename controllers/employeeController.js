// controllers/employeeController.js
const db = require('../database/connection');

// Initialize models
const EmployeeModel = require('../models/Employee');
const employeeModel = new EmployeeModel(db);

// Create a new employee
const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      department,
      phone
    } = req.body;

    // Validate required fields
    if (!name || !email || !department) {
      return res.status(400).json({
        error: 'Name, email, and department are required'
      });
    }

    // Check if employee with this email already exists
    const existingEmployee = await employeeModel.findByEmail(email);
    if (existingEmployee) {
      return res.status(400).json({
        error: 'Employee with this email already exists'
      });
    }

    // Prepare employee data
    const employeeData = {
      name: name,
      email: email,
      department: department,
      phone: phone || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Create employee record
    const newEmployee = await employeeModel.create(employeeData);

    res.status(201).json({
      message: 'Employee created successfully',
      employeeId: newEmployee.id,
      employee: {
        id: newEmployee.id,
        name: name,
        email: email,
        department: department,
        phone: phone
      }
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await employeeModel.findAll();

    res.json({
      count: employees.length,
      employees: employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        phone: emp.phone,
        createdAt: emp.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await employeeModel.findById(parseInt(id));

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        phone: employee.phone,
        createdAt: employee.created_at,
        updatedAt: employee.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

// Get employee by email
const getEmployeeByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const employee = await employeeModel.findByEmail(email);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        phone: employee.phone,
        createdAt: employee.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching employee by email:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await employeeModel.findById(parseInt(id));

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if email is being updated and if it already exists
    if (updateData.email && updateData.email !== employee.email) {
      const existingEmployee = await employeeModel.findByEmail(updateData.email);
      if (existingEmployee) {
        return res.status(400).json({
          error: 'Employee with this email already exists'
        });
      }
    }

    // Prepare update object
    const updateFields = { updated_at: new Date() };
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.email) updateFields.email = updateData.email;
    if (updateData.department) updateFields.department = updateData.department;
    if (updateData.phone !== undefined) updateFields.phone = updateData.phone;

    await employeeModel.update(parseInt(id), updateFields);

    // Get updated employee data
    const updatedEmployee = await employeeModel.findById(parseInt(id));

    res.json({
      message: 'Employee updated successfully',
      employee: {
        id: updatedEmployee.id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        department: updatedEmployee.department,
        phone: updatedEmployee.phone
      }
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await employeeModel.findById(parseInt(id));

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee has any visitors assigned
    const visitors = await db
      .selectFrom('visitors')
      .selectAll()
      .where('host_employee_id', '=', parseInt(id))
      .execute();

    if (visitors.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete employee. There are visitors assigned to this employee.',
        visitorsCount: visitors.length
      });
    }

    await employeeModel.delete(parseInt(id));

    res.json({
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

// Get employees by department
const getEmployeesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const employees = await db
      .selectFrom('employees')
      .selectAll()
      .where('department', '=', department)
      .orderBy('name', 'asc')
      .execute();

    res.json({
      department,
      count: employees.length,
      employees: employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        createdAt: emp.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching employees by department:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Get all departments
const getAllDepartments = async (req, res) => {
  try {
    const departments = await db
      .selectFrom('employees')
      .select('department')
      .distinct()
      .orderBy('department', 'asc')
      .execute();

    res.json({
      departments: departments.map(dept => dept.department)
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Search employees
const searchEmployees = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const employees = await db
      .selectFrom('employees')
      .selectAll()
      .where((eb) => eb.or([
        eb('name', 'like', `%${query}%`),
        eb('email', 'like', `%${query}%`),
        eb('department', 'like', `%${query}%`),
        eb('phone', 'like', `%${query}%`)
      ]))
      .orderBy('name', 'asc')
      .execute();

    res.json({
      query,
      count: employees.length,
      employees: employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        phone: emp.phone
      }))
    });

  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ error: 'Failed to search employees' });
  }
};

// Get employee's visitors
const getEmployeeVisitors = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query; // Optional status filter

    const employee = await employeeModel.findById(parseInt(id));

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    let query = db
      .selectFrom('visitors')
      .selectAll()
      .where('host_employee_id', '=', parseInt(id));

    // Add status filter if provided
    if (status) {
      query = query.where('status', '=', status);
    }

    const visitors = await query
      .orderBy('created_at', 'desc')
      .execute();

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        department: employee.department
      },
      visitorsCount: visitors.length,
      visitors: visitors.map(visitor => ({
        id: visitor.id,
        fullName: visitor.full_name,
        phone: visitor.mobile_number,
        purposeOfVisit: visitor.purpose_of_visit,
        status: visitor.status,
        checkInTime: visitor.check_in_time,
        checkOutTime: visitor.check_out_time,
        createdAt: visitor.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching employee visitors:', error);
    res.status(500).json({ error: 'Failed to fetch employee visitors' });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByEmail,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartment,
  getAllDepartments,
  searchEmployees,
  getEmployeeVisitors
};