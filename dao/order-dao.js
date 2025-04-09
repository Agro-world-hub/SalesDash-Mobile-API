const db = require('../startup/database');

// exports.placeOrder = (orderData, salesAgentId) => {
//   return new Promise((resolve, reject) => {
//     // Make sure db.dash exists and is properly initialized
//     if (!db || !db.dash) {
//       return reject(new Error('Database connection pool not initialized'));
//     }

//     let connection;

//     // Use proper error handling for the connection
//     db.dash.getConnection((err, conn) => {
//       if (err) {
//         return reject(err);
//       }

//       connection = conn;

//       connection.beginTransaction((err) => {
//         if (err) {
//           connection.release();
//           return reject(err);
//         }

//         // Insert into orders table - Including all fields from schema
//         connection.query(
//           `INSERT INTO orders (
//                         customerId, 
//                         salesAgentId, 
//                         deliveryType, 
//                         scheduleDate, 
//                         selectedDays, 
//                         weeklyDate, 
//                         paymentMethod, 
//                         paymentStatus, 
//                         orderStatus,
//                         InvNo,
//                         fullTotal,
//                         fullDiscount
//                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             orderData.customerId,
//             salesAgentId,
//             orderData.deliveryType,
//             orderData.scheduleDate,
//             orderData.selectedDays || null,
//             orderData.weeklyDate || null,
//             orderData.paymentMethod,
//             orderData.paymentStatus || false,
//             orderData.orderStatus,
//             orderData.InvNo || null,
//             orderData.fullTotal || null,
//             orderData.fullDiscount || null
//           ],
//           (err, orderResult) => {
//             if (err) {
//               return connection.rollback(() => {
//                 connection.release();
//                 reject(err);
//               });
//             }

//             const orderId = orderResult.insertId;
//             const orderItemPromises = [];

//             // Process each order item
//             const processOrderItems = (index) => {
//               if (index >= orderData.orderItems.length) {
//                 // All items processed, commit transaction
//                 connection.commit((err) => {
//                   if (err) {
//                     return connection.rollback(() => {
//                       connection.release();
//                       reject(err);
//                     });
//                   }

//                   connection.release();
//                   resolve({ success: true, orderId });
//                 });
//                 return;
//               }

//               const item = orderData.orderItems[index];

//               // Insert into orderitems table
//               connection.query(
//                 `INSERT INTO orderitems (
//                                     orderId, 
//                                     packageId, 
//                                     isModifiedPlus, 
//                                     isModifiedMin, 
//                                     isAdditionalItems, 
//                                     packageTotal, 
//                                     packageDiscount
//                                 ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                 [
//                   orderId,
//                   item.packageId,
//                   item.isModifiedPlus || false,
//                   item.isModifiedMin || false,
//                   item.isAdditionalItems || false,
//                   item.packageTotal,
//                   item.packageDiscount || 0
//                 ],
//                 (err, orderItemResult) => {
//                   if (err) {
//                     return connection.rollback(() => {
//                       connection.release();
//                       reject(err);
//                     });
//                   }

//                   const orderItemsId = orderItemResult.insertId;
//                   let remainingOperations = 0;
//                   let operationError = null;

//                   // Function to track completion of operations
//                   const trackCompletion = (err) => {
//                     if (err && !operationError) {
//                       operationError = err;
//                     }

//                     remainingOperations--;

//                     if (remainingOperations === 0) {
//                       if (operationError) {
//                         return connection.rollback(() => {
//                           connection.release();
//                           reject(operationError);
//                         });
//                       }

//                       // Process next order item
//                       processOrderItems(index + 1);
//                     }
//                   };

//                   // Process modifiedPlusItems if they exist
//                   if (item.modifiedPlusItems && item.modifiedPlusItems.length > 0) {
//                     remainingOperations += item.modifiedPlusItems.length;

//                     item.modifiedPlusItems.forEach(modifiedItem => {
//                       connection.query(
//                         `INSERT INTO modifiedplusitems (
//                                                     orderItemsId, 
//                                                     packageDetailsId, 
//                                                     originalQuantity, 
//                                                     modifiedQuantity, 
//                                                     originalPrice, 
//                                                     additionalPrice, 
//                                                     additionalDiscount
//                                                 ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                         [
//                           orderItemsId,
//                           modifiedItem.packageDetailsId,
//                           modifiedItem.originalQuantity,
//                           modifiedItem.modifiedQuantity,
//                           modifiedItem.originalPrice,
//                           modifiedItem.additionalPrice || 0,
//                           modifiedItem.additionalDiscount || 0
//                         ],
//                         (err) => trackCompletion(err)
//                       );
//                     });
//                   }

//                   // Process modifiedMinItems if they exist
//                   if (item.modifiedMinItems && item.modifiedMinItems.length > 0) {
//                     remainingOperations += item.modifiedMinItems.length;

//                     item.modifiedMinItems.forEach(modifiedItem => {
//                       connection.query(
//                         `INSERT INTO modifiedminitems (
//                                                     orderItemsId, 
//                                                     packageDetailsId, 
//                                                     originalQuantity, 
//                                                     modifiedQuantity, 
//                                                     originalPrice, 
//                                                     additionalPrice, 
//                                                     additionalDiscount
//                                                 ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                         [
//                           orderItemsId,
//                           modifiedItem.packageDetailsId,
//                           modifiedItem.originalQuantity,
//                           modifiedItem.modifiedQuantity,
//                           modifiedItem.originalPrice,
//                           modifiedItem.additionalPrice || 0,
//                           modifiedItem.additionalDiscount || 0
//                         ],
//                         (err) => trackCompletion(err)
//                       );
//                     });
//                   }

//                   // Process additionalItems if they exist
//                   if (item.additionalItems && item.additionalItems.length > 0) {
//                     remainingOperations += item.additionalItems.length;

//                     item.additionalItems.forEach(additionalItem => {
//                       connection.query(
//                         `INSERT INTO additionalitem (
//                                                     orderItemsId, 
//                                                     mpItemId, 
//                                                     quantity, 
//                                                     price, 
//                                                     discount
//                                                 ) VALUES (?, ?, ?, ?, ?)`,
//                         [
//                           orderItemsId,
//                           additionalItem.mpItemId,
//                           additionalItem.quantity,
//                           additionalItem.price,
//                           additionalItem.discount || 0
//                         ],
//                         (err) => trackCompletion(err)
//                       );
//                     });
//                   }

//                   // If no additional operations, process next order item
//                   if (remainingOperations === 0) {
//                     processOrderItems(index + 1);
//                   }
//                 }
//               );
//             };

//             // Start processing order items
//             processOrderItems(0);
//           }
//         );
//       });
//     });
//   });
// };


// orderDao.js

const QUERY_TIMEOUT = 0; // 10 seconds timeout for queries
/**
 * Process a complete order with transaction support
 * @param {Object} orderData - Complete order data from request
 * @param {Number} salesAgentId - ID of the sales agent
 * @returns {Promise<{orderId: number}>} Object containing the new order ID
 */
exports.processOrder = async (orderData, salesAgentId) => {
  console.time('process-order');
  let connection;

  try {
    // Get connection from pool with timeouts
    connection = await getConnectionWithTimeout();

    // Execute everything in a transaction
    await connection.promise().beginTransaction();
    console.log('Transaction started');



    // STEP 1: Insert main order record
    const orderId = await insertMainOrder();
    console.log(`Main order created with ID: ${orderId}`);

    // STEP 2: Process items based on order type
    if (orderData.isCustomPackage) {
      await processCustomPackage(orderId);
      console.log('Custom package items processed');
    } else if (orderData.isSelectPackage) {
      await processSelectedPackage(orderId);
      console.log('Package order processed');
    }

    // If we've reached here, everything succeeded - commit transaction
    await connection.promise().commit();
    console.log('Transaction committed successfully');
    console.timeEnd('process-order');

    return { orderId };
  } catch (error) {
    console.error('Error in processOrder:', error);

    // Attempt rollback if we have a connection and transaction is active
    if (connection) {
      try {
        await connection.promise().rollback();
        console.log('Transaction rolled back');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }

    // Re-throw with context
    throw new Error(`Order processing failed: ${error.message}`);
  } finally {
    // Always release connection back to pool
    if (connection) {
      try {
        connection.release();
        console.log('DB connection released');
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }

  // Inner function to get connection with timeout
  async function getConnectionWithTimeout() {
    return new Promise((resolve, reject) => {
      // Set a timeout for getting connection
      const connectionTimeout = setTimeout(() => {
        reject(new Error('Timeout getting database connection'));
      }, QUERY_TIMEOUT);

      // Attempt to get connection
      db.dash.getConnection((err, conn) => {
        clearTimeout(connectionTimeout);

        if (err) {
          return reject(new Error(`Failed to get database connection: ${err.message}`));
        }

        // Add query timeout to all queries made with this connection
        const originalQuery = conn.query;
        conn.query = function (sql, values, callback) {
          // Handle different parameter patterns
          if (typeof values === 'function') {
            callback = values;
            values = undefined;
          }

          // Wrap in timeout
          return originalQuery.call(conn, {
            sql: sql,
            values: values,
            timeout: QUERY_TIMEOUT
          }, callback);
        };

        // Add promise wrapper for convenience
        conn.promise = () => {
          return {
            query: (sql, values) => {
              return new Promise((resolve, reject) => {
                conn.query(sql, values, (err, results, fields) => {
                  if (err) return reject(err);
                  resolve([results, fields]);
                });
              });
            },
            beginTransaction: () => {
              return new Promise((resolve, reject) => {
                conn.beginTransaction(err => {
                  if (err) return reject(err);
                  resolve();
                });
              });
            },
            commit: () => {
              return new Promise((resolve, reject) => {
                conn.commit(err => {
                  if (err) return reject(err);
                  resolve();
                });
              });
            },
            rollback: () => {
              return new Promise((resolve, reject) => {
                conn.rollback(err => {
                  if (err) return reject(err);
                  resolve();
                });
              });
            }
          };
        };

        resolve(conn);
      });
    });
  }


  // Inner function to insert main order
  // async function insertMainOrder() {
  //   const {
  //     customerId,
  //     isCustomPackage,
  //     isSelectPackage,
  //     scheduleDate,
  //     selectedTimeSlot,
  //     paymentMethod,
  //     fullTotal,
  //     discount,
  //     subtotal,
  //     deleteStatus = false
  //   } = orderData;
  //   const sql = `
  //   INSERT INTO orders (
  //     customerId, salesAgentId, customPackage, selectedPackage,
  //     scheduleDate, scheduleTimeSlot, paymentMethod,
  //     paymentStatus, orderStatus, fullTotal,
  //     fullDiscount, fullSubTotal, deleteStatus
  //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  // `;

  //   console.log("date", scheduleDate)
  //   const values = [
  //     customerId,
  //     salesAgentId,
  //     isCustomPackage ? 1 : 0,
  //     isSelectPackage ? 1 : 0,
  //     scheduleDate,
  //     selectedTimeSlot,
  //     paymentMethod,
  //     0, // paymentStatus default false
  //     'Placed', // orderStatus default
  //     fullTotal,
  //     discount,
  //     subtotal,
  //     deleteStatus ? 1 : 0
  //   ];
  //   try {
  //     const [result] = await connection.promise().query(sql, values);
  //     return result.insertId;

  //     // This is the newly created order ID
  //   } catch (error) {
  //     throw new Error(`Failed to create main order: ${error.message}`);
  //   }
  // }

  // async function insertMainOrder() {
  //   const {
  //     customerId,
  //     isCustomPackage,
  //     isSelectPackage,
  //     scheduleDate,
  //     selectedTimeSlot,
  //     paymentMethod,
  //     fullTotal,
  //     discount,
  //     subtotal,
  //     deleteStatus = false
  //   } = orderData;

  //   // Convert date from "12 Apr 2025" format to SQL datetime format "YYYY-MM-DD 00:00:00"
  //   let formattedDate = scheduleDate;

  //   // Check if the date is in the format "12 Apr 2025"
  //   if (scheduleDate && typeof scheduleDate === 'string' && scheduleDate.match(/^\d{1,2}\s[A-Za-z]{3}\s\d{4}$/)) {
  //     // Parse the date string
  //     const dateParts = scheduleDate.split(' ');
  //     const day = parseInt(dateParts[0], 10);
  //     const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  //     const month = monthNames.indexOf(dateParts[1]) + 1; // Convert month name to number (1-12)
  //     const year = parseInt(dateParts[2], 10);

  //     // Format as YYYY-MM-DD 00:00:00
  //     formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 00:00:00`;
  //   }

  //   console.log("Original date:", scheduleDate);
  //   console.log("Formatted date for DB:", formattedDate);

  //   const sql = `
  //     INSERT INTO orders (
  //       customerId, salesAgentId, customPackage, selectedPackage,deliveryType,
  //       scheduleDate, scheduleTimeSlot, paymentMethod,
  //       paymentStatus, orderStatus, fullTotal,
  //       fullDiscount, fullSubTotal, deleteStatus
  //     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?)
  //   `;

  //   const values = [
  //     customerId,
  //     salesAgentId,
  //     isCustomPackage ? 1 : 0,
  //     isSelectPackage ? 1 : 0,
  //     'One Time',
  //     formattedDate, // Using the formatted date
  //     selectedTimeSlot,
  //     paymentMethod,
  //     0, // paymentStatus default false
  //     'Placed', // orderStatus default
  //     fullTotal,
  //     discount,
  //     subtotal,
  //     deleteStatus ? 1 : 0
  //   ];

  //   try {
  //     const [result] = await connection.promise().query(sql, values);
  //     return result.insertId; // This is the newly created order ID
  //   } catch (error) {
  //     throw new Error(`Failed to create main order: ${error.message}`);
  //   }
  // }

  async function insertMainOrder() {
    const {
      customerId,
      isCustomPackage,
      isSelectPackage,
      scheduleDate,
      selectedTimeSlot,
      paymentMethod,
      fullTotal,
      discount,
      subtotal,
      deleteStatus = false
    } = orderData;

    // Convert date from "12 Apr 2025" format to SQL datetime format "YYYY-MM-DD 00:00:00"
    let formattedDate = scheduleDate;

    // Check if the date is in the format "12 Apr 2025"
    if (scheduleDate && typeof scheduleDate === 'string' && scheduleDate.match(/^\d{1,2}\s[A-Za-z]{3}\s\d{4}$/)) {
      // Parse the date string
      const dateParts = scheduleDate.split(' ');
      const day = parseInt(dateParts[0], 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames.indexOf(dateParts[1]) + 1; // Convert month name to number (1-12)
      const year = parseInt(dateParts[2], 10);

      // Format as YYYY-MM-DD 00:00:00
      formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 00:00:00`;
    }

    console.log("Original date:", scheduleDate);
    console.log("Formatted date for DB:", formattedDate);

    // Generate Invoice Number (InvNo) with format YYMMDDRRRR
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2); // Get last 2 digits of year
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // 1-12 to 01-12
    const day = today.getDate().toString().padStart(2, '0'); // 1-31 to 01-31
    const datePrefix = `${year}${month}${day}`; // e.g., 250408

    // Get the current max sequence number for today
    const sequenceQuery = `
      SELECT MAX(InvNo) as maxInvNo 
      FROM orders 
      WHERE InvNo LIKE ?
    `;

    try {
      // Find the highest invoice number for today
      const [sequenceResult] = await connection.promise().query(sequenceQuery, [`${datePrefix}%`]);
      let sequenceNumber = 1; // Default to 1 if no orders exist for today

      if (sequenceResult[0].maxInvNo) {
        // Extract the sequence part (last 4 digits) and increment
        const lastSequence = parseInt(sequenceResult[0].maxInvNo.slice(-4), 10);
        sequenceNumber = lastSequence + 1;
      }

      // Format sequence with leading zeros (0001, 0002, etc.)
      const formattedSequence = sequenceNumber.toString().padStart(4, '0');
      const invNo = `${datePrefix}${formattedSequence}`;

      console.log("Generated Invoice Number:", invNo);

      const sql = `
        INSERT INTO orders (
          customerId, salesAgentId, InvNo,customPackage, selectedPackage, deliveryType,
          scheduleDate, scheduleTimeSlot, paymentMethod,
          paymentStatus, orderStatus, fullTotal,
          fullDiscount, fullSubTotal, deleteStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        customerId,
        salesAgentId,
        invNo,
        isCustomPackage ? 1 : 0,
        isSelectPackage ? 1 : 0,
        'One Time',
        formattedDate,
        selectedTimeSlot,
        paymentMethod,
        0, // paymentStatus default false
        'Ordered', // orderStatus default
        fullTotal,
        discount,
        subtotal,
        deleteStatus ? 1 : 0

      ];

      const [result] = await connection.promise().query(sql, values);
      return result.insertId; // This is the newly created order ID
    } catch (error) {
      throw new Error(`Failed to create main order: ${error.message}`);
    }
  }


  // Updated inner functions to accept orderId as parameter
  async function processCustomPackage(orderId) {

    const items = orderData.items;
    if (!items?.length) return;


    try {
      const values = items.map(item => {
        const total = item.normalPrice * item.quantity;
        const discount = (item.normalPrice - item.discountedPrice) * item.quantity;
        const subtotal = item.price * item.quantity;

        return [
          orderId,
          item.id, // mpItemId
          item.quantity,
          item.unitType,
          total,
          discount,
          subtotal
        ];
      });

      const sql = `
      INSERT INTO orderselecteditems (
        orderId, mpItemId, quantity, unitType, 
        total, discount, subtotal
      ) VALUES ?
    `;

      await connection.promise().query(sql, [values]);
    } catch (error) {
      throw new Error(`Failed to insert order items: ${error.message}`);
    }
  }

  async function processSelectedPackage(orderId) {
    try {
      const packageId = orderData.packageId || (orderData.items && orderData.items[0]?.packageId);

      if (!packageId) {
        throw new Error('Package ID is required for selected package orders');
      }

      const {
        isModifiedPlus = false,
        isModifiedMin = false,
        isAdditionalItems = false,
        packageTotal = orderData.fullTotal,
        packageDiscount = orderData.discount,
        packageSubTotal = orderData.subtotal
      } = orderData;

      const packageSql = `
      INSERT INTO orderpackageitems (
        orderId, packageId, isModifiedPlus, isModifiedMin, 
        isAdditionalItems, packageTotal, packageDiscount, packageSubTotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const packageValues = [
        orderId,
        packageId,
        isModifiedPlus ? 1 : 0,
        isModifiedMin ? 1 : 0,
        isAdditionalItems ? 1 : 0,
        packageTotal,
        packageDiscount,
        packageSubTotal
      ];

      const [packageResult] = await connection.promise().query(packageSql, packageValues);
      const orderPackageItemsId = packageResult.insertId;

      const operations = [];

      if (isModifiedPlus && orderData.modifiedPlusItems?.length > 0) {
        operations.push(processModifiedPlusItems(orderPackageItemsId));
      }

      if (isModifiedMin && orderData.modifiedMinItems?.length > 0) {
        operations.push(processModifiedMinItems(orderPackageItemsId));
      }

      if (isAdditionalItems && orderData.additionalItems?.length > 0) {
        operations.push(processAdditionalItems(orderPackageItemsId));
      }

      if (operations.length > 0) {
        await Promise.all(operations);
      }
    } catch (error) {
      throw new Error(`Failed to process package order: ${error.message}`);
    }
  }

  // Inner function to process modified plus items
  async function processModifiedPlusItems(orderPackageItemsId) {
    const modifiedItems = orderData.modifiedPlusItems;
    if (!modifiedItems?.length) return;

    try {
      const values = modifiedItems.map(item => [
        orderPackageItemsId,
        item.packageDetailsId,
        item.originalQuantity,
        item.modifiedQuantity,
        item.originalPrice,
        item.additionalPrice,
        item.additionalDiscount
      ]);

      const sql = `
        INSERT INTO modifiedplusitems (
          orderPackageItemsId, packageDetailsId, originalQuantity, 
          modifiedQuantity, originalPrice, additionalPrice, additionalDiscount
        ) VALUES ?
      `;

      await connection.promise().query(sql, [values]);
    } catch (error) {
      throw new Error(`Failed to insert modified plus items: ${error.message}`);
    }
  }

  // Inner function to process modified minus items
  async function processModifiedMinItems(orderPackageItemsId) {
    const modifiedItems = orderData.modifiedMinItems;
    if (!modifiedItems?.length) return;

    try {
      const values = modifiedItems.map(item => [
        orderPackageItemsId,
        item.packageDetailsId,
        item.originalQuantity,
        item.modifiedQuantity,
        item.originalPrice,
        item.additionalPrice,
        item.additionalDiscount
      ]);

      const sql = `
        INSERT INTO modifiedminitems (
          orderPackageItemsId, packageDetailsId, originalQuantity, 
          modifiedQuantity, originalPrice, additionalPrice, additionalDiscount
        ) VALUES ?
      `;

      await connection.promise().query(sql, [values]);
    } catch (error) {
      throw new Error(`Failed to insert modified minus items: ${error.message}`);
    }
  }

  // Inner function to process additional items
  // async function processAdditionalItems(orderPackageItemsId) {
  //   const additionalItems = orderData.additionalItems;
  //   if (!additionalItems?.length) return;

  //   try {
  //     const values = additionalItems.map(item => {
  //       const total = item.normalPrice * item.quantity;
  //       const discount = (item.normalPrice - item.discountedPrice) * item.quantity;
  //       const subtotal = item.price * item.quantity;

  //       return [
  //         orderPackageItemsId,
  //         item.id, // mpItemId
  //         item.quantity,
  //         item.unitType,
  //         total,
  //         discount,
  //         subtotal
  //       ];
  //     });

  //     const sql = `
  //       INSERT INTO additionalitem (
  //         orderPackageItemsId, mpItemId, quantity, unitType, 
  //         total, discount, subtotal
  //       ) VALUES ?
  //     `;

  //     await connection.promise().query(sql, [values]);
  //   } catch (error) {
  //     throw new Error(`Failed to insert additional items: ${error.message}`);
  //   }
  // }
  async function processAdditionalItems(orderPackageItemsId) {
    const additionalItems = orderData.additionalItems;
    if (!additionalItems?.length) return;

    try {
      const values = additionalItems.map(item => {
        // const total = item.normalPrice * item.quantity;
        // const discount = (item.normalPrice - item.discountedPrice) * item.quantity;
        // const subtotal = item.price * item.quantity;

        console.log("//", item.total)
        return [
          orderPackageItemsId,
          item.id,
          item.quantity,
          item.unitType,
          item.total,
          item.discount,
          item.subtotal
        ];
      });

      const sql = `
        INSERT INTO additionalitem (
          orderPackageItemsId, mpItemId, quantity, unitType, 
          total, discount, subtotal
        ) VALUES ?
      `;

      await connection.promise().query(sql, [values]);
    } catch (error) {
      throw new Error(`Failed to insert additional items: ${error.message}`);
    }
  }
};



exports.getAllOrderDetails = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT 
          o.id AS orderId,
          o.customerId,
          o.salesAgentId,
          o.InvNo,
          o.customPackage,
          o.selectedPackage,
          o.deliveryType,
          o.scheduleDate,
          o.scheduleTimeSlot,
          o.paymentMethod,
          o.paymentStatus,
          o.orderStatus,
          o.reportStatus,
          o.createdAt,
          o.fullTotal,
          o.fullDiscount,
          o.fullSubTotal,
          c.firstName,
          c.lastName,
          c.phoneNumber,
          c.buildingType
        FROM orders o
        JOIN customer c ON o.customerId = c.id
      `;

    db.dash.query(sql, (err, orderResults) => {
      if (err) {
        return reject(err);
      }

      if (orderResults.length === 0) {
        return resolve({ message: 'No orders found' });
      }

      // Process each order to get corresponding address details
      const orderPromises = orderResults.map(order => {
        return new Promise((resolveOrder, rejectOrder) => {
          const customerId = order.customerId;
          const buildingType = order.buildingType;

          if (buildingType === 'House') {
            const addressSql = `
                SELECT 
                  houseNo,
                  streetName,
                  city
                FROM house
                WHERE customerId = ?
              `;

            db.dash.query(addressSql, [customerId], (err, addressResults) => {
              if (err) {
                return rejectOrder(err);
              }

              let formattedAddress = '';
              if (addressResults[0]) {
                const addr = addressResults[0];
                formattedAddress = `${addr.houseNo || ''} ${addr.streetName || ''}, ${addr.city || ''}`.trim();
                formattedAddress = formattedAddress.replace(/\s+/g, ' ').trim();
              }

              resolveOrder({
                ...order,
                fullAddress: formattedAddress
              });
            });
          } else if (buildingType === 'Apartment') {
            const addressSql = `
                SELECT 
                  buildingNo,
                  buildingName,
                  unitNo,
                  floorNo,
                  houseNo,
                  streetName,
                  city
                FROM apartment
                WHERE customerId = ?
              `;

            db.dash.query(addressSql, [customerId], (err, addressResults) => {
              if (err) {
                return rejectOrder(err);
              }

              let formattedAddress = '';
              if (addressResults[0]) {
                const addr = addressResults[0];
                formattedAddress = `${addr.buildingName || ''} ${addr.buildingNo || ''}, Unit ${addr.unitNo || ''}, Floor ${addr.floorNo || ''}, ${addr.houseNo || ''} ${addr.streetName || ''}, ${addr.city || ''}`.trim();
                formattedAddress = formattedAddress.replace(/\s+/g, ' ')
                  .replace(/, Unit ,/, ',')
                  .replace(/, Floor ,/, ',')
                  .trim();
                formattedAddress = formattedAddress.replace(/,\s*$/, '');
              }

              resolveOrder({
                ...order,
                fullAddress: formattedAddress
              });
            });
          } else {
            resolveOrder({
              ...order,
              fullAddress: ''
            });
          }
        });
      });

      Promise.all(orderPromises)
        .then(results => resolve(results))
        .catch(error => reject(error));
    });
  });
};

exports.getOrderById = (orderId) => {
  console.log("rrrrrrr")
  return new Promise((resolve, reject) => {
    console.log("1")
    const sql = `
        SELECT 
          o.id AS orderId,
          o.customerId,
          o.deliveryType,
          o.scheduleDate,
          o.scheduleTimeSlot,  
          o.paymentMethod,
          o.paymentStatus,
          o.orderStatus,
          o.createdAt,
          o.InvNo,
          o.reportStatus,
          o.fullTotal,
          o.fullDiscount,
          o.fullSubTotal,  
          c.firstName,
          c.lastName,
          c.phoneNumber,
          c.buildingType
        FROM orders o
        JOIN customer c ON o.customerId = c.id
        WHERE o.id = ?
      `;


    console.log("2")
    console.log(orderId)


    db.dash.query(sql, [orderId], (err, orderResults) => {
      console.log("after")
      if (err) {
        console.log(".", err)
        return reject(err);

      }

      console.log("3")
      if (orderResults.length === 0) {
        return resolve({ message: 'No order found with the given ID' });
      }

      console.log("4")
      const order = orderResults[0];
      const customerId = order.customerId;
      const buildingType = order.buildingType;

      if (buildingType === 'House') {

        console.log("5")
        const addressSql = `
            SELECT 
              houseNo,
              streetName,
              city
            FROM house
            WHERE customerId = ?
          `;
        console.log("6")
        db.dash.query(addressSql, [customerId], (err, addressResults) => {
          if (err) {
            console.log("error", err)
            return reject(err);
          }

          console.log("7")
          let formattedAddress = '';
          if (addressResults[0]) {
            const addr = addressResults[0];
            formattedAddress = `${addr.houseNo || ''} ${addr.streetName || ''}, ${addr.city || ''}`.trim();
            formattedAddress = formattedAddress.replace(/\s+/g, ' ').trim();
          }
          console.log("8")
          resolve({
            ...order,
            fullAddress: formattedAddress
          });
        });
        console.log("9")
      } else if (buildingType === 'Apartment') {

        console.log("................")
        const addressSql = `
            SELECT 
              buildingNo,
              buildingName,
              unitNo,
              floorNo,
              houseNo,
              streetName,
              city
            FROM apartment
            WHERE customerId = ?
          `;
        console.log("10")
        db.dash.query(addressSql, [customerId], (err, addressResults) => {
          console.log("before")
          if (err) {
            console.log("errorr", err)
            return reject(err);
          }

          console.log("11")

          let formattedAddress = '';
          if (addressResults[0]) {
            const addr = addressResults[0];
            formattedAddress = `${addr.buildingName || ''} ${addr.buildingNo || ''}, Unit ${addr.unitNo || ''}, Floor ${addr.floorNo || ''}, ${addr.houseNo || ''} ${addr.streetName || ''}, ${addr.city || ''}`.trim();
            formattedAddress = formattedAddress.replace(/\s+/g, ' ')
              .replace(/, Unit ,/, ',')
              .replace(/, Floor ,/, ',')
              .trim();
            formattedAddress = formattedAddress.replace(/,\s*$/, '');
          }

          console.log("12")
          resolve({
            ...order,
            fullAddress: formattedAddress
          });
        });
      } else {
        resolve({
          ...order,
          fullAddress: ''
        });
      }
    });
  });
};

exports.getOrderByCustomerId = (customerId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        id AS orderId,
        customerId,
        deliveryType,
        scheduleDate,
        scheduleTimeSlot,  
        paymentMethod,
        paymentStatus,
        orderStatus,
        createdAt,
        InvNo,
        fullTotal,
        fullDiscount,
        fullSubTotal  
      FROM orders
      WHERE customerId = ?
    `;

    db.dash.query(sql, [customerId], (err, orderResults) => {
      if (err) {
        return reject(err);
      }

      if (orderResults.length === 0) {
        return resolve({ message: 'No orders found for this customer' });
      }

      resolve(orderResults);
    });
  });
};



exports.getDataCustomerId = (customerId) => {
  return new Promise((resolve, reject) => {
    // First query to get basic customer info
    const customerSql = `
      SELECT 
        id,
        cusId,
        salesAgent,
        title,
        firstName,
        lastName,
        phoneNumber,
        email,
        buildingType
      FROM customer
      WHERE id = ?
    `;

    db.dash.query(customerSql, [customerId], (err, customerResults) => {
      if (err) {
        return reject(err);
      }

      if (customerResults.length === 0) {
        return resolve({ message: 'No customer found with this ID' });
      }

      const customer = customerResults[0];
      const buildingType = customer.buildingType.toLowerCase();

      // Second query to get building details based on building type
      const buildingSql = `
        SELECT * FROM ${buildingType}
        WHERE customerId = ?
      `;

      db.dash.query(buildingSql, [customerId], (err, buildingResults) => {
        if (err) {
          return reject(err);
        }

        // Combine customer info with building info
        const result = {
          ...customer,
          buildingDetails: buildingResults.length > 0 ? buildingResults[0] : null
        };

        resolve(result);
      });
    });
  });
};




// order-dao.js

exports.cancelOrder = (orderId) => {
  return new Promise((resolve, reject) => {
    // Update order status to Cancelled
    const updateSql = `
      UPDATE dash.orders 
      SET orderStatus = 'Cancelled'
      WHERE id = ?
    `;

    db.dash.query(updateSql, [orderId], (err, result) => {
      if (err) {
        return reject(err);
      }

      // Check if any row was affected
      if (result.affectedRows === 0) {
        return resolve({
          message: 'Order not found or already cancelled'
        });
      }

      // Return success
      resolve({
        success: true,
        message: 'Order cancelled successfully',
        orderId: orderId
      });
    });
  });
};

exports.reportOrder = (orderId, reportStatus) => {
  return new Promise((resolve, reject) => {
    const updateSql = `
      UPDATE dash.orders 
      SET reportStatus = ?
      WHERE id = ?
    `;

    db.dash.query(updateSql, [reportStatus, orderId], (err, result) => {
      if (err) {
        return reject(err);
      }

      // Check if any row was affected
      if (result.affectedRows === 0) {
        return resolve({
          message: 'Order not found or could not be updated'
        });
      }

      // Return success
      resolve({
        success: true,
        message: 'Order report status updated successfully',
        orderId: orderId,
        reportStatus: reportStatus
      });
    });
  });
};