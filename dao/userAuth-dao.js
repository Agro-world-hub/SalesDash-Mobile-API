const db = require('../startup/database');
const bcrypt = require('bcrypt');

exports.loginUser = (empId, password) => {
  console.log(empId)
  return new Promise(async (resolve, reject) => {
    try {
      const sql = 'SELECT empId, password, id, passwordUpdate FROM salesagent WHERE empId = ?';
      const [results] = await db.marketPlace.promise().query(sql, [empId]);

      if (results.length === 0) {
        return reject(new Error('User not found'));
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return reject(new Error('Invalid password'));
      }

      resolve({ success: true, empId: user.empId, id: user.id, passwordUpdate: user.passwordUpdate });
    } catch (err) {
      return reject(new Error('Database error: ' + err.message));
    }
  });
};

exports.getUserProfile = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `       
      SELECT 
        id,         
        firstName,          
        lastName,          
        empType,
        empId,          
        phoneCode1,
        phoneNumber1,          
        phoneCode2,
        phoneNumber2,          
        nic,          
        email,          
        houseNumber,          
        streetName,          
        city,
        district,
        province,
        country,
        accHolderName,
        accNumber,
        bankName,
        branchName,
        status,
        image,
        createdAt
      FROM salesagent        
      WHERE id = ?     
    `;

    db.marketPlace.query(sql, [id], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return reject(new Error('Database error'));
      }

      if (results.length === 0) {
        return reject(new Error('User not found'));
      }


      console.log("Raw DB result:", JSON.stringify(results[0]).substring(0, 200) + "...");
      console.log("Image exists:", results[0].image ? "Yes" : "No");


      resolve(results[0]);
    });
  });
};


exports.updateUserProfile = (id, updatedData) => {
  console.log("kkkkk")
  return new Promise((resolve, reject) => {
    const sql = `
          UPDATE salesagent
          SET firstName = ?, lastName = ?,
              houseNumber = ?, streetName = ?, city = ?, district = ?, province = ?
          WHERE id = ?;
      `;

    const values = [
      updatedData.firstName, updatedData.lastName,
      updatedData.houseNumber, updatedData.streetName, updatedData.city,
      updatedData.district, updatedData.province, id
    ];

    db.marketPlace.query(sql, values, (err, results) => {
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
    db.marketPlace.query(fetchSql, [id], async (err, results) => {
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
          return reject(new Error('Current Password does not match. Please Re-enter'));
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

        db.marketPlace.query(updateSql, [newPasswordHash, passwordUpdateValue, id], (updateErr, updateResults) => {
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



exports.getPassword = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `       
      SELECT 
        id,         
       
        empId,          
       passwordUpdate,
        createdAt
      FROM salesagent        
      WHERE id = ?     
    `;

    db.marketPlace.query(sql, [id], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return reject(new Error('Database error'));
      }

      if (results.length === 0) {
        return reject(new Error('User not found'));
      }


      console.log("Raw DB result:", JSON.stringify(results[0]).substring(0, 200) + "...");
      console.log("Image exists:", results[0].image ? "Yes" : "No");


      resolve(results[0]);
    });
  });
};
