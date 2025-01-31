import executeJavaCode from "./compilers/executeJavaCode.controller.js";

const executeProblemController = async (req, res) => {
  const { sourceCode, language, input } = req.body;
  console.log("Executing with input:", JSON.stringify(input.trim()));

  if (typeof language === "string" && language.toLowerCase() === "java") {
    await executeJavaCode(sourceCode, input, res);
  } else {
    res.status(400).json({ success: false, message: "Unsupported language" });
  }
};

export { executeProblemController };
