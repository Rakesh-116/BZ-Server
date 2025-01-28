import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { exec } from "child_process";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JAVA_WORKER_PATH = join(
  __dirname,
  "..",
  "workers",
  "java-worker",
  "NeoCode.java"
).replace(/\\/g, "/");

const executeProblem = async (req, res) => {
  const { sourceCode, language, input } = req.body;
  // console.log(req.body);

  if (typeof language === "string" && language.toLowerCase() === "java") {
    try {
      // Step 1: Write the sourceCode to NeoCode.java
      fs.writeFileSync(JAVA_WORKER_PATH, sourceCode, "utf-8");

      // Step 2: Start the Docker container
      exec(
        `docker run --rm -v ${join(
          __dirname,
          "..",
          "workers",
          "java-worker"
        )}:/app java-comp sh -c "javac NeoCode.java && echo ${input.trim()} | java -cp /app NeoCode"`,
        (error, stdout, stderr) => {
          if (error) {
            console.error("Execution error:", error);
            return res.status(500).json({ success: false, message: stderr });
          }

          // Step 3: Send the result to the frontend
          console.log(stdout);
          res.json({ success: true, message: stdout.trim() });
        }
      );
    } catch (err) {
      console.error("File write error:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  } else {
    res.status(400).json({ success: false, message: "Unsupported language" });
  }
};

export { executeProblem };
