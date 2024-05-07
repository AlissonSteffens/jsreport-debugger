const fs = require("fs");
const path = require("path");
const vm = require("vm");

const context = { functions: {} };
// Available functions to be called
let functions = {};

function handleEachBlocks(html, data, root) {
  const eachRegex = /{{#each\s+([\w\.]+)}}([\s\S]*?){{\/each}}/g;

  return html.replace(eachRegex, (match, key, block) => {
    let array = data[key];
    if (!Array.isArray(array)) {
      console.error(`Key not found or not an array: ${key}`);
      return match; // Return the original string if key is not found or not an array
    }

    let result = "";
    for (let item of array) {
      result += replaceKeys(block, item, root); // Recursively replace keys in the block for each item
    }
    return result;
  });
}

function handleFunctionCalls(html, data, root) {
  const regexFunction = /{{#(\w+)\s+(([\w\.@]+\s*)+)}}{{\/\1}}/g;

  return html.replace(regexFunction, (match, functionName, argsString) => {
    const args = argsString.split(" ").map((arg) => {
      const keyPath = arg.split(".");
      let value;

      if (keyPath[0] === "@root") {
        value = root;
        keyPath.shift(); // Remove "@root" from the key path
      } else {
        value = data;
      }

      for (let i = 0; i < keyPath.length; i++) {
        value = value[keyPath[i]];

        if (value === undefined) {
          console.error(`Key not found inside function: ${keyPath.join(".")}`);
          return undefined;
        }
      }

      return value;
    });

    const func = functions[functionName];

    if (func) {
      return func(...args);
    } else {
      console.error(`Function not found: ${functionName}`);
      return match; // Return the original string if function is not found
    }
  });
}

function handleIndividualKeys(html, data, root) {
  const regex = /{{\s*([\w\.@]+)\s*}}/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const keyPath = match[1].split(".");
    let value;

    if (keyPath[0] === "@root") {
      value = root;
      keyPath.shift(); // Remove "@root" from the key path
    } else {
      value = data;
    }

    for (let i = 0; i < keyPath.length; i++) {
      if (keyPath[i] === "this") {
        value = data;
        break;
      } else {
        value = value[keyPath[i]];

        if (value === undefined) {
          console.error(`Key not found: ${keyPath.join(".")}`);
          break;
        }
      }
    }

    if (value !== undefined) {
      html = html.replace(new RegExp(`{{\s*${match[1]}\s*}}`, "g"), value);
    }
  }

  return html;
}

function replaceKeys(html, data, root = data) {
  html = handleEachBlocks(html, data, root);
  html = handleFunctionCalls(html, data, root);
  html = handleIndividualKeys(html, data, root);

  return html;
}

// Get file names from command line arguments
const inputHtmlFile = process.argv[2];
const inputDataFile = process.argv[3];
const inputFunctionsFile = process.argv[4];
const outputHtmlFile = process.argv[5];

function loadFunctionsFile() {
  const functionFileContent = fs.readFileSync(inputFunctionsFile, "utf8");

  // Create a new context with an empty object for the functions
  vm.createContext(context);

  // for each function in the file, add to the context
  let functionRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*{/g;
  let match;
  while ((match = functionRegex.exec(functionFileContent)) !== null) {
    const functionName = match[1];
    const args = match[2].split(",").map((arg) => arg.trim());

    // get function body
    const startIndex = match.index + match[0].length;
    let openBrackets = 1;
    let endIndex = startIndex;
    while (openBrackets > 0) {
      if (functionFileContent[endIndex] === "{") {
        openBrackets++;
      } else if (functionFileContent[endIndex] === "}") {
        openBrackets--;
      }
      endIndex++;
    }
    const functionBody = functionFileContent.slice(startIndex, endIndex - 1);

    // create the function in the context
    const functionString = `functions.${functionName} = function(${args.join(
      ", "
    )}) { ${functionBody} }`;
    vm.runInContext(functionString, context);
  }
  functions = context.functions;
}

loadFunctionsFile();
// load index.html
let html = fs.readFileSync(path.join(__dirname, inputHtmlFile), "utf8");
// load data.json
let data = fs.readFileSync(path.join(__dirname, inputDataFile), "utf8");
// parse data.json
data = JSON.parse(data);

html = replaceKeys(html, data);

// write the modified html to a new file
fs.writeFileSync(path.join(__dirname, outputHtmlFile), html);
