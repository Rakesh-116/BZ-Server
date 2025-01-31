import { pool } from "../database/connect.db.js";

const createProblemController = async (req, res) => {
  const {
    title,
    description,
    input_format,
    output_format,
    constraints,
    prohibited_keys,
    sample_testcase,
    explaination,
    difficulty,
    score,
  } = req.body;
  const userId = req.userId;
  // console.log(req.body, userId);

  const createProblemQuery = `INSERT INTO Problem (title, description, input_format, output_format, constraints, prohibited_keys, sample_testcase, explaination, difficulty,score, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

  const createProblemProps = [
    title,
    description,
    input_format,
    output_format,
    constraints,
    prohibited_keys,
    sample_testcase,
    explaination || "Self Explainary!",
    difficulty,
    score,
    userId,
  ];

  try {
    const result = await pool.query(createProblemQuery, createProblemProps);

    if (result.rowCount > 0) {
      // console.log(result);
      return res.status(200).json({
        success: true,
        message: "Problem created successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Problem creation failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error creating problem:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

const getAllProblemsController = async (req, res) => {
  const getAllProblemsQuery =
    "SELECT id, title, score, difficulty FROM Problem";
  try {
    const result = await pool.query(getAllProblemsQuery);
    if (result.rowCount > 0) {
      // console.log(result);
      return res.status(200).json({
        success: true,
        problems: result.rows,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No problems found",
      });
    }
  } catch (error) {
    console.error("Error fetching problems:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

const getProblemDetailsController = async (req, res) => {
  const problemId = req.params.id;
  // console.log("prob: ", problemId);
  const getProblemDetailsQuery = "SELECT * FROM Problem WHERE id = $1";
  try {
    const result = await pool.query(getProblemDetailsQuery, [problemId]);
    if (result.rowCount > 0) {
      return res.status(200).json({
        success: true,
        problem: result.rows[0],
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

export {
  createProblemController,
  getAllProblemsController,
  getProblemDetailsController,
};
