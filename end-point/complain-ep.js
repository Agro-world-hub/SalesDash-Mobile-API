const asyncHandler = require("express-async-handler");
const complainDAO = require('../dao/complain-dao');

const {
    createComplain
} = require('..//Validations/complain-validation');

const Joi = require('joi');





exports.createComplain = asyncHandler(async (req, res) => {
    try {
        const saId = req.user.id; // Get the user ID from the token
        const input = { ...req.body, saId };

        // Validate input using Joi
        const { value, error } = createComplain.validate(input);
        if (error) {
            return res.status(400).json({
                status: "error",
                message: error.details[0].message,
            });
        }

        const { language, complain, category, refNo, replyTime } = value;
        const status = "Opened"; // Default status for new complaints

        // Create the complaint in the database
        const newComplainId = await complainDAO.createComplain(
            saId,
            language,
            complain,
            category,
            status,
            refNo,
            replyTime
        );

        res.status(201).json({
            status: "success",
            message: "Complain created successfully.",
            complainId: newComplainId,
        });
    } catch (err) {
        console.error("Error creating complain:", err);
        res.status(500).json({
            status: "error",
            message: "Internal Server Error",
        });
    }
});



exports.getComplains = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        const complains = await complainDAO.getAllComplaintsByUserId(userId);

        if (!complains || complains.length === 0) {
            return res.status(404).json({ message: "No complaints found" });
        }

        res.status(200).json(complains);
        // console.log("Complaints fetched successfully", complains);
    } catch (error) {
        console.error("Error fetching complaints:", error);
        res.status(500).json({ message: "Failed to fetch complaints" });
    }
});

// exports.getComplainReplyByid = asyncHandler(async(req, res) => {
//     try {
//         const reply = await complainDAO.getAllComplaintsByUserId(id);

//         if (!complains || complains.length === 0) {
//             return res.status(404).json({ message: "No complaints found" });
//         }

//         res.status(200).json(reply);
//         // console.log("reply fetched successfully", reply);
//     } catch (error) {
//         console.error("Error fetching complaints:", error);
//         res.status(500).json({ message: "Failed to fetch complaints" });
//     }
// });

