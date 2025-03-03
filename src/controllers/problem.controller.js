import { pool } from "../database/connect.db.js";
import generateUuid from "../constants/generateUuid.js";

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
    hidden_testcases,
    category,
    solution,
    solutionLanguage,
  } = req.body;
  const userId = req.userId;
  // console.log(req.body, userId);

  const createProblemQuery = `INSERT INTO Problem (title, description, input_format, output_format, constraints, prohibited_keys, sample_testcase, explaination, difficulty,score, category, solution, solution_language, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`;

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
    category || null,
    solution || "No Solution",
    solutionLanguage || null,
    userId,
  ];

  try {
    const createProblemResult = await pool.query(
      createProblemQuery,
      createProblemProps
    );

    if (createProblemResult.rowCount > 0) {
      console.log(createProblemResult);
      const problemId = createProblemResult.rows[0].id;

      const insertHiddenTestcasesQuery = `INSERT INTO testcases (id, testcase, problem_id) VALUES ($1, $2, $3)`;

      for (const test of hidden_testcases) {
        await pool.query(insertHiddenTestcasesQuery, [
          generateUuid(),
          test,
          problemId,
        ]);
      }

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

const getAllProblemSubmissionsController = async (req, res) => {
  const problemId = req.params.id;
  const userId = req.userId;

  const getAllSubmissionsQuery = `
    SELECT * FROM submissions WHERE problem_id = $1 and user_id = $2
    ORDER BY submission_time DESC
  `;

  const getAllProblemsProps = [problemId, userId];

  try {
    const result = await pool.query(
      getAllSubmissionsQuery,
      getAllProblemsProps
    );
    if (result.rowCount > 0) {
      return res.status(200).json({
        success: true,
        submissionDetails: result.rows,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "No Submissions",
        submissionDetails: [],
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
  getAllProblemSubmissionsController,
};
