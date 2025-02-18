const db = require('../startup/database');
const bcrypt = require('bcrypt');

exports.loginUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT username, password, id, passwordUpdate FROM salesagent WHERE username = ?';
    db.dash.query(sql, [username], async (err, results) => {
      if (err) {
        return reject(new Error('Database error'));
      }
      if (results.length === 0) {
        return reject(new Error('User not found'));
      }

      const user = results[0];

      try {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return reject(new Error('Invalid password'));
        }
        resolve({ success: true, username: user.username, id: user.id, passwordUpdate: user.passwordUpdate });
      } catch (bcryptErr) {
        return reject(new Error('Password comparison error'));
      }
    });
  });
};

exports.getUserProfile = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        firstName, 
        lastName, 
        empId, 
        phoneNumber1, 
        phoneNumber2, 
        nic, 
        email, 
        houseNumber, 
        streetName, 
        city, 
        username
      FROM salesagent 
      WHERE id = ?
    `;
    db.dash.query(sql, [id], (err, results) => {
      if (err) {
        return reject(new Error('Database error'));
      }
      if (results.length === 0) {
        return reject(new Error('User not found'));
      }
      resolve(results[0]); // Return first matching result
    });
  });
};





exports.updateUserProfile = (id, updatedData) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE salesagent
      SET firstName = ?, lastName = ?, phoneNumber1 = ?, phoneNumber2 = ?,
          nic = ?, email = ?, houseNumber = ?, streetName = ?, city = ?,
          district = ?, province = ?
      WHERE id = ?`; // Change WHERE empId = ? to WHERE id = ?

    const values = [
      updatedData.firstName, updatedData.lastName, updatedData.phoneNumber1,
      updatedData.phoneNumber2, updatedData.nic, updatedData.email,
      updatedData.houseNumber, updatedData.streetName, updatedData.city,
      updatedData.district, updatedData.province, id // Use id here
    ];

    db.dash.query(sql, values, (err, results) => {
      if (err) return reject(new Error('Database update error'));
      if (results.affectedRows === 0) {
        return reject(new Error('User not found'));
      }
      resolve({ success: true, message: 'Profile updated successfully' });
    });
  });
};


exports.updatePassword = (id, oldPassword, newPassword) => {
  return new Promise((resolve, reject) => {
    // Fetch the user's current password and passwordUpdate status
    const fetchSql = `SELECT password, passwordUpdate FROM salesagent WHERE id = ?`;
    db.dash.query(fetchSql, [id], async (err, results) => {
      if (err) {
        return reject(new Error('Database error'));
      }
      if (results.length === 0) {
        return reject(new Error('User not found'));
      }

      const user = results[0];

      try {
        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
          return reject(new Error('Old password is incorrect'));
        }

        // Check if the new password matches the old password
        const isSameAsOldPassword = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOldPassword) {
          return reject(new Error('New password cannot be the same as the old password'));
        }

        // Hash the new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update the password and set passwordUpdate to 1 if not already set
        const updateSql = `
          UPDATE salesagent 
          SET password = ?, passwordUpdate = ?
          WHERE id = ?
        `;
        const passwordUpdateValue = user.passwordUpdate === 0 ? 1 : user.passwordUpdate;

        db.dash.query(updateSql, [newPasswordHash, passwordUpdateValue, id], (updateErr, updateResults) => {
          if (updateErr) {
            return reject(new Error('Database update error'));
          }
          if (updateResults.affectedRows === 0) {
            return reject(new Error('Failed to update password'));
          }
          resolve({ success: true, message: 'Password updated successfully' });
        });
      } catch (bcryptErr) {
        return reject(new Error('Password hashing error'));
      }
    });
  });
};



