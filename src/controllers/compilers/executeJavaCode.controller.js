import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { exec } from "child_process";
import { hrtime } from "process";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLASS_FILE_PATH = join(
  __dirname,
  "..",
  "..",
  "workers",
  "java-worker",
  "NeoCode.class"
).replace(/\\/g, "/");

const executeJavaCode = async (sourceCode, input, testId) => {
  const executionId = `exec_${testId}_${Date.now()}`;
  const executionDirectory = `/sandbox/${executionId}`;

  return new Promise((resolve, reject) => {
    try {
      const LOCAL_WORKSPACE = join(
        __dirname,
        "..",
        "..",
        "workers",
        "java-worker",
        executionId
      );

      const LOCAL_JAVA_FILE = join(LOCAL_WORKSPACE, "NeoCode.java");
      const LOCAL_INPUT_FILE = join(LOCAL_WORKSPACE, "input.txt");

      fs.mkdirSync(LOCAL_WORKSPACE, { recursive: true });
      fs.writeFileSync(LOCAL_JAVA_FILE, sourceCode, "utf-8");
      fs.writeFileSync(LOCAL_INPUT_FILE, input, "utf-8");

      const startTime = hrtime();
      exec(
        'docker ps -q --filter "name=java-container"',
        (psError, psStdout) => {
          if (psError) {
            console.error("Docker ps error: ", psError);
            return reject({
              success: false,
              message: "Failed to check Docker container",
            });
          }

          if (!psStdout) {
            exec("docker start java-container", (startError) => {
              if (startError) {
                console.error("Container start error:", startError);
                return reject({
                  success: false,
                  message: "Failed to start Docker container",
                });
              }
            });
          }

          exec(
            `docker exec java-container mkdir -p ${executionDirectory} && docker cp ${LOCAL_JAVA_FILE} java-container:${executionDirectory}/NeoCode.java && docker cp ${LOCAL_INPUT_FILE} java-container:${executionDirectory}/input.txt`,
            (copyError) => {
              if (copyError) {
                console.error("File copy error: ", copyError);

                fs.rmSync(LOCAL_WORKSPACE, {
                  recursive: true,
                  force: true,
                });

                return reject({
                  success: false,
                  message: "Failed to copy files to container",
                });
              }

              // Compile and execute inside isolated directory
              exec(
                `docker exec -i java-container sh -c "javac ${executionDirectory}/NeoCode.java && java ${executionDirectory}/NeoCode.java < ${executionDirectory}/input.txt"`,
                // { timeout: 5000 },
                (error, stdout, stderr) => {
                  const endTime = process.hrtime(startTime);
                  // console.log(endTime);
                  const executionTime = `${
                    (endTime[0] * 1e9 + endTime[1]) / 1e6
                  } ms`;

                  if (error) {
                    console.error("Execution error:", error);

                    fs.rmSync(LOCAL_WORKSPACE, {
                      recursive: true,
                      force: true,
                    });

                    return reject({
                      success: false,
                      message: "Failed to execute Java code",
                      error: stderr || error.message,
                      executionTime,
                    });
                  }

                  // Cleanup after execution (both in container and locally)
                  exec(
                    `docker exec java-container rm -rf ${executionDirectory}`,
                    () => {
                      fs.rmSync(LOCAL_WORKSPACE, {
                        recursive: true,
                        force: true,
                      });

                      resolve({
                        success: true,
                        output: stdout.trimEnd(),
                        executionTime,
                      });
                    }
                  );

                  // Delete the .class file after execution
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
            }
          );
        }
      );
    } catch (err) {
      console.error("File write error:", err);
      reject({ success: false, message: "Internal Server Error" });
    }
  });
};

export default executeJavaCode;
