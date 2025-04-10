const db = require("../startup/database");


exports.getAllPackages = async () => {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT id, displayName, status, total, created_at AS createdAt, description, discount, subTotal
        FROM marketplacepackages
        `;

        db.marketPlace.query(query, (error, results) => {
            if (error) {
                console.error("Error fetching packages:", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};


exports.getItemsByPackageId = async (packageId) => {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT 
            mi.displayName AS name, 
            pd.id,
            pd.quantity, 
              pd.mpItemId,  
            pd.quantityType,
            pd.price 
        FROM marketplaceitems mi
        INNER JOIN packagedetails pd ON mi.id = pd.mpItemId
        WHERE pd.packageId = ?
        `;

        db.marketPlace.query(query, [packageId], (error, results) => {
            if (error) {
                console.error("Error fetching items for package:", error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};



exports.getMarketplaceItemDetails = async (mpItemId) => {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT 
          id,
          displayName,
          normalPrice, 
          discountedPrice, 
          unitType, 
          startValue, 
          changeby
        FROM marketplaceitems
        WHERE id = ?;
        `;

        console.log("Executing query:", query);
        console.log("With itemId:", mpItemId);

        db.marketPlace.query(query, [mpItemId], (error, results) => {
            if (error) {
                console.error("Error fetching marketplace item details:", error);
                reject(error);
            } else {
                resolve(results.length > 0 ? results[0] : null);
            }
        });
    });
};




exports.getAllCrops = async () => {
    try {
        const query = `
        SELECT 
            id, varietyId, displayName, category, 
            normalPrice, discountedPrice, discount, 
            promo, unitType, startValue, changeby
        FROM marketplaceitems;
       
        `;

        console.log("Executing query:", query);
        const [results] = await db.marketPlace.promise().query(query);

        console.log("Results fetched from DB:", results);
        return results;
    } catch (error) {
        console.error("Error fetching crops:", error);
        throw new Error("Database error: " + error.message);  // Throw the error to be handled in the controller
    }
};



exports.getCropById = async (cropId) => {
    try {
        const query = `
            SELECT 
                id, cropId, displayName, category, 
                normalPrice, discountedPrice, discount, 
                promo, unitType, startValue, changeby, displayType 
            FROM marketplaceitems 
            WHERE cropId = ?;
        `;  // SQL query to fetch the crop with the specific cropId

        console.log("Executing query:", query);  // Debugging SQL query
        const [results] = await db.marketPlace.promise().query(query, [cropId]);  // Run the query with cropId as a parameter

        console.log("Result fetched from DB:", results); // Check what the query returns
        return results[0];  // Return the first result (single crop)
    } catch (error) {
        console.error("Error fetching crop by ID:", error);
        throw new Error("Database error: " + error.message);  // Throw the error to be handled in the controller
    }
};
