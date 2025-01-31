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
  "..",
  "workers",
  "java-worker",
  "NeoCode.java"
).replace(/\\/g, "/");

const CLASS_FILE_PATH = join(
  __dirname,
  "..",
  "..",
  "workers",
  "java-worker",
  "NeoCode.class"
).replace(/\\/g, "/");

const INPUT_FILE_PATH = join(
  __dirname,
  "..",
  "..",
  "workers",
  "java-worker",
  "input.txt"
);

const executeJavaCode = async (sourceCode, input, res) => {
  try {
    // Step 1: Write the sourceCode to NeoCode.java
    fs.writeFileSync(JAVA_WORKER_PATH, sourceCode, "utf-8");

    fs.writeFileSync(INPUT_FILE_PATH, input, "utf-8");

    // Step 2: Start the Docker container from docker image, use the container to run the code and then remove (or) destroy the container and then remove the NeoCode.class file for new code compilations (to test it out set timeout for removal of .class file)
    exec(
      `docker run --rm -v ${join(
        __dirname,
        "..",
        "..",
        "workers",
        "java-worker"
      )}:/app java-comp sh -c "javac NeoCode.java && java NeoCode < /app/input.txt"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error("Execution error:", error);
          return res.status(500).json({ success: false, message: stderr });
        }

        // Step 3: Send the result to the frontend
        console.log(stdout);
        res.json({ success: true, message: stdout.trim() });

        // Step 4: Delete the .class file after execution
        // setTimeout(() => {
        fs.unlink(CLASS_FILE_PATH, (err) => {
          if (err) {
            console.error("Error deleting .class file:", err);
          } else {
            console.log("NeoCode.class file deleted successfully.");
          }
        });
        // }, 10000);
      }
    );
  } catch (err) {
    console.error("File write error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export default executeJavaCode;
