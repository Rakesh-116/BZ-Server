import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { exec } from "child_process";
import { hrtime } from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const executePythonCode = async (sourceCode, input, testId) => {
  const executionId = `exec_${testId}_${Date.now()}`;
  const executionDirectory = `/sandbox/${executionId}`;

  return new Promise((resolve, reject) => {
    try {
      const LOCAL_WORKSPACE = join(
        __dirname,
        "..",
        "..",
        "workers",
        "python-worker",
        executionId
      );

      const PYTHON_WORKER_PATH = join(LOCAL_WORKSPACE, "NeoCode.py");

      const INPUT_FILE_PATH = join(LOCAL_WORKSPACE, "input.txt");

      // create local workspace for this execution
      fs.mkdirSync(LOCAL_WORKSPACE, { recursive: true });
      fs.writeFileSync(PYTHON_WORKER_PATH, sourceCode, "utf-8");
      fs.writeFileSync(INPUT_FILE_PATH, input, "utf-8");

      const startTime = hrtime();

      exec(
        'docker ps -q --filter "name=python-container"',
        (psError, psStdout) => {
          if (psError) {
            console.error("Docker ps error:", psError);
            return reject({
              success: false,
              message: "Failed to check Docker container",
            });
          }

          // Start container if not running
          if (!psStdout) {
            exec("docker start python-container", (startError) => {
              if (startError) {
                console.error("Container start error:", startError);
                return reject({
                  success: false,
                  message: "Failed to start Docker container",
                });
              }
            });
          }

          // Create an isolated workspace inside the container and copy files
          exec(
            `docker exec python-container mkdir -p ${executionDirectory} && docker cp ${PYTHON_WORKER_PATH} python-container:/${executionDirectory}/NeoCode.py && docker cp ${INPUT_FILE_PATH} python-container:/${executionDirectory}/input.txt`,
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

              // Compile & Execute inside Docker
              exec(
                `docker exec -i python-container sh -c "python3 /${executionDirectory}/NeoCode.py < /${executionDirectory}/input.txt"`,
                (error, stdout, stderr) => {
                  const endTime = hrtime(startTime);
                  const executionTime = `${
                    (endTime[0] * 1e9 + endTime[1]) / 1e6
                  } ms`;

                  if (error) {
                    console.error("Execution error: ", error);

                    fs.rmSync(LOCAL_WORKSPACE, {
                      recursive: true,
                      force: true,
                    });

                    return reject({
                      success: false,
                      message: "Failed to execute python code",
                      error: stderr || error.message,
                    });
                  }

                  // Cleanup after execution (both in container and locally)
                  exec(
                    `docker exec python-container rm -rf ${executionDirectory}`,
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
                }
              );
            }
          );
        }
      );
    } catch (error) {
      console.error("File write error:", error);
      reject({ success: false, message: "Internal Server Error" });
    }
  });
};

export default executePythonCode;
