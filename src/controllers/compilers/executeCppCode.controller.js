import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { exec } from "child_process";
import { hrtime } from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const executeCppCode = async (sourceCode, input, testId) => {
  const executionId = `exec_${testId}_${Date.now()}`;
  const executionDirectory = `/sandbox/${executionId}`;

  return new Promise((resolve, reject) => {
    try {
      const LOCAL_WORKSPACE = join(
        __dirname,
        "..",
        "..",
        "workers",
        "cpp-worker",
        executionId
      );
      const LOCAL_CPP_FILE = join(LOCAL_WORKSPACE, "NeoCode.cpp");
      const LOCAL_INPUT_FILE = join(LOCAL_WORKSPACE, "input.txt");

      // Create local workspace for this execution
      fs.mkdirSync(LOCAL_WORKSPACE, { recursive: true });
      fs.writeFileSync(LOCAL_CPP_FILE, sourceCode, "utf-8");
      fs.writeFileSync(LOCAL_INPUT_FILE, input, "utf-8");

      const startTime = hrtime();

      exec(
        'docker ps -q --filter "name=cpp-container"',
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
            exec("docker start cpp-container", (startError) => {
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
            `docker exec cpp-container mkdir -p ${executionDirectory} && docker cp ${LOCAL_CPP_FILE} cpp-container:${executionDirectory}/NeoCode.cpp && docker cp ${LOCAL_INPUT_FILE} cpp-container:${executionDirectory}/input.txt`,
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
                `docker exec -i cpp-container sh -c "g++ ${executionDirectory}/NeoCode.cpp -o ${executionDirectory}/NeoCode.out && ${executionDirectory}/NeoCode.out < ${executionDirectory}/input.txt"`,
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
                      message: "Failed to execute C++ code",
                      error: stderr || error.message,
                      executionTime,
                    });
                  }

                  // Cleanup after execution (both in container and locally)
                  exec(
                    `docker exec cpp-container rm -rf ${executionDirectory}`,
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

export default executeCppCode;

// import { fileURLToPath } from "url";
// import { dirname, join } from "path";
// import fs from "fs";
// import { exec } from "child_process";
// import { hrtime } from "process";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const executeCppCode = async (sourceCode, input, testId) => {
//   const CPP_WORKER_PATH = join(
//     __dirname,
//     "..",
//     "..",
//     "workers",
//     "cpp-worker",
//     "NeoCode.cpp"
//   );
//   const INPUT_FILE_PATH = join(
//     __dirname,
//     "..",
//     "..",
//     "workers",
//     "cpp-worker",
//     "input.txt"
//   );

//   const executionDirectory = `/sandbox/${testId}`;

//   return new Promise((resolve, reject) => {
//     try {
//       // Write source code & input to files
//       fs.writeFileSync(CPP_WORKER_PATH, sourceCode, "utf-8");
//       fs.writeFileSync(INPUT_FILE_PATH, input, "utf-8");

//       const startTime = hrtime();

//       // Copy files into Docker container
//       exec(
//         `docker cp ${CPP_WORKER_PATH} cpp-container:/${executionDirectory}/NeoCode.cpp && docker cp ${INPUT_FILE_PATH} cpp-container:/${executionDirectory}/input.txt && docker start cpp-container`,
//         (copyError) => {
//           if (copyError) {
//             console.error("File copy error: ", copyError);
//             return reject({
//               success: false,
//               message: "Failed to copy files to container",
//             });
//           }

//           // Compile & Execute inside Docker
//           exec(
//             `docker exec -i cpp-container sh -c "g++ /${executionDirectory}/NeoCode.cpp -o /${executionDirectory}/NeoCode.out && /${executionDirectory}/NeoCode.out < /${executionDirectory}/input.txt"`,
//             (error, stdout, stderr) => {
//               const endTime = hrtime(startTime);
//               const executionTime = `${
//                 (endTime[0] * 1e9 + endTime[1]) / 1e6
//               } ms`;

//               if (error) {
//                 console.error("Execution error: ", error);
//                 return reject({
//                   success: false,
//                   message: "Failed to execute C++ code",
//                   error: stderr || error.message,
//                 });
//               }

//               execution.on("close", (code) => {
//                 exec(`docker exec cpp-container rm -rf ${executionDirectory}`);
//                 resolve({
//                   success: true,
//                   output: stdout.trim(),
//                   executionTime,
//                 });
//               });
//             }
//           );
//         }
//       );
//     } catch (error) {
//       console.error("File write error:", error);
//       reject({ success: false, message: "Internal Server Error" });
//     }
//   });
// };

// export default executeCppCode;
